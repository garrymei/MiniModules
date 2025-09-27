import { Test, TestingModule } from '@nestjs/testing';
import { UserPermissionsService } from './user-permissions.service';
import { Repository } from 'typeorm';
import { RolePermission } from '../../../entities/role-permission.entity';
import { User } from '../../../entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('UserPermissionsService', () => {
  let service: UserPermissionsService;
  let rolePermissionRepository: Repository<RolePermission>;
  let userRepository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserPermissionsService,
        {
          provide: getRepositoryToken(RolePermission),
          useValue: {
            createQueryBuilder: jest.fn(() => ({
              innerJoin: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue([]),
              getCount: jest.fn().mockResolvedValue(0),
            })),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              innerJoin: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue([]),
              getCount: jest.fn().mockResolvedValue(0),
            })),
          },
        },
      ],
    }).compile();

    service = module.get<UserPermissionsService>(UserPermissionsService);
    rolePermissionRepository = module.get<Repository<RolePermission>>(getRepositoryToken(RolePermission));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserPermissions', () => {
    it('should return all permissions for platform admin', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue({
        id: 'user-1',
        isPlatformAdmin: true,
      } as any);

      const result = await service.getUserPermissions('user-1', 'tenant-1');
      expect(result).toEqual(['*:*']);
    });

    it('should return all permissions for tenant admin', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue({
        id: 'user-1',
        isAdmin: true,
        tenantId: 'tenant-1',
      } as any);

      const result = await service.getUserPermissions('user-1', 'tenant-1');
      expect(result).toEqual(['*:*']);
    });

    it('should return empty array when error occurs', async () => {
      jest.spyOn(userRepository, 'findOne').mockRejectedValue(new Error('Database error'));

      const result = await service.getUserPermissions('user-1', 'tenant-1');
      expect(result).toEqual([]);
    });
  });

  describe('hasPermission', () => {
    it('should return true for platform admin', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue({
        id: 'user-1',
        isPlatformAdmin: true,
      } as any);

      const result = await service.hasPermission('user-1', 'tenant-1', 'test-resource', 'test-action');
      expect(result).toBe(true);
    });

    it('should return true for tenant admin', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue({
        id: 'user-1',
        isAdmin: true,
        tenantId: 'tenant-1',
      } as any);

      const result = await service.hasPermission('user-1', 'tenant-1', 'test-resource', 'test-action');
      expect(result).toBe(true);
    });

    it('should return false when error occurs', async () => {
      jest.spyOn(userRepository, 'findOne').mockRejectedValue(new Error('Database error'));

      const result = await service.hasPermission('user-1', 'tenant-1', 'test-resource', 'test-action');
      expect(result).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true for platform admin', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue({
        id: 'user-1',
        isPlatformAdmin: true,
      } as any);

      const result = await service.hasAnyPermission('user-1', 'tenant-1', [
        { resource: 'test-resource', action: 'test-action' },
      ]);
      expect(result).toBe(true);
    });

    it('should return true for tenant admin', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue({
        id: 'user-1',
        isAdmin: true,
        tenantId: 'tenant-1',
      } as any);

      const result = await service.hasAnyPermission('user-1', 'tenant-1', [
        { resource: 'test-resource', action: 'test-action' },
      ]);
      expect(result).toBe(true);
    });

    it('should return false when error occurs', async () => {
      jest.spyOn(userRepository, 'findOne').mockRejectedValue(new Error('Database error'));

      const result = await service.hasAnyPermission('user-1', 'tenant-1', [
        { resource: 'test-resource', action: 'test-action' },
      ]);
      expect(result).toBe(false);
    });
  });
});