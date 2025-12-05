# Determine Tech Stack

- Framework: Next.js 15 (App Router)
- Language: TypeScript (TSConfig present), JSX/TSX
- UI: React 19, Radix UI primitives, Tailwind CSS v4
- State/UX: Server Actions, Client Components, DnD via @hello-pangea/dnd
- Charts: Recharts
- Icons: lucide-react
- Data: Prisma 6 with SQLite/PostgreSQL-compatible schema (via `schema.prisma`), `@prisma/client`
- Auth: Custom actions with bcryptjs, sessions table
- Testing: Jest + Testing Library (unit), Playwright (e2e)
- Tooling: ESLint 9 + eslint-config-next, PostCSS, Turbopack dev
- Containerization: Dockerfile + docker-compose.yml
