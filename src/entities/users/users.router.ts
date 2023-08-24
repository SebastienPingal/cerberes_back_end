import express from 'express'
import user_controller from './users.controller'

const router = express.Router()

router.get('/me', user_controller.get_user)

export default router
