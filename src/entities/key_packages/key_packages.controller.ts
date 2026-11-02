import { type Request, type Response } from 'express'
import type { IKeyPackage, IUser } from '../../types'
import key_package from './key_packages.model'
import device from '../devices/devices.model'
import user from '../users/users.model'
import { current_device } from '../../utils/device.middleware'
import { decode_base64, parse_uuid_list, to_base64 } from '../../utils/binary'
import { http_error, send_error } from '../../utils/http_error'

const MAX_KEY_PACKAGES_PER_DEVICE = 100

export default class key_packages_controller {
  static async upload_key_packages(req: Request, res: Response) {
    try {
      const this_device = current_device(res)
      const { key_packages } = req.body
      if (!Array.isArray(key_packages) || key_packages.length === 0 || key_packages.length > MAX_KEY_PACKAGES_PER_DEVICE) {
        throw new http_error(400, `key_packages must be a list of 1 to ${MAX_KEY_PACKAGES_PER_DEVICE} items`)
      }

      const existing_count = await key_package.count_for_device(this_device.Device_id)
      if (existing_count + key_packages.length > MAX_KEY_PACKAGES_PER_DEVICE) {
        throw new http_error(409, 'Too many key packages stored for this device')
      }

      const new_key_packages: IKeyPackage[] = key_packages.map((item: { KeyPackage_ref?: unknown, key_package?: unknown }) => {
        const KeyPackage_ref = item?.KeyPackage_ref
        if (typeof KeyPackage_ref !== 'string' || !/^[A-Za-z0-9_-]{16,64}$/.test(KeyPackage_ref)) {
          throw new http_error(400, 'KeyPackage_ref must be a random url-safe string')
        }
        return {
          Device_id: this_device.Device_id,
          KeyPackage_ref,
          key_package: decode_base64(item?.key_package, 'key_package', 16 * 1024),
        }
      })

      await key_package.create_many(new_key_packages)
      res.status(201).json({ count: existing_count + new_key_packages.length })
    } catch (error) {
      send_error(res, error)
    }
  }

  static async count_key_packages(req: Request, res: Response) {
    try {
      const this_device = current_device(res)
      const count = await key_package.count_for_device(this_device.Device_id)
      res.status(200).json({ count })
    } catch (error) {
      send_error(res, error)
    }
  }

  // Get one key package for each of the given devices, to add them to an MLS group
  static async claim_key_packages(req: Request, res: Response) {
    try {
      const this_user = req.user as IUser
      if (!this_user) throw new http_error(401, 'User is required')
      const Device_ids = parse_uuid_list(req.body.Device_ids, 'Device_ids')

      // Only devices of users the requester is allowed to talk to
      const devices = await device.find_all_by_ids(Device_ids)
      const owners = [...new Set(devices.map(this_device => this_device.User_id))]
      for (const owner_id of owners) {
        if (!await user.can_access(this_user.User_id, owner_id)) {
          throw new http_error(403, 'Not allowed to add this user')
        }
      }

      const claimed = await key_package.claim_one_per_device(devices.map(this_device => this_device.Device_id))
      res.status(200).json(claimed.map(this_key_package => ({
        Device_id: this_key_package.Device_id,
        KeyPackage_ref: this_key_package.KeyPackage_ref,
        key_package: to_base64(this_key_package.key_package),
      })))
    } catch (error) {
      send_error(res, error)
    }
  }
}
