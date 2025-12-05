# TaskFlow AI Copilot Instructions

## Overview

This file enables AI coding assistants to generate features aligned with the TaskFlow project's architecture and style. These instructions are based on actual, observed patterns from the codebase — not invented practices.

TaskFlow is a **task management and project collaboration platform** built with Next.js 15, React 19, TypeScript, and Prisma. It follows a **server-first, type-safe, accessibility-focused** architecture with session-based authentication and optimistic UI updates.

## File Category Reference

### next-pages
**Purpose**: Next.js App Router pages that define application routes
**Examples**: `./app/(dashboard)/page.tsx`, `./app/login/page.tsx`
**Key Conventions**:
- Use route groups `(dashboard)` for organization without affecting URLs
- Server components by default - use `"use client"` only when necessary
- Delegate interactivity to dedicated client components
- Server pages fetch data and pass to client components as props
- Authentication pages are minimal server components focused on form rendering

### server-actions
**Purpose**: Next.js server actions for data mutations and server-side logic
**Examples**: `./app/(dashboard)/tasks/actions.ts`, `./app/login/actions.ts`
**Key Conventions**:
- Must start with `"use server"` directive
- Every mutation action checks authentication via `getCurrentUser()`
- Extract FormData using specific field names with type casting
- Return structured responses: `{ error: string | null, success: boolean, message?: string }`
- Use `revalidatePath()` after successful mutations
- Create new PrismaClient instance at file top

### business-components
**Purpose**: Feature-specific components that handle business logic and user interactions
**Examples**: `./components/task-list.tsx`, `./components/kanban-board.tsx`
**Key Conventions**:
- Use `"use client"` for interactivity with React 19 hooks
- Integrate server actions via `useActionState` for forms
- Implement optimistic updates with `useOptimistic`
- Use `useTransition` for background server sync
- Import Poppins font for task titles and headings
- Include `data-testid` attributes for testing

### ui-components
**Purpose**: Reusable UI primitives built on Radix UI with shadcn/ui patterns
**Examples**: `./components/ui/button.tsx`, `./components/ui/card.tsx`
**Key Conventions**:
- Use `React.forwardRef` with Radix Slot pattern
- Implement variants with `class-variance-authority` (CVA)
- All interactive components use Radix primitives for accessibility
- Export both component and variant functions
- Support `asChild` prop when appropriate
- Use design tokens (CSS custom properties) for theming

### utility-functions
**Purpose**: Helper functions for common operations
**Examples**: `./lib/utils.ts`, `./lib/date-utils.ts`
**Key Conventions**:
- `cn()` function for conditional class names with filtering
- Date parsing uses local noon as default time
- Date formatting for HTML inputs uses YYYY-MM-DD format
- Google Fonts integration with specific subset configuration
- Type-safe utility functions with proper TypeScript typing

### type-definitions
**Purpose**: TypeScript type definitions extending Prisma types
**Examples**: `./lib/types.ts`
**Key Conventions**:
- Extend Prisma types for component use: `TaskWithProfile = PrismaTask & { assignee?: Pick<User, "name"> | null }`
- Define Kanban-specific types with union types for status columns
- Use `Prisma.ModelGetPayload` for complex relationship types
- Import from generated Prisma client: `@/app/generated/prisma/client`

### unit-tests & e2e-tests
**Purpose**: Jest unit tests and Playwright end-to-end tests
**Key Conventions**:
- Use React Testing Library with accessibility-focused queries (`getByRole`)
- Mock server actions and Prisma client consistently
- E2E tests use `data-testid` selectors and seeded user credentials
- Generate unique emails for signup tests: `e2e-${Date.now()}@example.com`
- Use `Promise.all` for navigation and form submission

## Feature Scaffold Guide

### Planning a New Feature
1. **Determine file types needed** based on feature scope:
   - **Data mutations**: Create server action in appropriate `actions.ts`
   - **UI interactions**: Create business component with client-side logic
   - **Reusable UI**: Create ui-component if new primitive needed
   - **New routes**: Add page in app directory with proper route group

2. **File placement conventions**:
   - Pages: `./app/(dashboard)/[feature]/page.tsx` for protected routes
   - Server actions: `./app/(dashboard)/[feature]/actions.ts`
   - Business components: `./components/[feature-name].tsx`
   - UI components: `./components/ui/[component-name].tsx`
   - Types: Add to `./lib/types.ts`
   - Tests: `./tests/unit/[component].test.tsx` and `./tests/e2e/[feature].spec.ts`

### Example Feature Implementation
For a **searchable task filter** feature, create:

