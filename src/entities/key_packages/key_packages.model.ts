import { sequelize, KeyPackage } from '../../../sequelize/sequelize.models'
import type { IKeyPackage } from '../../types'

export default class key_package {
  static async create_many(key_packages: IKeyPackage[]) {
    try {
      return await KeyPackage.bulkCreate(key_packages)
    } catch (error) {
      const typedError = error as Error
      console.error(typedError.message)
      throw new Error('Unable to store key packages')
    }
  }

  static async count_for_device(Device_id: string) {
    return await KeyPackage.count({ where: { Device_id } })
  }

  // Hand out, and delete, the oldest key package of each device: a key package must only be used once
  static async claim_one_per_device(Device_ids: string[]) {
    return await sequelize.transaction(async (transaction) => {
      const claimed: IKeyPackage[] = []
      for (const Device_id of Device_ids) {
        const this_key_package = await KeyPackage.findOne({
          where: { Device_id },
          order: [['KeyPackage_id', 'ASC']],
          lock: transaction.LOCK.UPDATE,
          skipLocked: true,
          transaction,
        })
        if (!this_key_package) continue
        await this_key_package.destroy({ transaction })
        claimed.push(this_key_package)
      }
      return claimed
    })
  }
}
