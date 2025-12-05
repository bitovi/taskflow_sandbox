# TaskFlow - AI Copilot Instructions

## Overview

This file provides comprehensive guidance for AI coding assistants working on the TaskFlow project. All patterns, conventions, and constraints documented here are derived from actual codebase analysis, not invented best practices.

**Purpose**: Enable AI tools like GitHub Copilot to generate features that align with TaskFlow's existing architecture, design patterns, and coding style.

---

## Tech Stack Summary

- **Framework**: Next.js 15.4.6 with App Router
- **Language**: TypeScript (strict mode, ES2017 target)
- **UI**: React 19.1.0 + shadcn/ui + Radix UI + Tailwind CSS 4
- **Database**: Prisma 6.13.0 + SQLite
- **State**: Server-first with React hooks (no Redux/Zustand)
- **Auth**: Custom session-based with bcryptjs
- **Drag-and-Drop**: @hello-pangea/dnd
- **Charts**: recharts
- **Testing**: Jest + Playwright
- **Icons**: lucide-react
- **Fonts**: Next.js font optimization (Inter + Poppins)

---

## File Categories Reference

### UI Components (`components/ui/`)
**Purpose**: Reusable primitive components built on Radix UI with Tailwind styling.

**Examples**: `button.tsx`, `card.tsx`, `dialog.tsx`, `input.tsx`

**Conventions**:
- Use `class-variance-authority` (cva) for variants
- Support `asChild` prop via Radix Slot
- Forward refs with `React.forwardRef`
- Allow `className` override with `cn()` utility
- Export sub-components (e.g., `Card`, `CardHeader`, `CardContent`)

### Business Components (`components/`)
**Purpose**: Feature-specific components composed from UI primitives.

**Examples**: `kanban-board.tsx`, `task-list.tsx`, `create-task-form.tsx`, `sidebar.tsx`

**Conventions**:
- Mark as `"use client"` when needing interactivity
- Use `useOptimistic` + `useTransition` for optimistic updates
- Import Poppins font for headings: `${poppins.className}`
- Add `data-testid` attributes for E2E tests
- Fetch data with `useEffect` + Server Actions when needed client-side

### Route Pages (`app/`)
**Purpose**: File-based routing with Server Components by default.

**Examples**: `app/(dashboard)/tasks/page.tsx`, `app/login/page.tsx`

**Conventions**:
- Server Components by default (async/await data fetching)
- Use `export const revalidate = 0` for dynamic data
- Route groups: `(dashboard)` for authenticated routes
- Check auth in layouts, not individual pages
- Pass initial data to client components as props

### Server Actions (`actions.ts`)
**Purpose**: Server-side data mutations and queries.

**Examples**: `app/(dashboard)/tasks/actions.ts`, `app/login/actions.ts`

**Conventions**:
- Start with `"use server"` directive
- Accept `FormData` parameter
- Return `{ error: string | null, success?: boolean, data?: any }`
- Call `revalidatePath()` after mutations
- Use `safeUserSelect` for user data
- Validate auth with `getCurrentUser()`
- Parse dates with `parseDateString()` from `@/lib/date-utils`

### Utility Functions (`lib/`)
**Purpose**: Shared helpers and type definitions.

**Examples**: `utils.ts` (cn), `date-utils.ts`, `safe-user-select.ts`, `types.ts`

**Conventions**:
- `cn()` for className merging
- Date utilities to avoid timezone issues (parse at local noon)
- `safeUserSelect` to prevent password exposure
- Import Prisma types: `import type { Task } from "@/app/generated/prisma/client"`

### Database Schema (`prisma/schema.prisma`)
**Key Models**: User, Session, Task

**Conventions**:
- Generated client output: `../app/generated/prisma`
- Named relations for self-referential FKs: `@relation("CreatedTasks")`
- Optional fields with `?`: `assigneeId Int?`
- Timestamp fields: `createdAt`, `updatedAt`

---

## Feature Scaffold Guide

### To Add a New Task-Related Feature:

1. **Determine Required Files**:
   - Server Action in `app/(dashboard)/tasks/actions.ts` for data operations
   - Page in `app/(dashboard)/tasks/` if new route needed
   - Component in `components/` for UI logic
   - UI primitives from `components/ui/` for styling

