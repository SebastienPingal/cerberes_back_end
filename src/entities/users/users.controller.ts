import { type Request, type Response } from 'express'
import type { IUserCreation } from '../../types'
import users_helper from './users.helper'
import user from './users.model'

export default class user_controller {
    static async create_user(req: Request, res: Response) {
        try {
            const user_uuid = users_helper.generate_uuid()
            const user_input = {
                ...req.body,
                User_contact_uuid: user_uuid
            } as IUserCreation
            
            const new_user = await user.create_one(user_input as IUserCreation)
            res.status(201)
            res.send(new_user)
        } catch (error) {
            const typedError = error as Error
            res.status(500)
            res.send(typedError.message)
        }
    }

    static async get_user(req: Request, res: Response) {
        try {
            const user_uuid = req.body.id
            const this_user = await user.find_one_by_uuid(user_uuid)
            res.status(200)
            res.send(this_user)
        } catch (error) {
            const typedError = error as Error
            res.status(500)
            res.send(typedError.message)
        }
    }
}