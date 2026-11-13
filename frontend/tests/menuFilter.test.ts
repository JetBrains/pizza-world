import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterPizzasByCategory } from '../src/menuFilter.ts';
import { fetchCategories, fetchPizzas } from '../src/api.ts';
import type { Pizza } from '../src/types.ts';

const classic = { id: 1, name: 'Classic' };
const spicy = { id: 2, name: 'Spicy' };

const pizzas: Pizza[] = [
  { id: 1, name: 'Margherita', description: '', price: 12, size: '30 cm', category: classic },
  { id: 2, name: 'Diavola', description: '', price: 14, size: '30 cm', category: spicy },
  { id: 3, name: 'Plain', description: '', price: 9, size: '30 cm', category: null },
];

test('"All" (null) keeps every pizza, including uncategorised ones', () => {
  assert.deepEqual(filterPizzasByCategory(pizzas, null), pizzas);
});

test('a category shows only pizzas of that category', () => {
  assert.deepEqual(filterPizzasByCategory(pizzas, spicy.id).map(p => p.name), ['Diavola']);
  assert.deepEqual(filterPizzasByCategory(pizzas, classic.id).map(p => p.name), ['Margherita']);
});

test('a category without pizzas shows none', () => {
  assert.deepEqual(filterPizzasByCategory(pizzas, 99), []);
});

test('mock fallback: categories and pizzas line up so every tab filters', async () => {
  // No backend in node: fetch rejects the relative URL, so tryFetch returns the mock data.
  const [mockPizzas, mockCategories] = await Promise.all([fetchPizzas(), fetchCategories()]);
  assert.deepEqual(mockCategories.map(c => c.name), ['Classic', 'Spicy', 'Signature']);
  for (const pizza of mockPizzas) {
    assert.ok(mockCategories.some(c => c.id === pizza.category?.id), `${pizza.name} has a known category`);
  }
  for (const category of mockCategories) {
    const shown = filterPizzasByCategory(mockPizzas, category.id);
    assert.ok(shown.length > 0, `${category.name} tab is not empty`);
    assert.ok(shown.every(p => p.category?.id === category.id));
  }
  assert.equal(filterPizzasByCategory(mockPizzas, null).length, mockPizzas.length);
});
