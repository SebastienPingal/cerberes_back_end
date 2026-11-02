import express from 'express'
import key_packages_controller from './key_packages.controller'
import { require_device } from '../../utils/device.middleware'

const router = express.Router()

router.post('/', require_device, key_packages_controller.upload_key_packages)
router.get('/count', require_device, key_packages_controller.count_key_packages)
router.post('/claim', key_packages_controller.claim_key_packages)

export default router
