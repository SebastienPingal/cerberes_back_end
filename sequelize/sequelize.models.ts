const { Sequelize, DataTypes } = require('sequelize');
//initialize an instance of Sequelize with dialect postgres
const sequelize = new Sequelize({dialect: 'postgres', dialectOptions: {ssl: true}, URL: process.env.DATABASE_URL});

const User = sequelize.define('User', {
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
  PGP_PublicKey: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
});

const Contact = sequelize.define('Contact', {
  Contact_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  User_id: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'User_id'
    }
  },
  Contact_User_id: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'User_id'
    }
  },
});

const Conversation = sequelize.define('Conversation', {
  Conversation_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
});

const UserConversation = sequelize.define('UserConversation', {
  UserConversation_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  User_id: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'User_id'
    }
  },
  Conversation_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Conversation,
      key: 'Conversation_id'
    }
  },
});

const Message = sequelize.define('Message', {
  Message_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  Conversation_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Conversation,
      key: 'Conversation_id'
    }
  },
  Sender_id: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'User_id'
    }
  },
  MessageContent: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  TimeStamp: {
    type: DataTypes.DATE,
    allowNull: false,
  },
});

export { User, Contact, Conversation, UserConversation, Message }