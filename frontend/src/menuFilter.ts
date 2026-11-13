import type { Pizza } from './types';

/** `null` selects the "All" tab. */
export type CategoryFilter = number | null;

export function filterPizzasByCategory(pizzas: Pizza[], categoryId: CategoryFilter): Pizza[] {
  if (categoryId === null) return pizzas;
  return pizzas.filter(pizza => pizza.category?.id === categoryId);
}