```typescript
// 1. Server action for filtered queries
// ./app/(dashboard)/tasks/actions.ts
export async function searchTasks(query: string, filters: TaskFilters) {
    const user = await getCurrentUser();
    if (!user) return { tasks: [], error: "Not authenticated" };
    
    const tasks = await prisma.task.findMany({
        where: {
            AND: [
                { OR: [
                    { name: { contains: query } },
                    { description: { contains: query } }
                ]},
                filters.status && { status: filters.status },
                filters.priority && { priority: filters.priority }
            ].filter(Boolean)
        },
        include: {
            assignee: { select: { id: true, name: true, email: true } },
            creator: { select: { id: true, name: true, email: true } }
        }
    });
    
    return { tasks, error: null };
}

// 2. Client component with search state
// ./components/task-search-filter.tsx
"use client"
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function TaskSearchFilter({ onResults }: { onResults: (tasks: Task[]) => void }) {
    const [query, setQuery] = useState("");
    const [isPending, startTransition] = useTransition();
    
    const handleSearch = async () => {
        startTransition(async () => {
            const { tasks } = await searchTasks(query, filters);
            onResults(tasks);
        });
    };
    
    return (
        <div className="flex gap-4">
            <Input 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tasks..."
                className="flex-1"
            />
            {/* Filter selects */}
        </div>
    );
}

// 3. Integration in page
// ./app/(dashboard)/tasks/page.tsx  
import { TaskSearchFilter } from "@/components/task-search-filter";

export default async function TasksPage() {
    const { tasks } = await getAllTasks();
    return <TasksPageClient initialTasks={tasks} />;
}

// 4. Tests
// ./tests/unit/task-search-filter.test.tsx
test('renders search input and filters', () => {
    render(<TaskSearchFilter onResults={mockFn} />);
    expect(screen.getByPlaceholderText(/search tasks/i)).toBeInTheDocument();
});
```

## Integration Rules

### UI Domain Constraints
- All interactive components **must use Radix UI primitives** for accessibility
- Use `cn()` utility for conditional styling with Tailwind CSS
- Import Poppins font from `@/lib/fonts` for task headings
- Include `data-testid` attributes for testing stability

### Data Layer Constraints  
- All database operations **must use Prisma ORM** with type-safe queries
- Data mutations **must use Next.js server actions** with `"use server"`
- Authentication check **required**: `const user = await getCurrentUser(); if (!user) return { error: "Not authenticated" }`
- Call `revalidatePath()` after successful mutations

### State Management Constraints
- **No global state libraries** (Redux, Zustand) - use server state + local state
- Use `useOptimistic` for immediate UI feedback on mutations
- Use `useActionState` for form submission state management  
- Use `useTransition` for non-blocking background updates

### Authentication Constraints
- **Session-based auth** with database-stored tokens and bcryptjs password hashing
- Protected routes **must check auth in layout.tsx**: `const user = await getCurrentUser(); if (!user) redirect("/login")`
- Form validation with structured error responses

### Drag-and-Drop Constraints (Kanban features)
- **Must use @hello-pangea/dnd** with DragDropContext > Droppable > Draggable hierarchy
- Use string IDs for `draggableId`, convert to numbers for database operations
- Implement optimistic updates immediately, then sync with server via `useTransition`

### Charts Constraints (Dashboard features)
- **Must use Recharts** wrapped in `ResponsiveContainer` 
- Use predefined `COLORS` array for consistent theming
- Transform data client-side: `{ name: string, value: number }` format
- Configure clean tooltips: `cursor={{ fill: "transparent" }}`

### Testing Constraints
- Unit tests use Jest + Testing Library with accessibility queries (`getByRole`)
- E2E tests use Playwright with `data-testid` selectors
- Mock Prisma client and server actions consistently
- Use seeded credentials: `alice@example.com` / `password123`

## Example Prompt Usage

**User Request**: "Create a task priority filter dropdown that updates the task list"

**AI Response**: Following TaskFlow conventions, I'll create:

```typescript
// 1. Update server action (app/(dashboard)/tasks/actions.ts)
export async function getTasksByPriority(priority: string) {
    const user = await getCurrentUser();
    if (!user) return { tasks: [], error: "Not authenticated" };
    
    const tasks = await prisma.task.findMany({
        where: { priority },
        include: {
            assignee: { select: { id: true, name: true, email: true } },
            creator: { select: { id: true, name: true, email: true } }
        }
    });
    
    return { tasks, error: null };
}

// 2. Create filter component (components/priority-filter.tsx)
"use client"
import { useState, useTransition } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PriorityFilterProps {
    onFilter: (tasks: Task[]) => void;
}

export function PriorityFilter({ onFilter }: PriorityFilterProps) {
    const [isPending, startTransition] = useTransition();
    
    const handlePriorityChange = (priority: string) => {
        startTransition(async () => {
            const { tasks } = await getTasksByPriority(priority);
            onFilter(tasks);
        });
    };
    
    return (
        <Select onValueChange={handlePriorityChange}>
            <SelectTrigger className="w-40" data-testid="priority-filter">
                <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="low">Low Priority</SelectItem>
            </SelectContent>
        </Select>
    );
}

// 3. Add to tasks page client component (components/tasks-page-client.tsx)
// Import and integrate PriorityFilter with existing task list

// 4. Add test (tests/unit/priority-filter.test.tsx)
test('renders priority filter dropdown', () => {
    render(<PriorityFilter onFilter={mockFn} />);
    expect(screen.getByTestId('priority-filter')).toBeInTheDocument();
});
```

This implementation follows TaskFlow's server-first architecture, uses established UI patterns, implements proper authentication checks, and includes testing conventions.

---

**Note**: This instruction file is generated from actual codebase analysis. All patterns, conventions, and constraints are based on observed implementations in the TaskFlow repository, ensuring consistency with existing architectural decisions.