2. **File Creation Pattern**:
   ```
   app/(dashboard)/tasks/
   ├── my-feature/
   │   └── page.tsx              # Server Component page
   └── actions.ts                # Add new actions here
   
   components/
   └── my-feature-component.tsx  # Client component if interactive
   ```

3. **Naming Conventions**:
   - Files: kebab-case (`my-feature.tsx`)
   - Components: PascalCase (`MyFeature`)
   - Actions: camelCase (`getMyFeatureData`)
   - Types: PascalCase (`MyFeatureData`)

4. **Implementation Steps**:
   - Write Server Action with validation and error handling
   - Create Server Component page that calls the action
   - Build Client Component if interactivity needed
   - Use UI primitives for consistent styling
   - Add `data-testid` for E2E testing
   - Write tests in `tests/unit/` and `tests/e2e/`

### Example: Adding a Task Search Feature

**Server Action** (`app/(dashboard)/tasks/actions.ts`):
```typescript
export async function searchTasks(query: string) {
    try {
        const tasks = await prisma.task.findMany({
            where: {
                OR: [
                    { name: { contains: query } },
                    { description: { contains: query } }
                ]
            },
            include: {
                assignee: { select: safeUserSelect },
                creator: { select: safeUserSelect },
            },
        });
        return { tasks, error: null };
    } catch (e) {
        return { tasks: [], error: "Search failed." };
    }
}
```

**Client Component** (`components/task-search.tsx`):
```tsx
"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { searchTasks } from "@/app/(dashboard)/tasks/actions"

export function TaskSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState([])

  const handleSearch = async (e) => {
    const value = e.target.value
    setQuery(value)
    const { tasks } = await searchTasks(value)
    setResults(tasks)
  }

  return (
    <div>
      <Input
        placeholder="Search tasks..."
        value={query}
        onChange={handleSearch}
      />
      {/* Render results */}
    </div>
  )
}
```

---

## Integration Rules

### Routing Domain
- **REQUIRED**: Use Next.js App Router file-based routing
- **REQUIRED**: Authenticate in `(dashboard)/layout.tsx`, not individual pages
- **CONSTRAINT**: No API routes; use Server Actions instead
- **CONSTRAINT**: Server Components by default; `"use client"` only when necessary

### Data Layer Domain
- **REQUIRED**: All database operations via Prisma
- **REQUIRED**: Use `safeUserSelect` when including user relations
- **REQUIRED**: Call `revalidatePath()` after mutations
- **CONSTRAINT**: No direct Prisma calls in client components
- **CONSTRAINT**: Server Actions receive FormData, not JSON

### UI Domain
- **REQUIRED**: Use shadcn/ui components from `components/ui/`
- **REQUIRED**: Style with Tailwind CSS utility classes
- **REQUIRED**: Use `cn()` utility for className merging
- **CONSTRAINT**: No inline styles
- **CONSTRAINT**: No custom implementations of standard UI primitives (Button, Dialog, etc.)

### State Management Domain
- **REQUIRED**: Server-first state management
- **REQUIRED**: Use `useOptimistic` for immediate UI feedback on mutations
- **REQUIRED**: Wrap async operations in `startTransition`
- **CONSTRAINT**: No global state libraries (Redux, Zustand)
- **CONSTRAINT**: Prefer Server Components for data fetching

### Authentication Domain
- **REQUIRED**: Use session-based auth with database-backed tokens
- **REQUIRED**: Hash passwords with bcryptjs (10 rounds)
- **REQUIRED**: Store sessions in httpOnly cookies
- **CONSTRAINT**: No JWT or OAuth
- **CONSTRAINT**: Never expose password field in queries

### Drag-and-Drop Domain
- **REQUIRED**: Use @hello-pangea/dnd for drag-and-drop
- **REQUIRED**: Optimistic UI updates before server sync
- **CONSTRAINT**: Drag-and-drop components must be client components
- **CONSTRAINT**: Always sync changes to server via Server Actions

### Charts/Visualization Domain
- **REQUIRED**: Use recharts for all charts
- **REQUIRED**: Wrap charts in `ResponsiveContainer`
- **CONSTRAINT**: Charts must be client components

