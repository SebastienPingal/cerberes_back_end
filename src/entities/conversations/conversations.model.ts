import { sequelize, User, Device, Conversation, ConversationDevice } from '../../../sequelize/sequelize.models'

export default class conversation_model {
  // A conversation starts as an MLS group with only its creator's device, at epoch 0.
  // The creator then adds the other devices with a first commit.
  static async create_one(creator_device_id: string) {
    try {
      return await sequelize.transaction(async (transaction) => {
        const new_conversation = await Conversation.create({}, { transaction })
        await ConversationDevice.create({
          Conversation_id: new_conversation.Conversation_id,
          Device_id: creator_device_id,
        }, { transaction })
        return new_conversation
      })
    } catch (error) {
      const typed_error = error as Error
      console.error(typed_error.message)
      throw new Error('Unable to create conversation')
    }
  }

  // Conversations of a device, with the users behind their member devices
  static async find_all_for_device(Device_id: string) {
    const memberships = await ConversationDevice.findAll({ where: { Device_id }, attributes: ['Conversation_id'] })
    const conversation_ids = memberships.map(membership => membership.Conversation_id)
    if (!conversation_ids.length) return []

    const conversations = await Conversation.findAll({ where: { Conversation_id: conversation_ids } })
    const all_members = await ConversationDevice.findAll({
      where: { Conversation_id: conversation_ids },
      include: [{
        model: Device,
        as: 'Device',
        attributes: ['Device_id', 'User_id'],
        include: [{ model: User, as: 'User', attributes: ['User_id', 'User_name'] }],
      }],
    }) as (ConversationDevice & { Device?: Device & { User?: User } })[]

    return conversations.map((this_conversation) => {
      const members = new Map<number, { User_id: number, User_name: string }>()
      all_members
        .filter(member => member.Conversation_id === this_conversation.Conversation_id)
        .forEach((member) => {
          const member_user = member.Device?.User
          if (member_user) members.set(member_user.User_id, { User_id: member_user.User_id, User_name: member_user.User_name })
        })
      return {
        Conversation_id: this_conversation.Conversation_id,
        epoch: this_conversation.epoch,
        members: [...members.values()],
      }
    })
  }
}
