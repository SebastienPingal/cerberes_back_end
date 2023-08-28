import { Router } from 'express'
import auth_Routes from './entities/auth/auth.router'
import users_Routes from './entities/users/users.router'
import contacts_Routes from './entities/contacts/contacts.router'
import conversations_Routes from './entities/conversations/conversations.router'
import my_passport from './utils/passport.config'
import { testConnection } from './utils/sequelize.client'
import { User, Contact, Conversation, UserConversation, Message } from '../sequelize/sequelize.models'
import cors from 'cors'

const router = Router()

router.use(cors())
router.use(auth_Routes)
router.use(
  '/users',
  my_passport.authenticate('jwt', { session: false }),
  users_Routes
)
router.use(
  '/contacts',
  my_passport.authenticate('jwt', { session: false }),
  contacts_Routes
)
router.use(
  '/conversations',
  my_passport.authenticate('jwt', { session: false }),
    conversations_Routes
)

// ___________________________________
// # TODO - create a router for those routes

// health check
router.get('/', (req, res) => {
  res.send('OK')
})

// test database connection
router.get('/testDB', async (req, res) => {
  try {
    console.log('testing db')
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
    await User.sync({ force: true })
    await Contact.sync({ force: true })
    await Conversation.sync({ force: true })
    await UserConversation.sync({ force: true })
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
