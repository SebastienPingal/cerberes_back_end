import { type Response } from 'express'

// An error carrying the HTTP status to answer with
export class http_error extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export function send_error(res: Response, error: unknown) {
  const typedError = error as Error
  const status = error instanceof http_error ? error.status : 500
  console.error(typedError.message)
  res.status(status).send(typedError.message)
}
