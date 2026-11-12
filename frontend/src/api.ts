import type { Pizza, PizzaOrder, OrderStatus, CartItem, CheckoutQuote, Review, NewReview } from './types';
import { buildLocalReview, validateReview } from './reviews.ts';

const API_BASE = '/api';

const mockPizzas: Pizza[] = [
  { id: 1, name: 'Margherita', description: 'Tomato sauce, mozzarella, fresh basil, olive oil', price: 12, size: '30 cm' },
  { id: 2, name: 'Diavola', description: 'Tomato sauce, mozzarella, spicy salami, chili pepper', price: 14, size: '30 cm' },
  { id: 3, name: 'Quattro Formaggi', description: 'Mozzarella, gorgonzola, parmesan, fontina', price: 15, size: '30 cm' },
  { id: 4, name: 'Prosciutto e Rucola', description: 'Mozzarella, prosciutto crudo, arugula, parmesan, olive oil', price: 16, size: '30 cm' },
  { id: 5, name: 'Pepperoni', description: 'Tomato sauce, mozzarella, pepperoni', price: 13, size: '30 cm' },
  { id: 6, name: 'Napoletana', description: 'Tomato sauce, mozzarella, anchovies, capers, olives', price: 14, size: '30 cm' },
];

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

const mockReviews: Review[] = [
  { id: 3, orderId: null, text: 'Thin, airy crust and the basil tastes like summer. Best Margherita in town.', rating: 5, createdAt: daysAgo(1) },
  { id: 2, orderId: null, text: 'Diavola had a proper kick. Delivery took a little longer than promised.', rating: 4, createdAt: daysAgo(3) },
  { id: 1, orderId: null, text: 'Quattro Formaggi was rich and creamy, will order again.', rating: 5, createdAt: daysAgo(6) },
];

// Reviews saved in the browser while the backend is unavailable; kept for the page session so they survive remounts.
const localReviews: Review[] = [];

export class HttpError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`HTTP ${status}`);
    this.status = status;
  }
}

/** True when nothing answers behind /api (network error, or 404/502-504 as on Vercel or a Vite proxy without a backend). */
function isBackendUnavailable(error: unknown): boolean {
  return !(error instanceof HttpError) || [404, 502, 503, 504].includes(error.status);
}

async function tryFetch<T>(
  url: string,
  options?: RequestInit,
  fallback?: T,
  canFallBack: (error: unknown) => boolean = () => true,
): Promise<T> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) throw new HttpError(res.status);
    return (await res.json()) as T;
  } catch (error) {
    if (!canFallBack(error)) throw error;
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

/** Server-side price quote from the /api/checkout Vercel Function; falls back to a local calculation. */
export async function checkout(items: CartItem[]): Promise<CheckoutQuote> {
  const subtotal = items.reduce((sum, item) => sum + item.pizza.price * item.quantity, 0);
  const fallback: CheckoutQuote = { subtotal, discount: 0, total: subtotal, promoCode: null, currency: 'USD' };
  return tryFetch(`${API_BASE}/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: items.map(item => ({ pizzaId: item.pizza.id, quantity: item.quantity })) }),
  }, fallback);
}

export async function fetchReviews(): Promise<Review[]> {
  return tryFetch(`${API_BASE}/reviews`, undefined, [...localReviews, ...mockReviews], isBackendUnavailable);
}

/**
 * Saves a review; without a backend (e.g. on Vercel) it keeps a review built locally.
 * Errors from a live backend (400, 500, ...) are not hidden by the fallback: they are thrown as HttpError.
 */
export async function createReview(review: NewReview): Promise<Review> {
  const invalid = validateReview(review);
  if (invalid) throw new Error(invalid);
  const body: NewReview = { orderId: review.orderId, text: review.text.trim(), rating: review.rating };
  const local = buildLocalReview(body);
  const saved = await tryFetch(`${API_BASE}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }, local, isBackendUnavailable);
  if (saved === local) localReviews.unshift(local);
  return saved;
}
