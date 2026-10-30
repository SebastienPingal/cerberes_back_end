import { type Request, type Response } from 'express'
import { IConversation, IUser } from '../../types'
import message from './messages.model'
import conversation from '../conversations/conversations.model'
import conversations_helper from '../conversations/conversations.helper'
import user from '../users/users.model'

export default class message_controller {
  static async create_message(req: Request, res: Response) {
    try {
      const { Conversation, Message_content, Nonce } = req.body
      if (!Conversation) throw new Error('Conversation is required')
      if (!Message_content) throw new Error('Message_content is required')
      if (!Nonce) throw new Error('Nonce is required')

      //convert to buffer
      const this_user = req.user as IUser
      if (!this_user) throw new Error('User is required')

      let this_conversation: IConversation | null = null

      if (Number.isInteger(Conversation.Conversation_id) && Conversation.Conversation_id > 0) {
        this_conversation = await conversation.find_one_by_id(Conversation.Conversation_id)
        if (this_conversation) {
          const user_in_conversation = await conversation.find_user_in_conversation(this_user.User_id, this_conversation.Conversation_id)
          if (!user_in_conversation) throw new Error('User not in conversation')
        }
      }
      if (!this_conversation) {
        const raw_members_id = Array.isArray(Conversation.Users)
          ? Conversation.Users.map((member: IUser) => member.User_id)
          : undefined
        const members_id = conversations_helper.parse_members_id(raw_members_id, this_user.User_id)
        if (!await user.all_exist(members_id)) throw new Error('Invalid member_id')
        this_conversation = await conversation.find_one_by_members_id(members_id)
        if (!this_conversation)
          this_conversation = await conversation.create_one(members_id)
      }

      const new_message = await message.create_one(this_conversation.Conversation_id, this_user.User_id, Message_content, Nonce)
      res.status(201).json(new_message)
    } catch (error) {
      const typedError = error as Error
      console.error(typedError.message)
      res.status(500).json({ message: typedError.message })
    }
  }

  static async get_messages(req: Request, res: Response) {
    try {
      const { Conversation_id } = req.query
      if (!Conversation_id) throw new Error('Conversation_id is required')
      const this_conversation = await conversation.find_one_by_id(Number(Conversation_id))
      if (!this_conversation) throw new Error('Conversation not found')
      // check that user is in conversation
      const this_user_id = req.user as IUser
      if (!this_user_id) throw new Error('User is required')
      const this_user = await conversation.find_user_in_conversation(this_user_id.User_id, Number(Conversation_id))
      if (!this_user) throw new Error('Couldn\'t get User, User not in conversation')

      const messages = await message.get_from_conversation(Number(Conversation_id))
      res.status(200).json(messages)
    } catch (error) {
      const typedError = error as Error
      console.error(typedError.message)
      res.status(500).json({ message: typedError.message })
    }
  }

  static async get_all_new_messages_of_user(req: Request, res: Response) {
    try {
      const this_user_id = req.user as IUser
      if (!this_user_id) throw new Error('User is required')
      const messages = await message.get_all_from_user(this_user_id.User_id)

      res.status(200).json(messages)
    } catch (error) {
      const typedError = error as Error
      console.error(typedError.message)
      res.status(500).json({ message: typedError.message })
    }
  }

  static async delete_messages(req: Request, res: Response) {
    try {
      if (!req.query.ids) throw new Error('ids is required')
      if (typeof req.query.ids !== 'string') throw new Error('ids must be a string')
      // get the ids from the query ids and create an array from it
      const decrypted_messages_id = req.query.ids.split(',').map((id) => Number(id))
      if (!decrypted_messages_id.every(id => Number.isInteger(id) && id > 0)) throw new Error('ids must be a comma separated list of message ids')
      const this_user = req.user as IUser
      if (!this_user) throw new Error('User is required')

      await message.delete_received(this_user.User_id, decrypted_messages_id)
      res.status(204).send()
    } catch (error) {
      const typedError = error as Error
      console.error(typedError.message)
      res.status(500).json({ message: typedError.message })
    }
  }
}
