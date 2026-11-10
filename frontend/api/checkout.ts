/**
 * POST /api/checkout — prices a cart server-side.
 *
 * Runs as a Vercel Function so that real runtime logs exist for the incident pipeline.
 * Every request emits exactly one structured JSON log line (see `log()`).
 *
 * Fault injection ("knob") for incident demos — set in the Vercel project env and redeploy:
 *   CHECKOUT_FAULT       = error | slow | bad-promo   (unset = healthy)
 *   CHECKOUT_FAULT_RATE  = 0..1, share of requests affected (default 1)
 */

export type Fault = 'error' | 'slow' | 'bad-promo';

export interface CheckoutItem {
  pizzaId: number;
  quantity: number;
}

export interface QuoteLine {
  pizzaId: number;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Quote {
  lines: QuoteLine[];
  subtotal: number;
  discount: number;
  total: number;
  promoCode: string | null;
  currency: 'USD';
}

export const CATALOG: Record<number, { name: string; price: number }> = {
  1: { name: 'Margherita', price: 12 },
  2: { name: 'Diavola', price: 14 },
  3: { name: 'Quattro Formaggi', price: 15 },
  4: { name: 'Prosciutto e Rucola', price: 16 },
  5: { name: 'Pepperoni', price: 13 },
  6: { name: 'Napoletana', price: 14 },
};

const PROMO_CODES: Record<string, { discountPercent: number }> = {
  PIZZA10: { discountPercent: 10 },
};

const MAX_QUANTITY = 20;
const SLOW_FAULT_MS = 8000; // longer than maxDuration (5s) in vercel.json -> function timeout

/** Client error: invalid input, returned as HTTP 400. */
export class CheckoutError extends Error {
  readonly status = 400;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function priceOrder(input: unknown, fault: Fault | null = null): Quote {
  if (typeof input !== 'object' || input === null) throw new CheckoutError('Body must be a JSON object');
  const { items, promoCode } = input as { items?: unknown; promoCode?: unknown };

  if (!Array.isArray(items) || items.length === 0) throw new CheckoutError('Cart is empty');

  const lines: QuoteLine[] = items.map((raw, i) => {
    const item = raw as Partial<CheckoutItem>;
    const pizza = typeof item.pizzaId === 'number' ? CATALOG[item.pizzaId] : undefined;
    if (!pizza) throw new CheckoutError(`items[${i}]: unknown pizzaId ${String(item.pizzaId)}`);
    const quantity = item.quantity;
    if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
      throw new CheckoutError(`items[${i}]: quantity must be an integer 1..${MAX_QUANTITY}`);
    }
    return { pizzaId: item.pizzaId!, name: pizza.name, unitPrice: pizza.price, quantity, lineTotal: round2(pizza.price * quantity) };
  });

  const subtotal = round2(lines.reduce((sum, l) => sum + l.lineTotal, 0));

  let discount = 0;
  let appliedCode: string | null = null;
  if (promoCode !== undefined && promoCode !== null && promoCode !== '') {
    if (typeof promoCode !== 'string') throw new CheckoutError('promoCode must be a string');
    const code = promoCode.trim().toUpperCase();
    const promo = PROMO_CODES[code];
    if (fault === 'bad-promo') {
      // Simulated regression: the "unknown code" guard was lost in a refactoring,
      // so an unknown code crashes with a TypeError (HTTP 500) instead of a 400.
      discount = round2((subtotal * (promo as { discountPercent: number }).discountPercent) / 100);
    } else {
      if (!promo) throw new CheckoutError(`Unknown promo code: ${code}`);
      discount = round2((subtotal * promo.discountPercent) / 100);
    }
    appliedCode = code;
  }

  return { lines, subtotal, discount, total: round2(subtotal - discount), promoCode: appliedCode, currency: 'USD' };
}

export function activeFault(env: Record<string, string | undefined> = process.env, random = Math.random): Fault | null {
  const fault = env.CHECKOUT_FAULT;
  if (fault !== 'error' && fault !== 'slow' && fault !== 'bad-promo') return null;
  const rate = env.CHECKOUT_FAULT_RATE === undefined ? 1 : Number(env.CHECKOUT_FAULT_RATE);
  return random() < rate ? fault : null;
}

type Level = 'info' | 'warn' | 'error';

function log(level: Level, fields: Record<string, unknown>) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    service: 'checkout',
    deploymentId: process.env.VERCEL_DEPLOYMENT_ID ?? null,
    env: process.env.VERCEL_ENV ?? 'local',
    ...fields,
  });
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

export async function POST(request: Request): Promise<Response> {
  const started = Date.now();
  const requestId = request.headers.get('x-vercel-id') ?? crypto.randomUUID();
  const fault = activeFault();
  const base = { event: 'checkout', requestId, fault };

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new CheckoutError('Body must be valid JSON');
    }
    if (fault === 'error') throw new Error('Pricing service unavailable (injected fault)');
    if (fault === 'slow') await new Promise(resolve => setTimeout(resolve, SLOW_FAULT_MS));

    const quote = priceOrder(body, fault);
    log('info', {
      ...base, status: 200, durationMs: Date.now() - started,
      itemCount: quote.lines.reduce((n, l) => n + l.quantity, 0), total: quote.total, promoCode: quote.promoCode,
    });
    return json(quote);
  } catch (e) {
    if (e instanceof CheckoutError) {
      log('warn', { ...base, status: 400, durationMs: Date.now() - started, error: e.message });
      return json({ error: e.message, requestId }, 400);
    }
    const err = e instanceof Error ? e : new Error(String(e));
    log('error', { ...base, status: 500, durationMs: Date.now() - started, errorType: err.name, error: err.message, stack: err.stack });
    return json({ error: 'Internal error', requestId }, 500);
  }
}

/** Health check, also used by the synthetic monitor. */
export function GET(): Response {
  return json({ status: 'ok', service: 'checkout', faultConfigured: process.env.CHECKOUT_FAULT ?? 'none' });
}
