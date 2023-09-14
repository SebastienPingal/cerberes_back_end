import { Optional } from 'sequelize';

export interface IUser {
  User_id: number;
  User_name: string;
  User_email: string;
  User_password?: string;
  User_contact_uuid?: string;
  PGP_PublicKey?: string;
  contact_list?: IContact[];
  demand_list?: IContact[];
  AddedContacts?: IContact[];
  AddedByOthers?: IContact[];
}

export interface IUserCreation extends Optional<IUser, "User_id"> { }

export interface IUserUpdate extends Partial<IUser> { }

export interface IContact {
  Contact_id: number;
  User_id: number;
  Contact_User_id: number;
  AddedBy?: IUser;
  User?: IUser;
}

export interface IConversation {
  Conversation_id: number;
}

export interface IUserConversation {
  UserConversation_id: number;
  User_id: number;
  Conversation_id: number;
}

export interface IMessage {
  Message_id: number;
  Conversation_id: number;
  Sender_id: number;
  Message_content: string;
}
