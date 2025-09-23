import { Router, Request, Response } from 'express';
import { TenantService } from '../services/tenant.service';

const router: Router = Router();
const tenantService = new TenantService();

/**
 * 获取租户配置
 * GET /api/tenant/{id}/config
 */
router.get('/:id/config', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const config = await tenantService.getTenantConfig(id);
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取租户配置失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 更新租户配置
 * PUT /api/tenant/{id}/config
 */
router.put('/:id/config', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const config = req.body;
    
    const updatedConfig = await tenantService.updateTenantConfig(id, config);
    
    res.json({
      success: true,
      data: updatedConfig
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新租户配置失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
