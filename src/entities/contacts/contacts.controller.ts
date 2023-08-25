import { type Request, type Response } from 'express'
import contact from './contacts.model'
import type { IContact, IUser } from '../../types'
import user from '../users/users.model'

export default class contact_controller {
  static async get_contacts(req: Request, res: Response) {
    try {
      const this_user = req.user as IUser
      if (!this_user) throw new Error('User is required')

      const contacts = await contact.find_all_by_user_id(this_user.User_id)
      res.status(200)
      res.send(contacts)
    } catch (error) {
      const typedError = error as Error
      console.error(typedError.message)
      res.status(500)
      res.send(typedError.message)
    }
  }

  static async create_contact(req: Request, res: Response) {
    try {
      const uuid = req.query.uuid as string
      if (!uuid) throw new Error('uuid is required')

      const { User_id } = req.user as IUser
      const new_contact_user = await user.find_one_by_uuid(uuid)
      if (!new_contact_user) throw new Error('User not found')
      if (new_contact_user.User_id === User_id) throw new Error('Cannot add self as contact')

      const contact_input = {
        Contact_User_id: new_contact_user.User_id,
        User_id
      } as IContact

      const new_contact = await contact.create_one(contact_input)
      res.status(201)
      res.send(new_contact)
    } catch (error) {
      const typedError = error as Error
      console.error(typedError.message)
      res.status(500)
      res.send(typedError.message)
    }
  }
}
