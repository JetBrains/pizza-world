import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { POST, priceOrder, CheckoutError, INVALID_PROMO_CODE } from '../api/checkout.ts';
import {
  checkout,
  formatPrice,
  InvalidPromoCodeError,
  localQuote,
  MOCK_PROMO_CODES,
  validatePromoCode,
} from '../src/api.ts';
import type { CartItem } from '../src/types.ts';

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

type Handler = (url: string, init?: RequestInit) => Response | Promise<Response>;
const calls: { url: string; body: unknown }[] = [];
function stubFetch(handler: Handler) {
  calls.length = 0;
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, body: init?.body ? JSON.parse(String(init.body)) : undefined });
    return handler(url, init);
  }) as typeof fetch;
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const cart = (...items: [id: number, price: number, quantity: number][]): CartItem[] =>
  items.map(([id, price, quantity]) => ({ pizza: { id, name: `#${id}`, description: '', price, size: '' }, quantity }));

// --- validatePromoCode -------------------------------------------------------------------------

test('validatePromoCode returns the backend discount and sends the normalised code', async () => {
  stubFetch(() => json({ code: 'PIZZA10', discountPercent: 10 }));
  assert.deepEqual(await validatePromoCode('  pizza10 '), { code: 'PIZZA10', discountPercent: 10 });
  assert.equal(calls[0].url, '/api/promo/validate');
  assert.deepEqual(calls[0].body, { code: 'PIZZA10' });
});

test('validatePromoCode does not mask a backend 400 as success', async () => {
  // PIZZA10 is in the mock list, but the backend says it is inactive: the backend wins.
  stubFetch(() => json({ error: 'Invalid promo code: PIZZA10' }, 400));
  await assert.rejects(validatePromoCode('PIZZA10'), (e: unknown) =>
    e instanceof InvalidPromoCodeError && e.message === 'Invalid promo code: PIZZA10');
});

for (const [name, handler] of [
  ['network error', () => { throw new TypeError('fetch failed'); }],
  ['404 (Vercel, no backend)', () => new Response('Not found', { status: 404 })],
  ['502 from the dev proxy', () => new Response('', { status: 502 })],
  ['200 with non-JSON body', () => new Response('<html>', { status: 200 })],
] as [string, Handler][]) {
  test(`validatePromoCode falls back to the mock when the API is unavailable: ${name}`, async () => {
    stubFetch(handler);
    assert.deepEqual(await validatePromoCode('pizza10'), { code: 'PIZZA10', discountPercent: 10 });
    await assert.rejects(validatePromoCode('NOPE'), (e: unknown) =>
      e instanceof InvalidPromoCodeError && e.message === 'Invalid promo code: NOPE');
  });
}

test('validatePromoCode rejects a blank code without calling the API', async () => {
  stubFetch(() => json({}));
  await assert.rejects(validatePromoCode('   '), InvalidPromoCodeError);
  assert.equal(calls.length, 0);
});

// --- pricing and rounding ----------------------------------------------------------------------

test('localQuote rounds discount and total to cents', () => {
  // 8.99 * 10% = 0.899 -> 0.90; 8.99 - 0.90 = 8.09
  const q = localQuote(cart([1, 8.99, 1]), { code: 'PIZZA10', discountPercent: 10 });
  assert.equal(q.subtotal, 8.99);
  assert.equal(q.discount, 0.9);
  assert.equal(q.total, 8.09);
  assert.equal(q.promoCode, 'PIZZA10');
  // 3 * 10.99 = 32.97 (not 32.970000000000006); 10% = 3.30; total 29.67
  const q3 = localQuote(cart([2, 10.99, 3]), { code: 'PIZZA10', discountPercent: 10 });
  assert.deepEqual([q3.subtotal, q3.discount, q3.total], [32.97, 3.3, 29.67]);
  assert.equal(localQuote(cart([1, 12, 1])).discount, 0);
});

test('formatPrice always shows 2 decimals', () => {
  assert.equal(formatPrice(27), '27.00');
  assert.equal(formatPrice(11.7), '11.70');
  assert.equal(formatPrice(0.899), '0.90');
  assert.equal(formatPrice(32.970000000000006), '32.97');
});

// --- checkout() against the real Vercel Function ---------------------------------------------------

const viaCheckoutFunction: Handler = (url, init) => {
  assert.equal(url, '/api/checkout');
  return POST(new Request('http://localhost/api/checkout', { method: 'POST', body: init?.body, headers: init?.headers }));
};

test('checkout sends the promo code and returns the server quote', async () => {
  stubFetch(viaCheckoutFunction);
  const q = await checkout(cart([3, 15, 2]), { code: 'PIZZA10', discountPercent: 10 });
  assert.equal(calls[0].body && (calls[0].body as { promoCode?: string }).promoCode, 'PIZZA10');
  assert.deepEqual([q.subtotal, q.discount, q.total, q.promoCode], [30, 3, 27, 'PIZZA10']);
});

test('checkout without a promo code sends no promoCode', async () => {
  stubFetch(viaCheckoutFunction);
  const q = await checkout(cart([1, 12, 1]));
  assert.equal('promoCode' in (calls[0].body as object), false);
  assert.equal(q.total, 12);
});

test('checkout throws InvalidPromoCodeError when the function rejects the code (not the local fallback)', async () => {
  stubFetch(viaCheckoutFunction);
  await assert.rejects(checkout(cart([1, 12, 1]), { code: 'NOPE', discountPercent: 10 }), InvalidPromoCodeError);
});

test('checkout falls back to the local quote, with the discount, when the function is unavailable', async () => {
  stubFetch(() => new Response('Not found', { status: 404 }));
  const q = await checkout(cart([1, 8.99, 1]), { code: 'PIZZA10', discountPercent: 10 });
  assert.deepEqual([q.subtotal, q.discount, q.total], [8.99, 0.9, 8.09]);
});

// --- contract between the frontend mock and the Vercel Function ----------------------------------

test('every mock promo code is accepted by api/checkout.ts with the same discount', () => {
  for (const [code, percent] of Object.entries(MOCK_PROMO_CODES)) {
    const q = priceOrder({ items: [{ pizzaId: 4, quantity: 1 }], promoCode: code });
    assert.equal(q.discount, Math.round(16 * percent) / 100, code);
  }
});

test('unknown promo code: 400 response carries the INVALID_PROMO_CODE code', async () => {
  assert.throws(() => priceOrder({ items: [{ pizzaId: 1, quantity: 1 }], promoCode: 'NOPE' }),
    (e: unknown) => e instanceof CheckoutError && e.code === INVALID_PROMO_CODE);
  const res = await POST(new Request('http://localhost/api/checkout', {
    method: 'POST', body: JSON.stringify({ items: [{ pizzaId: 1, quantity: 1 }], promoCode: 'NOPE' }),
  }));
  assert.equal(res.status, 400);
  const body = await res.json() as { code?: string; error?: string };
  assert.equal(body.code, INVALID_PROMO_CODE);
  assert.equal(body.error, 'Unknown promo code: NOPE');
});
