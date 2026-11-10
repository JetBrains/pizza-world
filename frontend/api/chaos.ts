/**
 * Chaos API — lets a bot (or a human) provoke a controlled incident in /api/checkout at runtime, without a redeploy.
 *
 *   GET    /api/chaos                                   current state (public)
 *   POST   /api/chaos  {"scenario","rate","ttlMinutes","reason"}   enable a fault   (Authorization: Bearer $CHAOS_TOKEN)
 *   DELETE /api/chaos                                   disable the fault           (Authorization: Bearer $CHAOS_TOKEN)
 *
 * State lives in Vercel Edge Config (key "chaos"); /api/checkout reads it on every request.
 * Changes propagate to all regions within ~10 seconds. A fault always expires after ttlMinutes.
 *
 * Env: EDGE_CONFIG (connection string), CHAOS_TOKEN, VERCEL_CHAOS_API_TOKEN (Edge Config write), VERCEL_TEAM_ID
 */
import { get } from '@vercel/edge-config';
import { timingSafeEqual } from 'node:crypto';

export const SCENARIOS = ['error', 'slow', 'bad-promo'] as const;
export type Scenario = (typeof SCENARIOS)[number];

export interface ChaosState {
  active: true;
  scenario: Scenario;
  rate: number;
  since: string;
  until: string;
  reason: string | null;
}

export interface ChaosOff {
  active: false;
  disabledAt: string;
}

const DEFAULT_TTL_MINUTES = 30;
const MAX_TTL_MINUTES = 240;
const EDGE_CONFIG_KEY = 'chaos';

export class ChaosRequestError extends Error {
  readonly status = 400;
}

export function buildChaosState(input: unknown, now = new Date()): ChaosState {
  if (typeof input !== 'object' || input === null) throw new ChaosRequestError('Body must be a JSON object');
  const { scenario, rate = 1, ttlMinutes = DEFAULT_TTL_MINUTES, reason = null } = input as Record<string, unknown>;

  if (typeof scenario !== 'string' || !(SCENARIOS as readonly string[]).includes(scenario)) {
    throw new ChaosRequestError(`scenario must be one of: ${SCENARIOS.join(', ')}`);
  }
  if (typeof rate !== 'number' || !(rate > 0 && rate <= 1)) throw new ChaosRequestError('rate must be a number in (0, 1]');
  if (typeof ttlMinutes !== 'number' || !Number.isInteger(ttlMinutes) || ttlMinutes < 1 || ttlMinutes > MAX_TTL_MINUTES) {
    throw new ChaosRequestError(`ttlMinutes must be an integer 1..${MAX_TTL_MINUTES}`);
  }
  if (reason !== null && typeof reason !== 'string') throw new ChaosRequestError('reason must be a string');

  return {
    active: true,
    scenario: scenario as Scenario,
    rate,
    since: now.toISOString(),
    until: new Date(now.getTime() + ttlMinutes * 60_000).toISOString(),
    reason: reason ? reason.slice(0, 200) : null,
  };
}

export function isAuthorized(header: string | null, token: string | undefined): boolean {
  if (!token || !header?.startsWith('Bearer ')) return false;
  const given = Buffer.from(header.slice('Bearer '.length));
  const expected = Buffer.from(token);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** Describes a stored state; expired faults are reported as inactive. */
export function describe(state: unknown, now = Date.now()) {
  const s = state as Partial<ChaosState> | null;
  if (!s || s.active !== true || typeof s.until !== 'string') return { active: false as const };
  const remainingMs = Date.parse(s.until) - now;
  if (!(remainingMs > 0)) return { active: false as const, expiredAt: s.until };
  return { active: true as const, scenario: s.scenario, rate: s.rate, since: s.since, until: s.until, reason: s.reason, remainingMinutes: Math.ceil(remainingMs / 60_000) };
}

function log(level: 'info' | 'warn', fields: Record<string, unknown>) {
  const line = JSON.stringify({ ts: new Date().toISOString(), level, service: 'chaos', env: process.env.VERCEL_ENV ?? 'local', ...fields });
  if (level === 'warn') console.warn(line);
  else console.log(line);
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

async function writeState(value: ChaosState | ChaosOff): Promise<void> {
  const connection = process.env.EDGE_CONFIG;
  const apiToken = process.env.VERCEL_CHAOS_API_TOKEN;
  if (!connection || !apiToken) throw new Error('Chaos API is not configured (EDGE_CONFIG / VERCEL_CHAOS_API_TOKEN missing)');
  const edgeConfigId = new URL(connection).pathname.replace(/^\//, '');
  const team = process.env.VERCEL_TEAM_ID ? `?teamId=${process.env.VERCEL_TEAM_ID}` : '';
  const res = await fetch(`https://api.vercel.com/v1/edge-config/${edgeConfigId}/items${team}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: [{ operation: 'upsert', key: EDGE_CONFIG_KEY, value: value }] }),
  });
  if (!res.ok) throw new Error(`Edge Config write failed: HTTP ${res.status} ${await res.text()}`);
}

async function guarded(request: Request, action: () => Promise<Response>): Promise<Response> {
  if (!process.env.CHAOS_TOKEN) return json({ error: 'Chaos API is disabled (CHAOS_TOKEN not set)' }, 503);
  if (!isAuthorized(request.headers.get('authorization'), process.env.CHAOS_TOKEN)) return json({ error: 'Unauthorized' }, 401);
  try {
    return await action();
  } catch (e) {
    if (e instanceof ChaosRequestError) return json({ error: e.message }, 400);
    const err = e instanceof Error ? e : new Error(String(e));
    log('warn', { event: 'chaos', action: 'failed', error: err.message });
    return json({ error: err.message }, 502);
  }
}

export async function GET(): Promise<Response> {
  const state = process.env.EDGE_CONFIG ? await get(EDGE_CONFIG_KEY).catch(() => null) : null;
  return json({ ...describe(state), scenarios: SCENARIOS });
}

export function POST(request: Request): Promise<Response> {
  return guarded(request, async () => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ChaosRequestError('Body must be valid JSON');
    }
    const state = buildChaosState(body);
    await writeState(state);
    log('warn', { event: 'chaos', action: 'enabled', scenario: state.scenario, rate: state.rate, until: state.until, reason: state.reason });
    return json({ ok: true, state, note: 'Propagates to all regions within ~10 seconds' });
  });
}

export function DELETE(request: Request): Promise<Response> {
  return guarded(request, async () => {
    const off: ChaosOff = { active: false, disabledAt: new Date().toISOString() };
    await writeState(off);
    log('info', { event: 'chaos', action: 'disabled' });
    return json({ ok: true, state: off, note: 'Propagates to all regions within ~10 seconds' });
  });
}
