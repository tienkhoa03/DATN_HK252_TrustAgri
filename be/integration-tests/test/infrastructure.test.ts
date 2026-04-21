import { Client } from 'pg';
import Redis from 'ioredis';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { RedisContainer } from '@testcontainers/redis';
import { GenericContainer, Wait } from 'testcontainers';

/**
 * Task 20.1 — Testcontainers: PostgreSQL, Redis, InfluxDB (ảnh Docker).
 */
describe('Testcontainers infrastructure', () => {
  it('PostgreSQL: kết nối và SELECT 1', async () => {
    const pg = await new PostgreSqlContainer('postgres:15-alpine')
      .withDatabase('tc')
      .withUsername('tc')
      .withPassword('tc')
      .start();
    try {
      const c = new Client({
        host: pg.getHost(),
        port: pg.getMappedPort(5432),
        user: pg.getUsername(),
        password: pg.getPassword(),
        database: pg.getDatabase(),
      });
      await c.connect();
      const r = await c.query('SELECT 1 AS ok');
      expect(r.rows[0].ok).toBe(1);
      await c.end();
    } finally {
      await pg.stop();
    }
  });

  it('Redis: PING', async () => {
    const redis = await new RedisContainer('redis:7-alpine').start();
    try {
      const client = new Redis({
        host: redis.getHost(),
        port: redis.getMappedPort(6379),
      });
      const pong = await client.ping();
      expect(pong).toBe('PONG');
      await client.quit();
    } finally {
      await redis.stop();
    }
  });

  it('InfluxDB 2.x: /health', async () => {
    const influx = await new GenericContainer('influxdb:2.7-alpine')
      .withEnvironment({
        DOCKER_INFLUXDB_INIT_MODE: 'setup',
        DOCKER_INFLUXDB_INIT_USERNAME: 'trustagri',
        DOCKER_INFLUXDB_INIT_PASSWORD: 'trustagri_secret',
        DOCKER_INFLUXDB_INIT_ORG: 'trustagri',
        DOCKER_INFLUXDB_INIT_BUCKET: 'sensor_data',
        DOCKER_INFLUXDB_INIT_ADMIN_TOKEN: 'test-token',
      })
      .withExposedPorts(8086)
      .withWaitStrategy(Wait.forListeningPorts())
      .start();
    try {
      const port = influx.getMappedPort(8086);
      const res = await fetch(`http://${influx.getHost()}:${port}/health`);
      expect(res.ok).toBe(true);
    } finally {
      await influx.stop();
    }
  });
});
