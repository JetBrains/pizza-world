# Junie Guidelines — Pizza World

## Project

Fullstack app: Spring Boot 4 (Java 21, H2) + React 19 (Vite, TypeScript).  
Frontend deployed to Vercel. Backend is not deployed — frontend uses mock data fallback.

## Task workflow

1. Create a feature branch from `main`:
   ```
   git checkout main && git pull
   git checkout -b feature/<short-name>
   ```

2. Implement changes in backend and/or frontend (see AGENTS.md for file locations).

3. Run checks:
   ```
   ./gradlew test
   cd frontend && npm run build
   ```

4. Commit and push the branch:
   ```
   git add -A
   git commit -m "<description>"
   git push -u origin feature/<short-name>
   ```

5. **Deploy to Vercel and get the preview URL** — use the Vercel CLI:
   ```
   cd frontend
   vercel --yes 2>&1 | grep -oE 'https://[^ ]+\.vercel\.app' | tail -1
   ```
   This deploys a preview and prints the URL. Use this URL in the summary.

## Summary format

**Always** end your task summary with a clickable Vercel preview link. Use this exact format:

```
## Done

<What was changed — bullet points for backend and frontend>

**Branch:** `feature/<short-name>`
**Preview:** <actual URL from `vercel` CLI output>
```

The preview URL **must** come from the `vercel` CLI output. Do not guess or construct the URL manually. It must be a full clickable link, not inside a code block.

## Important rules

- **Mock data fallback:** Every new API call in `frontend/src/api.ts` must use `tryFetch()` with a fallback value so the feature works on Vercel without a running backend.
- **One feature per branch.** Don't mix unrelated changes.
- **Tests required** for every new backend endpoint.
- **No Lombok.** Standard Java getters/setters.
- **UI style:** Minimal, lots of whitespace. Serif headings (DM Serif Display), sans-serif body (Inter). See current `App.css` for reference.
- **English only** in code, comments, and UI text. Prices in USD ($).
