import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { ContractsService } from './contracts.service';
import { ContractEntity } from './entities/contract.entity';
import { ContractAuditService } from './contract-audit.service';
import { ConnectionsService } from '../connections/connections.service';

function mockContractRepo() {
  return {
    findOne: jest.fn(),
    save: jest.fn(),
    exists: jest.fn(),
    createQueryBuilder: jest.fn(),
  } as unknown as jest.Mocked<Repository<ContractEntity>>;
}

function mockAudit() {
  return {
    logStatusChange: jest.fn().mockResolvedValue(undefined),
    findByContractId: jest.fn(),
  } as unknown as jest.Mocked<Pick<ContractAuditService, 'logStatusChange' | 'findByContractId'>>;
}

function mockConnections() {
  return {
    markConnectionSignedByContract: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<
    Pick<ConnectionsService, 'markConnectionSignedByContract'>
  >;
}

function mockConfig() {
  return {
    get: jest.fn(),
  } as unknown as ConfigService;
}

function farmerTraderContract(overrides?: Partial<ContractEntity>): ContractEntity {
  const now = new Date();
  return {
    id: 'contract-uuid-1',
    partyFarmerId: 'farmer-1',
    partyTraderId: 'trader-1',
    partyBuyerId: null,
    contractType: 'farmer_trader',
    productId: null,
    standardId: null,
    farmId: 'farm-1',
    quantity: 100,
    unit: 'kg',
    totalPrice: 1_000_000,
    deposit: null,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    status: 'pending_signature',
    terms: '',
    orderId: null,
    proposalId: null,
    farmerSignedAt: null,
    traderSignedAt: null,
    buyerSignedAt: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  } as ContractEntity;
}

function mockAuthClient() {
  return { getUserSnapshot: jest.fn() } as unknown as import('../clients/auth-client.service').AuthClientService;
}

function mockFarmClient() {
  return { listFarmsByIds: jest.fn() } as unknown as import('../clients/farm-client.service').FarmClientService;
}

function makeService() {
  const contractRepo = mockContractRepo();
  const contractAudit = mockAudit();
  const config = mockConfig();
  const connectionsService = mockConnections();
  const service = new ContractsService(
    contractRepo,
    contractAudit as unknown as ContractAuditService,
    config,
    connectionsService as unknown as ConnectionsService,
    mockAuthClient(),
    mockFarmClient(),
  );
  return { service, contractRepo, contractAudit, connectionsService };
}

describe('ContractsService.sign', () => {
  it('throws NotFoundException when contract missing', async () => {
    const { service, contractRepo } = makeService();
    contractRepo.findOne.mockResolvedValue(null);

    await expect(
      service.sign('missing', { sub: 'farmer-1', role: 'farmer' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws ForbiddenException when user is not a party', async () => {
    const { service, contractRepo } = makeService();
    contractRepo.findOne.mockResolvedValue(farmerTraderContract());

    await expect(
      service.sign('contract-uuid-1', { sub: 'stranger', role: 'farmer' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws ConflictException when not pending_signature', async () => {
    const { service, contractRepo } = makeService();
    contractRepo.findOne.mockResolvedValue(
      farmerTraderContract({ status: 'active' }),
    );

    await expect(
      service.sign('contract-uuid-1', { sub: 'farmer-1', role: 'farmer' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws ForbiddenException for disallowed role (admin)', async () => {
    const { service, contractRepo } = makeService();
    contractRepo.findOne.mockResolvedValue(farmerTraderContract());

    await expect(
      service.sign('contract-uuid-1', { sub: 'admin-1', role: 'admin' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('farmer can sign once; status stays pending_signature until trader signs', async () => {
    const { service, contractRepo, contractAudit, connectionsService } = makeService();
    const entity = farmerTraderContract();
    contractRepo.findOne.mockResolvedValue(entity);
    contractRepo.save.mockImplementation(async (e: ContractEntity) => ({ ...e }));

    const dto = await service.sign('contract-uuid-1', { sub: 'farmer-1', role: 'farmer' });

    expect(dto.status).toBe('pending_signature');
    expect(dto.farmerSignedAt).toBeDefined();
    expect(contractAudit.logStatusChange).not.toHaveBeenCalled();
    expect(connectionsService.markConnectionSignedByContract).not.toHaveBeenCalled();
  });

  it('when both parties signed farmer_trader, status becomes active and connection marked signed', async () => {
    const { service, contractRepo, contractAudit, connectionsService } = makeService();
    const signedFarmer = farmerTraderContract({
      farmerSignedAt: new Date('2026-05-01T00:00:00Z'),
      traderSignedAt: null,
    });
    contractRepo.findOne.mockResolvedValue(signedFarmer);
    contractRepo.save.mockImplementation(async (e: ContractEntity) => ({ ...e }));

    const dto = await service.sign('contract-uuid-1', { sub: 'trader-1', role: 'trader' });

    expect(dto.status).toBe('active');
    expect(contractAudit.logStatusChange).toHaveBeenCalledWith(
      'contract-uuid-1',
      'pending_signature',
      'active',
      'trader-1',
    );
    expect(connectionsService.markConnectionSignedByContract).toHaveBeenCalledWith(
      'farmer-1',
      'trader-1',
      'farm-1',
    );
  });

  it('throws ConflictException when farmer already signed', async () => {
    const { service, contractRepo } = makeService();
    contractRepo.findOne.mockResolvedValue(
      farmerTraderContract({ farmerSignedAt: new Date() }),
    );

    await expect(
      service.sign('contract-uuid-1', { sub: 'farmer-1', role: 'farmer' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('ContractsService.reject', () => {
  it('throws NotFoundException when contract missing', async () => {
    const { service, contractRepo } = makeService();
    contractRepo.findOne.mockResolvedValue(null);

    await expect(
      service.reject('missing', { sub: 'trader-1', role: 'trader' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws ForbiddenException when user is not a party', async () => {
    const { service, contractRepo } = makeService();
    contractRepo.findOne.mockResolvedValue(farmerTraderContract());

    await expect(
      service.reject('contract-uuid-1', { sub: 'stranger', role: 'trader' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws ConflictException when not pending_signature', async () => {
    const { service, contractRepo } = makeService();
    contractRepo.findOne.mockResolvedValue(
      farmerTraderContract({ status: 'active' }),
    );

    await expect(
      service.reject('contract-uuid-1', { sub: 'trader-1', role: 'trader' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws ConflictException when trader already signed', async () => {
    const { service, contractRepo } = makeService();
    contractRepo.findOne.mockResolvedValue(
      farmerTraderContract({ traderSignedAt: new Date() }),
    );

    await expect(
      service.reject('contract-uuid-1', { sub: 'trader-1', role: 'trader' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('trader reject sets status cancelled and logs audit', async () => {
    const { service, contractRepo, contractAudit } = makeService();
    const entity = farmerTraderContract();
    contractRepo.findOne.mockResolvedValue(entity);
    contractRepo.save.mockImplementation(async (e: ContractEntity) => ({ ...e }));

    const dto = await service.reject(
      'contract-uuid-1',
      { sub: 'trader-1', role: 'trader' },
      'Không đồng ý điều khoản',
    );

    expect(dto.status).toBe('cancelled');
    expect(contractAudit.logStatusChange).toHaveBeenCalledWith(
      'contract-uuid-1',
      'pending_signature',
      'cancelled',
      'trader-1',
    );
  });
});
