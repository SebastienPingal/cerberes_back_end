import { User } from '../../../sequelize/sequelize.models'
import { IUserCreation, IUserUpdate, IUser } from '../../types'

export default class user {
    static async create_one(user: IUserCreation) {
        try {
            console.log('user', user)
            return await User.create(user)
        } catch (error) {
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
            return await User.findOne({ where: { User_email: email } })
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
        let updated_user 
        await User.findOne({ where: { User_id: user_to_update.User_id } })
          .then((response) => {
            if (!response) throw new Error()
            updated_user = response.dataValues
          })
        return updated_user
      } catch (error) {
        const typedError = error as Error
        console.error("Error updating user:", typedError.message);
        throw new Error('Unable to update user');
      }
    }
}
