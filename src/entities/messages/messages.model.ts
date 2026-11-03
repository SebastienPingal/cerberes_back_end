import { sequelize, Conversation, ConversationDevice, Device, Message, Delivery } from '../../../sequelize/sequelize.models'
import type { Transaction } from 'sequelize'
import type { IMessage } from '../../types'
import { to_base64 } from '../../utils/binary'
import { http_error } from '../../utils/http_error'

export interface IAddedDevice {
  Device_id: string
  KeyPackage_ref: string
}

export interface ICommitInput {
  Conversation_id: string
  Sender_device_id: string
  epoch: number
  commit: Buffer
  welcome?: Buffer
  added: IAddedDevice[]
  removed: string[]
}

export interface IApplicationMessageInput {
  Conversation_id: string
  Sender_device_id: string
  epoch: number
  message: Buffer
}

export default class message_model {
  // Store a message with one delivery per recipient. A message nobody has to fetch (a commit or a
  // message in a group where the sender is alone) is not kept: it would never be acknowledged.
  private static async store_for_recipients(fields: IMessage, recipient_ids: string[], transaction: Transaction) {
    const new_message = await Message.create(fields, { transaction })
    if (recipient_ids.length) {
      await Delivery.bulkCreate(recipient_ids.map(Device_id => ({ Message_id: new_message.Message_id, Device_id })), { transaction })
    } else {
      await new_message.destroy({ transaction })
    }
    return new_message
  }

  // The server is the MLS delivery service: it orders commits by accepting only one per epoch.
  // A commit created for an older epoch is refused, its author must process the inbox and retry.
  static async accept_commit(input: ICommitInput): Promise<number> {
    return await sequelize.transaction(async (transaction) => {
      const this_conversation = await Conversation.findByPk(input.Conversation_id, { transaction, lock: transaction.LOCK.UPDATE })
      if (!this_conversation) throw new http_error(404, 'Conversation not found')

      const members = await ConversationDevice.findAll({ where: { Conversation_id: input.Conversation_id }, transaction })
      const member_ids = members.map(member => member.Device_id)
      if (!member_ids.includes(input.Sender_device_id)) throw new http_error(403, 'Device not in conversation')
      if (this_conversation.epoch !== input.epoch) throw new http_error(409, 'Epoch is outdated, process the inbox and retry')

      const added_ids = input.added.map(added => added.Device_id)
      if (added_ids.some(id => member_ids.includes(id))) throw new http_error(400, 'Device already in conversation')
      if (!input.removed.every(id => member_ids.includes(id))) throw new http_error(400, 'Removed device not in conversation')
      if (input.removed.includes(input.Sender_device_id)) throw new http_error(400, 'A device cannot remove itself')
      if (added_ids.length && !input.welcome) throw new http_error(400, 'welcome is required when adding devices')
      const added_devices = await Device.count({ where: { Device_id: added_ids }, transaction })
      if (added_devices !== added_ids.length) throw new http_error(400, 'Unknown added device')

      // Every current member except the committer processes the commit, removed ones included
      await message_model.store_for_recipients({
        Conversation_id: input.Conversation_id,
        Sender_device_id: input.Sender_device_id,
        kind: 'commit',
        epoch: input.epoch,
        payload: input.commit,
      }, member_ids.filter(id => id !== input.Sender_device_id), transaction)

      if (input.removed.length) {
        await ConversationDevice.destroy({ where: { Conversation_id: input.Conversation_id, Device_id: input.removed }, transaction })
      }

      if (input.added.length && input.welcome) {
        await ConversationDevice.bulkCreate(input.added.map(added => ({
          Conversation_id: input.Conversation_id,
          Device_id: added.Device_id,
        })), { transaction })
        const welcome_message = await Message.create({
          Conversation_id: input.Conversation_id,
          Sender_device_id: input.Sender_device_id,
          kind: 'welcome',
          epoch: input.epoch + 1,
          payload: input.welcome,
        }, { transaction })
        await Delivery.bulkCreate(input.added.map(added => ({
          Message_id: welcome_message.Message_id,
          Device_id: added.Device_id,
          KeyPackage_ref: added.KeyPackage_ref,
        })), { transaction })
      }

      this_conversation.epoch = input.epoch + 1
      await this_conversation.save({ transaction })
      return this_conversation.epoch
    })
  }

  static async accept_application_message(input: IApplicationMessageInput) {
    return await sequelize.transaction(async (transaction) => {
      // Same lock as commits, so that messages and commits are stored in the order they were accepted
      const this_conversation = await Conversation.findByPk(input.Conversation_id, { transaction, lock: transaction.LOCK.UPDATE })
      if (!this_conversation) throw new http_error(404, 'Conversation not found')

      const members = await ConversationDevice.findAll({ where: { Conversation_id: input.Conversation_id }, transaction })
      const member_ids = members.map(member => member.Device_id)
      if (!member_ids.includes(input.Sender_device_id)) throw new http_error(403, 'Device not in conversation')
      if (this_conversation.epoch !== input.epoch) throw new http_error(409, 'Epoch is outdated, process the inbox and retry')

      return await message_model.store_for_recipients({
        Conversation_id: input.Conversation_id,
        Sender_device_id: input.Sender_device_id,
        kind: 'application',
        epoch: input.epoch,
        payload: input.message,
      }, member_ids.filter(id => id !== input.Sender_device_id), transaction)
    })
  }

  // Pending messages of a device, in the order the server accepted them
  static async find_inbox(Device_id: string, limit = 100) {
    const deliveries = await Delivery.findAll({
      where: { Device_id },
      include: [{
        model: Message,
        as: 'Message',
        include: [{ model: Device, as: 'Sender', attributes: ['Device_id', 'User_id'] }],
      }],
      order: [['Message_id', 'ASC']],
      limit,
    })

    return deliveries.flatMap((delivery) => {
      const this_message = delivery.Message
      if (!this_message) return []
      return [{
        Message_id: this_message.Message_id,
        Conversation_id: this_message.Conversation_id,
        kind: this_message.kind,
        epoch: this_message.epoch,
        payload: to_base64(this_message.payload),
        // Given by the server for routing only: clients must rely on the sender authenticated by MLS
        sender: {
          Device_id: this_message.Sender_device_id,
          User_id: this_message.Sender?.User_id,
        },
        KeyPackage_ref: delivery.KeyPackage_ref ?? null,
        createdAt: this_message.createdAt,
      }]
    })
  }

  // Delivered messages are deleted from the server as soon as every recipient fetched them
  static async acknowledge(Device_id: string, Message_ids: number[]) {
    await Delivery.destroy({ where: { Device_id, Message_id: Message_ids } })
    const still_pending = await Delivery.findAll({ where: { Message_id: Message_ids }, attributes: ['Message_id'] })
    const pending_ids = new Set(still_pending.map(delivery => delivery.Message_id))
    const delivered_ids = Message_ids.filter(id => !pending_ids.has(id))
    if (delivered_ids.length) {
      await Message.destroy({ where: { Message_id: delivered_ids } })
    }
  }
}
