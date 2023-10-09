import { type Request, type Response } from 'express'
import { IConversation, IUser } from '../../types'
import message from './messages.model'
import conversation from '../conversations/conversations.model'
import message_helper from './messages.helper'

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

      if (Conversation.Conversation_id !== 0) this_conversation = await conversation.find_one_by_id(Conversation.Conversation_id)
      if (!this_conversation) {
        const members_id = Conversation.Users.map((user: IUser) => user.User_id)
        members_id.push(this_user.User_id)
        this_conversation = await conversation.find_one_by_members_id(members_id) ?? null
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
      // get the ids from the query ids and create an array fronm it
      const decrypted_messages_id = req.query.ids.split(',').map((id) => Number(id))
      if (!decrypted_messages_id) throw new Error('decrypted_messages is required')
      const this_user = req.user as IUser
      if (!this_user) throw new Error('User is required')

      decrypted_messages_id.forEach(async (message_id: number) => {
        const this_message = await message.find_one_by_id(message_id)
        if (this_message) {
          if (this_message.Sender_id === this_user.User_id) throw new Error('User not authorized to delete it\'s own messages')
          const user_in_conversation = await conversation.find_user_in_conversation(this_user.User_id, this_message.Conversation_id)
          if (!user_in_conversation) {
            console.error('User not in conversation and not authorized to delete message. message_id: ', message_id)
            return
          }
          this_message.destroy()
        }
      })

    } catch (error) {
      const typedError = error as Error
      console.error(typedError.message)
      res.status(500).json({ message: typedError.message })
    }
  }
}
