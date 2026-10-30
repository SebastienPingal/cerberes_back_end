import { type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import auth_helper from './auth.helper'
import user from '../users/users.model'

export default class auth_controller {
  static async register(req: Request, res: Response) {
    try {
      const { User_name, User_password } = req.body
      auth_helper.validate_password(User_password)
      auth_helper.validate_email(req.body.User_email)
      auth_helper.validate_name(User_name)
      const User_email = req.body.User_email.toLowerCase()
      await user.check_if_email_is_used(User_email)

      const hashed_password = await bcrypt.hash(User_password, 10)

      // Only pick the fields a client is allowed to set
      const new_user = await user.create_one({
        User_name,
        User_email,
        User_password: hashed_password,
        User_contact_uuid: auth_helper.generate_uuid(),
      })
      const full_user = await user.find_one_by_id(new_user.User_id)

      res.status(201)
      auth_helper.set_auth_cookie(res, auth_helper.generate_JWT(full_user))
      res.json(full_user)

    } catch (error) {
      const typedError = error as Error;
      console.error(typedError.message)
      if (typedError.message === 'Email already used') {
        res.status(409).send(typedError.message);
      } else {
        res.status(500).send(typedError.message);
      }
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { User_email, User_password } = req.body
      if (typeof User_email !== 'string' || typeof User_password !== 'string') {
        throw new Error('Wrong email or password')
      }
      const credentials = await user.find_credentials_by_email(User_email.toLowerCase())
      // Same answer for an unknown email and a wrong password, to not reveal who has an account
      if (!credentials) {
        throw new Error('Wrong email or password')
      }
      const password_valid = await bcrypt.compare(User_password, credentials.User_password)
      if (!password_valid) {
        throw new Error('Wrong email or password')
      }
      const existing_user = await user.find_one_by_id(credentials.User_id)
      res.status(200)
      auth_helper.set_auth_cookie(res, auth_helper.generate_JWT(existing_user))
      res.json(existing_user)
    } catch (error) {
      const typedError = error as Error;
      if (typedError.message === 'Wrong email or password') {
        res.status(401).send(typedError.message);
      } else {
        res.status(500).send(typedError.message);
      }
      console.error(typedError.message)
    }
  }

  static logout(req: Request, res: Response) {
    auth_helper.clear_auth_cookie(res)
    res.status(204).send()
  }
}
