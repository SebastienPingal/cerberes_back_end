import express from 'express'
import auth_controller from './auth.controller'

const router = express.Router()

// router.post('/auth/login', auth_controller.login)
router.post('/auth/register', auth_controller.register)

export default router