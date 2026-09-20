import { describe, expect, it } from 'vitest';
import { fmtDateTime, fmtH, fmtTok, isoWeekOfMonday, localDayNumber, mondayOf, pct, weekLabel } from '../src/domain/format.js';

// T-UNIT-FMT-1: the design's formatters reproduce the design's output.
describe('fmtTok', () => {
  it.each([
    [0, '0'],
    [999, '999'],
    [1000, '1.0k'],
    [1234, '1.2k'],
    [9999, '10.0k'],
    [10000, '10k'],
    [96500, '97k'],
    [999999, '1000k'],
    [1_000_000, '1.00M'],
    [2_345_678, '2.35M'],
  ])('fmtTok(%d) = %s', (n, expected) => {
    expect(fmtTok(n)).toBe(expected);
  });
  it('renders unknown as an em dash', () => {
    expect(fmtTok(null)).toBe('—');
    expect(fmtTok(undefined)).toBe('—');
  });
});

describe('fmtH', () => {
  it.each([
    [0, '0m'],
    [59 / 60, '59m'],
    [1, '1.0h'],
    [9.9, '9.9h'],
    [10, '10h'],
    [23.4, '23h'],
    [24, '1.0d'],
    [36, '1.5d'],
  ])('fmtH(%d) = %s', (h, expected) => {
    expect(fmtH(h)).toBe(expected);
  });
  it('renders unknown as an em dash', () => {
    expect(fmtH(null)).toBe('—');
  });
});

describe('pct', () => {
  it('is 0% without a maximum', () => {
    expect(pct(5, 0)).toBe('0%');
  });
  it('never drops below 2%', () => {
    expect(pct(0, 10)).toBe('2%');
    expect(pct(1, 1000)).toBe('2%');
  });
  it('rounds the share of the maximum', () => {
    expect(pct(5, 10)).toBe('50%');
    expect(pct(10, 10)).toBe('100%');
    expect(pct(1, 3)).toBe('33%');
  });
});

describe('weeks in a display zone', () => {
  it('finds the Monday of an ISO week and numbers it', () => {
    // 2026-09-20 is a Sunday: its ISO week starts on Monday 2026-09-14, week 38.
    const sunday = localDayNumber(Date.UTC(2026, 8, 20, 12), 'Europe/Berlin');
    const monday = mondayOf(sunday);
    expect(sunday - monday).toBe(6);
    expect(isoWeekOfMonday(monday)).toBe(38);
    expect(weekLabel(monday)).toBe('w38');
  });
  it('numbers the week that contains January 1st by ISO rules', () => {
    // Monday 2026-12-28 starts ISO week 53 of 2026; Monday 2027-01-04 starts week 1 of 2027.
    const days = (y: number, m: number, d: number): number => Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
    expect(isoWeekOfMonday(days(2026, 12, 28))).toBe(53);
    expect(isoWeekOfMonday(days(2027, 1, 4))).toBe(1);
  });
  it('uses the zone for the calendar day, not UTC', () => {
    const ts = Date.UTC(2026, 8, 20, 23, 30); // 01:30 on the 21st in Berlin
    expect(fmtDateTime(ts, 'Europe/Berlin')).toBe('2026-09-21 01:30');
    expect(fmtDateTime(ts, 'UTC')).toBe('2026-09-20 23:30');
  });
});
