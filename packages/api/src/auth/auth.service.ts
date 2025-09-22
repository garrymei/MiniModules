import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Role } from './roles.enum'
import { AuthUser } from './interfaces/auth-user.interface'
import { JwtPayload } from './interfaces/jwt-payload.interface'
import { LoginDto } from './dto/login.dto'

interface InternalUser extends AuthUser {
  password: string
}

const users: InternalUser[] = [
  {
    id: 'user-admin',
    username: 'admin',
    password: 'admin123',
    role: Role.Admin,
  },
  {
    id: 'user-staff',
    username: 'staff',
    password: 'staff123',
    role: Role.Staff,
  },
]

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  private findUser(username: string): InternalUser | undefined {
    return users.find(user => user.username === username)
  }

  private toAuthUser(user: InternalUser): AuthUser {
    const { password: _password, ...rest } = user
    return rest
  }

  private createTokenPayload(user: AuthUser): JwtPayload {
    return {
      sub: user.id,
      username: user.username,
      role: user.role,
    }
  }

  async login({ username, password }: LoginDto) {
    const user = this.findUser(username)

    if (!user || user.password !== password) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const authUser = this.toAuthUser(user)
    const payload = this.createTokenPayload(authUser)
    const token = await this.jwtService.signAsync(payload)

    return {
      token,
      user: authUser,
    }
  }
}
