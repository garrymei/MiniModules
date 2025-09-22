import { Controller, Get, Req, UseGuards } from '@nestjs/common'
import { Request } from 'express'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { Role } from '../auth/roles.enum'

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string
    username: string
    role: Role
  }
}

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  @Get('profile')
  getProfile(@Req() req: AuthenticatedRequest) {
    return {
      user: req.user,
    }
  }
}
