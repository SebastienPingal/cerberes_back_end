import express from 'express'
import conversations_controller from './conversations.controller'

const router = express.Router()

router.get('/', conversations_controller.get_conversations)
router.post('/', conversations_controller.create_conversation)

export default router
