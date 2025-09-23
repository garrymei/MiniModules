import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './auth.guard';
import { Public } from './public.decorator';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './jwt.strategy';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private jwtService: JwtService) {}

  @Post('login')
  @Public()
  @ApiOperation({ summary: '用户登录' })
  @ApiResponse({ 
    status: 200, 
    description: '登录成功',
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            roles: { type: 'array', items: { type: 'string' } },
            tenants: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  })
  async login(@Body() loginDto: LoginDto) {
    // Mock 用户数据
    const mockUser = {
      userId: 'user-123',
      roles: ['admin', 'user'],
      tenants: ['tenant-1', 'tenant-2']
    };

    const payload: JwtPayload = {
      userId: mockUser.userId,
      roles: mockUser.roles,
      tenants: mockUser.tenants
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      user: mockUser
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户信息' })
  @ApiResponse({ 
    status: 200, 
    description: '用户信息',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        roles: { type: 'array', items: { type: 'string' } },
        tenants: { type: 'array', items: { type: 'string' } }
      }
    }
  })
  getProfile(@Request() req) {
    return req.user;
  }
}
