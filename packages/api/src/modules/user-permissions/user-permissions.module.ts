import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserPermissionsService } from './user-permissions.service';
import { User } from '../../entities/user.entity';
import { Tenant } from '../../entities/tenant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Tenant])],
  providers: [UserPermissionsService],
  exports: [UserPermissionsService],
})
export class UserPermissionsModule {}