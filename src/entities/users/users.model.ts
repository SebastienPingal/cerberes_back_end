import {User} from './users.model'
import sequelize from '../../utils/sequelize.client'

export default class user {
    static async create(user: User) {
        try {
            return await sequelize.models.User.create(user)
        }catch(error) {
            throw new Error('Unable to create user')
        }
}
}
