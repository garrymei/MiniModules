import {
  Body,
  Controller,
  ForbiddenException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'
import { Request } from 'express'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { Role } from '../auth/roles.enum'
import { BookingService } from './booking.service'
import { CreateResourceDto } from './dto/create-resource.dto'
import { CreateTimeSlotRuleDto } from './dto/create-rule.dto'

interface AuthenticatedRequest extends Request {
  user?: {
    role: Role
  }
}

@Controller('admin/resources')
@UseGuards(JwtAuthGuard)
export class BookingAdminController {
  constructor(private readonly bookingService: BookingService) {}

  private ensureAdmin(req: AuthenticatedRequest) {
    if (req.user?.role !== Role.Admin) {
      throw new ForbiddenException('Admin role required')
    }
  }

  @Post()
  createResource(
    @Body() body: CreateResourceDto,
    @Req() req: AuthenticatedRequest,
  ) {
    this.ensureAdmin(req)
    return this.bookingService.createResource(body)
  }

  @Post(':id/rules')
  createRule(
    @Param('id') resourceId: string,
    @Body() body: Omit<CreateTimeSlotRuleDto, 'resourceId'>,
    @Req() req: AuthenticatedRequest,
  ) {
    this.ensureAdmin(req)
    return this.bookingService.createRule({
      ...body,
      resourceId,
    })
  }
}
