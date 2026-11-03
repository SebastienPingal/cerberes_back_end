import { Router } from 'express'
import auth_routes from './entities/auth/auth.router'
import users_routes from './entities/users/users.router'
import contacts_routes from './entities/contacts/contacts.router'
import devices_routes from './entities/devices/devices.router'
import key_packages_routes from './entities/key_packages/key_packages.router'
import conversations_routes from './entities/conversations/conversations.router'
import inbox_routes from './entities/inbox/inbox.router'
import my_passport from './utils/passport.config'
import cookieParser from 'cookie-parser'

const router = Router()

const authenticated = [cookieParser(), my_passport.authenticate('jwt', { session: false })]

router.use(auth_routes)
router.use('/users', authenticated, users_routes)
router.use('/contacts', authenticated, contacts_routes)
router.use('/devices', authenticated, devices_routes)
router.use('/key_packages', authenticated, key_packages_routes)
router.use('/conversations', authenticated, conversations_routes)
router.use('/inbox', authenticated, inbox_routes)

// health check
router.get('/', (req, res) => {
  res.send('OK')
})

export default router
