# Identify Architecture

- Paradigm: Next.js App Router with server-first patterns; server actions in route segments, client components for interactive UI.
- Layers:
  - UI Layer: React components in `components/` and `app/**/page.tsx`.
  - Domain/Data Layer: Prisma models and actions performing CRUD on tasks, sessions, teams.
  - Utilities: `lib/` provides typed helpers and date formatting.
- State Management: Minimal local state; server mutations via actions; drag-and-drop state in client.
- Routing: Nested layouts (`app/layout.tsx`, `(dashboard)/layout.tsx`), pages per feature.
- Styling: Tailwind v4 utility classes; UI primitives based on Radix.
- Testing Strategy: Unit tests for components and actions, E2E for flows (auth, kanban, tasks).
- Deployment: Dockerized; Next build/start; DB migration and seed scripts.
