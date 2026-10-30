import { Router } from 'express'
import auth_routes from './entities/auth/auth.router'
import users_routes from './entities/users/users.router'
import contacts_routes from './entities/contacts/contacts.router'
import conversations_routes from './entities/conversations/conversations.router'
import messages_routes from './entities/messages/messages.router'
import my_passport from './utils/passport.config'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { env } from './utils/env'

const router = Router()

router.use(cors({
  origin: env.CORS_ORIGINS,
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

// health check
router.get('/', (req, res) => {
  res.send('OK')
})

export default router
