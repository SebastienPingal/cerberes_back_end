import express from 'express'
import user_controller from './users.controller'

const router = express.Router()

router.post('/', user_controller.create_user)

export default router