import { User } from '../../../sequelize/sequelize.models'
import { IUserCreation, IUserUpdate } from '../../types'

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

    static async update_one_by_id(update: IUserUpdate) {
        try {
            const user_to_update = await User.findOne({ where: { User_id: update.User_id } })
            if (!user_to_update) throw new Error('User not found')
            const updated_user = { 
                ...user_to_update,
                ...update,
                User_id: user_to_update.User_id,
                User_password: user_to_update.User_password
            }
            await User.update(updated_user, { where: { User_id: update.User_id } })
            return updated_user
        } catch (error) {
            throw new Error('Unable to update user')
        }
    }
}
