import { Op } from 'sequelize'
import { User, Contact, Conversation, UserConversation } from '../../../sequelize/sequelize.models'
import { IUserCreation, IUserUpdate, IUser, IContact } from '../../types'
import message_helper from '../messages/messages.helper'

export default class user {
  static async create_one(user: IUserCreation) {
    try {
      return await User.create(user)
    } catch (error) {
      const typedError = error as Error
      console.error(typedError.message)
      throw new Error('Unable to create user')
    }
  }

  static async find_one_by_uuid(uuid: string) {
    try {
      console.log('finding user with uuid', uuid)
      const userWithLists = await User.findOne({
        where: { User_contact_uuid: uuid },
        include: [
          {
            model: Contact,
            as: 'contact_list',
            required: false,
            include: [{
              model: User,
              as: 'User',
              attributes: ['User_name', 'encryption_public_key', 'signing_public_key', 'User_id']
            }]
          },
          {
            model: Contact,
            as: 'demands',
            required: false,
            include: [{
              model: User,
              as: 'AddedBy',
              attributes: ['User_name', 'encryption_public_key', 'signing_public_key', 'User_id']
            }]
          }]
      }) as IUser
      if (!userWithLists) throw new Error('User not found')
      if (userWithLists.encryption_public_key && userWithLists.signing_public_key) {
        userWithLists.encryption_public_key = message_helper.convert_buffer_to_uint8Array(userWithLists.encryption_public_key as Buffer)
        userWithLists.signing_public_key = message_helper.convert_buffer_to_uint8Array(userWithLists.signing_public_key as Buffer)
      }

      userWithLists.contact_list?.forEach((contact: IContact) => {
        if (!contact.User || !contact.User.encryption_public_key || !contact.User.signing_public_key) return
        contact.User.encryption_public_key = message_helper.convert_buffer_to_uint8Array(contact.User.encryption_public_key as Buffer)
        contact.User.signing_public_key = message_helper.convert_buffer_to_uint8Array(contact.User.signing_public_key as Buffer)
      })
      userWithLists.demands?.forEach((contact: IContact) => {
        if (!contact.AddedBy || !contact.AddedBy.encryption_public_key || !contact.AddedBy.signing_public_key) return
        contact.AddedBy.encryption_public_key = message_helper.convert_buffer_to_uint8Array(contact.AddedBy.encryption_public_key as Buffer)
        contact.AddedBy.signing_public_key = message_helper.convert_buffer_to_uint8Array(contact.AddedBy.signing_public_key as Buffer)
      })

      delete userWithLists.User_password
      return userWithLists
    } catch (error) {
      const typedError = error as Error
      throw new Error(`Unable to find user with uuid ${uuid} : ${typedError.message}`)
    }
  }

  static async find_one_by_id(id: number) {
    try {
      console.log('finding user with id', id)
      const userWithLists = await User.findOne({
        where: { User_id: id },
        include: [
          {
            model: Contact,
            as: 'contact_list',
            required: false,
            include: [{
              model: User,
              as: 'User',
              attributes: ['User_name', 'encryption_public_key', 'signing_public_key', 'User_id']
            }]
          },
          {
            model: Contact,
            as: 'demands',
            required: false,
            include: [{
              model: User,
              as: 'AddedBy',
              attributes: ['User_name', 'encryption_public_key', 'signing_public_key', 'User_id']
            }]
          }]
      }) as IUser
      if (!userWithLists) throw new Error('User not found')

      if (userWithLists.encryption_public_key && userWithLists.signing_public_key) {
        userWithLists.encryption_public_key = message_helper.convert_buffer_to_uint8Array(userWithLists.encryption_public_key as Buffer)
        userWithLists.signing_public_key = message_helper.convert_buffer_to_uint8Array(userWithLists.signing_public_key as Buffer)
      }
      userWithLists.contact_list?.forEach((contact: IContact) => {
        if (!contact.User || !contact.User.encryption_public_key || !contact.User.signing_public_key) return
        contact.User.encryption_public_key = message_helper.convert_buffer_to_uint8Array(contact.User.encryption_public_key as Buffer)
        contact.User.signing_public_key = message_helper.convert_buffer_to_uint8Array(contact.User.signing_public_key as Buffer)
      })
      userWithLists.demands?.forEach((contact: IContact) => {
        if (!contact.AddedBy || !contact.AddedBy.encryption_public_key || !contact.AddedBy.signing_public_key) return
        contact.AddedBy.encryption_public_key = message_helper.convert_buffer_to_uint8Array(contact.AddedBy.encryption_public_key as Buffer)
        contact.AddedBy.signing_public_key = message_helper.convert_buffer_to_uint8Array(contact.AddedBy.signing_public_key as Buffer)
      })

      delete userWithLists.User_password
      return userWithLists
    } catch (error) {
      const typedError = error as Error
      console.error(typedError.message)
      throw new Error(`Unable to find user with id ${id} : ${typedError.message}`)
    }
  }

