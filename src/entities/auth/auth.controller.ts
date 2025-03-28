import { type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import type { IUserCreation, IUser } from '../../types'
import auth_helper from './auth.helper'
import user from '../users/users.model'

export default class auth_controller {
  static async register(req: Request, res: Response) {
    try {
      await user.check_if_email_is_used(req.body.User_email)
      auth_helper.validate_password(req.body.User_password)
      auth_helper.validate_email(req.body.User_email)
      auth_helper.validate_name(req.body.User_name)

      const hashed_password = await bcrypt.hash(req.body.User_password, 10)

      const user_uuid = auth_helper.generate_uuid()
      const user_input = {
        ...req.body,
        User_contact_uuid: user_uuid,
        User_password: hashed_password
      } as IUserCreation

      const new_user = await user.create_one(user_input as IUserCreation)
      const full_user = await user.find_one_by_id(new_user.User_id) as IUser

      const token = auth_helper.generate_JWT(new_user)
      res.status(201)
      res.cookie('token', token,
        {
          httpOnly: true,
          maxAge: 1000 * 60 * 60 * 24 * 7,
          sameSite: 'none',
          secure: true,
        })
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
      console.log('logging in user')
      const existing_user = await user.find_one_by_email(req.body.User_email) as IUser
      if (!existing_user) {
        throw new Error('User not found')
      }
      if (!existing_user.User_password) throw new Error('User has no password')
      const password_valid = await bcrypt.compare(
        req.body.User_password,
        existing_user.User_password
      )
      if (!password_valid) {
        throw new Error('Wrong password')
      }
      const token = auth_helper.generate_JWT(existing_user)
      res.status(200)
      res.cookie('token', token,
        {
          httpOnly: true,
          maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
          sameSite: 'none',
          secure: true,
        })
      res.json(existing_user)
    } catch (error) {
      const typedError = error as Error;
      if (typedError.message === 'User not found') {
        res.status(401).send(typedError.message);
      } else if (typedError.message === 'Wrong password') {
        res.status(401).send(typedError.message);
      } else {
        res.status(500).send(typedError.message);
      }
      console.error(typedError.message)
    }
  }
}
