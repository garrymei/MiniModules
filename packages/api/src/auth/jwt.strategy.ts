import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { JwtPayload } from './interfaces/jwt-payload.interface'

const defaultSecret = 'change-me'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? defaultSecret,
    })
  }

  async validate(payload: JwtPayload) {
    return {
      userId: payload.sub,
      username: payload.username,
      role: payload.role,
    }
  }
}
