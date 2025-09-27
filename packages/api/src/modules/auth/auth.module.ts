import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { UserPermissionsService } from './services/user-permissions.service';
import { WechatService } from './services/wechat.service';
import { TenantEntitlement } from '../../entities/tenant-entitlement.entity';
import { User } from '../../entities/user.entity';
import { Tenant } from '../../entities/tenant.entity';
import { Role } from '../../entities/role.entity';
import { RolePermission } from '../../entities/role-permission.entity';
import { UserRole } from '../../entities/user-role.entity';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
    }),
    TypeOrmModule.forFeature([TenantEntitlement, User, Tenant, Role, RolePermission, UserRole]),
  ],
  controllers: [AuthController],
  providers: [JwtStrategy, UserPermissionsService, WechatService],
  exports: [JwtModule, UserPermissionsService, WechatService],
})
export class AuthModule {}