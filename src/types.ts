import { Optional } from 'sequelize';

export interface IUser {
  User_id: number;
  User_name: string;
  User_email: string;
  User_password?: string;
  User_contact_uuid?: string;
  // Ed25519 public key derived from the user's BIP39 phrase, it certifies every device of the user
  identity_public_key?: Buffer | null;
  contact_list?: IContact[];
  demands?: IContact[];
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

export interface IDevice {
  Device_id: string;
  User_id: number;
  Device_name: string;
  // MLS signature public key of the device (Ed25519)
  signature_public_key: Buffer;
  // Signature of the device by the user's identity key, see devices.helper.ts
  certificate: Buffer;
  createdAt?: Date;
}

export interface IKeyPackage {
  KeyPackage_id?: number;
  Device_id: string;
  // Random reference chosen by the device to find the matching private keys when it is welcomed
  KeyPackage_ref: string;
  // Encoded MLS KeyPackage message
  key_package: Buffer;
}

export interface IConversation {
  // Also used as the MLS group id
  Conversation_id: string;
  // Current MLS epoch, incremented by every accepted commit
  epoch: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// MLS leaves of a conversation, as declared by the commits accepted by the server
export interface IConversationDevice {
  Conversation_id: string;
  Device_id: string;
}

export type MessageKind = 'commit' | 'welcome' | 'application';

export interface IMessage {
  Message_id?: number;
  Conversation_id: string;
  Sender_device_id: string;
  kind: MessageKind;
  epoch: number;
  // Encoded MLS message, opaque to the server
  payload: Buffer;
  createdAt?: Date;
}

// A message waiting to be fetched by a device
export interface IDelivery {
  Message_id: number;
  Device_id: string;
  // For welcome messages: which KeyPackage of the device was used
  KeyPackage_ref?: string | null;
}
