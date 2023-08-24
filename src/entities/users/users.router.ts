import express from 'express'
import user_controller from './users.controller'

const router = express.Router()

router.get('/me', user_controller.get_user)
router.patch('/me', user_controller.update_user)

export default router
