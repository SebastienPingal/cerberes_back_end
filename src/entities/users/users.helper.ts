import jwt from 'jsonwebtoken'
import { IUser } from '../../types'

export default class users_helper {
    static generate_uuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0
            const v = c == 'x' ? r : (r & 0x3 | 0x8)
            return v.toString(16)
        })
    }

    static generate_JWT(user: IUser) {
        const JWT_secret = process.env.JWT_SECRET ?? 'mysecret869'
        const payload = {
            id: user.User_id,
            name: user.User_name,
            uuid: user.User_contact_uuid
        }
        const token = jwt.sign(payload, JWT_secret, { expiresIn: '30d' })
        return token
    }
}
