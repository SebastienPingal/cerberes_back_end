import express from 'express'
import user_controller from './users.controller'

const router = express.Router()

router.get('/me', user_controller.get_user)
router.patch('/me', user_controller.update_user)
router.put('/me/identity', user_controller.set_identity)
router.get('/:User_id/directory', user_controller.get_directory)

export default router
