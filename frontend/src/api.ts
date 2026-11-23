import type { Pizza, PizzaOrder, OrderStatus, CartItem, CheckoutQuote, PromoDiscount } from './types';

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
    return (await res.json()) as T;
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

/**
 * Promo codes used when the backend is unavailable (e.g. on Vercel, where only the frontend is deployed).
 * Keep in sync with PROMO_CODES in api/checkout.ts and the seed data in DataInitializer.java.
 */
export const MOCK_PROMO_CODES: Record<string, number> = {
  PIZZA10: 10,
};

/** The code is not valid (unknown or inactive) — as opposed to the API being unavailable. */
export class InvalidPromoCodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPromoCodeError';
  }
}

export const round2 = (n: number) => Math.round(n * 100) / 100;

/** Money is always shown with 2 decimals, e.g. 11.7 -> "11.70". */
export const formatPrice = (n: number) => round2(n).toFixed(2);

export const normalizePromoCode = (code: string) => code.trim().toUpperCase();

const invalidCodeMessage = (code: string) => `Invalid promo code: ${code}`;

async function readJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function isPromoDiscount(body: unknown): body is PromoDiscount {
  const b = body as Partial<PromoDiscount> | null;
  return !!b && typeof b.code === 'string' && typeof b.discountPercent === 'number';
}

/**
 * Validates a promo code with the backend (POST /api/promo/validate).
 * - 200: the code and its discount.
 * - 400: throws InvalidPromoCodeError — never masked by the fallback.
 * - Backend unavailable (network error, 404 on Vercel, 5xx, non-JSON): checks MOCK_PROMO_CODES,
 *   which also throws InvalidPromoCodeError for unknown codes.
 */
export async function validatePromoCode(input: string): Promise<PromoDiscount> {
  const code = normalizePromoCode(input);
  if (!code) throw new InvalidPromoCodeError('Enter a promo code');

  let res: Response | null = null;
  try {
    res = await fetch(`${API_BASE}/promo/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
  } catch {
    res = null;
  }

  if (res?.status === 400) {
    const body = (await readJson(res)) as { error?: unknown } | null;
    throw new InvalidPromoCodeError(typeof body?.error === 'string' ? body.error : invalidCodeMessage(code));
  }
  if (res?.ok) {
    const body = await readJson(res);
    if (isPromoDiscount(body)) return { code: body.code, discountPercent: body.discountPercent };
  }

  // API unavailable: use the mock list so that PIZZA10 works without the backend.
  const discountPercent = MOCK_PROMO_CODES[code];
  if (discountPercent === undefined) throw new InvalidPromoCodeError(invalidCodeMessage(code));
  return { code, discountPercent };
}

/** Local price calculation, same rules as api/checkout.ts: discount = subtotal * percent / 100, rounded to cents. */
export function localQuote(items: CartItem[], promo: PromoDiscount | null = null): CheckoutQuote {
  const subtotal = round2(items.reduce((sum, item) => sum + item.pizza.price * item.quantity, 0));
  const discount = promo ? round2((subtotal * promo.discountPercent) / 100) : 0;
  return { subtotal, discount, total: round2(subtotal - discount), promoCode: promo?.code ?? null, currency: 'USD' };
}

/**
 * Server-side price quote from the /api/checkout Vercel Function; falls back to a local calculation
 * when the function is unavailable. A 400 for the promo code throws InvalidPromoCodeError instead.
 */
export async function checkout(items: CartItem[], promo: PromoDiscount | null = null): Promise<CheckoutQuote> {
  const fallback = localQuote(items, promo);
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: items.map(item => ({ pizzaId: item.pizza.id, quantity: item.quantity })),
        ...(promo ? { promoCode: promo.code } : {}),
      }),
    });
  } catch {
    return fallback;
  }

  if (res.ok) {
    const body = (await readJson(res)) as CheckoutQuote | null;
    return body && typeof body.total === 'number' ? body : fallback;
  }
  if (res.status === 400 && promo) {
    const body = (await readJson(res)) as { code?: unknown } | null;
    if (body?.code === 'INVALID_PROMO_CODE') throw new InvalidPromoCodeError(invalidCodeMessage(promo.code));
  }
  return fallback;
}
