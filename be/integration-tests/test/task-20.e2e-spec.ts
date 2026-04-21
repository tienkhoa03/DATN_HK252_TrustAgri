import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import * as request from 'supertest';
import { applyTrustagriHttpStack } from '@trustagri/shared';

import { AppModule as AuthAppModule } from '../../apps/auth-service/src/app.module';
import { ZaloService } from '../../apps/auth-service/src/auth/zalo.service';
import { AppModule as FarmAppModule } from '../../apps/farm-service/src/app.module';
import { AppModule as ContractAppModule } from '../../apps/contract-service/src/app.module';
import { AppModule as MonitoringAppModule } from '../../apps/monitoring-service/src/app.module';
import { AppModule as NotificationAppModule } from '../../apps/notification-service/src/app.module';

const SAMPLE_UUID = '00000000-0000-4000-8000-000000000000';

/**
 * Task 20.1 — E2E / integration: auth, farm + QR, validation ErrorResponse, health từng service,
 * smoke 401 trên các nhóm API được liệt kê trong tasks (care-log sync, alert, order, proposal, contract change, dashboard).
 */
describe('Task 20.1 e2e (Nest + Testcontainers PostgreSQL/Redis)', () => {
  let postgres: StartedPostgreSqlContainer;
  let redis: StartedRedisContainer;

  beforeAll(async () => {
    postgres = await new PostgreSqlContainer('postgres:15-alpine')
      .withDatabase('trustagri_it')
      .withUsername('it')
      .withPassword('it')
      .start();
    redis = await new RedisContainer('redis:7-alpine').start();

    process.env.POSTGRES_HOST = postgres.getHost();
    process.env.POSTGRES_PORT = String(postgres.getMappedPort(5432));
    process.env.POSTGRES_USER = postgres.getUsername();
    process.env.POSTGRES_PASSWORD = postgres.getPassword();
    process.env.POSTGRES_DB = postgres.getDatabase();
    process.env.REDIS_HOST = redis.getHost();
    process.env.REDIS_PORT = String(redis.getMappedPort(6379));
    process.env.JWT_SECRET = 'integration-test-secret';
    process.env.JWT_EXPIRES_IN = '15m';
    process.env.NODE_ENV = 'test';
  }, 180000);

  afterAll(async () => {
    await redis?.stop();
    await postgres?.stop();
  });

  it('auth: POST /auth/login (mock Zalo) + X-Request-Id', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AuthAppModule],
    })
      .overrideProvider(ZaloService)
      .useValue({
        getUserInfo: async () => ({
          id: 'zalo-e2e-1',
          name: 'E2E User',
        }),
      })
      .compile();
    const app = moduleRef.createNestApplication();
    applyTrustagriHttpStack(app);
    await app.init();
    try {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ zaloAccessToken: 'dummy' })
        .expect(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.userId).toBeDefined();
      expect(res.headers['x-request-id']).toBeDefined();
    } finally {
      await app.close().catch(() => undefined);
    }
  });

  it('validation: body thiếu zaloAccessToken → ErrorResponse INVALID_INPUT', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AuthAppModule],
    })
      .overrideProvider(ZaloService)
      .useValue({
        getUserInfo: async () => ({ id: 'x', name: 'y' }),
      })
      .compile();
    const app = moduleRef.createNestApplication();
    applyTrustagriHttpStack(app);
    await app.init();
    try {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({})
        .expect(400);
      expect(res.body.error?.code).toBe('INVALID_INPUT');
      expect(res.body.error?.requestId).toBeDefined();
    } finally {
      await app.close().catch(() => undefined);
    }
  });

  it('farm: tạo vườn + GET + QR traceability công khai', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [FarmAppModule],
    }).compile();
    const app = moduleRef.createNestApplication();
    applyTrustagriHttpStack(app);
    await app.init();
    try {
      const jwt = app.get(JwtService);
      const token = jwt.sign({ sub: 'farmer-e2e-1', role: 'farmer' });

      const create = await request(app.getHttpServer())
        .post('/api/v1/farms')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Vườn E2E',
          location: {
            province: 'HN',
            district: 'Q1',
            addressLine: '1 Test',
          },
          area: 1000,
          cropType: 'rau',
        })
        .expect(201);

      const farmId = create.body.id as string;

      await request(app.getHttpServer())
        .get(`/api/v1/farms/${farmId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const qr = await request(app.getHttpServer())
        .get(`/api/v1/traceability/qr/${encodeURIComponent(farmId)}`)
        .expect(200);

      expect(qr.body.farm?.id).toBe(farmId);
    } finally {
      await app.close().catch(() => undefined);
    }
  });

  it('farm: care-logs sync cần JWT', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [FarmAppModule],
    }).compile();
    const app = moduleRef.createNestApplication();
    applyTrustagriHttpStack(app);
    await app.init();
    try {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/farms/${SAMPLE_UUID}/care-logs/sync`)
        .send({ items: [] })
        .expect(401);
      expect(res.body.error?.code).toBe('UNAUTHORIZED');
    } finally {
      await app.close().catch(() => undefined);
    }
  });

  it('monitoring: alerts + acknowledge cần JWT', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [MonitoringAppModule],
    }).compile();
    const app = moduleRef.createNestApplication();
    applyTrustagriHttpStack(app);
    await app.init();
    try {
      const list = await request(app.getHttpServer())
        .get(`/api/v1/monitoring/farms/${SAMPLE_UUID}/alerts`)
        .expect(401);
      expect(list.body.error?.code).toBe('UNAUTHORIZED');

      const ack = await request(app.getHttpServer())
        .post(`/api/v1/monitoring/alerts/${SAMPLE_UUID}/acknowledge`)
        .send({})
        .expect(401);
      expect(ack.body.error?.code).toBe('UNAUTHORIZED');
    } finally {
      await app.close().catch(() => undefined);
    }
  });

  it('contract: orders, proposals, dashboard, change-requests cần JWT', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ContractAppModule],
    }).compile();
    const app = moduleRef.createNestApplication();
    applyTrustagriHttpStack(app);
    await app.init();
    try {
      for (const path of [
        '/api/v1/orders',
        '/api/v1/proposals',
        '/api/v1/dashboard/trader',
        `/api/v1/contracts/${SAMPLE_UUID}/change-requests`,
      ]) {
        const res = await request(app.getHttpServer()).get(path).expect(401);
        expect(res.body.error?.code).toBe('UNAUTHORIZED');
      }
    } finally {
      await app.close().catch(() => undefined);
    }
  });

  it('health: contract, monitoring, notification (Terminus + DB)', async () => {
    for (const Mod of [
      ContractAppModule,
      MonitoringAppModule,
      NotificationAppModule,
    ]) {
      const moduleRef = await Test.createTestingModule({
        imports: [Mod],
      }).compile();
      const app = moduleRef.createNestApplication();
      applyTrustagriHttpStack(app);
      await app.init();
      try {
        await request(app.getHttpServer()).get('/health').expect(200);
      } finally {
        await app.close().catch(() => undefined);
      }
    }
  });
});
