import { createPublicKey, verify } from 'crypto'
import type { IDevice } from '../../types'
import { to_base64 } from '../../utils/binary'

const DEVICE_CERTIFICATE_LABEL = 'cerberes/device-certificate/v1'
// DER prefix of an Ed25519 SubjectPublicKeyInfo, followed by the 32 bytes of the raw key
const ED25519_SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex')

// Concatenate fields, each prefixed with its length on 4 bytes, so that no two inputs give the same bytes
function encode_fields(fields: Buffer[]): Buffer {
  return Buffer.concat(fields.flatMap((field) => {
    const length = Buffer.alloc(4)
    length.writeUInt32BE(field.length)
    return [length, field]
  }))
}

export default class devices_helper {
  // What the identity key signs to certify a device.
  // Must stay byte for byte identical to the front-end (src/crypto/identity.ts).
  static certificate_message(User_id: number, Device_id: string, signature_public_key: Buffer): Buffer {
    return encode_fields([
      Buffer.from(DEVICE_CERTIFICATE_LABEL, 'utf8'),
      Buffer.from(String(User_id), 'utf8'),
      Buffer.from(Device_id, 'utf8'),
      signature_public_key,
    ])
  }

  static verify_certificate(identity_public_key: Buffer, User_id: number, Device_id: string, signature_public_key: Buffer, certificate: Buffer): boolean {
    try {
      const key = createPublicKey({
        key: Buffer.concat([ED25519_SPKI_PREFIX, identity_public_key]),
        format: 'der',
        type: 'spki',
      })
      const message = devices_helper.certificate_message(User_id, Device_id, signature_public_key)
      return verify(null, message, key, certificate)
    } catch (error) {
      return false
    }
  }

  static serialize(this_device: IDevice) {
    return {
      Device_id: this_device.Device_id,
      User_id: this_device.User_id,
      Device_name: this_device.Device_name,
      signature_public_key: to_base64(this_device.signature_public_key),
      certificate: to_base64(this_device.certificate),
      createdAt: this_device.createdAt,
    }
  }
}
