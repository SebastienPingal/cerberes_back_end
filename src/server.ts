import express from 'express'
import router from './router'
import { sequelize } from './utils/sequelize.client'
import { User, Contact, Conversation, UserConversation, Message } from '../sequelize/sequelize.models'

const app = express()

const port = process.env.PORT ?? 3000

app.use(express.json())

// Initialize database (sync models without force)
async function initDatabase() {
  try {
    console.log('🔍 Checking database structure...')
    
    // Sync all models without dropping tables (force: false)
    await User.sync({ alter: false })
    await Contact.sync({ alter: false })
    await Conversation.sync({ alter: false })
    await UserConversation.sync({ alter: false })
    await Message.sync({ alter: false })
    
    console.log('✅ Database ready')
  } catch (error) {
    console.error('❌ Database initialization error:', error)
  }
}

// Mount the router
app.use(router)

// Start server and initialize database
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, async () => {
    console.log(`🚀 Server is running on port ${port}`)
    await initDatabase()
  })
} else {
  // For Vercel, we need to export the app
  initDatabase().catch(console.error)
}

export default app