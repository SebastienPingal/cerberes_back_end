import { Router } from 'express'
import auth_routes from './entities/auth/auth.router'
import users_routes from './entities/users/users.router'
import contacts_routes from './entities/contacts/contacts.router'
import conversations_routes from './entities/conversations/conversations.router'
import messages_routes from './entities/messages/messages.router'
import my_passport from './utils/passport.config'
import cookieParser from 'cookie-parser'
import { testConnection } from './utils/sequelize.client'
import { User, Contact, Conversation, UserConversation, Message } from '../sequelize/sequelize.models'
import cors from 'cors'

const router = Router()

router.use(cors({
  origin: (origin, callback) => {
    try {
      callback(null, true);
    } catch (error) {
      console.error('Error inside CORS Middleware', error);
    }
  },
  credentials: true
}))


router.use(auth_routes)
router.use(
  '/users',
  cookieParser(),
  my_passport.authenticate('jwt', { session: false }),
  users_routes
)
router.use(
  '/contacts',
  cookieParser(),
  my_passport.authenticate('jwt', { session: false }),
  contacts_routes
)
router.use(
  '/conversations',
  cookieParser(),
  my_passport.authenticate('jwt', { session: false }),
  conversations_routes
)
router.use(
  '/messages',
  cookieParser(),
  my_passport.authenticate('jwt', { session: false }),
  messages_routes
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
