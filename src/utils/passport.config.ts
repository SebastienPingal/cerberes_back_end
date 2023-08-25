import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt'
import passport from 'passport'
import user from '../entities/users/users.model'
import { IUser } from '../types'

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET ?? 'mysecret869'
}

const my_passport = passport.use(
  new JwtStrategy(options, async (payload, done) => {
    try {
      if (!payload.id) throw new Error()
      let this_user 
      await user.find_one_by_id(payload.id).then((response) => {
        if (!response) throw new Error()
        this_user = response.dataValues
      })
      done(null, this_user)
    } catch (error) {
      done(null, false)
    }
  })
)

export default my_passport
