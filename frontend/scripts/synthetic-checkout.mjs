#!/usr/bin/env node
// Synthetic monitor for /api/checkout.
// Usage: BASE_URL=https://<deployment>.vercel.app [ROUNDS=1] node frontend/scripts/synthetic-checkout.mjs
// Exits 1 if any scenario returns an unexpected status or total — use it to verify a fix on a preview.

const base = (process.env.BASE_URL || process.argv[2] || '').replace(/\/$/, '');
if (!base) {
  console.error('Set BASE_URL (or pass it as the first argument)');
  process.exit(2);
}
const rounds = Number(process.env.ROUNDS || 1);

const scenarios = [
  { name: 'single pizza', body: { items: [{ pizzaId: 1, quantity: 1 }] }, status: 200, total: 12 },
  { name: 'several of the same pizza', body: { items: [{ pizzaId: 1, quantity: 3 }, { pizzaId: 2, quantity: 1 }] }, status: 200, total: 50 },
  { name: 'valid promo code', body: { items: [{ pizzaId: 3, quantity: 2 }], promoCode: 'PIZZA10' }, status: 200, total: 27 },
  { name: 'unknown promo code', body: { items: [{ pizzaId: 1, quantity: 1 }], promoCode: 'NOPE' }, status: 400 },
  { name: 'empty cart', body: { items: [] }, status: 400 },
];

let failures = 0;
for (let r = 1; r <= rounds; r++) {
  for (const s of scenarios) {
    const started = Date.now();
    let status = 0;
    let detail = '';
    try {
      const res = await fetch(`${base}/api/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'pizza-world-synthetic' },
        body: JSON.stringify(s.body),
        signal: AbortSignal.timeout(15000),
      });
      status = res.status;
      const data = await res.json().catch(() => ({}));
      if (s.total !== undefined && data.total !== s.total) detail = `expected total ${s.total}, got ${data.total}`;
      if (data.requestId) detail += `${detail ? '; ' : ''}requestId ${data.requestId}`;
    } catch (e) {
      detail = String(e);
    }
    const ok = status === s.status && !detail.startsWith('expected');
    if (!ok) failures++;
    console.log(JSON.stringify({ round: r, scenario: s.name, ok, status, expected: s.status, ms: Date.now() - started, detail: detail || undefined }));
  }
}

console.log(`\n${failures === 0 ? 'PASS' : 'FAIL'}: ${failures} failed of ${rounds * scenarios.length} checks against ${base}`);
process.exit(failures === 0 ? 0 : 1);
