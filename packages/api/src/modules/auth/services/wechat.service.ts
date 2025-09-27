import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface WechatSessionResponse {
  openid: string;
  session_key: string;
  unionid?: string;
  errmsg?: string;
  errcode?: number;
}

@Injectable()
export class WechatService {
  private readonly logger = new Logger(WechatService.name);

  constructor(private configService: ConfigService) {}

  /**
   * 通过微信code换取session信息
   */
  async exchangeCodeForSession(code: string): Promise<WechatSessionResponse> {
    try {
      const appId = this.configService.get('WECHAT_APP_ID');
      const appSecret = this.configService.get('WECHAT_APP_SECRET');

      if (!appId || !appSecret) {
        this.logger.error('WeChat app credentials not configured');
        throw new BadRequestException('WeChat app credentials not configured');
      }

      const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`;

      this.logger.debug(`Exchanging code for session with URL: ${url.replace(appId, '***').replace(appSecret, '***')}`);

      const response = await fetch(url);
      
      if (!response.ok) {
        this.logger.error(`WeChat API HTTP error: ${response.status} - ${response.statusText}`);
        throw new BadRequestException(`WeChat API HTTP error: ${response.status}`);
      }
      
      const data: WechatSessionResponse = await response.json();
      
      this.logger.debug(`WeChat API response: ${JSON.stringify({ ...data, openid: data.openid ? '***' : undefined, session_key: data.session_key ? '***' : undefined })}`);

      if (data.errcode) {
        this.logger.error(`WeChat API error: ${data.errcode} - ${data.errmsg}`);
        throw new BadRequestException(`WeChat API error: ${data.errmsg}`);
      }

      if (!data.openid) {
        this.logger.error('WeChat API response missing openid');
        throw new BadRequestException('Invalid response from WeChat API: missing openid');
      }

      return data;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      this.logger.error('Failed to exchange code for session', error);
      throw new BadRequestException('Failed to authenticate with WeChat');
    }
  }

  /**
   * 验证微信会话
   */
  async verifySession(sessionKey: string, encryptedData: string, iv: string): Promise<any> {
    // This would be used for decrypting user info if needed
    // For now, we'll just return a placeholder
    this.logger.debug('Session verification called', { sessionKey: sessionKey ? '***' : undefined });
    return {
      sessionKey,
      encryptedData,
      iv,
    };
  }
}