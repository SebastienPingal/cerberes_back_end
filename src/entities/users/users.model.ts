import { sequelize } from '../../utils/sequelize.client'
import { IUserCreation } from '../../types'

export default class user {
    static async create(user: IUserCreation) {
        try {
            return await sequelize.models.User.create(user)
        } catch (error) {
            throw new Error('Unable to create user')
        }
    }

    static async find_one_by_uuid(uuid: string) {
        try {
            return await sequelize.models.User.findOne({ where: { User_contact_uuid: uuid } })
        } catch (error) {
            throw new Error('Unable to find user')
        }
    }

    static async find_one_by_id(id: number) {
        try {
            return await sequelize.models.User.findOne({ where: { User_id: id } })
        } catch (error) {
            throw new Error('Unable to find user')
        }
    }

    static async delete_one_by_id(id: number) {
        try {
            return await sequelize.models.User.destroy({ where: { User_id: id } })
        } catch (error) {
            throw new Error('Unable to delete user')
        }
    }
}