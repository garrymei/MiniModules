import { Controller, Post, Get, Body, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './auth.guard';
import { Public } from './public.decorator';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './jwt.strategy';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantEntitlement } from '../../entities/tenant-entitlement.entity';

// 模拟用户数据库 - 在实际应用中这应该是真实的用户实体
interface User {
  id: string;
  username: string;
  password: string; // 在实际应用中应该是加密的密码
  roles: string[];
}

const MOCK_USERS: User[] = [
  {
    id: 'user-123',
    username: 'admin',
    password: 'password', // 在实际应用中应该是加密的密码
    roles: ['admin', 'user']
  }
];

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(TenantEntitlement)
    private tenantEntitlementRepository: Repository<TenantEntitlement>,
  ) {}

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
  @ApiResponse({
    status: 401,
    description: '认证失败'
  })
  async login(@Body() loginDto: LoginDto) {
    // 在实际应用中，这里应该验证用户名和密码
    const user = MOCK_USERS.find(u => u.username === loginDto.username);
    
    if (!user || user.password !== loginDto.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 获取用户可以访问的租户列表
    const entitlements = await this.tenantEntitlementRepository.find();
    const tenants = [...new Set(entitlements.map(e => e.tenantId))]; // 去重

    const userInfo = {
      userId: user.id,
      roles: user.roles,
      tenants: tenants
    };

    const payload: JwtPayload = {
      userId: userInfo.userId,
      roles: userInfo.roles,
      tenants: userInfo.tenants
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      user: userInfo
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