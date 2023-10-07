import { Message } from '../../../sequelize/sequelize.models'
import { IMessage } from '../../types'

export default class message_model {
  static async create_one(Conversation_id: number, Sender_id: number, Message_content: Buffer, Nonce: Buffer): Promise<IMessage> {
    try {
      return await Message.create({
        Conversation_id,
        Sender_id,
        Message_content,
        Nonce,
      })
    } catch (error) {
      const typedError = error as Error
      console.error(typedError.message)
      throw new Error(typedError.message)
    }
  }
  static async get_from_conversation(Conversation_id: number): Promise<IMessage[]> {
    try {
      return await Message.findAll({
        where: {
          Conversation_id,
        },
      })
    } catch (error) {
      const typedError = error as Error
      console.error(typedError.message)
      throw new Error(typedError.message)
    }
  }

  static async get_all_from_user(User_id: number): Promise<IMessage[]> {
    try {
      return await Message.findAll({
        where: {
          Sender_id: User_id,
        },
      })
    } catch (error) {
      const typedError = error as Error
      console.error(typedError.message)
      throw new Error(typedError.message)
    }
  }

  static async delete_one(Message_id: number): Promise<void> {
    try {
      await Message.destroy({
        where: {
          Message_id,
        },
      })
    } catch (error) {
      const typedError = error as Error
      console.error(typedError.message)
      throw new Error(typedError.message)
    }
  }

  static async find_one_by_id(Message_id: number): Promise<Message | null> {
    try {
      return await Message.findOne({
        where: {
          Message_id,
        },
      })
    } catch (error) {
      const typedError = error as Error
      console.error(typedError.message)
      throw new Error(typedError.message)
    }
  }
}
