import { DataTypes, Sequelize, Model } from 'sequelize'
import pg from 'pg'
import {
  IUser,
  IUserCreation,
  IContact,
  IDevice,
  IKeyPackage,
  IConversation,
  IConversationDevice,
  IMessage,
  IDelivery,
  MessageKind,
} from '../src/types'
import { env } from '../src/utils/env'

// Hosted Postgres (Neon on Vercel…) requires TLS and says so with sslmode in the connection string,
// but Sequelize does not pass that parameter on to pg
const database_requires_ssl = /[?&]sslmode=(require|verify-ca|verify-full)\b/.test(env.DATABASE_URL)

const sequelize = new Sequelize(env.DATABASE_URL, {
  dialect: 'postgres',
  dialectModule: pg,
  dialectOptions: database_requires_ssl ? { ssl: { rejectUnauthorized: true } } : {},
  // SQL logs are only useful while developing
  logging: env.NODE_ENV === 'production' ? false : console.log,
})

class User extends Model<IUser, IUserCreation> implements IUser {
  User_id!: number
  User_name!: string
  User_email!: string
  User_password!: string
  User_contact_uuid?: string
  identity_public_key?: Buffer | null

  // Defense in depth: never serialize the password hash, even when it was loaded
  toJSON<T extends IUser>(): T
  toJSON(): object
  toJSON(): object {
    const values: Partial<IUser> = { ...this.get({ plain: true }) }
    delete values.User_password
    return values
  }
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
      unique: true,
    },
    User_contact_uuid: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    identity_public_key: {
      type: DataTypes.BLOB,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'User',
    // The password hash is only loaded on demand, with User.scope('with_password')
    defaultScope: {
      attributes: { exclude: ['User_password'] },
    },
    scopes: {
      with_password: {
        attributes: { include: ['User_password'] },
      },
    },
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
      allowNull: false,
      references: {
        model: User,
        key: 'User_id',
      },
    },
    Contact_User_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'User_id',
      },
    },
  },
  {
    sequelize,
    modelName: 'Contact',
    indexes: [{ unique: true, fields: ['User_id', 'Contact_User_id'] }],
  }
)

class Device extends Model<IDevice> implements IDevice {
  Device_id!: string
  User_id!: number
  Device_name!: string
  signature_public_key!: Buffer
  certificate!: Buffer
  createdAt?: Date
}

Device.init(
  {
    Device_id: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    User_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'User_id',
      },
    },
    Device_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    signature_public_key: {
      type: DataTypes.BLOB,
      allowNull: false,
    },
    certificate: {
      type: DataTypes.BLOB,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Device',
  }
)

class KeyPackage extends Model<IKeyPackage> implements IKeyPackage {
  KeyPackage_id!: number
  Device_id!: string
  KeyPackage_ref!: string
  key_package!: Buffer
}

KeyPackage.init(
  {
    KeyPackage_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    Device_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Device,
        key: 'Device_id',
      },
    },
    KeyPackage_ref: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    key_package: {
      type: DataTypes.BLOB,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'KeyPackage',
    indexes: [{ unique: true, fields: ['Device_id', 'KeyPackage_ref'] }],
  }
)

class Conversation extends Model<IConversation, Partial<IConversation>> implements IConversation {
  Conversation_id!: string
  epoch!: number
  createdAt?: Date
  updatedAt?: Date
}

Conversation.init(
  {
    Conversation_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    epoch: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: 'Conversation',
  }
)

class ConversationDevice extends Model<IConversationDevice> implements IConversationDevice {
  Conversation_id!: string
  Device_id!: string
}

ConversationDevice.init(
  {
    Conversation_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      references: {
        model: Conversation,
        key: 'Conversation_id',
      },
    },
    Device_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      references: {
        model: Device,
        key: 'Device_id',
      },
    },
  },
  {
    sequelize,
    modelName: 'ConversationDevice',
  }
)

class Message extends Model<IMessage> implements IMessage {
  Message_id!: number
  Conversation_id!: string
  Sender_device_id!: string
  kind!: MessageKind
  epoch!: number
  payload!: Buffer
  createdAt?: Date
  // Loaded through the 'Sender' association
  Sender?: Device
}

Message.init(
  {
    Message_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    Conversation_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Conversation,
        key: 'Conversation_id',
      },
    },
    Sender_device_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Device,
        key: 'Device_id',
      },
    },
    kind: {
      type: DataTypes.ENUM('commit', 'welcome', 'application'),
      allowNull: false,
    },
    epoch: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    payload: {
      type: DataTypes.BLOB,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Message',
  }
)

class Delivery extends Model<IDelivery> implements IDelivery {
  Message_id!: number
  Device_id!: string
  KeyPackage_ref?: string | null
  // Loaded through the 'Message' association
  Message?: Message
}

Delivery.init(
  {
    Message_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: Message,
        key: 'Message_id',
      },
    },
    Device_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      references: {
        model: Device,
        key: 'Device_id',
      },
    },
    KeyPackage_ref: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Delivery',
  }
)

User.hasMany(Contact, { as: 'contact_list', foreignKey: 'User_id' })
Contact.belongsTo(User, { as: 'AddedBy', foreignKey: 'User_id' })

User.hasMany(Contact, { as: 'demands', foreignKey: 'Contact_User_id' })
Contact.belongsTo(User, { as: 'User', foreignKey: 'Contact_User_id' })

User.hasMany(Device, { as: 'Devices', foreignKey: 'User_id' })
Device.belongsTo(User, { as: 'User', foreignKey: 'User_id' })

Device.hasMany(KeyPackage, { as: 'KeyPackages', foreignKey: 'Device_id' })

Conversation.hasMany(ConversationDevice, { as: 'Members', foreignKey: 'Conversation_id' })
ConversationDevice.belongsTo(Conversation, { as: 'Conversation', foreignKey: 'Conversation_id' })
ConversationDevice.belongsTo(Device, { as: 'Device', foreignKey: 'Device_id' })

Message.hasMany(Delivery, { as: 'Deliveries', foreignKey: 'Message_id' })
Delivery.belongsTo(Message, { as: 'Message', foreignKey: 'Message_id' })
Message.belongsTo(Device, { as: 'Sender', foreignKey: 'Sender_device_id' })

export { sequelize, User, Contact, Device, KeyPackage, Conversation, ConversationDevice, Message, Delivery }
