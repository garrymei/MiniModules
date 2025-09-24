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

  static insufficientStock(productName: string, requestId?: string): BusinessException {
    return new BusinessException(
      BusinessErrorCode.INSUFFICIENT_STOCK,
      `Insufficient stock for ${productName}`,
      HttpStatus.BAD_REQUEST,
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
}
