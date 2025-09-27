import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { OrderingService } from './ordering.service';
import { Order } from '../../entities/order.entity';
import { UsageService } from '../usage/usage.service';
import { NotifyService } from '../notify/notify.service';
import { InventoryService } from './services/inventory.service';
import { OrderVerificationService } from './services/order-verification.service';

describe('OrderingService', () => {
  let service: OrderingService;
  let orderRepository: any;
  let dataSource: any;

  const mockOrderRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    create: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn(),
  };

  const mockUsageService = {
    enforceQuota: jest.fn(),
    incrementUsage: jest.fn(),
  };

  const mockNotifyService = {
    sendTemplateMessage: jest.fn(),
    triggerEvent: jest.fn(),
  };

  const mockInventoryService = {
    checkStockAvailability: jest.fn(),
    deductStock: jest.fn(),
  };

  const mockOrderVerificationService = {
    getOrderVerificationInfo: jest.fn(),
    verifyOrderCode: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderingService,
        { provide: getRepositoryToken(Order), useValue: mockOrderRepository },
        { provide: DataSource, useValue: mockDataSource },
        { provide: UsageService, useValue: mockUsageService },
        { provide: NotifyService, useValue: mockNotifyService },
        { provide: InventoryService, useValue: mockInventoryService },
        { provide: OrderVerificationService, useValue: mockOrderVerificationService },
      ],
    }).compile();

    service = module.get<OrderingService>(OrderingService);
    orderRepository = module.get(getRepositoryToken(Order));
    dataSource = module.get(DataSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateOrderStatus', () => {
    it('should update order status successfully', async () => {
      const orderId = 'test-order-id';
      const newStatus = 'paid';
      
      const mockOrder = {
        id: orderId,
        status: 'pending',
        save: jest.fn(),
      };
      
      orderRepository.findOne.mockResolvedValue(mockOrder);
      orderRepository.save.mockResolvedValue({ ...mockOrder, status: newStatus });
      
      const result = await service.updateOrderStatus(orderId, newStatus as any);
      
      expect(result.status).toBe(newStatus);
      expect(orderRepository.save).toHaveBeenCalled();
    });

    it('should throw error for invalid status transition', async () => {
      const orderId = 'test-order-id';
      const invalidStatus = 'used'; // Cannot go from pending to used directly
      
      const mockOrder = {
        id: orderId,
        status: 'pending',
      };
      
      orderRepository.findOne.mockResolvedValue(mockOrder);
      
      await expect(service.updateOrderStatus(orderId, invalidStatus as any))
        .rejects
        .toThrow('Invalid status transition from pending to used');
    });
  });
});