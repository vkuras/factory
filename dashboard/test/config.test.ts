import { describe, expect, it } from 'vitest';
import { ConfigError, isLoopback, loadConfig } from '../src/config.js';

describe('configuration (S7.3, ADR-0005)', () => {
  it('has the design\'s defaults: 3 loops, 24 hours, 12 hours stale, Europe/Berlin', () => {
    const c = loadConfig({});
    expect(c).toMatchObject({ loopThreshold: 3, idleHours: 24, runStaleHours: 12, tz: 'Europe/Berlin', port: 8787, dbPath: '/data/factory.sqlite', ingestToken: '' });
  });

  it('reads the thresholds from the environment', () => {
    const c = loadConfig({ LOOP_THRESHOLD: '5', IDLE_HOURS: '48', RUN_STALE_HOURS: '6', TZ: 'UTC' });
    expect(c).toMatchObject({ loopThreshold: 5, idleHours: 48, runStaleHours: 6, tz: 'UTC' });
  });

  it.each([
    ['LOOP_THRESHOLD', '0'],
    ['LOOP_THRESHOLD', '-2'],
    ['LOOP_THRESHOLD', '2.5'],
    ['LOOP_THRESHOLD', 'many'],
    ['IDLE_HOURS', '0'],
    ['IDLE_HOURS', 'abc'],
    ['RUN_STALE_HOURS', '0'],
  ])('aborts with one line that names %s=%s', (name, value) => {
    expect(() => loadConfig({ [name]: value })).toThrowError(ConfigError);
    expect(() => loadConfig({ [name]: value })).toThrowError(new RegExp(`^${name} must be an integer >= 1`));
  });

  it('rejects a time zone it does not know, by name', () => {
    expect(() => loadConfig({ TZ: 'Mars/Olympus' })).toThrowError(/TZ is not a known time zone/);
  });

  it('treats empty values as unset', () => {
    expect(loadConfig({ LOOP_THRESHOLD: '', IDLE_HOURS: ' ' }).loopThreshold).toBe(3);
  });

  it('recognises loopback addresses for the open-ingest warning', () => {
    expect(isLoopback('127.0.0.1')).toBe(true);
    expect(isLoopback('0.0.0.0')).toBe(false);
  });
});
