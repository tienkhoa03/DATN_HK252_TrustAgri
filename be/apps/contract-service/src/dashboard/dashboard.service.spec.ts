import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { DashboardService } from './dashboard.service';
import { ComplianceService } from '../contracts/compliance.service';
import { OrderEntity } from '../orders/entities/order.entity';
import { BuyingRequestEntity } from '../buying-requests/entities/buying-request.entity';
import { ContractEntity } from '../contracts/entities/contract.entity';
import { ConnectionEntity } from '../connections/entities/connection.entity';
import { ProposalEntity } from '../proposals/entities/proposal.entity';

type RawRow = Record<string, string>;

function qbReturning(rows: RawRow[]) {
  const qb: Record<string, jest.Mock> = {};
  qb.select = jest.fn(() => qb);
  qb.addSelect = jest.fn(() => qb);
  qb.innerJoin = jest.fn(() => qb);
  qb.where = jest.fn(() => qb);
  qb.andWhere = jest.fn(() => qb);
  qb.groupBy = jest.fn(() => qb);
  qb.orderBy = jest.fn(() => qb);
  qb.limit = jest.fn(() => qb);
  qb.getRawMany = jest.fn(async () => rows);
  return qb;
}

function makeService(demandRows: RawRow[], supplyRows: RawRow[]) {
  const buyingRequestRepo = {
    createQueryBuilder: jest.fn(() => qbReturning(demandRows)),
  } as unknown as jest.Mocked<Repository<BuyingRequestEntity>>;
  const orderRepo = {
    createQueryBuilder: jest.fn(() => qbReturning(supplyRows)),
  } as unknown as jest.Mocked<Repository<OrderEntity>>;
  const empty = {} as unknown as Repository<unknown>;

  const svc = new DashboardService(
    { get: jest.fn() } as unknown as ConfigService,
    {} as unknown as ComplianceService,
    orderRepo,
    buyingRequestRepo,
    empty as unknown as Repository<ContractEntity>,
    empty as unknown as Repository<ConnectionEntity>,
    empty as unknown as Repository<ProposalEntity>,
  );
  return { svc };
}

describe('DashboardService.getMarketTrendsForTrader', () => {
  it('marks trend up when demand exceeds supply beyond threshold', async () => {
    const { svc } = makeService(
      [{ cropType: 'rice', demand: '1000', buyerCount: '5' }],
      [{ cropType: 'rice', supply: '100' }],
    );

    const result = await svc.getMarketTrendsForTrader('trader-1');

    expect(result).toEqual([
      { cropType: 'rice', demand: 1000, supply: 100, buyerCount: 5, trend: 'up' },
    ]);
  });

  it('marks trend down when supply exceeds demand beyond threshold', async () => {
    const { svc } = makeService(
      [{ cropType: 'mango', demand: '100', buyerCount: '2' }],
      [{ cropType: 'mango', supply: '1000' }],
    );

    const result = await svc.getMarketTrendsForTrader('trader-1');

    expect(result[0].trend).toBe('down');
  });

  it('marks trend stable when demand and supply are within 10%', async () => {
    const { svc } = makeService(
      [{ cropType: 'durian', demand: '100', buyerCount: '3' }],
      [{ cropType: 'durian', supply: '105' }],
    );

    const result = await svc.getMarketTrendsForTrader('trader-1');

    expect(result[0].trend).toBe('stable');
  });

  it('defaults supply to zero for crops with demand but no completed orders', async () => {
    const { svc } = makeService(
      [{ cropType: 'coffee', demand: '500', buyerCount: '4' }],
      [],
    );

    const result = await svc.getMarketTrendsForTrader('trader-1');

    expect(result[0]).toMatchObject({ supply: 0, trend: 'up' });
  });
});
