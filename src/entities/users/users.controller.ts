import { type Request, type Response } from 'express'
import type { IUser, IUserUpdate } from '../../types'
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

    static async update_user(req: Request, res: Response) {
        try {
            const user_to_update = req.user as IUser
            if (!user_to_update) throw new Error('User is required')
            const update = req.body as IUserUpdate
            const updated_user = await user.update_one_by_id(user_to_update, update)
            res.status(200)
            res.send(updated_user)
        } catch (error) {
            const typedError = error as Error
            console.error
            res.status(500)
            res.send(typedError.message)
        }
    }
}
