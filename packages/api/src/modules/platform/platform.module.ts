import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantEntitlement } from '../../entities/tenant-entitlement.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { ApprovalConfig } from './entities/approval-config.entity';
import { PlatformController } from './platform.controller';
import { ApprovalWorkflowController } from './controllers/approval-workflow.controller';
import { PlatformService } from './platform.service';
import { BatchEntitlementsService } from './services/batch-entitlements.service';
import { ApprovalConfigService } from './services/approval-config.service';
import { ApprovalWorkflowService } from './services/approval-workflow.service';
import { ModuleSpecService } from './module-spec.service';
import { ModuleDependencyService } from './module-dependency.service';
import { UsageModule } from '../usage/usage.module';
import { UserPermissionsModule } from '../user-permissions/user-permissions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TenantEntitlement, AuditLog, ApprovalConfig]),
    UsageModule,
    UserPermissionsModule,
  ],
  controllers: [PlatformController, ApprovalWorkflowController],
  providers: [
    PlatformService,
    BatchEntitlementsService,
    ApprovalConfigService,
    ApprovalWorkflowService,
    ModuleSpecService,
    ModuleDependencyService,
  ],
  exports: [
    PlatformService,
    BatchEntitlementsService,
    ApprovalConfigService,
    ApprovalWorkflowService,
    ModuleSpecService,
    ModuleDependencyService,
  ],
})
export class PlatformModule {}
