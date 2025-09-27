import { Test, TestingModule } from '@nestjs/testing';
import { WechatService } from './wechat.service';
import { ConfigService } from '@nestjs/config';

describe('WechatService', () => {
  let service: WechatService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WechatService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'WECHAT_APP_ID') return 'test-app-id';
              if (key === 'WECHAT_APP_SECRET') return 'test-app-secret';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<WechatService>(WechatService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('exchangeCodeForSession', () => {
    it('should throw error when app credentials are not configured', async () => {
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'WECHAT_APP_ID') return null;
        if (key === 'WECHAT_APP_SECRET') return null;
        return null;
      });

      await expect(service.exchangeCodeForSession('test-code')).rejects.toThrow('WeChat app credentials not configured');
    });

    it('should handle HTTP errors', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(service.exchangeCodeForSession('test-code')).rejects.toThrow('WeChat API HTTP error: 500');
    });

    it('should handle WeChat API errors', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          errcode: 40029,
          errmsg: 'invalid code',
        }),
      });

      await expect(service.exchangeCodeForSession('test-code')).rejects.toThrow('WeChat API error: invalid code');
    });

    it('should handle missing openid', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          session_key: 'test-session-key',
        }),
      });

      await expect(service.exchangeCodeForSession('test-code')).rejects.toThrow('Invalid response from WeChat API: missing openid');
    });

    it('should return session data on success', async () => {
      const mockResponse = {
        openid: 'test-openid',
        session_key: 'test-session-key',
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await service.exchangeCodeForSession('test-code');
      expect(result).toEqual(mockResponse);
    });
  });
});