import { User, Contact } from '../../../sequelize/sequelize.models'
import { IUserCreation, IUserUpdate, IUser } from '../../types'

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
      return await User.findOne({ where: { User_contact_uuid: uuid } })
    } catch (error) {
      throw new Error('Unable to find user')
    }
  }

  static async find_one_by_id(id: number) {
    try {
      return await User.findOne({ where: { User_id: id } })
    } catch (error) {
      throw new Error('Unable to find user')
    }
  }

  static async find_one_by_email(email: string) {
    try {
      const userWithLists = await User.findOne({
        where: { User_email: email },
        include: [
          {
            model: Contact,
            as: 'AddedContacts',
            required: false,
            include: [{
              model: User,
              as: 'AddedBy',
              attributes: ['User_name', 'PGP_PublicKey']
            }]
          },
          {
            model: Contact,
            as: 'AddedByOthers',
            required: false,
            include: [{

              model: User,
              as: 'User',
              attributes: ['User_name', 'PGP_PublicKey']
            }]
          }
        ]
      }) as IUser
      console.log('userWithLists', userWithLists)
      let contactUserIds: number[] = [];

      if (userWithLists.AddedContacts)
        contactUserIds = userWithLists.AddedContacts.map(contact => contact.AddedBy?.User_id!)

      if (userWithLists.AddedByOthers)
        userWithLists.demand_list = userWithLists.AddedByOthers?.filter(contact => !contactUserIds.includes(contact.User!.User_id));

      return {
        ...userWithLists,
        contact_list: userWithLists.AddedContacts,
        demand_list: userWithLists.demand_list
      }
    } catch (error) {
      throw new Error('Unable to find user')
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
        throw new Error('Invalid input');
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

      return updated_user

    } catch (error) {
      const typedError = error as Error
      console.error("Error updating user:", typedError.message);
      throw new Error('Unable to update user');
    }
  }
}
