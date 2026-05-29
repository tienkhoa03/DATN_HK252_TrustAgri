import { Repository } from 'typeorm';
import { ForecastsService } from './forecasts.service';
import { ForecastEntity } from './forecast.entity';
import { AuthClientService } from '../clients/auth-client.service';

function mockQb(rows: ForecastEntity[]) {
  const qb: Record<string, jest.Mock> = {};
  qb.where = jest.fn(() => qb);
  qb.andWhere = jest.fn(() => qb);
  qb.orderBy = jest.fn(() => qb);
  qb.addOrderBy = jest.fn(() => qb);
  qb.getMany = jest.fn(async () => rows);
  return qb;
}

function makeService(rows: ForecastEntity[]) {
  const qb = mockQb(rows);
  const repo = {
    createQueryBuilder: jest.fn(() => qb),
  } as unknown as jest.Mocked<Repository<ForecastEntity>>;
  const authClient = {} as unknown as AuthClientService;
  const svc = new ForecastsService(repo, authClient);
  return { svc, repo, qb };
}

function forecast(partial: Partial<ForecastEntity>): ForecastEntity {
  return {
    id: 'f-1',
    traderId: 't-1',
    traderDisplayName: null,
    traderPhone: null,
    region: 'Mekong Delta',
    cropType: 'rice',
    type: 'price',
    forecastData: {},
    validFrom: new Date('2026-05-01'),
    validTo: new Date('2026-05-31'),
    createdAt: new Date('2026-05-01'),
    updatedAt: new Date('2026-05-01'),
    deletedAt: null,
    ...partial,
  } as ForecastEntity;
}

describe('ForecastsService.aggregatePriceTrends', () => {
  it('returns the latest price forecast per crop type with its series', async () => {
    const rows = [
      forecast({
        id: 'rice-new',
        cropType: 'rice',
        validFrom: new Date('2026-05-20'),
        updatedAt: new Date('2026-05-20'),
        forecastData: {
          productLabel: 'Gạo ST25',
          trend: 'up',
          changePercent: 5,
          series: [
            { day: 'T2', price: 30 },
            { day: 'T3', price: 31 },
          ],
        },
      }),
      forecast({
        id: 'rice-old',
        cropType: 'rice',
        validFrom: new Date('2026-05-01'),
        forecastData: { series: [{ day: 'T1', price: 28 }] },
      }),
    ];
    const { svc } = makeService(rows);

    const result = await svc.aggregatePriceTrends();

    expect(result).toHaveLength(1);
    expect(result[0].cropType).toBe('rice');
    expect(result[0].productLabel).toBe('Gạo ST25');
    expect(result[0].trend).toBe('up');
    expect(result[0].series).toEqual([
      { day: 'T2', price: 30 },
      { day: 'T3', price: 31 },
    ]);
  });

  it('caps the series to the requested number of recent points', async () => {
    const rows = [
      forecast({
        forecastData: {
          series: [
            { day: 'T1', price: 10 },
            { day: 'T2', price: 11 },
            { day: 'T3', price: 12 },
          ],
        },
      }),
    ];
    const { svc } = makeService(rows);

    const result = await svc.aggregatePriceTrends(undefined, 2);

    expect(result[0].series).toEqual([
      { day: 'T2', price: 11 },
      { day: 'T3', price: 12 },
    ]);
  });

  it('ignores series points without a numeric price and never exposes PII', async () => {
    const rows = [
      forecast({
        traderDisplayName: 'Nguyen Van A',
        traderPhone: '0900000000',
        forecastData: {
          series: [
            { day: 'T1', price: 10 },
            { day: 'T2' } as never,
          ],
        },
      }),
    ];
    const { svc } = makeService(rows);

    const result = await svc.aggregatePriceTrends();

    expect(result[0].series).toEqual([{ day: 'T1', price: 10 }]);
    expect(JSON.stringify(result[0])).not.toContain('0900000000');
    expect(JSON.stringify(result[0])).not.toContain('Nguyen Van A');
  });
});
