import { Device } from '../../../sequelize/sequelize.models'
import type { IDevice } from '../../types'

export default class device {
  static async create_one(new_device: IDevice) {
    try {
      return await Device.create(new_device)
    } catch (error) {
      const typedError = error as Error
      console.error(typedError.message)
      throw new Error('Unable to register device')
    }
  }

  static async find_one_of_user(User_id: number, Device_id: string) {
    return await Device.findOne({ where: { Device_id, User_id } })
  }

  static async find_all_by_user_id(User_id: number) {
    return await Device.findAll({
      where: { User_id },
      order: [['createdAt', 'ASC']],
    })
  }

  static async find_all_by_ids(Device_ids: string[]) {
    return await Device.findAll({ where: { Device_id: Device_ids } })
  }
}
