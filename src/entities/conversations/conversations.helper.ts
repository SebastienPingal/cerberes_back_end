import type { IAddedDevice } from '../messages/messages.model'
import { is_uuid } from '../../utils/binary'
import { http_error } from '../../utils/http_error'

export default class conversations_helper {
  static parse_epoch(raw_epoch: unknown): number {
    if (!Number.isInteger(raw_epoch) || (raw_epoch as number) < 0) {
      throw new http_error(400, 'epoch must be a positive integer')
    }
    return raw_epoch as number
  }

  // Devices added by a commit, with the reference of the key package used for each of them
  static parse_added_devices(raw_added: unknown): IAddedDevice[] {
    if (!Array.isArray(raw_added) || raw_added.length > 100) {
      throw new http_error(400, 'added must be a list of devices')
    }
    const added = raw_added.map((item: { Device_id?: unknown, KeyPackage_ref?: unknown }) => {
      const Device_id = item?.Device_id
      const KeyPackage_ref = item?.KeyPackage_ref
      if (!is_uuid(Device_id) || typeof KeyPackage_ref !== 'string') {
        throw new http_error(400, 'added devices need a Device_id and a KeyPackage_ref')
      }
      return { Device_id, KeyPackage_ref }
    })
    if (new Set(added.map(item => item.Device_id)).size !== added.length) {
      throw new http_error(400, 'A device can only be added once')
    }
    return added
  }
}
