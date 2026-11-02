import express from 'express'
import conversations_controller from './conversations.controller'
import { require_device } from '../../utils/device.middleware'

const router = express.Router()

router.use(require_device)
router.get('/', conversations_controller.get_conversations)
router.post('/', conversations_controller.create_conversation)
router.post('/:Conversation_id/commits', conversations_controller.post_commit)
router.post('/:Conversation_id/messages', conversations_controller.post_message)

export default router
