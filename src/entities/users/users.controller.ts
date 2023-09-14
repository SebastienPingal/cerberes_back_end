import { type Request, type Response } from 'express'
import type { IUser, IUserUpdate, IContact } from '../../types'
import user from './users.model'
import contacts from '../contacts/contacts.model'

export default class user_controller {
  static async get_user(req: Request, res: Response) {
    try {
      const this_user = req.user as IUser
      if (!this_user) throw new Error('User is required')

      try {
        const contact_list = await contacts.find_all_by_user_id(this_user.User_id) as IContact[]
        if (contact_list) this_user.contact_list = contact_list
      } catch (error) {
        console.error(error)
      }
      res.status(200)
      res.send(this_user)
    } catch (error) {
      const typedError = error as Error
      console.error(typedError.message)
      res.status(500)
      res.send(typedError.message)
    }
  }

  static async update_user(req: Request, res: Response) {
    try {
      const user_to_update = req.user as IUser
      if (!user_to_update) throw new Error('User is required')
      const update = req.body as IUserUpdate

      const updated_user = await user.update_one_by_id(user_to_update, update) as IUser
      if (!updated_user) throw new Error('Unable to update user')
      delete updated_user.User_password

      res.status(200)
      res.send(updated_user)
    } catch (error) {
      const typedError = error as Error
      console.error(typedError.message)
      res.status(500)
      res.send(typedError.message)
    }
  }
}
