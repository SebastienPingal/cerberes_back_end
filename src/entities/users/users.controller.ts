import { type Request, type Response } from 'express'
import type { IUser, IUserUpdate } from '../../types'
import user from './users.model'
import device from '../devices/devices.model'
import devices_helper from '../devices/devices.helper'
import auth_helper from '../auth/auth.helper'
import { decode_base64 } from '../../utils/binary'
import { http_error, send_error } from '../../utils/http_error'

export default class user_controller {
  static async get_user(req: Request, res: Response) {
    try {
      const this_user = req.user as IUser
      if (!this_user) throw new Error('User is required')
      res.status(200)
      res.json(user.serialize(this_user))
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
      const update: IUserUpdate = { User_name: req.body.User_name }
      auth_helper.validate_name(update.User_name)

      const updated_user = await user.update_one_by_id(user_to_update, update) as IUser
      if (!updated_user) throw new Error('Unable to update user')

      res.status(200)
      res.json(user.serialize(updated_user))
    } catch (error) {
      const typedError = error as Error
      console.error(typedError.message)
      res.status(500)
      res.send(typedError.message)
    }
  }

  // The identity key is derived from the user's BIP39 phrase and can only be set once:
  // changing it would silently invalidate every device and every safety number.
  static async set_identity(req: Request, res: Response) {
    try {
      const this_user = req.user as IUser
      if (!this_user) throw new http_error(401, 'User is required')
      const identity_public_key = decode_base64(req.body.identity_public_key, 'identity_public_key', 32)
      if (identity_public_key.length !== 32) throw new http_error(400, 'identity_public_key must be 32 bytes')

      if (this_user.identity_public_key) {
        if (!Buffer.from(this_user.identity_public_key).equals(identity_public_key)) {
          throw new http_error(409, 'This account already has another identity')
        }
        res.status(200).json(user.serialize(this_user))
        return
      }

      const updated_user = await user.set_identity_public_key(this_user.User_id, identity_public_key)
      res.status(200).json(user.serialize(updated_user))
    } catch (error) {
      send_error(res, error)
    }
  }

  // Public identity and certified devices of a user, used by clients to validate MLS credentials
  static async get_directory(req: Request, res: Response) {
    try {
      const this_user = req.user as IUser
      if (!this_user) throw new http_error(401, 'User is required')
      const target_id = Number(req.params.User_id)
      if (!Number.isInteger(target_id) || target_id <= 0) throw new http_error(400, 'Invalid user id')

      const allowed = await user.can_access(this_user.User_id, target_id)
      if (!allowed) throw new http_error(404, 'User not found')

      const target_user = await user.find_public_by_id(target_id)
      if (!target_user) throw new http_error(404, 'User not found')
      const devices = await device.find_all_by_user_id(target_id)

      res.status(200).json({
        ...user.serialize_public(target_user),
        devices: devices.map(devices_helper.serialize),
      })
    } catch (error) {
      send_error(res, error)
    }
  }
}
