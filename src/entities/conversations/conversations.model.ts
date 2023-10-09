import { User, Message, Conversation, UserConversation } from '../../../sequelize/sequelize.models'
import { Op } from 'sequelize'
import { sequelize } from '../../utils/sequelize.client'
import { IConversation, IUser } from '../../types'
import message_helper from '../messages/messages.helper'

export default class conversation_model {
  static async create_one(members_id: number[]) {
    try {
      // Create the conversation
      const new_conversation = await Conversation.create();

      // Fetch the users associated with the provided member_ids
      const users = await User.findAll({
        where: {
          User_id: members_id
        }
      });

      // Associate the users with the conversation
      await (new_conversation as any).addUsers(users);

      return new_conversation;
    } catch (err) {
      throw new Error('Unable to create conversation');
    }
  }

  static async get_conversations(user_id: number) {
    try {
      const user = await User.findOne({
        where: { User_id: user_id },
        include: [
          {
            model: Conversation,
            as: 'Conversations',
            through: {
              attributes: []
            },
            include: [
              {
                model: User,
                as: 'Users',
                where: {
                  User_id: {
                    [Op.ne]: user_id // Exclude the current user
                  }
                },
                attributes: ['User_id', 'User_name', 'encryption_public_key', 'signing_public_key'],
              },
              {
                model: Message,
                as: 'Messages',
                where: { Sender_id: { [Op.ne]: user_id } },
                attributes: ['Message_id', 'Message_content', 'Nonce', 'createdAt', 'Sender_id'],
              }
            ]
          }
        ]
      }) as IUser
      if (!user) throw new Error('Unable to get user');
      if (!user.Conversations) {
        console.error('no conversations')
        return []
      }

      user.Conversations.forEach(conv => {
        if (!conv.Users || !conv.Users.length) return
        conv.Users.forEach(user => {
          if (!user.encryption_public_key) return
          if (user.encryption_public_key instanceof Buffer)
            user.encryption_public_key = message_helper.convert_buffer_to_uint8Array(user.encryption_public_key);

          if (!user.signing_public_key) return
          if (user.signing_public_key instanceof Buffer)
            user.signing_public_key = message_helper.convert_buffer_to_uint8Array(user.signing_public_key);
        })

        if (!conv.Messages || !conv.Messages.length) return
        conv.Messages.forEach(msg => {
          console.log("contenu", msg.Message_content)
          if (!msg.Message_content) return
          if (msg.Message_content instanceof Buffer)
            msg.Message_content = message_helper.convert_buffer_to_uint8Array(msg.Message_content);

          if (!msg.Nonce) return
          if (msg.Nonce instanceof Buffer)
            msg.Nonce = message_helper.convert_buffer_to_uint8Array(msg.Nonce);
        })
      })

      return user.Conversations;
    } catch (error) {
      const typed_error = error as Error
      throw new Error(`Unable to get conversations : ${typed_error.message}`)
    }
  }

  static async find_one_by_members_id(members_id: number[]) {
    try {
      const [results, metadata] = await sequelize.query(`
      SELECT "Conversation"."Conversation_id"
      FROM "Conversations" AS "Conversation"
      INNER JOIN "UserConversations" AS "Users"
      ON "Conversation"."Conversation_id" = "Users"."Conversation_id"
      WHERE "Users"."User_id" IN (${members_id.join(',')})
      GROUP BY "Conversation"."Conversation_id"
      HAVING COUNT(DISTINCT "Users"."User_id") = ${members_id.length}
    `) as [IConversation[], any]

      const conversation_id = results[0]?.Conversation_id;

      if (!conversation_id) {
        throw new Error('Unable to find conversation');
      }

      const conversation = await Conversation.findOne({
        where: { Conversation_id: conversation_id },
        include: [
          {
            model: User,
            as: 'Users',
            attributes: ['User_id', 'User_name', 'encryption_public_key', 'signing_public_key'],
          }
        ]
      });

      return conversation
    } catch (error) {
      const typed_error = error as Error
      console.error(typed_error.message)
      // throw new Error(`Unable to find conversation : ${typed_error.message}`)
    }
  }

  static async find_one_by_id(conversation_id: number) {
    try {
      const conversation = await Conversation.findOne({
        where: {
          Conversation_id: conversation_id
        },
        include: [
          {
            model: User,
            attributes: ['User_id', 'User_name']
          }
        ]
      })
      return conversation
    } catch (error) {
      throw new Error('Unable to find conversation')
    }
  }

  static async find_user_in_conversation(user_id: number, conversation_id: number) {
    try {
      const user = await UserConversation.findOne({
        where: {
          User_id: user_id,
          Conversation_id: conversation_id
        }
      })
      return user
    } catch (error) {
      const typed_error = error as Error
      throw new Error(`Unable to find user in conversation: ${typed_error.message}`)
    }
  }
}
