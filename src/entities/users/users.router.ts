import express from 'express'
import user_controller from './users.controller'

const router = express.Router()

router.get('/users/me', user_controller.get_user)

export default router