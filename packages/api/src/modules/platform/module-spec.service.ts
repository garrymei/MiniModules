import { Injectable, NotFoundException } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
// 临时定义ModuleSpec接口，后续需要从libs包导入
interface ModuleSpec {
  id: string;
  key: string;
  name: string;
  version: string;
  description: string;
  routes: any[];
  configSchema: any;
  config_schema: any; // 兼容旧字段名
  capabilities: any;
  dependencies: string[];
}

@Injectable()
export class ModuleSpecService {
  private readonly moduleSpecs: Map<string, ModuleSpec> = new Map();

  /**
   * 加载所有模块规范
   */
  loadAllModuleSpecs(): void {
    try {
      // 加载 ordering 模块规范
      const orderingSpecPath = join(__dirname, '../../../../libs/module-spec/ordering.json');
      const orderingSpec = JSON.parse(readFileSync(orderingSpecPath, 'utf-8'));
      this.moduleSpecs.set(orderingSpec.id, orderingSpec);

      // 加载 booking 模块规范
      const bookingSpecPath = join(__dirname, '../../../../libs/module-spec/booking.json');
      const bookingSpec = JSON.parse(readFileSync(bookingSpecPath, 'utf-8'));
      this.moduleSpecs.set(bookingSpec.id, bookingSpec);

      // 加载 user 模块规范
      const userSpecPath = join(__dirname, '../../../../libs/module-spec/user.json');
      const userSpec = JSON.parse(readFileSync(userSpecPath, 'utf-8'));
      this.moduleSpecs.set(userSpec.id, userSpec);

      // 加载 cms 模块规范
      const cmsSpecPath = join(__dirname, '../../../../libs/module-spec/cms.json');
      const cmsSpec = JSON.parse(readFileSync(cmsSpecPath, 'utf-8'));
      this.moduleSpecs.set(cmsSpec.id, cmsSpec);

      console.log(`✅ 成功加载 ${this.moduleSpecs.size} 个模块规范`);
    } catch (error) {
      console.error('❌ 加载模块规范失败:', error);
    }
  }

  /**
   * 根据模块ID获取模块规范
   * @param moduleId 模块ID
   * @returns 模块规范
   */
  getModuleSpec(moduleId: string): ModuleSpec {
    const spec = this.moduleSpecs.get(moduleId);
    if (!spec) {
      throw new NotFoundException(`Module spec not found for module: ${moduleId}`);
    }
    return spec;
  }

  /**
   * 获取所有模块规范
   * @returns 所有模块规范列表
   */
  getAllModuleSpecs(): ModuleSpec[] {
    return Array.from(this.moduleSpecs.values());
  }

  /**
   * 验证租户配置是否符合模块规范
   * @param moduleId 模块ID
   * @param config 租户配置
   * @returns 验证结果
   */
  validateModuleConfig(moduleId: string, config: Record<string, any>): { isValid: boolean; errors?: string[] } {
    try {
      const spec = this.getModuleSpec(moduleId);
      const errors: string[] = [];
      
      // 如果模块没有配置模式，则认为验证通过
      const configSchema = spec.config_schema || spec.configSchema;
      if (!configSchema) {
        return { isValid: true };
      }

      const { properties = {}, required = [], type } = configSchema;
      
      // 检查根类型
      if (type && type !== 'object') {
        errors.push(`Root schema type must be 'object', got ${type}`);
        return { isValid: false, errors };
      }
      
      // 检查必需字段
      for (const field of required) {
        if (!(field in config)) {
          errors.push(`Missing required field: ${field}`);
        }
      }

      // 检查字段类型和值
      for (const [field, fieldSchema] of Object.entries(properties)) {
        if (field in config) {
          const value = config[field];
          const { type: fieldType, enum: enumValues, minimum, maximum } = fieldSchema as any;
          
          // 类型检查
          if (fieldType) {
            const valueType = typeof value;
            if (fieldType === 'number' && valueType !== 'number') {
              errors.push(`Field ${field} should be a number, got ${valueType}`);
            } else if (fieldType === 'string' && valueType !== 'string') {
              errors.push(`Field ${field} should be a string, got ${valueType}`);
            } else if (fieldType === 'boolean' && valueType !== 'boolean') {
              errors.push(`Field ${field} should be a boolean, got ${valueType}`);
            } else if (fieldType === 'array' && !Array.isArray(value)) {
              errors.push(`Field ${field} should be an array, got ${valueType}`);
            }
          }
          
          // 枚举值检查
          if (enumValues && Array.isArray(enumValues) && !enumValues.includes(value)) {
            errors.push(`Field ${field} should be one of ${enumValues.join(', ')}, got ${value}`);
          }
          
          // 数值范围检查
          if (fieldType === 'number') {
            if (minimum !== undefined && value < minimum) {
              errors.push(`Field ${field} should be >= ${minimum}, got ${value}`);
            }
            if (maximum !== undefined && value > maximum) {
              errors.push(`Field ${field} should be <= ${maximum}, got ${value}`);
            }
          }
        }
      }

      return {
        isValid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Unknown validation error']
      };
    }
  }
}