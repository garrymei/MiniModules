import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { JwtStrategy } from './jwt.strategy'

const defaultSecret = 'change-me'

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? defaultSecret,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
  exports: [JwtModule, PassportModule, JwtAuthGuard],
})
export class AuthModule {}
