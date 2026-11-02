import { env } from './utils/env'
import express from 'express'
import router from './router'
import { sequelize } from '../sequelize/sequelize.models'

const app = express()

const port = env.PORT

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