import jwt from 'jsonwebtoken'
import { IUser } from '../../types'

export default class auth_helper {
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
        const token = jwt.sign(payload, JWT_secret, { expiresIn: '1w' })
        return token
    }

    static validate_password(password: string) {
        const error_message = []
        if (password.length < 8) {
            error_message.push('Password must be at least 8 characters long')
        }
        if (password.length > 50) {
            error_message.push('Password must be less than 50 characters long')
        }
        if (!password.match(/[a-z]/)) {
            error_message.push('Password must contain at least one lowercase letter')
        }
        if (!password.match(/[A-Z]/)) {
            error_message.push('Password must contain at least one uppercase letter')
        }
        if (!password.match(/[0-9]/)) {
            error_message.push('Password must contain at least one number')
        }
        if(error_message.length > 0) {
            throw new Error(error_message.join('\n'))
        }
    }

    static validate_email(email: string) {
        const error_message = []
        if (email.length > 50) {
            error_message.push('Email must be less than 50 characters long')
        }
        if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            error_message.push('Email must be a valid email address')
        }
        if(error_message.length > 0) {
            throw new Error(error_message.join('\n'))
        }
    }

    static validate_name(name: string) {
        const error_message = []
        if (name.length > 50) {
            error_message.push('Name must be less than 50 characters long')
        }
        if (!name.match(/^[a-zA-Z]+$/)) {
            error_message.push('Name must only contain letters')
        }
        if (!name.match(/^[^\s]+$/)) {
            error_message.push('Name must not contain spaces')
        }
        if(error_message.length > 0) {
            throw new Error(error_message.join('\n'))
        }
    }
}
