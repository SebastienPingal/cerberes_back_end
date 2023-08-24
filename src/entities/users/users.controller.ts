import { type Request, type Response } from 'express'
import type { IUserCreation, IUser } from '../../types'
import users_helper from './users.helper'
import user from './users.model'

export default class user_controller {
    static async get_user(req: Request, res: Response) {
        try {
            const this_user = req.user as IUser
            if (!this_user) throw new Error('User is required')
            console.log('this_user', this_user)
            res.status(200)
            res.send(this_user)
        } catch (error) {
            const typedError = error as Error
            res.status(500)
            res.send(typedError.message)
        }
    }

}
