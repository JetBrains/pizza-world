import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { fetchPizzas, fetchTopPizzas, mockPizzas, sortByRating } from '../src/api.ts';
import { starStates } from '../src/rating.ts';
import type { Pizza } from '../src/types.ts';

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

function backendDown() {
  globalThis.fetch = async () => { throw new TypeError('fetch failed'); };
}

function pizza(id: number, name: string, rating: number | null): Pizza {
  return { id, name, description: '', price: 10, size: '30 cm', rating };
}

test('every mock pizza has a rating from 1 to 5', () => {
  for (const p of mockPizzas) {
    assert.ok(Number.isInteger(p.rating) && p.rating! >= 1 && p.rating! <= 5, `${p.name}: ${p.rating}`);
  }
});

test('menu falls back to rated mock pizzas without a backend', async () => {
  backendDown();
  const pizzas = await fetchPizzas();
  assert.equal(pizzas.length, mockPizzas.length);
  assert.ok(pizzas.every(p => p.rating != null));
});

test('fetchTopPizzas falls back to mock pizzas sorted by rating', async () => {
  backendDown();
  const ratings = (await fetchTopPizzas()).map(p => p.rating!);
  assert.equal(ratings.length, mockPizzas.length);
  assert.deepEqual(ratings, [...ratings].sort((a, b) => b - a));
});

test('fetchTopPizzas uses the API response when the backend is up', async () => {
  const fromApi = [pizza(9, 'Funghi', 2)];
  globalThis.fetch = async (input) => {
    assert.equal(String(input), '/api/pizzas/top');
    return new Response(JSON.stringify(fromApi), { status: 200 });
  };
  assert.deepEqual(await fetchTopPizzas(), fromApi);
});

test('sortByRating puts unrated pizzas last and breaks ties by name', () => {
  const sorted = sortByRating([pizza(1, 'B', 4), pizza(2, 'X', null), pizza(3, 'A', 4), pizza(4, 'C', 5)]);
  assert.deepEqual(sorted.map(p => p.name), ['C', 'A', 'B', 'X']);
});

test('starStates fills one star per rating point, clamped to 0–5', () => {
  assert.deepEqual(starStates(3), [true, true, true, false, false]);
  assert.deepEqual(starStates(5), [true, true, true, true, true]);
  assert.deepEqual(starStates(0), [false, false, false, false, false]);
  assert.deepEqual(starStates(7).filter(Boolean).length, 5);
  assert.deepEqual(starStates(-1).filter(Boolean).length, 0);
});
