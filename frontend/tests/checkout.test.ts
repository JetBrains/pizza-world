import { test } from 'node:test';
import assert from 'node:assert/strict';
import { priceOrder, faultFromEnv, faultFromChaosState, CheckoutError } from '../api/checkout.ts';

test('prices a single pizza', () => {
  const q = priceOrder({ items: [{ pizzaId: 1, quantity: 1 }] });
  assert.equal(q.total, 12);
  assert.equal(q.discount, 0);
  assert.equal(q.promoCode, null);
});

test('multiplies by quantity and sums lines', () => {
  const q = priceOrder({ items: [{ pizzaId: 1, quantity: 3 }, { pizzaId: 2, quantity: 1 }] });
  assert.equal(q.subtotal, 50);
  assert.equal(q.total, 50);
  assert.deepEqual(q.lines.map(l => l.lineTotal), [36, 14]);
});

test('applies PIZZA10 case-insensitively', () => {
  const q = priceOrder({ items: [{ pizzaId: 3, quantity: 2 }], promoCode: ' pizza10 ' });
  assert.equal(q.subtotal, 30);
  assert.equal(q.discount, 3);
  assert.equal(q.total, 27);
  assert.equal(q.promoCode, 'PIZZA10');
});

test('rejects invalid input with CheckoutError (HTTP 400)', () => {
  assert.throws(() => priceOrder({ items: [] }), CheckoutError);
  assert.throws(() => priceOrder({ items: [{ pizzaId: 99, quantity: 1 }] }), CheckoutError);
  assert.throws(() => priceOrder({ items: [{ pizzaId: 1, quantity: 0 }] }), CheckoutError);
  assert.throws(() => priceOrder({ items: [{ pizzaId: 1, quantity: 1.5 }] }), CheckoutError);
  assert.throws(() => priceOrder({ items: [{ pizzaId: 1, quantity: 1 }], promoCode: 'NOPE' }), CheckoutError);
  assert.throws(() => priceOrder(null), CheckoutError);
});

test('bad-promo fault turns an unknown code into a TypeError (HTTP 500)', () => {
  assert.throws(() => priceOrder({ items: [{ pizzaId: 1, quantity: 1 }], promoCode: 'NOPE' }, 'bad-promo'), TypeError);
  // valid codes still work under the fault, so only part of the traffic fails
  assert.equal(priceOrder({ items: [{ pizzaId: 3, quantity: 2 }], promoCode: 'PIZZA10' }, 'bad-promo').total, 27);
});

test('faultFromEnv reads env and rate', () => {
  assert.equal(faultFromEnv({}), null);
  assert.equal(faultFromEnv({ CHECKOUT_FAULT: 'nonsense' }), null);
  assert.equal(faultFromEnv({ CHECKOUT_FAULT: 'error' }), 'error');
  assert.equal(faultFromEnv({ CHECKOUT_FAULT: 'slow', CHECKOUT_FAULT_RATE: '0.5' }, () => 0.4), 'slow');
  assert.equal(faultFromEnv({ CHECKOUT_FAULT: 'slow', CHECKOUT_FAULT_RATE: '0.5' }, () => 0.6), null);
});

test('faultFromChaosState honours active flag, TTL and rate', () => {
  const now = Date.parse('2026-01-01T12:00:00Z');
  const state = { active: true, scenario: 'bad-promo', rate: 0.5, until: '2026-01-01T12:30:00Z' };
  assert.equal(faultFromChaosState(state, now, () => 0.1), 'bad-promo');
  assert.equal(faultFromChaosState(state, now, () => 0.9), null);
  assert.equal(faultFromChaosState(state, Date.parse('2026-01-01T12:31:00Z'), () => 0.1), null);
  assert.equal(faultFromChaosState({ active: false, disabledAt: '2026-01-01T12:00:00Z' }, now), null);
  assert.equal(faultFromChaosState({ ...state, scenario: 'nope' }, now, () => 0.1), null);
  assert.equal(faultFromChaosState(null, now), null);
});
