# Domain Deep Dive

- Core Entities: Users (via sessions), Tasks (status/assignee/board), Team/Board contexts.
- Key Features:
  - Authentication: Login/Signup via server actions, bcrypt password handling, session creation.
  - Task Management: Create/Edit/List tasks; Kanban board with drag-and-drop; task overview and charts.
  - Team Views: Team stats and dashboards.
- Workflows:
  - Auth flow tested in `tests/e2e/auth.spec.ts`.
  - Kanban interactions in `tests/e2e/kanban.spec.ts`.
  - Task lifecycle in `tests/e2e/tasks.spec.ts` and unit tests for actions.
- Data Ops: Prisma CRUD in `app/**/actions.ts`; seeding/resetting via `prisma/seed.js` and `prisma/clear.js`.
