# Project Instructions

This document summarizes architecture, domain, style, and build instructions to guide AI assistants within this repository.

## Tech Stack
- Next.js 15 (App Router) with Turbopack dev
- React 19, TypeScript, Tailwind CSS v4
- Radix UI primitives, lucide-react icons, Recharts
- Prisma 6 for data layer; bcryptjs for auth
- Jest + Testing Library, Playwright for E2E
- Dockerized via Dockerfile and docker-compose

## Architecture
- Server-first: route-local server actions under `app/**/actions.ts`
- UI composition: `app/**/page.tsx` + components in `components/`
- Layouts: `app/layout.tsx`, `(dashboard)/layout.tsx`
- Data: Prisma-backed models; seeds and migrations in `prisma/`
- Utilities: `lib/` for date, types, fonts, helpers

## Domain Overview
- Auth: login/signup, sessions table
- Tasks: CRUD, Kanban board, charts, team stats
- Workflows covered by E2E tests: auth, kanban interactions, task lifecycle

## Style Guide
- TypeScript throughout; explicit types via `lib/types.ts`
- Server actions handle Prisma and business logic; client components manage interactivity
- Tailwind utility-first styling; prefer Radix components for accessibility
- Testing: unit in Jest, E2E in Playwright; follow existing test patterns
- Linting: ESLint + Next; keep imports tidy; avoid single-letter variables

## Build & Run
- Install: `npm i`
- DB setup: `npm run db:setup` (push schema, reset, seed)
- Dev: `npm run dev`
- Unit tests: `npm test`
- E2E: `npm run test:e2e`
- Build: `npm run build` then `npm run start`
- Lint: `npm run lint`
- Docker: build and run using provided files; ensure DB migrations/seeds are applied.
