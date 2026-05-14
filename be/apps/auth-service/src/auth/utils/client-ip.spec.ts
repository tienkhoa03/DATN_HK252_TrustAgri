import type { Request } from 'express';
import { getClientIp, normalizeIp } from './client-ip';

function makeReq(partial: Partial<Request>): Request {
  return partial as Request;
}

describe('normalizeIp', () => {
  it('strips IPv4-mapped IPv6 prefix', () => {
    expect(normalizeIp('::ffff:127.0.0.1')).toBe('127.0.0.1');
  });

  it('returns plain IPv4 unchanged', () => {
    expect(normalizeIp('192.168.1.10')).toBe('192.168.1.10');
  });
});

describe('getClientIp', () => {
  it('prefers first X-Forwarded-For hop', () => {
    const req = makeReq({
      headers: { 'x-forwarded-for': '203.0.113.1, 10.0.0.1' },
      socket: { remoteAddress: '10.0.0.2' } as Request['socket'],
      ip: '10.0.0.3',
    });
    expect(getClientIp(req)).toBe('203.0.113.1');
  });

  it('uses X-Real-IP when X-Forwarded-For absent', () => {
    const req = makeReq({
      headers: { 'x-real-ip': ' 198.51.100.2 ' },
      socket: { remoteAddress: '10.0.0.1' } as Request['socket'],
      ip: '10.0.0.2',
    });
    expect(getClientIp(req)).toBe('198.51.100.2');
  });

  it('falls back to socket.remoteAddress with normalization', () => {
    const req = makeReq({
      headers: {},
      socket: { remoteAddress: '::ffff:10.0.0.5' } as Request['socket'],
      ip: undefined,
    });
    expect(getClientIp(req)).toBe('10.0.0.5');
  });

  it('falls back to req.ip when socket missing', () => {
    const req = makeReq({
      headers: {},
      socket: undefined,
      ip: '172.16.0.1',
    });
    expect(getClientIp(req)).toBe('172.16.0.1');
  });
});
