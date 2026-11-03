import express, { type NextFunction, type Request, type Response } from 'express'
import cors from 'cors'
import router from './router'
import { sequelize } from '../sequelize/sequelize.models'
import { env } from './utils/env'
import { http_error, send_error } from './utils/http_error'

export function create_app() {
  const app = express()

  // Before body parsing, so that even a rejected body gets an answer the front-end can read
  app.use(cors({
    origin: env.CORS_ORIGINS,
    credentials: true
  }))

  // MLS commits carry welcomes and ratchet trees, which can exceed the 100kb default
  app.use(express.json({ limit: '1mb' }))

  app.use(router)

  // Errors thrown by middlewares, like body-parser on an invalid or too large body
  app.use((error: Error & { status?: number }, req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) return next(error)
    send_error(res, error.status && error.status < 500 ? new http_error(error.status, 'Invalid request body') : error)
  })

  return app
}

// Create missing tables, in dependency order, without altering existing ones
export async function init_database() {
  try {
    console.log('🔍 Checking database structure...')
    await sequelize.sync()
    console.log('✅ Database ready')
  } catch (error) {
    console.error('❌ Database initialization error:', error)
  }
}
