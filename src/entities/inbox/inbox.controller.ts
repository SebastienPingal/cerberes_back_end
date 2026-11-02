import { type Request, type Response } from 'express'
import message from '../messages/messages.model'
import { current_device } from '../../utils/device.middleware'
import { http_error, send_error } from '../../utils/http_error'

export default class inbox_controller {
  static async get_inbox(req: Request, res: Response) {
    try {
      const this_device = current_device(res)
      const messages = await message.find_inbox(this_device.Device_id)
      res.status(200).json(messages)
    } catch (error) {
      send_error(res, error)
    }
  }

  static async acknowledge(req: Request, res: Response) {
    try {
      const this_device = current_device(res)
      const { Message_ids } = req.body
      if (!Array.isArray(Message_ids) || Message_ids.length > 100 || !Message_ids.every(id => Number.isInteger(id) && id > 0)) {
        throw new http_error(400, 'Message_ids must be a list of message ids')
      }
      await message.acknowledge(this_device.Device_id, Message_ids)
      res.status(204).send()
    } catch (error) {
      send_error(res, error)
    }
  }
}
