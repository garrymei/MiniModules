import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { ApprovalWorkflowService, ApprovalDecision } from '../services/approval-workflow.service';
import { ApprovalConfig, ApprovalScope, ApprovalType } from '../entities/approval-config.entity';
import { ApprovalRequest } from '../entities/approval-request.entity';
import { JwtAuthGuard } from '../../auth/auth.guard';
import { AuditCreate, AuditUpdate } from '../../../common/decorators/audit.decorator';

@ApiTags('Approval Workflow')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('platform/approval')
export class ApprovalWorkflowController {
  constructor(private readonly approvalWorkflowService: ApprovalWorkflowService) {}

  @Get('configs')
  @ApiOperation({ summary: '获取审批配置列表' })
  async getApprovalConfigs(@Query() query: Partial<ApprovalConfig>): Promise<ApprovalConfig[]> {
    return this.approvalWorkflowService.getApprovalConfigs(query);
  }

  @Put('configs/:id')
  @ApiOperation({ summary: '更新审批配置' })
  @AuditUpdate('APPROVAL_CONFIG', '更新审批配置')
  async updateApprovalConfig(
    @Param('id') id: string,
    @Body() updates: Partial<ApprovalConfig>,
    @Request() req: any,
  ): Promise<ApprovalConfig> {
    const operatorId = req.user?.id;
    return this.approvalWorkflowService.updateApprovalConfig(id, updates, operatorId);
  }

  @Post('toggle')
  @ApiOperation({ summary: '启用/禁用审批' })
  @AuditUpdate('APPROVAL_CONFIG', '切换审批开关')
  async toggleApproval(
    @Body() body: { type: ApprovalType; scope: ApprovalScope; enabled: boolean; moduleKey?: string; tenantId?: string; },
    @Request() req: any,
  ): Promise<ApprovalConfig> {
    const operatorId = req.user?.id;
    return this.approvalWorkflowService.toggleApproval(body.type, body.scope, body.enabled, body.moduleKey, body.tenantId, operatorId);
  }

  @Post('requests')
  @ApiOperation({ summary: '创建审批请求' })
  @AuditCreate('APPROVAL_REQUEST', '创建审批请求')
  async createApprovalRequest(@Body() requestDto: Partial<ApprovalRequest>, @Request() req: any): Promise<ApprovalRequest> {
    requestDto.applicantId = req.user?.id;
    return this.approvalWorkflowService.createApprovalRequest(requestDto);
  }

  @Post('decisions')
  @ApiOperation({ summary: '处理审批决策' })
  @AuditUpdate('APPROVAL_REQUEST', '处理审批决策')
  async processApprovalDecision(@Body() decisionDto: ApprovalDecision, @Request() req: any): Promise<ApprovalRequest> {
      decisionDto.approverId = req.user?.id;
    return this.approvalWorkflowService.processApprovalDecision(decisionDto);
  }

  @Get('stats')
  @ApiOperation({ summary: '获取审批统计' })
  async getApprovalStats(
    @Query('type') type?: ApprovalType,
    @Query('scope') scope?: ApprovalScope,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.approvalWorkflowService.getApprovalStats(type, scope, tenantId);
  }
}