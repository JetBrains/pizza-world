import type { Pizza, PizzaOrder, OrderStatus } from './types';

const API_BASE = '/api';

export async function fetchPizzas(): Promise<Pizza[]> {
  const res = await fetch(`${API_BASE}/pizzas`);
  return res.json();
}

export async function fetchOrders(): Promise<PizzaOrder[]> {
  const res = await fetch(`${API_BASE}/orders`);
  return res.json();
}

export async function createOrder(customerName: string, pizzaIds: number[]): Promise<PizzaOrder> {
  const res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerName, pizzaIds }),
  });
  return res.json();
}

export async function updateOrderStatus(orderId: number, status: OrderStatus): Promise<PizzaOrder> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/status?status=${status}`, {
    method: 'PATCH',
  });
  return res.json();
}
