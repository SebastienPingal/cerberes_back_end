import { randomUUID } from 'crypto'
import jwt from 'jsonwebtoken'
import type { CookieOptions, Response } from 'express'
import { IUser } from '../../types'
import { env } from '../../utils/env'

const AUTH_COOKIE_NAME = 'token'
const AUTH_COOKIE_MAX_AGE = 1000 * 60 * 60 * 24 * 7 // 1 week, same as the JWT

export default class auth_helper {
    // The contact uuid is shared to be added as a contact: it must not be guessable
    static generate_uuid() {
        return randomUUID()
    }

    static auth_cookie_options(): CookieOptions {
        return {
            httpOnly: true,
            sameSite: 'none',
            secure: true,
            partitioned: true,
            // Set to backend domain (e.g. .yourdomain.com) to allow cookie sharing across subdomains
            domain: env.COOKIE_DOMAIN
        }
    }

    static set_auth_cookie(res: Response, token: string) {
        res.cookie(AUTH_COOKIE_NAME, token, { ...auth_helper.auth_cookie_options(), maxAge: AUTH_COOKIE_MAX_AGE })
    }

    static clear_auth_cookie(res: Response) {
        res.clearCookie(AUTH_COOKIE_NAME, auth_helper.auth_cookie_options())
    }

    static generate_JWT(user: IUser) {
        const payload = {
            id: user.User_id,
            name: user.User_name,
            uuid: user.User_contact_uuid
        }
        const token = jwt.sign(payload, env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '1w' })
        return token
    }

    static validate_password(password: unknown) {
        if (typeof password !== 'string') throw new Error('Password is required')
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

    static validate_email(email: unknown) {
        if (typeof email !== 'string') throw new Error('Email is required')
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

    static validate_name(name: unknown) {
        if (typeof name !== 'string') throw new Error('Name is required')
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
