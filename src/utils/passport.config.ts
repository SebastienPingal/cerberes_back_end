import { Strategy as JwtStrategy } from 'passport-jwt'
import passport from 'passport'
import user from '../entities/users/users.model'
import { Request } from 'express'
import { env } from './env'

const cookieExtractor = function(req : Request) {
    let token = null;
    if (req && req.cookies) {
      token = req.cookies['token'];
    }
    return token;
}

const options = {
  jwtFromRequest: cookieExtractor,
  secretOrKey: env.JWT_SECRET,
  algorithms: ['HS256']
}

const my_passport = passport.use(
  new JwtStrategy(options, async (payload, done) => {
    try {
      if (!payload.id) throw new Error()
      let this_user
      await user.find_one_by_id(payload.id).then((response) => {
        if (!response) throw new Error()
        this_user = response
      })
      done(null, this_user)
    } catch (error) {
      done(null, false)
    }
  })
)

export default my_passport
