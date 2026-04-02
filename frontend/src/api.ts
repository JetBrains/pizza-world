import type { Pizza, PizzaOrder, OrderStatus } from './types';

const API_BASE = '/api';

const mockPizzas: Pizza[] = [
  { id: 1, name: 'Margherita', description: 'Tomato sauce, mozzarella, fresh basil, olive oil', price: 12, size: '30 cm' },
  { id: 2, name: 'Diavola', description: 'Tomato sauce, mozzarella, spicy salami, chili pepper', price: 14, size: '30 cm' },
  { id: 3, name: 'Quattro Formaggi', description: 'Mozzarella, gorgonzola, parmesan, fontina', price: 15, size: '30 cm' },
  { id: 4, name: 'Prosciutto e Rucola', description: 'Mozzarella, prosciutto crudo, arugula, parmesan, olive oil', price: 16, size: '30 cm' },
  { id: 5, name: 'Pepperoni', description: 'Tomato sauce, mozzarella, pepperoni', price: 13, size: '30 cm' },
  { id: 6, name: 'Napoletana', description: 'Tomato sauce, mozzarella, anchovies, capers, olives', price: 14, size: '30 cm' },
];

async function tryFetch<T>(url: string, options?: RequestInit, fallback?: T): Promise<T> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    if (fallback !== undefined) return fallback;
    throw new Error(`API unavailable: ${url}`);
  }
}

export async function fetchPizzas(): Promise<Pizza[]> {
  return tryFetch(`${API_BASE}/pizzas`, undefined, mockPizzas);
}

export async function fetchOrders(): Promise<PizzaOrder[]> {
  return tryFetch(`${API_BASE}/orders`, undefined, []);
}

export async function createOrder(customerName: string, pizzaIds: number[]): Promise<PizzaOrder> {
  return tryFetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerName, pizzaIds }),
  });
}

export async function updateOrderStatus(orderId: number, status: OrderStatus): Promise<PizzaOrder> {
  return tryFetch(`${API_BASE}/orders/${orderId}/status?status=${status}`, {
    method: 'PATCH',
  });
}
