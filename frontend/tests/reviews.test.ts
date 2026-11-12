import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { validateReview, parseOrderId, sortNewestFirst, buildLocalReview, MAX_REVIEW_LENGTH } from '../src/reviews.ts';
import { fetchReviews, createReview, HttpError } from '../src/api.ts';
import type { Review } from '../src/types.ts';

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

function stubFetch(handler: (url: string, init?: RequestInit) => Response | Promise<Response>): RequestInit[] {
  const calls: RequestInit[] = [];
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    calls.push(init ?? {});
    return handler(String(input), init);
  }) as typeof fetch;
  return calls;
}

const review = (id: number, createdAt: string): Review => ({ id, orderId: null, text: `r${id}`, rating: 5, createdAt });

test('validateReview accepts ratings 1-5 with non-blank text', () => {
  for (const rating of [1, 2, 3, 4, 5]) {
    assert.equal(validateReview({ rating, text: 'Great', orderId: null }), null);
  }
  assert.equal(validateReview({ rating: 4, text: 'Great', orderId: 7 }), null);
});

test('validateReview rejects what the backend rejects with 400', () => {
  for (const rating of [0, 6, -1, 2.5, NaN]) {
    assert.notEqual(validateReview({ rating, text: 'Great', orderId: null }), null, `rating ${rating}`);
  }
  for (const text of ['', '   ', '\n\t']) {
    assert.notEqual(validateReview({ rating: 3, text, orderId: null }), null, JSON.stringify(text));
  }
  assert.notEqual(validateReview({ rating: 3, text: 'a'.repeat(MAX_REVIEW_LENGTH + 1), orderId: null }), null);
  assert.notEqual(validateReview({ rating: 3, text: 'Great', orderId: NaN }), null);
  assert.notEqual(validateReview({ rating: 3, text: 'Great', orderId: 0 }), null);
});

test('parseOrderId treats an empty field as no order', () => {
  assert.equal(parseOrderId(''), null);
  assert.equal(parseOrderId('  '), null);
  assert.equal(parseOrderId(' 12 '), 12);
  assert.ok(Number.isNaN(parseOrderId('12a')));
  assert.ok(Number.isNaN(parseOrderId('-3')));
});

test('sortNewestFirst orders by createdAt, then id, without mutating the input', () => {
  const input = [review(1, '2026-01-01T10:00:00'), review(3, '2026-01-03T10:00:00'), review(2, '2026-01-03T10:00:00')];
  assert.deepEqual(sortNewestFirst(input).map(r => r.id), [3, 2, 1]);
  assert.deepEqual(input.map(r => r.id), [1, 3, 2]);
});

test('buildLocalReview trims text and uses unique negative ids', () => {
  const now = new Date('2026-11-12T12:00:00Z');
  const a = buildLocalReview({ rating: 4, text: '  Tasty  ', orderId: null }, now);
  const b = buildLocalReview({ rating: 4, text: 'Tasty', orderId: 2 }, now);
  assert.equal(a.text, 'Tasty');
  assert.equal(a.createdAt, '2026-11-12T12:00:00.000Z');
  assert.ok(a.id < 0 && b.id < 0 && a.id !== b.id);
  assert.equal(b.orderId, 2);
});

test('fetchReviews returns the backend list when it is available', async () => {
  const fromServer = [review(9, '2026-11-12T10:00:00')];
  stubFetch(() => Response.json(fromServer));
  assert.deepEqual(await fetchReviews(), fromServer);
});

test('fetchReviews falls back to mock reviews without a backend', async () => {
  stubFetch(() => new Response('Not Found', { status: 404 }));
  const reviews = await fetchReviews();
  assert.ok(reviews.length > 0);
  assert.deepEqual(sortNewestFirst(reviews).map(r => r.id), reviews.map(r => r.id), 'mocks are newest first');

  stubFetch(() => Promise.reject(new TypeError('fetch failed')));
  assert.ok((await fetchReviews()).length > 0);
});

test('createReview posts a trimmed review and returns the saved one', async () => {
  const saved = { id: 42, orderId: null, text: 'Lovely', rating: 5, createdAt: '2026-11-12T10:00:00' };
  const calls = stubFetch(() => Response.json(saved));
  assert.deepEqual(await createReview({ rating: 5, text: '  Lovely ', orderId: null }), saved);
  assert.equal(calls[0].method, 'POST');
  assert.deepEqual(JSON.parse(String(calls[0].body)), { orderId: null, text: 'Lovely', rating: 5 });
});

test('createReview keeps a local review when there is no backend, and fetchReviews still lists it', async () => {
  for (const status of [404, 502]) {
    stubFetch(() => new Response('No backend', { status }));
    const local = await createReview({ rating: 3, text: `Offline but tasty ${status}`, orderId: null });
    assert.equal(local.text, `Offline but tasty ${status}`);
    assert.equal(local.rating, 3);
    assert.ok(local.id < 0);
    assert.equal((await fetchReviews())[0].id, local.id, 'survives a refetch, e.g. after switching tabs');
  }
});

test('createReview does not hide errors from a live backend behind the fallback', async () => {
  for (const status of [400, 500]) {
    stubFetch(() => new Response(null, { status }));
    await assert.rejects(createReview({ rating: 3, text: 'Unknown order', orderId: 999 }),
      (err: unknown) => err instanceof HttpError && err.status === status);
  }
});

test('fetchReviews does not hide a 500 from a live backend behind mock reviews', async () => {
  stubFetch(() => new Response(null, { status: 500 }));
  await assert.rejects(fetchReviews(), (err: unknown) => err instanceof HttpError && err.status === 500);
});

test('createReview rejects invalid input without calling the API', async () => {
  const calls = stubFetch(() => Response.json({}));
  await assert.rejects(createReview({ rating: 0, text: 'Nice', orderId: null }));
  await assert.rejects(createReview({ rating: 5, text: '   ', orderId: null }));
  assert.equal(calls.length, 0);
});
