import express, { type Request, type Response } from 'express'
import { env, missing_env } from './utils/env'

const MISCONFIGURED_MESSAGE = 'Server misconfigured: required environment variables are missing, see the server logs'

function log_missing_env() {
  console.error(`❌ Missing environment variables: ${missing_env.join(', ')}. Every request is answered with 503 until they are set.`)
}

// Without its configuration the API can't work. Instead of crashing, which browsers only report as a
// network error, answer every request with an explicit 503 and log what is missing.
function create_misconfigured_app() {
  const app = express()
  app.use((req: Request, res: Response) => {
    log_missing_env()
    const origin = req.header('Origin')
    if (origin) {
      // The answer is a static message without any data: any origin may read it
      res.setHeader('Access-Control-Allow-Origin', origin)
      res.setHeader('Access-Control-Allow-Credentials', 'true')
      res.setHeader('Vary', 'Origin')
    }
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE')
      res.setHeader('Access-Control-Allow-Headers', req.header('Access-Control-Request-Headers') ?? '')
      res.status(204).end()
      return
    }
    res.status(503).send(MISCONFIGURED_MESSAGE)
  })
  return app
}

// The real app (routes, database, session secret) is only loaded once its configuration is complete
async function create_server() {
  if (missing_env.length) {
    log_missing_env()
    return create_misconfigured_app()
  }
  const { create_app, init_database } = await import('./app')
  init_database()
  return create_app()
}

const app_promise = create_server()

if (env.NODE_ENV !== 'production') {
  app_promise.then(app => app.listen(env.PORT, () => {
    console.log(`🚀 Server is running on port ${env.PORT}`)
  }))
}

// Entry point of the Vercel function
export default async function handler(req: Request, res: Response) {
  const app = await app_promise
  app(req, res)
}
