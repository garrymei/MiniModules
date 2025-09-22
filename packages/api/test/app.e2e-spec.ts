import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { DataSource } from 'typeorm'
import * as request from 'supertest'
import { AppModule } from './../src/app.module'

const RESTAURANT_TENANT_ID = '11111111-1111-1111-1111-111111111111'
const VENUE_TENANT_ID = '22222222-2222-2222-2222-222222222222'
let latestOrderId: string | undefined

describe('AppController (e2e)', () => {
  let app: INestApplication
  let dataSource: DataSource

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    dataSource = moduleFixture.get(DataSource)
    await dataSource.runMigrations()
    await app.init()
  })

  afterAll(async () => {
    await dataSource.destroy()
    await app.close()
  })

  it('/healthz (GET)', () => {
    return request(app.getHttpServer())
      .get('/healthz')
      .expect(200)
      .expect(res => {
        expect(res.body).toEqual({ ok: true, ts: expect.any(Number) })
      })
  })

  describe('Authentication', () => {
    it('/auth/login issues token for valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'admin', password: 'admin123' })
        .expect(201)

      expect(response.body).toEqual({
        token: expect.any(String),
        user: {
          id: 'user-admin',
          username: 'admin',
          role: 'admin',
        },
      })
    })

    it('rejects invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'admin', password: 'wrong' })
        .expect(401)
    })

    it('protects /admin routes with JWT guard', async () => {
      await request(app.getHttpServer()).get('/admin/profile').expect(401)

      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'staff', password: 'staff123' })
        .expect(201)

      const token = login.body.token as string

      await request(app.getHttpServer())
        .get('/admin/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect(res => {
          expect(res.body).toEqual({
            user: {
              userId: 'user-staff',
              username: 'staff',
              role: 'staff',
            },
          })
        })
    })
  })

  describe('Tenant configuration', () => {
    let adminToken: string
    let staffToken: string
    const restaurantBaseline = {
      tenantId: RESTAURANT_TENANT_ID,
      industry: 'restaurant',
      enabledModules: ['ordering', 'table-management'],
      theme: {
        primaryColor: '#E67E22',
        logo: 'https://cdn.example.com/tenants/restaurant/logo.png',
        buttonRadius: 8,
      },
      moduleConfigs: {
        ordering: {
          serviceFee: 0.05,
          supportTips: true,
        },
        'table-management': {
          maxPartySize: 8,
          enableWaitlist: true,
        },
      },
    }

    beforeAll(async () => {
      const adminLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'admin', password: 'admin123' })
        .expect(201)

      adminToken = adminLogin.body.token

      const staffLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'staff', password: 'staff123' })
        .expect(201)

      staffToken = staffLogin.body.token

      await request(app.getHttpServer())
        .put(`/admin/tenant/${RESTAURANT_TENANT_ID}/config`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(restaurantBaseline)
        .expect(200)
    })

    it('returns restaurant tenant configuration', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/tenant/${RESTAURANT_TENANT_ID}/config`)
        .expect(200)

      expect(response.body).toEqual(restaurantBaseline)
    })

    it('returns venue tenant configuration', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/tenant/${VENUE_TENANT_ID}/config`)
        .expect(200)

      expect(response.body).toEqual({
        tenantId: VENUE_TENANT_ID,
        industry: 'venue',
        enabledModules: ['booking', 'ticketing'],
        theme: {
          primaryColor: '#2C3E50',
          logo: 'https://cdn.example.com/tenants/venue/logo.png',
          buttonRadius: 4,
        },
        moduleConfigs: {
          booking: {
            openingHours: {
              mon: ['09:00', '18:00'],
              tue: ['09:00', '18:00'],
              sat: ['10:00', '22:00'],
              sun: ['10:00', '22:00'],
            },
          },
          ticketing: {
            supportsQr: true,
            delivery: ['email', 'sms'],
          },
        },
      })
    })

    it('prevents staff users from updating tenant config', async () => {
      await request(app.getHttpServer())
        .put(`/admin/tenant/${RESTAURANT_TENANT_ID}/config`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({})
        .expect(403)
    })

    it('validates payload when updating tenant config', async () => {
      await request(app.getHttpServer())
        .put(`/admin/tenant/${RESTAURANT_TENANT_ID}/config`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400)
    })

    it('updates tenant configuration for admin users', async () => {
      const payload = {
        tenantId: RESTAURANT_TENANT_ID,
        industry: 'restaurant',
        enabledModules: ['ordering', 'ticketing'],
        theme: {
          primaryColor: '#FF5733',
          buttonRadius: 6,
        },
        moduleConfigs: {
          ordering: {
            serviceFee: 0.1,
            supportTips: false,
          },
          ticketing: {
            supportsQr: true,
          },
        },
      }

      const response = await request(app.getHttpServer())
        .put(`/admin/tenant/${RESTAURANT_TENANT_ID}/config`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload)
        .expect(200)

      expect(response.body).toEqual({
        tenantId: RESTAURANT_TENANT_ID,
        industry: 'restaurant',
        enabledModules: ['ordering', 'ticketing'],
        theme: {
          primaryColor: '#FF5733',
          buttonRadius: 6,
        },
        moduleConfigs: {
          ordering: {
            serviceFee: 0.1,
            supportTips: false,
          },
          ticketing: {
            supportsQr: true,
          },
        },
      })

      const verify = await request(app.getHttpServer())
        .get(`/api/tenant/${RESTAURANT_TENANT_ID}/config`)
        .expect(200)

      expect(verify.body).toEqual(response.body)

      // reset to baseline for subsequent tests
      await request(app.getHttpServer())
        .put(`/admin/tenant/${RESTAURANT_TENANT_ID}/config`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(restaurantBaseline)
        .expect(200)
    })
  })

  describe('Products and Orders', () => {
    let adminToken: string
    let tenantId: string
    let createdProductId: string
    let createdSkuId: string

    beforeAll(async () => {
      tenantId = RESTAURANT_TENANT_ID
      const adminLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'admin', password: 'admin123' })
        .expect(201)
      adminToken = adminLogin.body.token
    })

    it('creates a product with skus', async () => {
      const response = await request(app.getHttpServer())
        .post('/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tenantId,
          title: 'Test Combo Meal',
          status: 'active',
          images: ['https://cdn.example.com/product.png'],
          skus: [
            {
              price: 19.99,
              stock: 10,
              spec: { size: 'large' },
            },
          ],
        })
        .expect(201)

      expect(response.body.title).toBe('Test Combo Meal')
      expect(response.body.skus).toHaveLength(1)
      createdProductId = response.body.id
      createdSkuId = response.body.skus[0].id
    })

    it('lists products for tenant', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/products')
        .query({ tenantId })
        .expect(200)

      const match = response.body.find((item: any) => item.id === createdProductId)
      expect(match).toBeDefined()
    })

    it('places an order and locks stock', async () => {
      const orderResponse = await request(app.getHttpServer())
        .post('/api/orders')
        .send({
          tenantId,
          userId: 'user-123',
          items: [
            {
              skuId: createdSkuId,
              quantity: 2,
            },
          ],
        })
        .expect(201)

      expect(orderResponse.body.amount).toBe('39.98')
      expect(orderResponse.body.items).toHaveLength(1)
      expect(orderResponse.body.items[0]).toMatchObject({
        quantity: 2,
        unitPrice: '19.99',
        totalPrice: '39.98',
      })
      latestOrderId = orderResponse.body.id

      // Stock should be decremented
      const product = await request(app.getHttpServer())
        .get(`/admin/products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      const sku = product.body.skus.find((item: any) => item.id === createdSkuId)
      expect(sku.stock).toBe(8)
    })

    it('prevents ordering more than stock', async () => {
      await request(app.getHttpServer())
        .post('/api/orders')
        .send({
          tenantId,
          userId: 'user-456',
          items: [
            {
              skuId: createdSkuId,
              quantity: 100,
            },
          ],
        })
        .expect(400)
    })
  })

  describe('Booking flow', () => {
    let adminToken: string
    let resourceId: string
    const tenantId = VENUE_TENANT_ID

    beforeAll(async () => {
      const adminLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'admin', password: 'admin123' })
        .expect(201)
      adminToken = adminLogin.body.token
    })

    it('creates resource and rule, lists slots, and books without conflicts', async () => {
      const resourceResponse = await request(app.getHttpServer())
        .post('/admin/resources')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tenantId,
          name: 'Conference Room A',
          type: 'room',
        })
        .expect(201)

      resourceId = resourceResponse.body.id

      const openHours = {
        mon: [['09:00', '18:00']],
        tue: [['09:00', '18:00']],
        wed: [['09:00', '18:00']],
        thu: [['09:00', '18:00']],
        fri: [['09:00', '18:00']],
        sat: [['09:00', '18:00']],
        sun: [['09:00', '18:00']],
      }

      await request(app.getHttpServer())
        .post(`/admin/resources/${resourceId}/rules`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          slotMinutes: 60,
          openHours,
          maxBookDays: 14,
        })
        .expect(201)

      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]

      const slotResponse = await request(app.getHttpServer())
        .get('/api/booking/slots')
        .query({ resourceId, date: tomorrow })
        .expect(200)

      expect(slotResponse.body.slots.length).toBeGreaterThan(0)
      const firstAvailable = slotResponse.body.slots.find(
        (slot: any) => slot.available,
      )
      expect(firstAvailable).toBeDefined()

      const bookingResponse = await request(app.getHttpServer())
        .post('/api/bookings')
        .send({
          resourceId,
          tenantId,
          userId: 'user-789',
          start: firstAvailable.start,
          end: firstAvailable.end,
        })
        .expect(201)

      expect(bookingResponse.body.resourceId).toBe(resourceId)
      expect(bookingResponse.body.status).toBe('CONFIRMED')

      await request(app.getHttpServer())
        .post('/api/bookings')
        .send({
          resourceId,
          tenantId,
          userId: 'user-999',
          start: firstAvailable.start,
          end: firstAvailable.end,
        })
        .expect(400)

      const slotResponseAfter = await request(app.getHttpServer())
        .get('/api/booking/slots')
        .query({ resourceId, date: tomorrow })
        .expect(200)

      const slotAfter = slotResponseAfter.body.slots.find(
        (slot: any) => slot.start === firstAvailable.start,
      )
      expect(slotAfter.available).toBe(false)
    })
  })

  describe('Payment mock', () => {
    it('returns prepay info for an existing order', async () => {
      expect(latestOrderId).toBeDefined()
      const response = await request(app.getHttpServer())
        .post('/api/pay/create')
        .send({ orderId: latestOrderId })
        .expect(201)

      expect(response.body).toEqual({
        prepayId: expect.stringMatching(/^mock_/),
        nonceStr: expect.any(String),
        timeStamp: expect.any(String),
        paySign: 'mock',
        amount: '39.98',
      })
    })

    it('accepts mock payment notifications', async () => {
      await request(app.getHttpServer())
        .post('/api/pay/notify')
        .send({ orderId: latestOrderId, event: 'SUCCESS' })
        .expect(201)
    })
  })
})
