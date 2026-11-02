import express from 'express'
import inbox_controller from './inbox.controller'
import { require_device } from '../../utils/device.middleware'

const router = express.Router()

router.use(require_device)
router.get('/', inbox_controller.get_inbox)
router.post('/ack', inbox_controller.acknowledge)

export default router
