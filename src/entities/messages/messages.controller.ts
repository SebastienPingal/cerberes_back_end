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
      const messages = await message.get_from_conversation(Number(Conversation_id))
      res.status(200).json(messages)
    } catch (error) {
      const typedError = error as Error
      console.error(typedError.message)
      res.status(500).json({ message: typedError.message })
    }
  }
}
