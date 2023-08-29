import { type Request, type Response } from 'express'
import conversation from './conversations.model'
import user from '../users/users.model'
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
      const { members_id } = req.body
      // check if all members_id match existing users
      const existing_member = members_id.all(async (member_id: number) => {
        const member = await user.find_one_by_id(member_id)
        if (member) {
          return true
        }
      })
      if (!existing_member) {
        throw new Error('Invalid member_id')
      }
      const new_conversation = await conversation.create_one() as IConversation
      await user_conversation.create_many(members_id, new_conversation.Conversation_id)
      res.status(200).json(new_conversation)
    } catch (err) {
      res.status(500).json({ error: err })
    }
  }

}
