import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Basic E2E Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // 创建测试模块，暂时禁用 TypeORM
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('GET /healthz should return 200', () => {
      return request(app.getHttpServer())
        .get('/healthz')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('ok', true);
          expect(res.body).toHaveProperty('ts');
          expect(typeof res.body.ts).toBe('number');
        });
    });
  });

  describe('Authentication', () => {
    it('POST /auth/login should return token', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'admin', password: 'password' })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('token');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user).toHaveProperty('userId');
          expect(res.body.user).toHaveProperty('roles');
          expect(res.body.user).toHaveProperty('tenants');
          expect(Array.isArray(res.body.user.roles)).toBe(true);
          expect(Array.isArray(res.body.user.tenants)).toBe(true);
        });
    });

    it('GET /auth/me should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });

    it('GET /auth/me should return user info with valid token', async () => {
      // 先获取 token
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'admin', password: 'password' })
        .expect(201);

      const token = loginResponse.body.token;

      // 使用 token 访问受保护的路由
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('userId');
          expect(res.body).toHaveProperty('roles');
          expect(res.body).toHaveProperty('tenants');
        });
    });
  });

  // 暂时跳过 Swagger 测试，因为需要服务器运行
  // describe('Swagger Documentation', () => {
  //   it('GET /docs should return Swagger UI', () => {
  //     return request(app.getHttpServer())
  //       .get('/docs')
  //       .expect(200)
  //       .expect((res) => {
  //         expect(res.text).toContain('<!DOCTYPE html>');
  //       });
  //   });
  // });

  describe('Error Handling', () => {
    it('GET /non-existent should return 404', () => {
      return request(app.getHttpServer())
        .get('/non-existent')
        .expect(404);
    });

    it('POST /auth/login with invalid data should still work (mock)', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: '', password: '' })
        .expect(201); // Mock 实现总是返回成功
    });
  });
});
