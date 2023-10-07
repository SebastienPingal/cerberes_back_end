import { type Request, type Response } from 'express'
import conversation from './conversations.model'
import user from '../users/users.model'
import type { IConversation, IUser } from '../../types'

export default class conversation_controller {
  static async get_conversations_with_new_messages(req: Request, res: Response) {
    try {
      const this_user = req.user as IUser
      if (!this_user) throw new Error('User not found')
      let conversations = await conversation.get_conversations(this_user.User_id) as IConversation[]
      if (!conversations) throw new Error('Unable to get conversations')

      // Filter out conversations with no messages or if Messages is undefined
      conversations = conversations.filter(conversation => conversation.Messages && conversation.Messages.length > 0)

      res.status(200).json(conversations)
    } catch (error) {
      const typed_error = error as Error
      console.error('Error :', typed_error.message)
      res.status(500).json({ error: typed_error.message })
    }
  }

  static async create_conversation(req: Request, res: Response) {
    try {
      const { members_id } = req.body
      const this_user = req.user as IUser
      members_id.push(this_user.User_id)

      // check if all members_id match existing users
      const existing_member = await members_id.every(async (member_id: number) => {
        const member = await user.find_one_by_id(member_id)
        if (member) {
          return true
        }
      })

      if (!existing_member) {
        throw new Error('Invalid member_id')
      }

      //check if conversatgion already exist
      const existing_conversation = await conversation.find_one_by_members_id(members_id)
      if (existing_conversation) {
        throw new Error('Conversation already exist')
      }

      const new_conversation = await conversation.create_one(members_id) as IConversation
      res.status(200).json(new_conversation)
    } catch (error) {
      const typed_error = error as Error
      console.error('error', typed_error.message)
      res.status(500)
      res.send(typed_error.message)
    }
  }
}
