import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { VerificationService } from '../services/verification.service';
import { BookingService } from '../booking.service';

export interface VerifyCodeDto {
  code: string;
  tenantId: string;
  verifiedBy?: string;
}

export interface GenerateQRCodeDto {
  bookingId: string;
  tenantId: string;
}

@ApiTags('booking-verification')
@Controller('api/booking/verification')
export class VerificationController {
  constructor(
    private readonly verificationService: VerificationService,
    private readonly bookingService: BookingService,
  ) {}

  @Post('verify')
  @ApiOperation({ summary: '验证核销码' })
  @ApiResponse({ status: 200, description: '验证成功' })
  @ApiResponse({ status: 400, description: '验证失败' })
  async verifyCode(@Body() verifyDto: VerifyCodeDto) {
    const result = await this.verificationService.performVerification(
      verifyDto.code,
      verifyDto.tenantId,
      verifyDto.verifiedBy,
    );

    if (!result.success) {
      return {
        success: false,
        message: result.message,
      };
    }

    return {
      success: true,
      message: result.message,
      booking: result.booking,
    };
  }

  @Post('verify-qr')
  @ApiOperation({ summary: '验证二维码' })
  @ApiResponse({ status: 200, description: '验证成功' })
  @ApiResponse({ status: 400, description: '验证失败' })
  async verifyQRCode(@Body() body: { qrData: string; tenantId: string; verifiedBy?: string }) {
    const result = await this.verificationService.verifyQRCodeData(
      body.qrData,
      body.tenantId,
    );

    if (!result.valid) {
      return {
        success: false,
        message: result.message,
      };
    }

    // 执行核销
    const verificationResult = await this.verificationService.performVerification(
      JSON.parse(body.qrData).code,
      body.tenantId,
      body.verifiedBy,
    );

    return {
      success: verificationResult.success,
      message: verificationResult.message,
      booking: verificationResult.booking,
    };
  }

  @Get('qr-code/:bookingId')
  @ApiOperation({ summary: '生成预约二维码' })
  @ApiParam({ name: 'bookingId', description: '预约ID' })
  @ApiQuery({ name: 'tenantId', description: '租户ID' })
  @ApiResponse({ status: 200, description: '二维码生成成功' })
  async generateQRCode(
    @Param('bookingId') bookingId: string,
    @Query('tenantId') tenantId: string,
  ) {
    const result = await this.verificationService.getBookingVerificationInfo(bookingId);
    
    return {
      success: true,
      data: {
        bookingId: result.booking.id,
        qrCodeData: result.qrCodeData,
        verificationCode: result.verificationCode,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15分钟过期
      },
    };
  }

  @Get('check/:bookingId')
  @ApiOperation({ summary: '检查预约状态' })
  @ApiParam({ name: 'bookingId', description: '预约ID' })
  @ApiResponse({ status: 200, description: '检查成功' })
  async checkBookingStatus(@Param('bookingId') bookingId: string) {
    const booking = await this.bookingService.getBookingById(bookingId);
    
    return {
      success: true,
      data: {
        bookingId: booking.id,
        status: booking.status,
        bookingDate: booking.bookingDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        verifiedAt: booking.verifiedAt,
        canVerify: booking.status === 'confirmed' && !booking.verifiedAt,
      },
    };
  }
}
