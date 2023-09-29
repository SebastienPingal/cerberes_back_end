import { Strategy as JwtStrategy } from 'passport-jwt'
import passport from 'passport'
import user from '../entities/users/users.model'
import { Request } from 'express'

const cookieExtractor = function(req : Request) {
    var token = null;
    if (req && req.cookies) {
      token = req.cookies['token'];
    }
    return token;
}

const options = {
  jwtFromRequest: cookieExtractor,
  secretOrKey: process.env.JWT_SECRET ?? 'mysecret869'
}

const my_passport = passport.use(
  new JwtStrategy(options, async (payload, done) => {
    try {
      if (!payload.id) throw new Error()
      let this_user 
      console.log(payload.id)
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
