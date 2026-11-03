import { env } from './utils/env'
import express, { type NextFunction, type Request, type Response } from 'express'
import cors from 'cors'
import router from './router'
import { sequelize } from '../sequelize/sequelize.models'
import { http_error, send_error } from './utils/http_error'

const app = express()

const port = env.PORT

// Before body parsing, so that even a rejected body gets an answer the front-end can read
app.use(cors({
  origin: env.CORS_ORIGINS,
  credentials: true
}))

// MLS commits carry welcomes and ratchet trees, which can exceed the 100kb default
app.use(express.json({ limit: '1mb' }))

// Initialize database (sync models without force)
async function initDatabase() {
  try {
    console.log('🔍 Checking database structure...')

    // Create missing tables, in dependency order, without altering existing ones
    await sequelize.sync()

    console.log('✅ Database ready')
  } catch (error) {
    console.error('❌ Database initialization error:', error)
  }
}

// Mount the router
app.use(router)

// Errors thrown by middlewares, like body-parser on an invalid or too large body
app.use((error: Error & { status?: number }, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) return next(error)
  send_error(res, error.status && error.status < 500 ? new http_error(error.status, 'Invalid request body') : error)
})

// Start server and initialize database
if (env.NODE_ENV !== 'production') {
  app.listen(port, async () => {
    console.log(`🚀 Server is running on port ${port}`)
    await initDatabase()
  })
} else {
  // For Vercel, we need to export the app
  initDatabase().catch(console.error)
}

export default app