import { Message } from '../../../sequelize/sequelize.models'
import { IMessage } from '../../types'
import messages_helper from './messages.helper'

export default class message_model {
  static async create_one(Conversation_id: number, Sender_id: number, Message_content: Uint8Array, Nonce: Uint8Array): Promise<IMessage> {
    try {
      const buffered_messages = messages_helper.convert_object_to_buffer(Message_content)
      const buffered_nonce = messages_helper.convert_object_to_buffer(Nonce)

      return await Message.create({
        Conversation_id,
        Sender_id,
        Message_content: buffered_messages,
        Nonce: buffered_nonce,
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
