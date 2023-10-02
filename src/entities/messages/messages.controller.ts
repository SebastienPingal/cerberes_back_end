import { type Request, type Response } from 'express'
import { IUser } from '../../types'
import message from './messages.model'
import conversation from '../conversations/conversations.model'

export default class message_controller {
  static async create_message(req: Request, res: Response){
    try {
      const { Conversation_id, Message_content } = req.body
      const this_user_id = req.user as IUser
      if (!this_user_id) throw new Error('User is required')
      const this_conversation = await conversation.find_one_by_id(Conversation_id)
      if (!this_conversation) throw new Error('Conversation not found')
      const new_message = await message.create_one(Conversation_id, this_user_id.User_id, Message_content)
      res.status(201).json(new_message)
    } catch (error) {
      const typedError = error as Error
      console.error(typedError.message)
      res.status(500).json({ message: typedError.message })
    }
  }

  static async get_messages(req: Request, res: Response){
    try {
      const { Conversation_id } = req.query
      if (!Conversation_id) throw new Error('Conversation_id is required')
      const this_conversation = await conversation.find_one_by_id(Number(Conversation_id))
      if (!this_conversation) throw new Error('Conversation not found')
      // check that user is in conversation
      const this_user_id = req.user as IUser
      if (!this_user_id) throw new Error('User is required')
      const this_user = await conversation.find_user_in_conversation(this_user_id.User_id, Number(Conversation_id))
      if (!this_user) throw new Error('User not in conversation')

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
      const { decrypted_messages_id } = req.body
      if (!decrypted_messages_id) throw new Error('decrypted_messages is required')
      // check that the message belongs to the user
      const this_user = req.user as IUser
      if (!this_user) throw new Error('User is required')

      decrypted_messages_id.forEach(async (message_id : number) => {
        const this_message = await message.find_one_by_id(message_id)
        if (this_message) {
          if (this_message.Sender_id === this_user.User_id) throw new Error('User not authorized to delete it\'s own messages')
          const user_in_conversation = await conversation.find_user_in_conversation(this_user.User_id, this_message.Conversation_id)
          if (!user_in_conversation) throw new Error('User not in conversation')
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
