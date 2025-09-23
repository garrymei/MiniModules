import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Entitlements E2E Tests', () => {
  let app: INestApplication;
  let authToken: string;
  let testTenantId: string;

  beforeAll(async () => {
    // 创建测试模块
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // 生成测试租户ID
    testTenantId = 'test-tenant-' + Date.now();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication Setup', () => {
    it('POST /auth/login should return token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'admin', password: 'password' })
        .expect(201);

      expect(response.body).toHaveProperty('token');
      authToken = response.body.token;
    });
  });

  describe('Module Permission Tests', () => {
    it('GET /test/public should work without module permission', () => {
      return request(app.getHttpServer())
        .get('/test/public')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toContain('Public endpoint access granted');
        });
    });

    it('GET /test/ordering should return 403 without entitlements', () => {
      return request(app.getHttpServer())
        .get('/test/ordering')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403)
        .expect((res) => {
          expect(res.body.message).toContain('Module \'ordering\' is not enabled');
        });
    });

    it('GET /test/booking should return 403 without entitlements', () => {
      return request(app.getHttpServer())
        .get('/test/booking')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403)
        .expect((res) => {
          expect(res.body.message).toContain('Module \'booking\' is not enabled');
        });
    });
  });

  describe('Platform Management (Mock)', () => {
    it('GET /platform/tenants/:id/entitlements should return empty list initially', () => {
      return request(app.getHttpServer())
        .get(`/platform/tenants/${testTenantId}/entitlements`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('PUT /platform/tenants/:id/entitlements should create entitlements', () => {
      const entitlements = [
        {
          moduleKey: 'ordering',
          status: 'enabled',
          expiresAt: null
        },
        {
          moduleKey: 'booking',
          status: 'enabled',
          expiresAt: null
        }
      ];

      return request(app.getHttpServer())
        .put(`/platform/tenants/${testTenantId}/entitlements`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(entitlements)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(2);
        });
    });

    it('GET /platform/tenants/:id/entitlements should return created entitlements', () => {
      return request(app.getHttpServer())
        .get(`/platform/tenants/${testTenantId}/entitlements`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(2);
          
          const orderingEntitlement = res.body.find(e => e.moduleKey === 'ordering');
          const bookingEntitlement = res.body.find(e => e.moduleKey === 'booking');
          
          expect(orderingEntitlement).toBeDefined();
          expect(orderingEntitlement.status).toBe('enabled');
          expect(bookingEntitlement).toBeDefined();
          expect(bookingEntitlement.status).toBe('enabled');
        });
    });
  });

  describe('Error Handling', () => {
    it('GET /platform/tenants/:id/entitlements should return 401 without token', () => {
      return request(app.getHttpServer())
        .get(`/platform/tenants/${testTenantId}/entitlements`)
        .expect(401);
    });

    it('PUT /platform/tenants/:id/entitlements should return 401 without token', () => {
      const entitlements = [
        { moduleKey: 'test', status: 'enabled' }
      ];

      return request(app.getHttpServer())
        .put(`/platform/tenants/${testTenantId}/entitlements`)
        .send(entitlements)
        .expect(401);
    });
  });
});
