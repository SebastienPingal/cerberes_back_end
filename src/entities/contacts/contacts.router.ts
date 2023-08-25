import express from 'express'
import contacts_controller from './contacts.controller'

const router = express.Router()

router.get('/', contacts_controller.get_contacts)
router.post('/', contacts_controller.create_contact)

export default router
