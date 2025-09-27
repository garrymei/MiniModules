import { HttpException, HttpStatus } from '@nestjs/common';
import { BusinessErrorCode, BusinessErrorMessages } from './business-codes.enum';

export class BusinessException extends HttpException {
  public readonly code: BusinessErrorCode;
  public readonly requestId: string;

  constructor(
    code: BusinessErrorCode,
    message?: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    requestId?: string,
  ) {
    const requestIdValue = requestId || BusinessException.generateRequestId();
    const errorMessage = message || BusinessErrorMessages[code];
    super(
      {
        code,
        message: errorMessage,
        requestId: requestIdValue,
        timestamp: new Date().toISOString(),
      },
      status,
    );
    this.code = code;
    this.requestId = requestIdValue;
  }

  /**
   * 从请求上下文创建业务异常
   */
  static fromRequest(
    code: BusinessErrorCode,
    message?: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    request?: any,
  ): BusinessException {
    const requestId = request?.requestId || BusinessException.generateRequestId();
    return new BusinessException(code, message, status, requestId);
  }

  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static unauthorized(message?: string, requestId?: string): BusinessException {
    return new BusinessException(
      BusinessErrorCode.UNAUTHORIZED,
      message,
      HttpStatus.UNAUTHORIZED,
      requestId,
    );
  }

  static forbidden(message?: string, requestId?: string): BusinessException {
    return new BusinessException(
      BusinessErrorCode.FORBIDDEN,
      message,
      HttpStatus.FORBIDDEN,
      requestId,
    );
  }

  static notFound(message?: string, requestId?: string): BusinessException {
    return new BusinessException(
      BusinessErrorCode.RESOURCE_NOT_FOUND,
      message,
      HttpStatus.NOT_FOUND,
      requestId,
    );
  }

  static badRequest(message?: string, requestId?: string): BusinessException {
    return new BusinessException(
      BusinessErrorCode.INVALID_PARAMS,
      message,
      HttpStatus.BAD_REQUEST,
      requestId,
    );
  }

  static moduleNotAuthorized(moduleKey: string, requestId?: string): BusinessException {
    return new BusinessException(
      BusinessErrorCode.MODULE_NOT_AUTHORIZED,
      `Module ${moduleKey} is not authorized`,
      HttpStatus.FORBIDDEN,
      requestId,
    );
  }

  static moduleDisabled(moduleKey: string, requestId?: string): BusinessException {
    return new BusinessException(
      BusinessErrorCode.MODULE_DISABLED,
      `Module ${moduleKey} is disabled`,
      HttpStatus.FORBIDDEN,
      requestId,
    );
  }

  static conflictSlot(resourceId: string, timeSlot: string, requestId?: string): BusinessException {
    return new BusinessException(
      BusinessErrorCode.CONFLICT_SLOT,
      `Time slot ${timeSlot} conflicts for resource ${resourceId}`,
      HttpStatus.CONFLICT,
      requestId,
    );
  }

  static outOfStock(skuName: string, requested: number, available: number, requestId?: string): BusinessException {
    return new BusinessException(
      BusinessErrorCode.OUT_OF_STOCK,
      `Out of stock: ${skuName}. Requested: ${requested}, Available: ${available}`,
      HttpStatus.CONFLICT,
      requestId,
    );
  }

  static bookingTimeConflict(resourceId: string, startTime: string, endTime: string, requestId?: string): BusinessException {
    return new BusinessException(
      BusinessErrorCode.BOOKING_TIME_CONFLICT,
      `Booking time conflict for resource ${resourceId} at ${startTime}-${endTime}`,
      HttpStatus.CONFLICT,
      requestId,
    );
  }

  static verificationCodeExpired(requestId?: string): BusinessException {
    return new BusinessException(
      BusinessErrorCode.VERIFICATION_CODE_EXPIRED,
      'Verification code has expired',
      HttpStatus.BAD_REQUEST,
      requestId,
    );
  }

  static verificationCodeInvalid(requestId?: string): BusinessException {
    return new BusinessException(
      BusinessErrorCode.VERIFICATION_CODE_INVALID,
      'Verification code is invalid',
      HttpStatus.BAD_REQUEST,
      requestId,
    );
  }

  static verificationCodeUsed(requestId?: string): BusinessException {
    return new BusinessException(
      BusinessErrorCode.VERIFICATION_CODE_USED,
      'Verification code has already been used',
      HttpStatus.BAD_REQUEST,
      requestId,
    );
  }

  static verificationAttemptsExceeded(requestId?: string): BusinessException {
    return new BusinessException(
      BusinessErrorCode.VERIFICATION_ATTEMPTS_EXCEEDED,
      'Too many verification attempts',
      HttpStatus.TOO_MANY_REQUESTS,
      requestId,
    );
  }

  static bookingSlotUnavailable(slot: string, requestId?: string): BusinessException {
    return new BusinessException(
      BusinessErrorCode.BOOKING_SLOT_UNAVAILABLE,
      `Booking slot ${slot} is not available`,
      HttpStatus.BAD_REQUEST,
      requestId,
    );
  }

  static quotaExceeded(message?: string, requestId?: string): BusinessException {
    return new BusinessException(
      BusinessErrorCode.TENANT_QUOTA_EXCEEDED,
      message,
      HttpStatus.TOO_MANY_REQUESTS,
      requestId,
    );
  }
}