import { type Request, type Response } from 'express'
import conversation from './conversations.model'
import type { IConversation, IUser } from '../../types'
import user_conversation from '../user_conversations/user_conversation.model'

export default class conversation_controller {
  static async get_conversations(req: Request, res: Response) {
    try {
      const this_user = req.user as IUser
      const conversations = await conversation.get_conversations(this_user.User_id)
      res.status(200).json(conversations)
    } catch (err) {
      res.status(500).json({ error: err })
    }
  }

  static async create_conversation(req: Request, res: Response) {
    try {
      const { members } = req.body
      const new_conversation = await conversation.create_one() as IConversation
      await user_conversation.create_many(members, new_conversation.Conversation_id)
      res.status(200).json(new_conversation)
    } catch (err) {
      res.status(500).json({ error: err })
    }
  }

}
