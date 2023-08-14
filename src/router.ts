import { Router } from 'express'
import authRoutes from './entities/auth/auth.router'
import usersRoutes from './entities/users/users.router'
import passport from 'passport'
import { testConnection, sequelize} from './utils/sequelize.client'

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
        await sequelize.sync({ force: true })
        res.send('OK')
    } catch (error) {
        const typedError = error as Error
        res.status(500)
        res.send(typedError.message)
    }
})

export default router