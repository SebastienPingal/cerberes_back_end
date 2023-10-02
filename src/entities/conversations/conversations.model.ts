import { User, Message, Conversation, UserConversation } from '../../../sequelize/sequelize.models'

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
      const conversations = await Conversation.findAll({
        attributes: ['Conversation_id'],
        include: [
          {
            model: User,
            through: {
              where: { User_id: user_id },
              attributes: []
            },
            attributes: ['User_id']
          }, {
            model: Message,
            attributes: ['Message_id', 'Message_content', 'Message_created_at', 'Sender_id'],
          }
        ]
      })
      return conversations
    } catch (error) {
      throw new Error('Unable to get conversations')
    }
  }

  static async find_one_by_members_id(members_id: number[]) {
    try {
      const conversation = await Conversation.findOne({
        attributes: ['Conversation_id'],
        include: [
          {
            model: User,
            through: {
              where: { User_id: members_id },
              attributes: []
            },
            attributes: ['User_id']
          }
        ]
      })
      return conversation
    } catch (error) {
      throw new Error('Unable to find conversation')
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
      throw new Error('Unable to find user in conversation')
    }
  }
}
