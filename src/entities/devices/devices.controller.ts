import { type Request, type Response } from 'express'
import type { IUser } from '../../types'
import device from './devices.model'
import devices_helper from './devices.helper'
import { decode_base64, is_uuid } from '../../utils/binary'
import { http_error, send_error } from '../../utils/http_error'

export default class devices_controller {
  static async register_device(req: Request, res: Response) {
    try {
      const this_user = req.user as IUser
      if (!this_user) throw new http_error(401, 'User is required')
      if (!this_user.identity_public_key) throw new http_error(409, 'Set up your identity before registering a device')

      const { Device_id, Device_name } = req.body
      if (!is_uuid(Device_id)) throw new http_error(400, 'Device_id must be a lowercase uuid')
      if (typeof Device_name !== 'string' || Device_name.length === 0 || Device_name.length > 64) {
        throw new http_error(400, 'Device_name must be between 1 and 64 characters')
      }
      const signature_public_key = decode_base64(req.body.signature_public_key, 'signature_public_key', 32)
      const certificate = decode_base64(req.body.certificate, 'certificate', 64)

      // The server can't be trusted with this check (clients verify certificates themselves),
      // but refusing invalid ones early keeps garbage out of the directory.
      const certificate_valid = devices_helper.verify_certificate(
        this_user.identity_public_key,
        this_user.User_id,
        Device_id,
        signature_public_key,
        certificate,
      )
      if (!certificate_valid) throw new http_error(400, 'Invalid device certificate')

      const new_device = await device.create_one({
        Device_id,
        User_id: this_user.User_id,
        Device_name,
        signature_public_key,
        certificate,
      })
      res.status(201).json(devices_helper.serialize(new_device))
    } catch (error) {
      send_error(res, error)
    }
  }

  static async get_devices(req: Request, res: Response) {
    try {
      const this_user = req.user as IUser
      if (!this_user) throw new http_error(401, 'User is required')
      const devices = await device.find_all_by_user_id(this_user.User_id)
      res.status(200).json(devices.map(devices_helper.serialize))
    } catch (error) {
      send_error(res, error)
    }
  }
}
