---
name: chaos-trigger
description: Provoke a controlled production incident in Pizza World's checkout via the Chaos API (/api/chaos), generate traffic and confirm the errors show up in Vercel runtime logs; also check or switch off a running fault. Use when asked to "break checkout", "simulate / trigger an incident", "turn on chaos", "what chaos is running" or "stop the chaos".
---

# Chaos trigger

Turns on a fault in `POST /api/checkout` at runtime (no redeploy) and proves it is visible. The fault lives in Vercel Edge Config and **always expires** after `ttlMinutes`.

## Inputs

| What | Value |
|---|---|
| Production URL | `https://pizza-world-github.vercel.app` |
| Chaos token | env `CHAOS_TOKEN` (factory secret — never print it, never commit it) |
| Jira project | `PZG` (do **not** create an issue — detecting the incident is the factory's job) |

## Scenarios

| `scenario` | Effect | What shows up in Vercel logs |
|---|---|---|
| `bad-promo` | Unknown promo code → **500** instead of 400; other requests keep working | `level:"error"`, `errorType:"TypeError"`, `Cannot read properties of undefined (reading 'discountPercent')`, stack `checkout.ts` |
| `error` | Every checkout → **500** | `level:"error"`, `Pricing service unavailable (injected fault)` |
| `slow` | Every checkout hangs → **504** timeout after 5 s | `Task timed out` / 504 on `/api/checkout` |

`rate` (0–1] limits the share of affected requests — `0.3` looks more realistic than `1`.

## Steps

1. **Check current state** — refuse to stack faults:
   ```bash
   curl -s https://pizza-world-github.vercel.app/api/chaos
   ```
   If `"active": true`, report it and stop unless asked to replace it.

2. **Enable** (defaults: `rate` 1, `ttlMinutes` 30, max 240):
   ```bash
   curl -s -X POST https://pizza-world-github.vercel.app/api/chaos \
     -H "Authorization: Bearer $CHAOS_TOKEN" -H "Content-Type: application/json" \
     -d '{"scenario":"bad-promo","rate":1,"ttlMinutes":30,"reason":"factory demo"}'
   ```
   Expect `{"ok":true,...}`. `401` = wrong token, `503` = Chaos API not configured.

3. **Wait ~15 s** for Edge Config to propagate, then **generate traffic**:
   ```bash
   BASE_URL=https://pizza-world-github.vercel.app ROUNDS=3 node frontend/scripts/synthetic-checkout.mjs
   ```
   Expect `FAIL` (for `bad-promo`: the "unknown promo code" scenario returns 500).

4. **Confirm the errors are in Vercel runtime logs**:
   ```bash
   cd frontend && vercel logs --environment production --level error --since 5m --no-follow --no-branch --json | head -5
   ```
   Each line's `message` is a JSON log with `level`, `errorType`, `error`, `requestId`, `fault`.

5. **Report**: scenario, rate, expiry time (`until`), synthetic result, 1–2 sample `requestId`s.

## Switch off

```bash
curl -s -X DELETE https://pizza-world-github.vercel.app/api/chaos -H "Authorization: Bearer $CHAOS_TOKEN"
```
Wait ~15 s and verify: `BASE_URL=https://pizza-world-github.vercel.app node frontend/scripts/synthetic-checkout.mjs` → `PASS`.

## Rules

- Only this project's own production URL. Never point it at another project.
- Never set `ttlMinutes` above 240. Default to 30.
- One fault at a time.
- Never print `CHAOS_TOKEN`.
