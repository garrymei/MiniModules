import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction, AuditResourceType } from '../../../entities/audit-log.entity';
import { BusinessException, BusinessErrorCode } from '../../../common/errors/business.exception';

export interface ApprovalConfig {
  id: string;
  configApprovalEnabled: boolean;
  autoApproveConfig: boolean;
  defaultApproverRole: string;
  moduleSpecificRules: Array<{
    moduleId: string;
    reviewRequired: boolean;
    approverRole?: string;
    autoApproveThreshold?: number; // 自动审批阈值（分钟）
  }>;
  approvalTimeoutHours: number;
  notificationSettings: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    webhookEnabled: boolean;
  };
  // 灰度发布配置
  grayReleaseSettings: {
    enabled: boolean;
    percentage: number; // 灰度百分比 (0-100)
    targetTenants: string[]; // 目标租户列表
    excludeTenants: string[]; // 排除租户列表
    featureFlags: Record<string, boolean>; // 功能开关
  };
  // 审批角色配置
  approverRoles: Array<{
    roleId: string;
    roleName: string;
    permissions: string[];
    maxApprovalAmount?: number; // 最大审批金额
    canApproveModules: string[]; // 可审批的模块
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface GrayReleaseRule {
  id: string;
  featureName: string;
  enabled: boolean;
  percentage: number;
  targetTenants: string[];
  excludeTenants: string[];
  conditions: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ApprovalConfigService {
  private readonly logger = new Logger(ApprovalConfigService.name);
  private approvalConfig: ApprovalConfig = {
    id: 'default',
    configApprovalEnabled: true,
    autoApproveConfig: false,
    defaultApproverRole: 'admin',
    moduleSpecificRules: [
      { moduleId: 'ordering', reviewRequired: true, autoApproveThreshold: 60 },
      { moduleId: 'booking', reviewRequired: false, autoApproveThreshold: 30 },
      { moduleId: 'cms', reviewRequired: false, autoApproveThreshold: 15 },
    ],
    approvalTimeoutHours: 24,
    notificationSettings: {
      emailEnabled: true,
      smsEnabled: false,
      webhookEnabled: true,
    },
    grayReleaseSettings: {
      enabled: false,
      percentage: 0,
      targetTenants: [],
      excludeTenants: [],
      featureFlags: {
        newApprovalFlow: false,
        autoApproval: false,
        advancedNotifications: false,
      },
    },
    approverRoles: [
      {
        roleId: 'admin',
        roleName: 'Administrator',
        permissions: ['config:approve', 'config:publish', 'tenant:manage'],
        canApproveModules: ['ordering', 'booking', 'cms', 'user'],
      },
      {
        roleId: 'manager',
        roleName: 'Manager',
        permissions: ['config:approve'],
        maxApprovalAmount: 10000,
        canApproveModules: ['booking', 'cms'],
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * 获取审批配置
   */
  async getApprovalConfig(): Promise<ApprovalConfig> {
    return { ...this.approvalConfig };
  }

  /**
   * 更新审批配置
   */
  async updateApprovalConfig(config: Partial<ApprovalConfig>): Promise<ApprovalConfig> {
    this.approvalConfig = {
      ...this.approvalConfig,
      ...config,
      updatedAt: new Date(),
    };

    this.logger.log('Approval configuration updated', { configId: this.approvalConfig.id });
    return { ...this.approvalConfig };
  }

  /**
   * 检查租户是否在灰度发布范围内
   */
  async isTenantInGrayRelease(tenantId: string, featureName?: string): Promise<boolean> {
    const { grayReleaseSettings } = this.approvalConfig;

    if (!grayReleaseSettings.enabled) {
      return false;
    }

    // 检查是否在排除列表中
    if (grayReleaseSettings.excludeTenants.includes(tenantId)) {
      return false;
    }

    // 检查是否在目标列表中
    if (grayReleaseSettings.targetTenants.length > 0 && 
        !grayReleaseSettings.targetTenants.includes(tenantId)) {
      return false;
    }

    // 检查功能开关
    if (featureName && grayReleaseSettings.featureFlags[featureName] === false) {
      return false;
    }

    // 基于百分比的灰度判断
    if (grayReleaseSettings.percentage > 0) {
      const hash = this.hashTenantId(tenantId);
      return hash % 100 < grayReleaseSettings.percentage;
    }

    return true;
  }

  /**
   * 获取租户的功能开关状态
   */
  async getTenantFeatureFlags(tenantId: string): Promise<Record<string, boolean>> {
    const isInGray = await this.isTenantInGrayRelease(tenantId);
    const { featureFlags } = this.approvalConfig;

    if (!isInGray) {
      // 不在灰度范围内，返回默认关闭状态
      return Object.keys(featureFlags).reduce((acc, key) => {
        acc[key] = false;
        return acc;
      }, {} as Record<string, boolean>);
    }

    return { ...featureFlags };
  }

  /**
   * 检查是否需要审批
   */
  async requiresApproval(tenantId: string, moduleId: string, configData: any): Promise<{
    requiresApproval: boolean;
    approverRole?: string;
    autoApproveAfter?: number;
  }> {
    const { configApprovalEnabled, moduleSpecificRules, grayReleaseSettings } = this.approvalConfig;

    // 如果全局审批关闭
    if (!configApprovalEnabled) {
      return { requiresApproval: false };
    }

    // 检查灰度发布设置
    const isInGray = await this.isTenantInGrayRelease(tenantId, 'autoApproval');
    if (isInGray && grayReleaseSettings.featureFlags.autoApproval) {
      return { requiresApproval: false };
    }

    // 查找模块特定规则
    const moduleRule = moduleSpecificRules.find(rule => rule.moduleId === moduleId);
    if (!moduleRule) {
      return { requiresApproval: true, approverRole: this.approvalConfig.defaultApproverRole };
    }

    // 如果模块不需要审批
    if (!moduleRule.reviewRequired) {
      return { requiresApproval: false };
    }

    return {
      requiresApproval: true,
      approverRole: moduleRule.approverRole || this.approvalConfig.defaultApproverRole,
      autoApproveAfter: moduleRule.autoApproveThreshold,
    };
  }

  /**
   * 检查用户是否有审批权限
   */
  async canUserApprove(userRoleId: string, moduleId: string, amount?: number): Promise<boolean> {
    const approverRole = this.approvalConfig.approverRoles.find(role => role.roleId === userRoleId);
    
    if (!approverRole) {
      return false;
    }

    // 检查模块权限
    if (!approverRole.canApproveModules.includes(moduleId)) {
      return false;
    }

    // 检查金额限制
    if (amount && approverRole.maxApprovalAmount && amount > approverRole.maxApprovalAmount) {
      return false;
    }

    return true;
  }

  /**
   * 更新灰度发布设置
   */
  async updateGrayReleaseSettings(settings: Partial<ApprovalConfig['grayReleaseSettings']>): Promise<void> {
    this.approvalConfig.grayReleaseSettings = {
      ...this.approvalConfig.grayReleaseSettings,
      ...settings,
    };

    this.logger.log('Gray release settings updated', { settings });
  }

  /**
   * 添加审批角色
   */
  async addApproverRole(role: Omit<ApprovalConfig['approverRoles'][0], 'roleId'>): Promise<void> {
    const roleId = role.roleName.toLowerCase().replace(/\s+/g, '_');
    
    if (this.approvalConfig.approverRoles.find(r => r.roleId === roleId)) {
      throw new BusinessException(
        BusinessErrorCode.OPERATION_FAILED,
        `Approver role ${roleId} already exists`,
      );
    }

    this.approvalConfig.approverRoles.push({
      roleId,
      ...role,
    });

    this.logger.log('Approver role added', { roleId, roleName: role.roleName });
  }

  /**
   * 更新审批角色
   */
  async updateApproverRole(roleId: string, updates: Partial<ApprovalConfig['approverRoles'][0]>): Promise<void> {
    const roleIndex = this.approvalConfig.approverRoles.findIndex(r => r.roleId === roleId);
    
    if (roleIndex === -1) {
      throw new BusinessException(
        BusinessErrorCode.RESOURCE_NOT_FOUND,
        `Approver role ${roleId} not found`,
      );
    }

    this.approvalConfig.approverRoles[roleIndex] = {
      ...this.approvalConfig.approverRoles[roleIndex],
      ...updates,
    };

    this.logger.log('Approver role updated', { roleId });
  }

  /**
   * 删除审批角色
   */
  async removeApproverRole(roleId: string): Promise<void> {
    const roleIndex = this.approvalConfig.approverRoles.findIndex(r => r.roleId === roleId);
    
    if (roleIndex === -1) {
      throw new BusinessException(
        BusinessErrorCode.RESOURCE_NOT_FOUND,
        `Approver role ${roleId} not found`,
      );
    }

    this.approvalConfig.approverRoles.splice(roleIndex, 1);
    this.logger.log('Approver role removed', { roleId });
  }

  /**
   * 获取所有审批角色
   */
  async getApproverRoles(): Promise<ApprovalConfig['approverRoles']> {
    return [...this.approvalConfig.approverRoles];
  }

  /**
   * 生成租户ID的哈希值（用于灰度判断）
   */
  private hashTenantId(tenantId: string): number {
    let hash = 0;
    for (let i = 0; i < tenantId.length; i++) {
      const char = tenantId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * 更新审批配置
   */
  async updateApprovalConfig(
    config: Partial<ApprovalConfig>,
    updatedBy: string,
  ): Promise<ApprovalConfig> {
    const oldConfig = { ...this.approvalConfig };
    
    this.approvalConfig = {
      ...this.approvalConfig,
      ...config,
      id: 'default',
      updatedAt: new Date(),
    };

    // 记录审计日志
    await this.auditLogRepository.save({
      action: AuditAction.UPDATE,
      resourceType: AuditResourceType.CONFIG,
      resourceId: 'approval-config',
      resourceName: 'Approval Configuration',
      description: 'Updated approval workflow configuration',
      oldValues: oldConfig,
      newValues: this.approvalConfig,
      userId: updatedBy,
      result: 'success' as any,
    });

    return { ...this.approvalConfig };
  }

  /**
   * 检查模块是否需要审批
   */
  async requiresApproval(moduleId: string): Promise<boolean> {
    if (!this.approvalConfig.configApprovalEnabled) {
      return false;
    }

    if (this.approvalConfig.autoApproveConfig) {
      return false;
    }

    const moduleRule = this.approvalConfig.moduleSpecificRules.find(
      rule => rule.moduleId === moduleId
    );

    return moduleRule?.reviewRequired ?? true;
  }

  /**
   * 获取模块的审批角色
   */
  async getApproverRole(moduleId: string): Promise<string> {
    const moduleRule = this.approvalConfig.moduleSpecificRules.find(
      rule => rule.moduleId === moduleId
    );

    return moduleRule?.approverRole ?? this.approvalConfig.defaultApproverRole;
  }

  /**
   * 检查审批是否超时
   */
  async isApprovalTimeout(submittedAt: Date): Promise<boolean> {
    const timeoutMs = this.approvalConfig.approvalTimeoutHours * 60 * 60 * 1000;
    const now = new Date();
    return (now.getTime() - submittedAt.getTime()) > timeoutMs;
  }

  /**
   * 获取通知设置
   */
  async getNotificationSettings(): Promise<ApprovalConfig['notificationSettings']> {
    return { ...this.approvalConfig.notificationSettings };
  }

  /**
   * 启用/禁用审批流程
   */
  async toggleApprovalWorkflow(
    enabled: boolean,
    updatedBy: string,
  ): Promise<ApprovalConfig> {
    return this.updateApprovalConfig(
      { configApprovalEnabled: enabled },
      updatedBy,
    );
  }

  /**
   * 设置自动审批
   */
  async setAutoApprove(
    autoApprove: boolean,
    updatedBy: string,
  ): Promise<ApprovalConfig> {
    return this.updateApprovalConfig(
      { autoApproveConfig: autoApprove },
      updatedBy,
    );
  }

  /**
   * 添加模块特定规则
   */
  async addModuleRule(
    moduleId: string,
    reviewRequired: boolean,
    approverRole?: string,
    updatedBy?: string,
  ): Promise<ApprovalConfig> {
    const existingRuleIndex = this.approvalConfig.moduleSpecificRules.findIndex(
      rule => rule.moduleId === moduleId
    );

    const newRule = {
      moduleId,
      reviewRequired,
      approverRole,
    };

    if (existingRuleIndex >= 0) {
      this.approvalConfig.moduleSpecificRules[existingRuleIndex] = newRule;
    } else {
      this.approvalConfig.moduleSpecificRules.push(newRule);
    }

    return this.updateApprovalConfig(
      { moduleSpecificRules: this.approvalConfig.moduleSpecificRules },
      updatedBy || 'system',
    );
  }

  /**
   * 移除模块特定规则
   */
  async removeModuleRule(
    moduleId: string,
    updatedBy?: string,
  ): Promise<ApprovalConfig> {
    this.approvalConfig.moduleSpecificRules = this.approvalConfig.moduleSpecificRules.filter(
      rule => rule.moduleId !== moduleId
    );

    return this.updateApprovalConfig(
      { moduleSpecificRules: this.approvalConfig.moduleSpecificRules },
      updatedBy || 'system',
    );
  }

  /**
   * 获取审批统计
   */
  async getApprovalStats(): Promise<{
    totalConfigs: number;
    pendingApprovals: number;
    approvedToday: number;
    rejectedToday: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [totalConfigs, pendingApprovals, approvedToday, rejectedToday] = await Promise.all([
      this.auditLogRepository.count({
        where: { resourceType: AuditResourceType.CONFIG },
      }),
      this.auditLogRepository.count({
        where: { 
          action: AuditAction.UPDATE,
          resourceType: AuditResourceType.CONFIG,
          description: 'Config submitted for review',
        },
      }),
      this.auditLogRepository.count({
        where: { 
          action: AuditAction.UPDATE,
          resourceType: AuditResourceType.CONFIG,
          description: 'Config approved',
          createdAt: { $gte: today, $lt: tomorrow } as any,
        },
      }),
      this.auditLogRepository.count({
        where: { 
          action: AuditAction.UPDATE,
          resourceType: AuditResourceType.CONFIG,
          description: 'Config rejected',
          createdAt: { $gte: today, $lt: tomorrow } as any,
        },
      }),
    ]);

    return {
      totalConfigs,
      pendingApprovals,
      approvedToday,
      rejectedToday,
    };
  }

  /**
   * 动态开关控制
   */
  async toggleApprovalSwitch(
    switchName: string,
    enabled: boolean,
    operatorId: string,
    reason?: string,
  ): Promise<void> {
    const validSwitches = [
      'approvalRequired',
      'autoApproval',
      'grayRelease',
      'notifications',
      'auditLogging',
    ];

    if (!validSwitches.includes(switchName)) {
      throw new Error(`Invalid switch name: ${switchName}`);
    }

    // 更新开关状态
    switch (switchName) {
      case 'approvalRequired':
        this.approvalConfig.requiresApproval = enabled;
        break;
      case 'autoApproval':
        this.approvalConfig.autoApproval = enabled;
        break;
      case 'grayRelease':
        this.approvalConfig.grayReleaseSettings.enabled = enabled;
        break;
      case 'notifications':
        this.approvalConfig.notifications = enabled;
        break;
      case 'auditLogging':
        this.approvalConfig.auditLogging = enabled;
        break;
    }

    this.approvalConfig.updatedAt = new Date();

    // 记录开关变更日志
    this.logger.log(
      `Approval switch '${switchName}' ${enabled ? 'enabled' : 'disabled'} by ${operatorId}`,
      { switchName, enabled, operatorId, reason }
    );
  }

  /**
   * 获取所有开关状态
   */
  getSwitchStates(): Record<string, boolean> {
    return {
      approvalRequired: this.approvalConfig.requiresApproval,
      autoApproval: this.approvalConfig.autoApproval,
      grayRelease: this.approvalConfig.grayReleaseSettings.enabled,
      notifications: this.approvalConfig.notifications,
      auditLogging: this.approvalConfig.auditLogging,
    };
  }

  /**
   * 批量更新开关状态
   */
  async updateSwitchStates(
    switches: Record<string, boolean>,
    operatorId: string,
    reason?: string,
  ): Promise<void> {
    const validSwitches = [
      'approvalRequired',
      'autoApproval',
      'grayRelease',
      'notifications',
      'auditLogging',
    ];

    for (const [switchName, enabled] of Object.entries(switches)) {
      if (validSwitches.includes(switchName)) {
        await this.toggleApprovalSwitch(switchName, enabled, operatorId, reason);
      }
    }
  }

  /**
   * 验证开关配置
   */
  validateSwitchConfiguration(): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 检查冲突配置
    if (this.approvalConfig.requiresApproval && this.approvalConfig.autoApproval) {
      warnings.push('Both approval required and auto approval are enabled');
    }

    if (this.approvalConfig.grayReleaseSettings.enabled) {
      if (this.approvalConfig.grayReleaseSettings.percentage < 0 || 
          this.approvalConfig.grayReleaseSettings.percentage > 100) {
        errors.push('Gray release percentage must be between 0 and 100');
      }

      if (this.approvalConfig.grayReleaseSettings.targetTenants.length === 0 &&
          this.approvalConfig.grayReleaseSettings.percentage === 0) {
        warnings.push('Gray release is enabled but no tenants are targeted');
      }
    }

    // 检查审批角色配置
    if (this.approvalConfig.requiresApproval && this.approvalConfig.approverRoles.length === 0) {
      errors.push('Approval is required but no approver roles are configured');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 获取开关影响分析
   */
  getSwitchImpactAnalysis(switchName: string, enabled: boolean): {
    affectedTenants: number;
    affectedModules: string[];
    estimatedImpact: 'low' | 'medium' | 'high';
    recommendations: string[];
  } {
    const analysis = {
      affectedTenants: 0,
      affectedModules: [],
      estimatedImpact: 'low' as 'low' | 'medium' | 'high',
      recommendations: [] as string[],
    };

    switch (switchName) {
      case 'approvalRequired':
        analysis.affectedTenants = this.getTotalTenantCount();
        analysis.affectedModules = ['ordering', 'booking', 'cms', 'user'];
        analysis.estimatedImpact = 'high';
        analysis.recommendations = [
          'Monitor approval queue length',
          'Ensure approver roles are properly configured',
          'Set up notifications for pending approvals',
        ];
        break;

      case 'autoApproval':
        analysis.affectedTenants = this.getTotalTenantCount();
        analysis.affectedModules = ['ordering', 'booking'];
        analysis.estimatedImpact = 'medium';
        analysis.recommendations = [
          'Review auto-approval thresholds',
          'Monitor for abuse or errors',
          'Maintain audit trail',
        ];
        break;

      case 'grayRelease':
        analysis.affectedTenants = this.approvalConfig.grayReleaseSettings.targetTenants.length;
        analysis.affectedModules = ['all'];
        analysis.estimatedImpact = 'medium';
        analysis.recommendations = [
          'Monitor feature flag usage',
          'Collect feedback from target tenants',
          'Prepare rollback plan',
        ];
        break;

      case 'notifications':
        analysis.affectedTenants = this.getTotalTenantCount();
        analysis.affectedModules = ['all'];
        analysis.estimatedImpact = 'low';
        analysis.recommendations = [
          'Test notification delivery',
          'Monitor notification queue',
        ];
        break;

      case 'auditLogging':
        analysis.affectedTenants = this.getTotalTenantCount();
        analysis.affectedModules = ['all'];
        analysis.estimatedImpact = 'low';
        analysis.recommendations = [
          'Monitor log storage usage',
          'Ensure log retention policies are in place',
        ];
        break;
    }

    return analysis;
  }

  /**
   * 获取总租户数量（模拟）
   */
  private getTotalTenantCount(): number {
    // 这里应该从数据库查询实际租户数量
    return 1000;
  }

  /**
   * 导出开关配置
   */
  exportSwitchConfiguration(): {
    switches: Record<string, boolean>;
    grayReleaseSettings: any;
    approverRoles: any[];
    timestamp: Date;
  } {
    return {
      switches: this.getSwitchStates(),
      grayReleaseSettings: this.approvalConfig.grayReleaseSettings,
      approverRoles: this.approvalConfig.approverRoles,
      timestamp: new Date(),
    };
  }

  /**
   * 导入开关配置
   */
  async importSwitchConfiguration(
    config: {
      switches: Record<string, boolean>;
      grayReleaseSettings?: any;
      approverRoles?: any[];
    },
    operatorId: string,
  ): Promise<void> {
    // 更新开关状态
    if (config.switches) {
      await this.updateSwitchStates(config.switches, operatorId, 'Configuration import');
    }

    // 更新灰度发布设置
    if (config.grayReleaseSettings) {
      await this.updateGrayReleaseSettings(config.grayReleaseSettings);
    }

    // 更新审批角色
    if (config.approverRoles) {
      this.approvalConfig.approverRoles = config.approverRoles;
    }

    this.approvalConfig.updatedAt = new Date();
  }
}
