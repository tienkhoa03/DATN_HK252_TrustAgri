import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserEntity } from './entities/user.entity';
import { ZaloService } from './zalo.service';
import { RedisService } from './redis.service';

const makeUser = (overrides: Partial<UserEntity> = {}): UserEntity =>
  ({
    userId: 'user-1',
    zaloId: 'zalo-1',
    roles: ['buyer'],
    displayName: 'Test User',
    phone: null,
    email: null,
    avatarUrl: null,
    traderProfile: null,
    farmerProfile: null,
    buyerProfile: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    lastLogin: new Date(),
    username: null,
    passwordHash: null,
    ...overrides,
  } as UserEntity);

describe('AuthService.switchRole', () => {
  let service: AuthService;
  let userRepo: { findOne: jest.Mock; save: jest.Mock };
  let jwtService: { sign: jest.Mock; decode: jest.Mock; verify: jest.Mock };
  let redisService: { set: jest.Mock; get: jest.Mock; del: jest.Mock; incrWithTtl: jest.Mock };

  beforeEach(async () => {
    userRepo = { findOne: jest.fn(), save: jest.fn() };
    jwtService = {
      sign: jest.fn().mockReturnValue('mock-token'),
      decode: jest.fn().mockReturnValue({ exp: 9999999999, iat: 0 }),
      verify: jest.fn(),
    };
    redisService = {
      set: jest.fn().mockResolvedValue(undefined),
      get: jest.fn(),
      del: jest.fn(),
      incrWithTtl: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(UserEntity), useValue: userRepo },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('7d') } },
        { provide: ZaloService, useValue: {} },
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should issue new JWT with requested role when role is in user.roles', async () => {
    const user = makeUser({ roles: ['farmer', 'buyer'] });
    userRepo.findOne.mockResolvedValue(user);

    const result = await service.switchRole('user-1', 'farmer');

    expect(result.role).toBe('farmer');
    expect(result.roles).toEqual(['farmer', 'buyer']);
    expect(result.accessToken).toBe('mock-token');
  });

  it('should throw ForbiddenException when role is not in user.roles', async () => {
    const user = makeUser({ roles: ['buyer'] });
    userRepo.findOne.mockResolvedValue(user);

    await expect(service.switchRole('user-1', 'farmer')).rejects.toThrow(ForbiddenException);
  });

  it('should throw NotFoundException when user does not exist', async () => {
    userRepo.findOne.mockResolvedValue(null);

    await expect(service.switchRole('no-user', 'buyer')).rejects.toThrow(NotFoundException);
  });
});
