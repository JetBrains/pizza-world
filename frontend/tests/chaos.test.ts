import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildChaosState, isAuthorized, describe, ChaosRequestError } from '../api/chaos.ts';

const now = new Date('2026-01-01T12:00:00Z');

test('builds a state with defaults (rate 1, 30 min TTL)', () => {
  const s = buildChaosState({ scenario: 'bad-promo' }, now);
  assert.equal(s.scenario, 'bad-promo');
  assert.equal(s.rate, 1);
  assert.equal(s.until, '2026-01-01T12:30:00.000Z');
  assert.equal(s.reason, null);
});

test('accepts rate, ttl and reason', () => {
  const s = buildChaosState({ scenario: 'slow', rate: 0.25, ttlMinutes: 5, reason: 'demo' }, now);
  assert.equal(s.rate, 0.25);
  assert.equal(s.until, '2026-01-01T12:05:00.000Z');
  assert.equal(s.reason, 'demo');
});

test('rejects invalid requests', () => {
  for (const body of [null, {}, { scenario: 'nope' }, { scenario: 'error', rate: 0 }, { scenario: 'error', rate: 2 },
    { scenario: 'error', ttlMinutes: 0 }, { scenario: 'error', ttlMinutes: 241 }, { scenario: 'error', ttlMinutes: 1.5 }]) {
    assert.throws(() => buildChaosState(body, now), ChaosRequestError, JSON.stringify(body));
  }
});

test('checks the bearer token', () => {
  assert.equal(isAuthorized('Bearer secret', 'secret'), true);
  assert.equal(isAuthorized('Bearer wrong!', 'secret'), false);
  assert.equal(isAuthorized('secret', 'secret'), false);
  assert.equal(isAuthorized(null, 'secret'), false);
  assert.equal(isAuthorized('Bearer secret', undefined), false);
});

test('describe reports remaining time and treats expired or disabled state as inactive', () => {
  const s = buildChaosState({ scenario: 'error', ttlMinutes: 10 }, now);
  assert.deepEqual(describe(s, now.getTime()).active, true);
  assert.equal(describe(s, now.getTime()).remainingMinutes, 10);
  assert.equal(describe(s, now.getTime() + 11 * 60_000).active, false);
  assert.equal(describe({ active: false, disabledAt: now.toISOString() }).active, false);
  assert.equal(describe(null).active, false);
});
