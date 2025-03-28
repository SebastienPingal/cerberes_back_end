import { DataTypes, Sequelize, Model } from 'sequelize'
import pg from 'pg'
import dotenv from 'dotenv'
import {
  IUser,
  IUserCreation,
  IContact,
  IConversation,
  IUserConversation,
  IMessage,
} from '../src/types'

dotenv.config()

if (!process.env.DATABASE_URL) {
  throw new Error('Please define the DATABASE_URL environment variable inside .env')
}

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectModule: pg,
})

class User extends Model<IUser, IUserCreation> implements IUser {
  User_id!: number
  User_name!: string
  User_email!: string
  User_password!: string
  User_contact_uuid?: string
  encryption_public_key?: Buffer
  signing_public_key?: Buffer
}

User.init(
  {
    User_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    User_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    User_password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    User_email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    User_contact_uuid: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    encryption_public_key: {
      type: DataTypes.BLOB,
      allowNull: true,
    },
    signing_public_key: {
      type: DataTypes.BLOB,
      allowNull: true,
    }
  },
  {
    sequelize,
    modelName: 'User',
  }
)

class Contact extends Model<IContact> implements IContact {
  Contact_id!: number
  User_id!: number
  Contact_User_id!: number
}

Contact.init(
  {
    Contact_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    User_id: {
      type: DataTypes.INTEGER,
      references: {
        model: User,
        key: 'User_id',
      },
    },
    Contact_User_id: {
      type: DataTypes.INTEGER,
      references: {
        model: User,
        key: 'User_id',
      },
    },
  },
  {
    sequelize,
    modelName: 'Contact',
  }
)

class Conversation extends Model<IConversation> implements IConversation {
  Conversation_id!: number
}

Conversation.init(
  {
    Conversation_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
  },
  {
    sequelize,
    modelName: 'Conversation',
  }
)

class UserConversation extends Model<IUserConversation> implements IUserConversation {
  UserConversation_id!: number
  User_id!: number
  Conversation_id!: number
}

UserConversation.init(
  {
    UserConversation_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    User_id: {
      type: DataTypes.INTEGER,
      references: {
        model: User,
        key: 'User_id',
      },
    },
    Conversation_id: {
      type: DataTypes.INTEGER,
      references: {
        model: Conversation,
        key: 'Conversation_id',
      },
    },
  },
  {
    sequelize,
    modelName: 'UserConversation',
  }
)

class Message extends Model<IMessage> implements IMessage {
  Message_id!: number
  Conversation_id!: number
  Sender_id!: number
  Message_content!: Buffer
  Nonce!: Buffer
}

Message.init(
  {
    Message_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    Conversation_id: {
      type: DataTypes.INTEGER,
      references: {
        model: Conversation,
        key: 'Conversation_id',
      },
    },
    Sender_id: {
      type: DataTypes.INTEGER,
      references: {
        model: User,
        key: 'User_id',
      },
    },
    Message_content: {
      type: DataTypes.BLOB,
      allowNull: false,
    },
    Nonce: {
      type: DataTypes.BLOB,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Message',
  }
)

User.belongsToMany(Conversation, { through: UserConversation, foreignKey: 'User_id' })
Conversation.belongsToMany(User, { through: UserConversation, foreignKey: 'Conversation_id' })

User.hasMany(Contact, { as: 'contact_list', foreignKey: 'User_id' })
Contact.belongsTo(User, { as: 'AddedBy', foreignKey: 'User_id' })

User.hasMany(Contact, { as: 'demands', foreignKey: 'Contact_User_id' })
Contact.belongsTo(User, { as: 'User', foreignKey: 'Contact_User_id' })

Conversation.hasMany(Message, { as: 'Messages', foreignKey: 'Conversation_id' })
Message.belongsTo(Conversation, { as: 'Conversation', foreignKey: 'Conversation_id' })

export { User, Contact, Conversation, UserConversation, Message }
