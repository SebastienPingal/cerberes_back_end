import { UserConversation } from '../../../sequelize/sequelize.models'
import { IUserConversation } from '../../types'

export default class user_conversation_controller {
  static async create_many (members_id: number[], conversation_id: number) {
    try {
      // check if members_id exists
      if (members_id.length === 0) {
        throw new Error('No members_id provided')
      }
      const new_user_conversations : IUserConversation[] = members_id.map((member_id) => {
        return { User_id: member_id, Conversation_id : conversation_id } as IUserConversation
      })
      await UserConversation.bulkCreate(new_user_conversations)
    } catch (err) {
      console.log(err)
    }
  }
  
  static async get_user_conversations (user_id: number) {
    try {
      const user_conversations = await UserConversation.findAll({
        where: {
          User_id: user_id
        }
      })
      return user_conversations
    } catch (err) {
      console.log(err)
    }
  }

  static async get_conversation_members (conversation_id: number) {
    try {
      const conversation_members = await UserConversation.findAll({
        where: {
          Conversation_id: conversation_id
        }
      })
      return conversation_members
    } catch (err) {
      console.log(err)
    }
  }

  static async delete_all_conversation_members (conversation_id: number) {
    try {
      const conversation_members = await UserConversation.destroy({
        where: {
          Conversation_id: conversation_id
        }
      })
      return conversation_members
    } catch (err) {
      console.log(err)
    }
  }

  static async delete_conversation_member (conversation_id: number, user_id: number) {
    try {
      const conversation_member = await UserConversation.destroy({
        where: {
          Conversation_id: conversation_id,
          User_id: user_id
        }
      })
      return conversation_member
    } catch (err) {
      console.log(err)
    }
  }
}
