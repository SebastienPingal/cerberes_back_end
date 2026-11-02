import { type NextFunction, type Request, type Response } from 'express'
import device from '../entities/devices/devices.model'
import type { IDevice, IUser } from '../types'
import { is_uuid } from './binary'
import { http_error, send_error } from './http_error'

// MLS routes act on behalf of one device of the authenticated user, given by the X-Device-Id header
export async function require_device(req: Request, res: Response, next: NextFunction) {
  try {
    const this_user = req.user as IUser
    if (!this_user) throw new http_error(401, 'User is required')
    const Device_id = req.header('X-Device-Id')
    if (!is_uuid(Device_id)) throw new http_error(400, 'X-Device-Id header is required')

    const this_device = await device.find_one_of_user(this_user.User_id, Device_id)
    if (!this_device) throw new http_error(403, 'Unknown device')

    res.locals.device = this_device
    next()
  } catch (error) {
    send_error(res, error)
  }
}

export function current_device(res: Response): IDevice {
  return res.locals.device as IDevice
}
