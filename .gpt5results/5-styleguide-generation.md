# Styleguide Generation

- Language: TypeScript everywhere; prefer explicit types for actions and components; leverage `lib/types.ts`.
- Components: Functional components; split server vs client ("use client" at top when needed); keep UI in `components/ui/*` and feature components in `components/*`.
- Styling: Tailwind classes; avoid inline styles; keep consistent spacing and typography via utilities.
- Accessibility: Use Radix primitives for dialogs, dropdowns, select, checkbox; provide labels with `@radix-ui/react-label`.
- Data Access: Use Prisma in server actions only; avoid Prisma in client components.
- Testing: Unit test components/actions with Jest; E2E flows with Playwright; colocate tests under `tests/` following existing patterns.
- Files & Routing: Use `layout.tsx` for shared UI; keep route actions in the route folder `app/segment/actions.ts`.
- Code Style: ESLint + Next config; run `npm run lint`; maintain consistent imports and avoid one-letter variables.
