**Summary**
- Scope: Compare three AI copilot instruction files: `claude-copilot-instructions.md`, `gpt5-copilot-instructions.md`, `rovodev-copilot-instructions.md`.
- Goal: Identify shared guidance, unique details, gaps, and produce harmonized takeaways.

**Common Ground**
- **Tech Stack**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Radix UI, lucide-react, Prisma ORM, Recharts; Jest + Playwright for testing; session-based auth with bcryptjs.
- **Server-First Pattern**: Server Actions in `app/**/actions.ts` with `"use server"`; use Prisma for DB; call `revalidatePath()` on mutations; FormData extraction; consistent action response `{ error, success, message? }`.
- **Routing/Layout**: App Router pages in `app/**/page.tsx`; protected routes under `(dashboard)`; auth check via layout redirect to `/login` when unauthenticated.
- **UI/Components**: Use shadcn/ui based on Radix, `React.forwardRef`, CVA variants, `cn()` utility; client components only when needed; Poppins for headings.
- **State & Interactivity**: `useOptimistic`, `useTransition`, `useActionState`; server components fetch and pass data to client components.
- **Testing**: Jest + RTL unit tests, Playwright E2E, `data-testid` attributes; seeded data for E2E.
- **Kanban/Drag-and-Drop**: `@hello-pangea/dnd` with DnD hierarchy; optimistic UI then server sync; status columns fixed.
- **Charts**: Recharts wrapped in `ResponsiveContainer`; simple chart types; aggregate data before rendering.

**Key Differences**
- **Depth and Structure**:
  - `claude-copilot-instructions.md`: Most exhaustive. Includes File Categories, multiple Architectural Domains (UI, Routing, Data Layer, State, Forms, Auth, DnD, Charts, Testing, Design System), detailed examples (components, server actions, schema changes), and Integration Rules. Strong emphasis on conventions like fonts, layout wrappers, and type unions.
  - `rovodev-copilot-instructions.md`: Also comprehensive, but grouped with custom category names (next-pages, server-actions, business-components, ui-components, utility-functions, type-definitions, tests). Adds concrete constraints (e.g., Slot pattern, design tokens) and testing practices (accessibility queries, unique signup emails). Provides end-to-end feature scaffold example for search and priority filter.
  - `gpt5-copilot-instructions.md`: High-level summary. Focuses on stack, architecture, style, and build/run commands. Lacks detailed domain breakdowns, examples, and constraints found in the other two.

- **Operational Guidance**:
  - `gpt5`: Provides explicit build/run commands and Docker notes; helpful for setup and CI/CD contexts.
  - `claude` and `rovodev`: Provide more prescriptive coding conventions, patterns, and feature scaffolding with code samples; stronger implementation guardrails.

- **Design System Detail**:
  - `claude`: Dedicated Design System section and CVA guidance; strict “lucide-only icons”, “no CSS-in-JS”.
  - `rovodev`: Emphasizes Radix Slot, CVA, design tokens (CSS variables), and exporting variant functions; mentions `asChild` support.
  - `gpt5`: Mentions Radix and Tailwind but minimal specifics.

- **Types and Prisma Details**:
  - `claude`: Mentions importing Prisma types, intersection patterns, literal unions for status, custom Prisma client output path.
  - `rovodev`: Mentions `Prisma.ModelGetPayload` usage and complex relationship types; clarifies generated client import path; union types for Kanban statuses.
  - `gpt5`: General note on TypeScript and utilities; less on Prisma typing specifics.

- **Testing Practices**:
  - `rovodev`: Adds accessibility-first queries, unique email patterns for signup tests, and `Promise.all` navigation/submission guidance.
  - `claude`: Focuses on test domains and adding `data-testid`; global setup/teardown notes.
  - `gpt5`: Mentions Jest/Playwright, fewer specifics.

- **Examples and Scaffolds**:
  - `claude`: Multiple feature examples, including comments feature with schema updates and server actions; rich file placement guidance.
  - `rovodev`: Detailed feature scaffold (search and priority filter), integration rules per domain.
  - `gpt5`: No feature examples; concise overview only.

**Coverage Gaps Noted**
- `gpt5`: Missing detailed constraints (e.g., no other icon libraries, no CSS-in-JS, no global state libs), file category breakdowns, and domain-specific examples.
- `claude`: Minimal operational (dev/build/test) commands and Docker context compared to `gpt5`.
- `rovodev`: Strong coding conventions; lighter on environment setup commands and Docker guidance.

**Harmonized Recommendations**
- **Use claude + rovodev for implementation guardrails**: Follow their detailed domain rules, file placements, component patterns (Radix/shadcn, CVA, Slot, `asChild`, `cn()`), server-first approach, and testing practices.
- **Use gpt5 for environment operations**: Adopt its build/run tasks for local/dev/CI: `npm i`, `npm run db:setup`, `npm run dev`, `npm test`, `npm run test:e2e`, `npm run build && npm run start`, `npm run lint`; leverage Docker notes where applicable.
- **Types & Prisma**: Prefer `rovodev`’s `ModelGetPayload` patterns and `claude`’s union types and generated client import path consistency.
- **Design System**: Combine `claude`’s strict constraints with `rovodev`’s Radix Slot and design tokens guidance.
- **Testing**: Apply `rovodev` accessibility queries and unique email strategy; keep `data-testid` per `claude`; use seeded credentials noted by `rovodev`.

**Actionable Checklist for Contributors**
- Pages as server components; client only for interactivity.
- Server Actions with `"use server"`, auth via `getCurrentUser()`, FormData extraction, `revalidatePath()` on success, structured response shape.
- UI via shadcn/Radix with `forwardRef`, CVA, Slot/`asChild`; Tailwind + `cn()`; Poppins for headings.
- State with `useOptimistic`, `useTransition`, `useActionState`; no global state libs.
- DnD via `@hello-pangea/dnd`; optimistic update then server sync.
- Charts via Recharts with `ResponsiveContainer`; aggregate data first.
- Types: extend Prisma types; use unions for statuses; consider `ModelGetPayload` for complex includes.
- Tests: Jest + RTL (accessibility queries), Playwright E2E with `data-testid`; use seeded creds; unique signup emails in E2E.
- Ops: Use `gpt5` run commands; apply Docker files as needed.