  static async find_one_by_email(email: string): Promise<IUser | undefined> {
    try {
      console.log('finding user with email', email)
      const userWithLists = await User.findOne({
        where: { User_email: email },
        include: [
          {
            model: Contact,
            as: 'contact_list',
            required: false,
            include: [{
              model: User,
              as: 'User',
              attributes: ['User_name', 'encryption_public_key', 'signing_public_key', 'User_id']
            }]
          },
          {
            model: Contact,
            as: 'demands',
            required: false,
            include: [{
              model: User,
              as: 'AddedBy',
              attributes: ['User_name', 'encryption_public_key', 'signing_public_key', 'User_id']
            }]
          }]
      }) as IUser

      if (!userWithLists) throw new Error('User not found')

      if (userWithLists.encryption_public_key && userWithLists.signing_public_key) {
        userWithLists.encryption_public_key = message_helper.convert_buffer_to_uint8Array(userWithLists.encryption_public_key as Buffer)
        userWithLists.signing_public_key = message_helper.convert_buffer_to_uint8Array(userWithLists.signing_public_key as Buffer)
      }
      userWithLists.contact_list?.forEach((contact: IContact) => {
        if (!contact.User || !contact.User.encryption_public_key || !contact.User.signing_public_key) return
        contact.User.encryption_public_key = message_helper.convert_buffer_to_uint8Array(contact.User.encryption_public_key as Buffer)
        contact.User.signing_public_key = message_helper.convert_buffer_to_uint8Array(contact.User.signing_public_key as Buffer)
      })
      userWithLists.demands?.forEach((contact: IContact) => {
        if (!contact.AddedBy || !contact.AddedBy.encryption_public_key || !contact.AddedBy.signing_public_key) return
        contact.AddedBy.encryption_public_key = message_helper.convert_buffer_to_uint8Array(contact.AddedBy.encryption_public_key as Buffer)
        contact.AddedBy.signing_public_key = message_helper.convert_buffer_to_uint8Array(contact.AddedBy.signing_public_key as Buffer)
      })

      delete userWithLists.User_password
      return userWithLists
    } catch (error) {
      const typedError = error as Error
      console.error(typedError.message)
      throw new Error(`Unable to find user with email ${email} : ${typedError.message}`)
    }
  }

  static async check_if_email_is_used(email: string) {
    // throw error if email already exists
    const existing_user = await User.findOne({ where: { User_email: email } })
    if (existing_user) {
      throw new Error('Email already used')
    }
    return
  }

  static async delete_one_by_id(id: number) {
    try {
      return await User.destroy({ where: { User_id: id } })
    } catch (error) {
      throw new Error('Unable to delete user')
    }
  }

  static async update_one_by_id(user_to_update: IUser, update: IUserUpdate) {
    try {
      if (!user_to_update || !update) {
        throw new Error('Invalid input')
      }
      const { User_id, User_password, ...fields_to_update } = update

      await User.update(
        fields_to_update,
        { where: { User_id: user_to_update.User_id } }
      )

      let updated_user = {} as IUser
      await User.findOne({ where: { User_id: user_to_update.User_id } })
        .then((response) => {
          if (!response) throw new Error('Could not find user after update')
          updated_user = response.dataValues as IUser
        })

      return this.find_one_by_id(updated_user.User_id)

    } catch (error) {
      const typedError = error as Error
      console.error("Error updating user:", typedError.message)
      throw new Error('Unable to update user')
    }
  }

  static async update_public_keys(user_to_update: IUser, encryption_public_key: Uint8Array, signing_public_key: Uint8Array) {
    try {
      if (!user_to_update || !encryption_public_key || !signing_public_key) {
        throw new Error('Invalid input')
      }

      const encryption_public_key_array = Object.values(encryption_public_key)
      const encryption_public_key_uint8 = new Uint8Array(encryption_public_key_array)
      const buffered_encryption_public_key = Buffer.from(encryption_public_key_uint8)
      const signing_public_key_array = Object.values(signing_public_key)
      const signing_public_key_uint8 = new Uint8Array(signing_public_key_array)
      const buffered_signing_public_key = Buffer.from(signing_public_key_uint8)

      await User.update(
        {
          encryption_public_key: buffered_encryption_public_key,
          signing_public_key: buffered_signing_public_key
        },
        { where: { User_id: user_to_update.User_id } }
      )

      let updated_user = {} as IUser
      await User.findOne({ where: { User_id: user_to_update.User_id } })
        .then((response) => {
          if (!response) throw new Error('Could not find user after update')
          updated_user = response.dataValues as IUser
        })

      return this.find_one_by_id(updated_user.User_id)

    } catch (error) {
      const typedError = error as Error
      console.error("Error updating user:", typedError.message)
      throw new Error('Unable to update user')
    }
  }
}
