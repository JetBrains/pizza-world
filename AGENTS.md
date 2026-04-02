# Agent Guidelines

## Project Overview

Pizza World is a fullstack app: Spring Boot 4 (Java 21, H2) backend + React 19 (Vite, TypeScript) frontend. The frontend is deployed to Vercel; the backend is not deployed. The frontend uses mock data fallback when the API is unavailable (see `frontend/src/api.ts`).

## Tech Stack

- **Backend:** Spring Boot 4, Java 21, Spring Data JPA, H2 in-memory database
- **Frontend:** React 19, TypeScript, Vite, plain CSS (no UI libraries)
- **Build:** Gradle (backend), npm (frontend)
- **Deploy:** Vercel (frontend only)

## How to Work on Tasks

### 1. Create a feature branch

```
git checkout -b feature/<short-name>
```

### 2. Backend changes (Spring Boot)

- Entities go in `src/main/java/com/jetbrains/pizzaworld/model/`
- Repositories in `src/main/java/com/jetbrains/pizzaworld/repository/`
- Controllers in `src/main/java/com/jetbrains/pizzaworld/controller/`
- DTOs in `src/main/java/com/jetbrains/pizzaworld/dto/`
- Seed data in `DataInitializer.java`
- Always add tests in `src/test/java/com/jetbrains/pizzaworld/`
- Run `./gradlew test` to verify

### 3. Frontend changes (React + TypeScript)

- Components in `frontend/src/components/`
- API calls in `frontend/src/api.ts`
- Types in `frontend/src/types.ts`
- Styles in `frontend/src/App.css`
- **Important:** When adding new API calls, always provide mock data fallback using `tryFetch()` so the feature works on Vercel without a live backend
- Run `cd frontend && npm run build` to verify

### 4. Code Style

- Frontend: minimal, clean UI inspired by [Studio Pallesh](https://www.studiopallesh.nl/) — lots of whitespace, serif headings (DM Serif Display), sans-serif body (Inter), neutral palette
- Backend: standard Spring Boot conventions, no Lombok
- Keep changes focused — one feature per branch
- Write tests for new endpoints

### 5. Push and Deploy

Push the feature branch to trigger a Vercel preview deployment:

```
git push -u origin feature/<short-name>
```

Vercel automatically creates a preview deployment for every branch push. The preview URL format is:
```
https://pizza-world-<hash>-<vercel-user>.vercel.app
```

### 6. Summary

**Always** include the following in your task summary:

- What was changed (backend + frontend)
- The branch name
- The Vercel preview URL (check Vercel dashboard or GitHub deployment status)

Example summary:
```
## Done

Added pizza ratings feature:
- Backend: `rating` field on Pizza entity, `GET /api/pizzas/top` endpoint, tests
- Frontend: star rating display in gallery items with mock fallback

Branch: `feature/pizza-ratings`
Preview: https://pizza-world-git-feature-pizza-ratings-<user>.vercel.app
```
