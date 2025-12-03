# Categorize Files

- App Routes: `app/` with nested segments `(dashboard)`, `login`, `signup`, `team`, `tasks`, `board`; each has `page.tsx`, some have `layout.tsx`, `actions.ts`.
- Components: `components/` reusable UI and feature components (forms, lists, kanban, charts, sidebar, ui primitives).
- Lib: `lib/` utilities (`date-utils.ts`, `fonts.ts`, `types.ts`, `utils.ts`).
- Prisma: `prisma/` schema, seeds, clear, migrations; DB lifecycle scripts.
- Config: `eslint.config.mjs`, `jest.config.cjs`, `jest.setup.ts`, `next.config.ts`, `postcss.config.mjs`, `tsconfig*.json`, `playwright.config.ts`.
- Tests: `tests/` unit and e2e with setup/teardown.
- Public/Assets: `public/`.
- Root Docs: `README.md`, repo explanations.
- CI/Results: `test-results/`.
