# Build Instructions

- Prereqs: Node 20+, npm; database accessible per Prisma config; Docker optional.
- Setup:
  - Install deps: `npm i`
  - Initialize DB: `npm run db:setup` (push schema, reset, seed)
- Development:
  - Start dev server: `npm run dev`
  - Run unit tests: `npm test`
  - Run E2E tests: `npm run test:e2e` (or `test:e2e:headed`)
- Production:
  - Build: `npm run build`
  - Start: `npm run start`
- Docker:
  - Use `Dockerfile` and `docker-compose.yml` to containerize; ensure Prisma migration/seed executed before starting.
- Lint:
  - `npm run lint`
