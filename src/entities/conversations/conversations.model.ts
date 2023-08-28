import { User, Conversation } from '../../../sequelize/sequelize.models'

export default class conversation_model {
  static async create_one () {
    try {
      const new_conversation = await Conversation.create()
      return new_conversation
    } catch (err) {
      throw new Error('Unable to create conversation')
    }
  }

  static async get_conversations (user_id: number) {
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
          }
        ]
      })
      return conversations
    } catch (error) {
      throw new Error('Unable to get conversations')
    }
  }
}