### Testing Domain
- **REQUIRED**: Jest + React Testing Library for unit tests
- **REQUIRED**: Playwright for E2E tests
- **REQUIRED**: Use `data-testid` for E2E selectors
- **CONSTRAINT**: No mocking Server Actions in E2E tests

---

## Example Prompt Usage

### Prompt: "Add a filter to show only high priority tasks"

**AI Should Generate**:

1. **Server Action** (`app/(dashboard)/tasks/actions.ts`):
```typescript
export async function getTasksByPriority(priority: string) {
    try {
        const tasks = await prisma.task.findMany({
            where: { priority },
            include: {
                assignee: { select: safeUserSelect },
                creator: { select: safeUserSelect },
            },
            orderBy: { createdAt: "desc" },
        });
        return { tasks, error: null };
    } catch (e) {
        return { tasks: [], error: "Failed to fetch tasks." };
    }
}
```

2. **Client Component** (`components/task-priority-filter.tsx`):
```tsx
"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getTasksByPriority } from "@/app/(dashboard)/tasks/actions"

export function TaskPriorityFilter({ onFilterChange }) {
  const [priority, setPriority] = useState("")

  const handleChange = async (value) => {
    setPriority(value)
    const { tasks } = await getTasksByPriority(value)
    onFilterChange(tasks)
  }

  return (
    <Select value={priority} onValueChange={handleChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Filter by priority" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="low">Low</SelectItem>
        <SelectItem value="medium">Medium</SelectItem>
        <SelectItem value="high">High</SelectItem>
        <SelectItem value="urgent">Urgent</SelectItem>
      </SelectContent>
    </Select>
  )
}
```

3. **Integration** (in existing `components/task-list.tsx`):
```tsx
const [filteredTasks, setFilteredTasks] = useState(initialTasks)

<TaskPriorityFilter onFilterChange={setFilteredTasks} />
<TaskList tasks={filteredTasks} />
```

4. **E2E Test** (`tests/e2e/tasks.spec.ts`):
```typescript
test('filter tasks by priority', async ({ page }) => {
    await login(page);
    await page.goto('/tasks');
    
    await page.click('[data-testid="priority-filter"]');
    await page.click('text=High');
    
    const tasks = await page.locator('[data-testid^="task-card-"]').all();
    for (const task of tasks) {
        await expect(task.locator('text=High')).toBeVisible();
    }
});
```

---

## Quick Reference

### Common Imports
```typescript
// UI Components
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// React Hooks
import { useState, useTransition, useOptimistic } from "react"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"

// Next.js
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

// Prisma
import { PrismaClient } from "@/app/generated/prisma"
import type { Task, User } from "@/app/generated/prisma/client"

// Utilities
import { cn } from "@/lib/utils"
import { parseDateString, formatDateForInput } from "@/lib/date-utils"
import { safeUserSelect } from "@/lib/safe-user-select"
import { poppins } from "@/lib/fonts"

// Icons
import { Plus, Search, Edit, Trash2, Clock } from "lucide-react"
```

### NPM Scripts
```bash
npm run dev          # Start development server
npm run build        # Production build
npm run test         # Run unit tests
npm run test:e2e     # Run E2E tests
npm run db:setup     # Initialize database
npm run db:reset     # Clear and reseed database
```

---

## Constraints Summary

**Do NOT**:
- Create API routes in `app/api/` (use Server Actions)
- Use inline styles (use Tailwind classes)
- Create custom UI primitives (use shadcn/ui)
- Use global state libraries (Redux, Zustand, etc.)
- Expose password fields in queries
- Use JWT or OAuth (use session-based auth)
- Mock Server Actions in E2E tests
- Call Prisma directly from client components

**Always**:
- Use `"use server"` in Server Action files
- Call `revalidatePath()` after mutations
- Use `safeUserSelect` for user data
- Forward refs in UI components
- Use `data-testid` for E2E test selectors
- Hash passwords with bcryptjs
- Store sessions in httpOnly cookies
- Parse dates with `parseDateString()`
- Wrap charts in `ResponsiveContainer`
- Use `cn()` for className merging

---

This instruction file enables AI assistants to generate code that seamlessly integrates with TaskFlow's existing patterns and architecture.