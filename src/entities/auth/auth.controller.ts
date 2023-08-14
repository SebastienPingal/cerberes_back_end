import { type Request, type Response } from 'express'
import type { IUserCreation, IUser } from '../../types'
import auth_helper from './auth.helper'
import user from '../users/users.model'

export default class user_controller {
    static async register(req: Request, res: Response) {
        try {
            // check if email is taken
            await user.check_if_email_is_used(req.body.User_email)

            // generate uuid
            const user_uuid = auth_helper.generate_uuid()
            const user_input = {
                ...req.body,
                User_contact_uuid: user_uuid
            } as IUserCreation

            // create user
            const new_user = await user.create_one(user_input as IUserCreation)

            // generate JWT
            const token = auth_helper.generate_JWT(new_user)
            res.status(201)
            res.send(token)

        } catch (error) {
            const typedError = error as Error;
            if (typedError.message === 'Email already used') {
                res.status(409).send(typedError.message);
            } else {
                res.status(500).send(typedError.message);
            }
        }
    }
}