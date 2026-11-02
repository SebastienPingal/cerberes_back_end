import express from 'express'
import devices_controller from './devices.controller'

const router = express.Router()

router.get('/', devices_controller.get_devices)
router.post('/', devices_controller.register_device)

export default router
