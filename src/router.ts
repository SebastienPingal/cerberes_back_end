import { Router } from 'express'
import authRoutes from './entities/auth/auth.router'
import usersRoutes from './entities/users/users.router'
import passport from 'passport'
import { testConnection } from './utils/sequelize.client'
import { User, Contact, Conversation, UserConversation, Message } from '../sequelize/sequelize.models'

const router = Router()
router.use('/users', passport.authenticate('jwt', { session: false }), usersRoutes)
router.use(authRoutes)

// health check
router.get('/', (req, res) => {
  res.send('OK')
})

// test database connection
router.get('/testDB', async (req, res) => {
  try {
    await testConnection()
    res.send('OK')
  } catch (error) {
    const typedError = error as Error
    res.status(500)
    res.send(typedError.message)
  }
})

// sync db
router.get('/syncDB', async (req, res) => {
  try {
      console.log('syncing db')
        await User.sync({force: true})
        await Contact.sync({force: true})
        await Conversation.sync({force: true})
        await UserConversation.sync({force: true})
        await Message.sync({ force: true })
        console.log('synced db')
        res.send('OK')
    } catch (error) {
        const typedError = error as Error
        res.status(500)
        res.send(typedError.message)
    }
})

export default router