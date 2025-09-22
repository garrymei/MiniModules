import { Test, TestingModule } from '@nestjs/testing'
import { AppController } from './app.controller'
import { AppService } from './app.service'

describe('AppController', () => {
  let appController: AppController
  let dateNowSpy: jest.SpyInstance<number, []>

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile()

    appController = app.get<AppController>(AppController)
    dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(1700000000000)
  })

  afterEach(() => {
    dateNowSpy.mockRestore()
  })

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!')
    })
  })

  describe('healthz', () => {
    it('should return health payload', () => {
      expect(appController.getHealth()).toEqual({ ok: true, ts: 1700000000000 })
    })
  })
})
