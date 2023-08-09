import { type Request, type Response } from 'express'
import type { IUserCreation, IUser } from '../../types'
import users_helper from './users.helper'
import user from './users.model'

export default class user_controller {
    static async create_user(req: Request, res: Response) {
        try {
            // check if user already exists
            await user.check_if_name_is_used(req.body.User_name)

            // generate uuid
            const user_uuid = users_helper.generate_uuid()
            const user_input = {
                ...req.body,
                User_contact_uuid: user_uuid
            } as IUserCreation

            // create user
            const new_user = await user.create_one(user_input as IUserCreation)
            users_helper.generate_JWT(new_user)
            res.status(201)
            res.send(new_user)

        } catch (error) {
            const typedError = error as Error;
            if (typedError.message === 'User already exists') {
            res.status(409).send(typedError.message);
            } else {
                res.status(500).send(typedError.message);
            }
        }
    }

    static async get_user(req: Request, res: Response) {
        try {
            const this_user = req.user as IUser
            if (!this_user) throw new Error('User is required')
            
            res.status(200)
            res.send(this_user)
        } catch (error) {
            const typedError = error as Error
            res.status(500)
            res.send(typedError.message)
        }
    }
}