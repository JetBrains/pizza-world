---
name: incident-fix
description: Investigate and resolve a production incident in Pizza World from Vercel runtime logs — create a Jira bug, mitigate, fix with a regression test, verify on a preview with the synthetic monitor and open a PR. Use when Vercel logs show level "error" or 5xx on /api/*, the synthetic monitor fails, or you are asked to handle an incident.
---

# Incident fix

## Context

| What | Value |
|---|---|
| Production URL | `https://pizza-world-github.vercel.app` |
| Jira project | `PZG` — https://jetbrains-team-bitdsbm5.atlassian.net/browse/PZG |
| Logs | `cd frontend && vercel logs --environment production --level error --since 30m --no-follow --no-branch --json` |
| Synthetic monitor | `BASE_URL=<url> node frontend/scripts/synthetic-checkout.mjs` (exit 1 = broken) |
| Chaos API | `GET https://pizza-world-github.vercel.app/api/chaos` (state) · `DELETE` with `Authorization: Bearer $CHAOS_TOKEN` (switch off) |

Every `/api/checkout` request writes one JSON line: `level`, `status`, `errorType`, `error`, `stack`, `requestId`, `deploymentId`, `fault`.

## Steps

### 1. Collect evidence
- Pull error logs (command above). Group by `errorType` + `error`; count occurrences and note the first timestamp.
- Keep 2–3 `requestId`s, the `deploymentId`, one full `stack`, and the `fault` field.
- Reproduce: `BASE_URL=https://pizza-world-github.vercel.app node frontend/scripts/synthetic-checkout.mjs` — which scenarios fail?

### 2. Check for an existing issue
Search Jira `PZG` for an open issue with label `incident` and the same error. If found — comment there instead of creating a new one.

### 3. Create the Jira bug
- Type **Bug**, label `incident`, summary: `[Incident] <errorType>: <error> on /api/checkout`.
- Description: error counts and time window, sample log line, `requestId`s, `deploymentId`, failing synthetic scenarios, `GET /api/chaos` result.
- Move it to **In Progress**.

### 4. Classify and mitigate
Check `GET https://pizza-world-github.vercel.app/api/chaos` and the `fault` field in the logs:

- **Injected fault** (`fault` is not null / chaos `active: true`):
  1. Mitigate: `DELETE https://pizza-world-github.vercel.app/api/chaos` (with `CHAOS_TOKEN`), wait ~15 s.
  2. Verify: synthetic on production → `PASS`; no new `level:"error"` lines for 5 minutes.
  3. Look for a real resilience gap the fault exposed (e.g. the UI should fall back when checkout is slow). If there is one, continue with step 5 for it; otherwise comment the evidence and move the issue to **Done** ("injected via Chaos API, mitigated").
- **Real bug** (`fault` is null): go to step 5. If the error rate is high and it started with the latest production deployment, roll back first: `cd frontend && vercel rollback`, and note it in Jira.

### 5. Fix
1. Branch: `fix/PZG-<n>-<short-name>` from `main`.
2. Write a **regression test first** in `frontend/tests/` that reproduces the failing input from the log; watch it fail.
3. Fix the code (`frontend/api/` for server code).
4. Checks: `cd frontend && npm run lint && npm run build && npm test`.
5. Commit `PZG-<n>: <what was fixed>`, push.

### 6. Verify on a preview
```bash
cd frontend && PREVIEW=$(vercel --yes 2>&1 | grep -oE 'https://[^ ]+\.vercel\.app' | tail -1)
BASE_URL=$PREVIEW node scripts/synthetic-checkout.mjs   # must PASS
```

### 7. Open the PR
- Title `PZG-<n>: Fix <error>`; body: incident evidence (log line, counts, `requestId`s), root cause, fix, regression test, preview URL, synthetic result.
- CI must be green before asking for review.
- Jira: comment with PR link, preview URL and synthetic result; move to **In Review**.

### 8. After merge
Deploy production (`cd frontend && vercel --prod --yes`), run synthetic on `https://pizza-world-github.vercel.app` → `PASS`, confirm no new error logs for 10 minutes, move the Jira issue to **Done**.

## Rules
- Never close an incident without a passing synthetic run on production.
- Never print secrets (`CHAOS_TOKEN`, Vercel/Jira tokens).
- Don't disable or delete the synthetic monitor or the Chaos API to "fix" an incident.
