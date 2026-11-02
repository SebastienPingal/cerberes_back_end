import { http_error } from './http_error'

const BASE64_REGEX = /^[A-Za-z0-9+/]*={0,2}$/
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

// Binary fields travel as base64 strings in JSON bodies and responses
export function decode_base64(value: unknown, name: string, max_bytes = 64 * 1024): Buffer {
  if (typeof value !== 'string' || !BASE64_REGEX.test(value)) {
    throw new http_error(400, `${name} must be a base64 string`)
  }
  const buffer = Buffer.from(value, 'base64')
  if (buffer.length === 0 || buffer.length > max_bytes) {
    throw new http_error(400, `${name} has an invalid size`)
  }
  return buffer
}

export function to_base64(buffer: Buffer | Uint8Array | null | undefined): string | null {
  return buffer ? Buffer.from(buffer).toString('base64') : null
}

// Lowercase canonical UUID, as produced by crypto.randomUUID() and returned by Postgres
export function is_uuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value)
}

export function parse_uuid_list(value: unknown, name: string, max_length = 100): string[] {
  if (!Array.isArray(value) || value.length > max_length || !value.every(is_uuid)) {
    throw new http_error(400, `${name} must be a list of device ids`)
  }
  return [...new Set<string>(value)]
}
