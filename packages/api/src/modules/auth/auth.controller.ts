import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  UnauthorizedException,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './auth.guard';
import { Public } from './public.decorator';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './jwt.strategy';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantEntitlement } from '../../entities/tenant-entitlement.entity';
import { WechatLoginDto } from './dto/wechat-login.dto';
import { User } from '../../entities/user.entity';
import { Tenant } from '../../entities/tenant.entity';
import { WechatService } from './services/wechat.service';
import { UserPermissionsService } from './services/user-permissions.service';

interface MockUser {
  id: string;
  username: string;
  password: string;
  roles: string[];
}

const MOCK_USERS: MockUser[] = [
  {
    id: 'user-123',
    username: 'admin',
    password: 'password',
    roles: ['admin', 'user'],
  },
];

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly jwtService: JwtService,
    private readonly wechatService: WechatService,
    private readonly userPermissionsService: UserPermissionsService,
    @InjectRepository(TenantEntitlement)
    private readonly tenantEntitlementRepository: Repository<TenantEntitlement>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
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
            tenants: { type: 'array', items: { type: 'string' } },
            tenantId: { type: 'string', nullable: true },
          },
        },
      },
    },
  })
  async login(@Body() loginDto: LoginDto) {
    const user = MOCK_USERS.find((u) => u.username === loginDto.username);

    if (!user || user.password !== loginDto.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const entitlements = await this.tenantEntitlementRepository.find({ where: { status: 'active' } });
    const tenants = [...new Set(entitlements.map((item) => item.tenantId))];

    const userInfo = {
      userId: user.id,
      roles: user.roles,
      tenants,
      tenantId: tenants[0] || null,
    };

    const payload: JwtPayload = {
      userId: userInfo.userId,
      roles: userInfo.roles,
      tenants: userInfo.tenants,
      tenantId: userInfo.tenantId || undefined,
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      user: userInfo,
    };
  }

  @Post('wechat')
  @Public()
  @ApiOperation({ summary: '微信小程序登录' })
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
            tenantId: { type: 'string' },
            wechatOpenId: { type: 'string' },
            nickname: { type: 'string' },
            avatarUrl: { type: 'string' },
          },
        },
      },
    },
  })
  async wechatLogin(@Body() dto: WechatLoginDto) {
    if (!dto.code) {
      throw new BadRequestException('code is required');
    }

    // 使用真实的微信API换取openId
    const session = await this.wechatService.exchangeCodeForSession(dto.code);
    const openId = session.openid;

    let user = await this.userRepository.findOne({ 
      where: { wechatOpenId: openId },
      relations: ['roles']
    });

    let tenantId = dto.tenantId;
    if (!user) {
      if (!tenantId) {
        tenantId = await this.resolveDefaultTenantId();
      }

      if (!tenantId) {
        throw new BadRequestException('Unable to determine tenant for new user');
      }

      user = this.userRepository.create({
        wechatOpenId: openId,
        tenantId,
        nickname: dto.nickname,
        avatarUrl: dto.avatarUrl,
        roles: [] // 新用户默认没有角色
      });
      user = await this.userRepository.save(user);
    } else if (dto.nickname || dto.avatarUrl) {
      user.nickname = dto.nickname ?? user.nickname;
      user.avatarUrl = dto.avatarUrl ?? user.avatarUrl;
      await this.userRepository.save(user);
    }

    // 获取用户角色
    const roles = user.roles ? user.roles.map(role => role.name) : [];

    const payload: JwtPayload = {
      userId: user.id,
      roles: roles,
      tenants: [user.tenantId],
      tenantId: user.tenantId,
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        userId: user.id,
        tenantId: user.tenantId,
        wechatOpenId: user.wechatOpenId,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  private async resolveDefaultTenantId(): Promise<string | null> {
    // 首先尝试查找活跃的租户
    const activeTenant = await this.tenantRepository.findOne({ 
      where: { status: 'active' } 
    });
    
    if (activeTenant) {
      return activeTenant.id;
    }

    // 如果没有活跃租户，返回第一个可用的租户
    const fallbackTenant = await this.tenantRepository.findOne({ 
      where: {} 
    });
    
    return fallbackTenant?.id ?? null;
  }

  @Get('me/permissions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户在租户下的模块与权限' })
  @ApiQuery({ name: 'tenantId', required: false, description: '租户ID，缺省使用第一可访问租户' })
  @ApiResponse({
    status: 200,
    description: '权限信息',
    schema: {
      type: 'object',
      properties: {
        tenantId: { type: 'string' },
        enabledModules: { type: 'array', items: { type: 'string' } },
        permissions: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async getPermissions(@Request() req, @Query('tenantId') tenantId?: string) {
    const payload = req.user as JwtPayload;
    const effectiveTenantId = tenantId || payload.tenantId || payload.tenants?.[0];

    if (!effectiveTenantId) {
      throw new BadRequestException('tenantId is required');
    }

    // 获取租户启用的模块
    const entitlements = await this.tenantEntitlementRepository.find({
      where: {
        tenantId: effectiveTenantId,
        status: 'active',
      },
    });

    const enabledModules = entitlements.map((item) => item.moduleKey);
    
    // 从数据库动态获取用户权限
    const permissions = await this.userPermissionsService.getUserPermissions(
      payload.userId,
      effectiveTenantId
    );

    return {
      tenantId: effectiveTenantId,
      enabledModules,
      permissions,
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
        tenants: { type: 'array', items: { type: 'string' } },
        tenantId: { type: 'string', nullable: true },
      },
    },
  })
  getProfile(@Request() req) {
    return req.user;
  }
}