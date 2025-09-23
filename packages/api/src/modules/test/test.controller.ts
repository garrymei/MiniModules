import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/auth.guard';
import { ModulePermissionGuard } from '../../guards/module-permission.guard';
import { RequireModule } from '../../decorators/require-module.decorator';

@ApiTags('test')
@Controller('test')
@UseGuards(JwtAuthGuard, ModulePermissionGuard)
@ApiBearerAuth()
export class TestController {
  @Get('ordering')
  @RequireModule('ordering')
  @ApiOperation({ summary: '测试点餐模块权限' })
  @ApiResponse({ 
    status: 200, 
    description: '点餐模块访问成功'
  })
  @ApiResponse({ 
    status: 403, 
    description: '点餐模块未授权'
  })
  testOrderingModule() {
    return {
      message: 'Ordering module access granted',
      module: 'ordering',
      timestamp: new Date().toISOString()
    };
  }

  @Get('booking')
  @RequireModule('booking')
  @ApiOperation({ summary: '测试预约模块权限' })
  @ApiResponse({ 
    status: 200, 
    description: '预约模块访问成功'
  })
  @ApiResponse({ 
    status: 403, 
    description: '预约模块未授权'
  })
  testBookingModule() {
    return {
      message: 'Booking module access granted',
      module: 'booking',
      timestamp: new Date().toISOString()
    };
  }

  @Get('public')
  @ApiOperation({ summary: '公开测试接口' })
  @ApiResponse({ 
    status: 200, 
    description: '公开接口访问成功'
  })
  testPublic() {
    return {
      message: 'Public endpoint access granted',
      timestamp: new Date().toISOString()
    };
  }
}
