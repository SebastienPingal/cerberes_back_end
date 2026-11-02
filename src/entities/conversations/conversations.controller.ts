import { type Request, type Response } from 'express'
import conversation from './conversations.model'
import conversations_helper from './conversations.helper'
import message from '../messages/messages.model'
import { current_device } from '../../utils/device.middleware'
import { decode_base64, is_uuid, parse_uuid_list } from '../../utils/binary'
import { http_error, send_error } from '../../utils/http_error'

// Commits carrying a welcome and a ratchet tree can be large
const MAX_HANDSHAKE_BYTES = 512 * 1024
const MAX_APPLICATION_MESSAGE_BYTES = 64 * 1024

export default class conversation_controller {
  static async get_conversations(req: Request, res: Response) {
    try {
      const this_device = current_device(res)
      const conversations = await conversation.find_all_for_device(this_device.Device_id)
      res.status(200).json(conversations)
    } catch (error) {
      send_error(res, error)
    }
  }

  static async create_conversation(req: Request, res: Response) {
    try {
      const this_device = current_device(res)
      const new_conversation = await conversation.create_one(this_device.Device_id)
      res.status(201).json({
        Conversation_id: new_conversation.Conversation_id,
        epoch: new_conversation.epoch,
      })
    } catch (error) {
      send_error(res, error)
    }
  }

  static async post_commit(req: Request, res: Response) {
    try {
      const this_device = current_device(res)
      const { Conversation_id } = req.params
      if (!is_uuid(Conversation_id)) throw new http_error(400, 'Invalid conversation id')

      const epoch = conversations_helper.parse_epoch(req.body.epoch)
      const commit = decode_base64(req.body.commit, 'commit', MAX_HANDSHAKE_BYTES)
      const welcome = req.body.welcome === undefined || req.body.welcome === null
        ? undefined
        : decode_base64(req.body.welcome, 'welcome', MAX_HANDSHAKE_BYTES)
      const added = conversations_helper.parse_added_devices(req.body.added ?? [])
      const removed = parse_uuid_list(req.body.removed ?? [], 'removed')

      const new_epoch = await message.accept_commit({
        Conversation_id,
        Sender_device_id: this_device.Device_id,
        epoch,
        commit,
        welcome,
        added,
        removed,
      })
      res.status(201).json({ epoch: new_epoch })
    } catch (error) {
      send_error(res, error)
    }
  }

  static async post_message(req: Request, res: Response) {
    try {
      const this_device = current_device(res)
      const { Conversation_id } = req.params
      if (!is_uuid(Conversation_id)) throw new http_error(400, 'Invalid conversation id')

      const epoch = conversations_helper.parse_epoch(req.body.epoch)
      const encrypted_message = decode_base64(req.body.message, 'message', MAX_APPLICATION_MESSAGE_BYTES)

      const new_message = await message.accept_application_message({
        Conversation_id,
        Sender_device_id: this_device.Device_id,
        epoch,
        message: encrypted_message,
      })
      res.status(201).json({ Message_id: new_message.Message_id, createdAt: new_message.createdAt })
    } catch (error) {
      send_error(res, error)
    }
  }
}
