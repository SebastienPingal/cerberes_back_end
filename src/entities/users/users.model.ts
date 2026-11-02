import { Op, type WhereOptions } from 'sequelize'
import { User, Contact, Device, ConversationDevice } from '../../../sequelize/sequelize.models'
import { IUserCreation, IUserUpdate, IUser, IContact } from '../../types'
import { to_base64 } from '../../utils/binary'

// What anyone allowed to see a user gets to know about them
const PUBLIC_USER_ATTRIBUTES = ['User_id', 'User_name', 'identity_public_key']

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

  private static async find_one_with_lists(where: WhereOptions<IUser>, label: string) {
    try {
      const userWithLists = await User.findOne({
        where,
        include: [
          {
            model: Contact,
            as: 'contact_list',
            required: false,
            include: [{
              model: User,
              as: 'User',
              attributes: PUBLIC_USER_ATTRIBUTES
            }]
          },
          {
            model: Contact,
            as: 'demands',
            required: false,
            include: [{
              model: User,
              as: 'AddedBy',
              attributes: PUBLIC_USER_ATTRIBUTES
            }]
          }]
      }) as IUser
      if (!userWithLists) throw new Error('User not found')
      return userWithLists
    } catch (error) {
      const typedError = error as Error
      throw new Error(`Unable to find user with ${label} : ${typedError.message}`)
    }
  }

  static async find_one_by_uuid(uuid: string) {
    return this.find_one_with_lists({ User_contact_uuid: uuid }, `uuid ${uuid}`)
  }

  static async find_one_by_id(id: number) {
    return this.find_one_with_lists({ User_id: id }, `id ${id}`)
  }

  static async find_public_by_id(id: number) {
    return await User.findOne({ where: { User_id: id }, attributes: PUBLIC_USER_ATTRIBUTES })
  }

  // Only used to check a password at login: the result must never be sent to a client
  static async find_credentials_by_email(email: string) {
    try {
      return await User.scope('with_password').findOne({
        where: { User_email: email },
        attributes: ['User_id', 'User_password'],
      })
    } catch (error) {
      const typedError = error as Error
      console.error(typedError.message)
      throw new Error('Unable to find user credentials')
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
      // Only explicitly allowed fields can be changed here: email, password,
      // contact uuid and identity key have their own dedicated flows.
      const { User_name } = update

      await User.update(
        { User_name },
        { where: { User_id: user_to_update.User_id } }
      )

      return this.find_one_by_id(user_to_update.User_id)

    } catch (error) {
      const typedError = error as Error
      console.error("Error updating user:", typedError.message)
      throw new Error('Unable to update user')
    }
  }

  static async set_identity_public_key(User_id: number, identity_public_key: Buffer) {
    await User.update({ identity_public_key }, { where: { User_id } })
    return this.find_one_by_id(User_id)
  }

  // A user can see another one if they are contacts (in any direction) or share a conversation
  static async can_access(viewer_id: number, target_id: number) {
    if (viewer_id === target_id) return true

    const contact = await Contact.findOne({
      where: {
        [Op.or]: [
          { User_id: viewer_id, Contact_User_id: target_id },
          { User_id: target_id, Contact_User_id: viewer_id },
        ]
      }
    })
    if (contact) return true

    const viewer_memberships = await ConversationDevice.findAll({
      attributes: ['Conversation_id'],
      include: [{ model: Device, as: 'Device', where: { User_id: viewer_id }, attributes: [] }],
    })
    if (!viewer_memberships.length) return false

    const shared_membership = await ConversationDevice.findOne({
      where: { Conversation_id: viewer_memberships.map(membership => membership.Conversation_id) },
      include: [{ model: Device, as: 'Device', where: { User_id: target_id }, attributes: [] }],
    })
    return !!shared_membership
  }

  static serialize_public(this_user: IUser | undefined) {
    if (!this_user) return undefined
    return {
      User_id: this_user.User_id,
      User_name: this_user.User_name,
      identity_public_key: to_base64(this_user.identity_public_key),
    }
  }

  // What a user gets to know about themselves
  static serialize(this_user: IUser) {
    return {
      User_id: this_user.User_id,
      User_name: this_user.User_name,
      User_email: this_user.User_email,
      User_contact_uuid: this_user.User_contact_uuid,
      identity_public_key: to_base64(this_user.identity_public_key),
      contact_list: this_user.contact_list?.map((contact: IContact) => ({
        Contact_id: contact.Contact_id,
        Contact_User_id: contact.Contact_User_id,
        User: user.serialize_public(contact.User),
      })) ?? [],
      demands: this_user.demands?.map((contact: IContact) => ({
        Contact_id: contact.Contact_id,
        User_id: contact.User_id,
        AddedBy: user.serialize_public(contact.AddedBy),
      })) ?? [],
    }
  }
}
