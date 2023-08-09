import express from 'express'
import user_controller from './users.controller'
import my_passport from '../../utils/passport.config'

const router = express.Router()

router.post('/', user_controller.create_user)
router.get('/',
    my_passport.authenticate('jwt', { session: false }),
    user_controller.get_user
)

export default router