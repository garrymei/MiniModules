import { Injectable } from '@nestjs/common';
import { ModuleSpecService } from './module-spec.service';

@Injectable()
export class ModuleDependencyService {
  constructor(private readonly moduleSpecService: ModuleSpecService) {}

  /**
   * 检查模块依赖是否满足
   * @param moduleIds 启用的模块ID列表
   * @returns 依赖检查结果
   */
  checkDependencies(moduleIds: string[]): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];
    
    // 获取所有启用模块的规范
    const moduleSpecs = moduleIds.map(id => {
      try {
        return this.moduleSpecService.getModuleSpec(id);
      } catch (error) {
        errors.push(`Module ${id} not found`);
        return null;
      }
    }).filter(spec => spec !== null);

    // 检查每个模块的依赖
    for (const spec of moduleSpecs) {
      if (spec.dependencies && Array.isArray(spec.dependencies)) {
        for (const dependency of spec.dependencies) {
          if (!moduleIds.includes(dependency)) {
            errors.push(`Module ${spec.id} requires dependency ${dependency}`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }
}