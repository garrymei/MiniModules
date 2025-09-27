import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from '../../../entities/booking.entity';
import { BusinessErrorCode } from '../../../common/errors/business-codes.enum';
import { BusinessException } from '../../../common/errors/business.exception';
import * as crypto from 'crypto';

export interface VerificationResult {
  success: boolean;
  message: string;
  booking?: Booking;
}

@Injectable()
export class VerificationService {
  private readonly VERIFICATION_CODE_EXPIRATION_MINUTES = 15; // 15分钟有效期
  private readonly MAX_VERIFICATION_ATTEMPTS = 3; // 最大验证尝试次数
  private readonly REPLAY_PROTECTION_WINDOW = 5 * 60 * 1000; // 5分钟防重放窗口
  private readonly usedNonces = new Set<string>(); // 内存中的已使用nonce集合

  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
  ) {}

  /**
   * 生成预约核销码
   * 包含 bookingId, timestamp, random string, 防重放标记
   */
  async generateVerificationCode(bookingId: string): Promise<string> {
    const booking = await this.bookingRepository.findOne({ where: { id: bookingId } });
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found`);
    }

    if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.COMPLETED) {
      throw new BusinessException(
        BusinessErrorCode.BOOKING_CANNOT_CANCEL,
        `Booking ${bookingId} is already ${booking.status}`,
      );
    }

    // 生成一次性随机数
    const nonce = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    
    // 构建验证码载荷
    const payload = {
      bookingId: booking.id,
      timestamp,
      nonce,
      tenantId: booking.tenantId,
    };

    // 生成签名防止篡改
    const signature = this.generateSignature(payload);
    const code = Buffer.from(JSON.stringify({ ...payload, signature })).toString('base64url');

    // 将核销码存储到 booking 的 metadata 中，并设置过期时间
    const expiresAt = new Date(Date.now() + this.VERIFICATION_CODE_EXPIRATION_MINUTES * 60 * 1000);
    
    booking.metadata = {
      ...booking.metadata,
      verificationCode: code,
      verificationCodeExpiresAt: expiresAt.toISOString(),
      verificationCodeUsed: false,
      verificationAttempts: 0,
      verificationNonce: nonce,
    };
    
    await this.bookingRepository.save(booking);

    return code;
  }

  /**
   * 验证并核销预约码
   */
  async verifyBookingCode(code: string, tenantId: string, verifiedBy?: string): Promise<VerificationResult> {
    let payload: any;
    
    try {
      // 解码验证码
      const decoded = Buffer.from(code, 'base64url').toString('utf8');
      payload = JSON.parse(decoded);
    } catch (e) {
      return {
        success: false,
        message: 'Invalid verification code format',
      };
    }

    // 验证签名
    if (!this.verifySignature(payload)) {
      return {
        success: false,
        message: 'Invalid verification code signature',
      };
    }

    // 防重放检查 - 检查nonce是否已使用
    if (this.usedNonces.has(payload.nonce)) {
      return {
        success: false,
        message: 'Verification code has already been used (replay attack detected)',
      };
    }

    // 时间戳防重放检查
    const now = Date.now();
    const codeTimestamp = payload.timestamp;
    if (now - codeTimestamp > this.REPLAY_PROTECTION_WINDOW) {
      return {
        success: false,
        message: 'Verification code is too old (replay attack detected)',
      };
    }

    const booking = await this.bookingRepository.findOne({ 
      where: { id: payload.bookingId, tenantId } 
    });
    
    if (!booking) {
      return {
        success: false,
        message: 'Booking not found',
      };
    }

    // 检查是否已核销
    if (booking.metadata?.verificationCodeUsed) {
      return {
        success: false,
        message: 'Verification code already used',
      };
    }

    // 检查验证尝试次数
    const attempts = booking.metadata?.verificationAttempts || 0;
    if (attempts >= this.MAX_VERIFICATION_ATTEMPTS) {
      return {
        success: false,
        message: 'Too many verification attempts',
      };
    }

    // 检查是否过期
    const expiresAt = booking.metadata?.verificationCodeExpiresAt 
      ? new Date(booking.metadata.verificationCodeExpiresAt) 
      : null;
    if (!expiresAt || expiresAt < new Date()) {
      return {
        success: false,
        message: 'Verification code has expired',
      };
    }

    // 检查码是否匹配
    if (booking.metadata?.verificationCode !== code) {
      // 增加验证尝试次数
      booking.metadata = {
        ...booking.metadata,
        verificationAttempts: attempts + 1,
      };
      await this.bookingRepository.save(booking);
      
      return {
        success: false,
        message: 'Verification code mismatch',
      };
    }

    // 检查nonce是否匹配（防重放）
    if (booking.metadata?.verificationNonce !== payload.nonce) {
      return {
        success: false,
        message: 'Verification code has been used or tampered with',
      };
    }

    // 标记nonce为已使用（防重放）
    this.usedNonces.add(payload.nonce);

    // 核销成功，更新预约状态和核销标记
    booking.status = BookingStatus.COMPLETED;
    booking.metadata = {
      ...booking.metadata,
      verificationCodeUsed: true,
      verifiedAt: new Date().toISOString(),
      verifiedBy: verifiedBy || 'system',
      verificationNonce: null, // 清除nonce防止重复使用
    };
    
    await this.bookingRepository.save(booking);

    return {
      success: true,
      message: 'Verification successful',
      booking,
    };
  }

  /**
   * 验证二维码数据
   */
  async verifyQRCodeData(qrData: string, tenantId: string): Promise<{ valid: boolean; message: string }> {
    try {
      const data = JSON.parse(qrData);
      
      if (!data.code) {
        return { valid: false, message: 'QR code data missing verification code' };
      }

      const result = await this.verifyBookingCode(data.code, tenantId);
      return {
        valid: result.success,
        message: result.message,
      };
    } catch (error) {
      return {
        valid: false,
        message: 'Invalid QR code data format',
      };
    }
  }

  /**
   * 获取预约验证信息
   */
  async getBookingVerificationInfo(bookingId: string): Promise<{
    booking: Booking;
    qrCodeData: string;
    verificationCode: string;
  }> {
    const booking = await this.bookingRepository.findOne({ where: { id: bookingId } });
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found`);
    }

    // 生成或获取验证码
    let verificationCode = booking.metadata?.verificationCode;
    if (!verificationCode || booking.metadata?.verificationCodeUsed) {
      verificationCode = await this.generateVerificationCode(bookingId);
    }

    // 构建二维码数据
    const qrCodeData = JSON.stringify({
      type: 'booking_verification',
      bookingId: booking.id,
      code: verificationCode,
      timestamp: Date.now(),
    });

    return {
      booking,
      qrCodeData,
      verificationCode,
    };
  }

  /**
   * 执行核销操作
   */
  async performVerification(
    code: string,
    tenantId: string,
    verifiedBy?: string,
  ): Promise<VerificationResult> {
    return this.verifyBookingCode(code, tenantId, verifiedBy);
  }

  /**
   * 撤销核销（管理员操作）
   */
  async revokeVerification(bookingId: string, reason: string, revokedBy: string): Promise<void> {
    const booking = await this.bookingRepository.findOne({ where: { id: bookingId } });
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found`);
    }

    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException('Only completed bookings can be revoked');
    }

    booking.status = BookingStatus.CONFIRMED;
    booking.metadata = {
      ...booking.metadata,
      verificationCodeUsed: false,
      verificationRevoked: true,
      verificationRevokedAt: new Date().toISOString(),
      verificationRevokedBy: revokedBy,
      verificationRevokeReason: reason,
    };

    await this.bookingRepository.save(booking);
  }

  /**
   * 生成签名
   */
  private generateSignature(payload: any): string {
    const secret = process.env.VERIFICATION_SECRET || 'default_secret';
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }

  /**
   * 验证签名
   */
  private verifySignature(payload: any): boolean {
    const { signature, ...data } = payload;
    const expectedSignature = this.generateSignature(data);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex'),
    );
  }

  /**
   * 清理过期的验证码
   */
  async cleanupExpiredVerificationCodes(): Promise<number> {
    const expiredDate = new Date(Date.now() - this.VERIFICATION_CODE_EXPIRATION_MINUTES * 60 * 1000);
    
    const result = await this.bookingRepository
      .createQueryBuilder()
      .update(Booking)
      .set({
        metadata: () => `metadata - 'verificationCode' - 'verificationCodeExpiresAt' - 'verificationNonce'`,
      })
      .where('metadata->>\'verificationCodeExpiresAt\' < :expiredDate', { expiredDate })
      .andWhere('metadata->>\'verificationCodeUsed\' = \'false\'')
      .execute();

    return result.affected || 0;
  }

  /**
   * 清理过期的nonce（防重放机制）
   */
  cleanupExpiredNonces(): void {
    const now = Date.now();
    const expiredNonces = [];

    // 这里应该从数据库或Redis中获取nonce的时间戳信息
    // 为了简化，我们使用内存清理
    for (const nonce of this.usedNonces) {
      // 假设nonce包含时间戳信息，实际实现中应该存储nonce的创建时间
      // 这里简化处理，定期清理所有nonce
      expiredNonces.push(nonce);
    }

    expiredNonces.forEach(nonce => this.usedNonces.delete(nonce));
  }

  /**
   * 获取防重放统计信息
   */
  getReplayProtectionStats(): {
    activeNonces: number;
    protectionWindow: number;
    maxAttempts: number;
  } {
    return {
      activeNonces: this.usedNonces.size,
      protectionWindow: this.REPLAY_PROTECTION_WINDOW,
      maxAttempts: this.MAX_VERIFICATION_ATTEMPTS,
    };
  }

  /**
   * 批量验证预约码
   */
  async batchVerifyBookingCodes(
    codes: string[],
    tenantId: string,
    verifiedBy?: string,
  ): Promise<Array<{
    code: string;
    result: VerificationResult;
  }>> {
    const results = [];

    for (const code of codes) {
      const result = await this.verifyBookingCode(code, tenantId, verifiedBy);
      results.push({ code, result });
    }

    return results;
  }

  /**
   * 撤销核销（管理员操作）
   */
  async revokeVerification(bookingId: string, reason: string, revokedBy: string): Promise<void> {
    const booking = await this.bookingRepository.findOne({ where: { id: bookingId } });
    if (!booking) {
      throw new Error(`Booking with ID ${bookingId} not found`);
    }

    if (booking.status !== BookingStatus.COMPLETED) {
      throw new Error('Only completed bookings can be revoked');
    }

    booking.status = BookingStatus.CONFIRMED; // 恢复到确认状态
    booking.metadata = {
      ...booking.metadata,
      verificationCodeUsed: false,
      verificationRevoked: true,
      verificationRevokedAt: new Date().toISOString(),
      verificationRevokedBy: revokedBy,
      verificationRevokeReason: reason,
    };

    await this.bookingRepository.save(booking);
  }
}