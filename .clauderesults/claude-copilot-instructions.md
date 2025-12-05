# TaskFlow Copilot Instructions

## Overview

This document serves as a comprehensive guide for AI coding assistants (GitHub Copilot, Claude, etc.) to generate code that aligns with the TaskFlow project's architecture, conventions, and style. 

**Purpose:**
- Enable AI assistants to create features that match existing patterns
- Provide architectural context and constraints
- Document unique conventions specific to this codebase
- Ensure consistency across AI-generated and human-written code

**Methodology:**
This file is generated from systematic analysis of the actual codebase:
- Technology stack identification
- File categorization and pattern extraction
- Architectural domain analysis
- Style guide generation from observed conventions

**All patterns and examples are derived from the existing codebase, not theoretical best practices.**

---

## Project Summary

**TaskFlow** is a modern task management application for team collaboration, featuring:
- Task CRUD operations with assignment and prioritization
- Kanban board with drag-and-drop
- Dashboard with analytics and charts
- Team member management
- Session-based authentication

**Tech Stack:**
- Next.js 15 (App Router) + React 19
- TypeScript (strict mode)
- Prisma ORM + SQLite
- Tailwind CSS v4 + shadcn/ui
- Recharts for data visualization
- @hello-pangea/dnd for drag-and-drop
- Jest + Playwright for testing

---

## File Categories Reference

### Route Pages (`./app/**/*.tsx`)

**What it is:** Page components that map to URLs in the Next.js App Router.

**Representative examples:**
- `./app/(dashboard)/page.tsx` - Dashboard home
- `./app/(dashboard)/tasks/page.tsx` - Tasks list view
- `./app/login/page.tsx` - Login page

**Key conventions:**
- Server Components by default (no `"use client"` unless needed)
- Fetch data directly with async/await
- Use `export const revalidate = 0` to opt out of caching
- Apply Poppins font to page headings: `className={`text-3xl font-bold ${poppins.className}`}`
- Layout structure: `<div className="flex-1 space-y-4 p-4 md:p-8 pt-6">`

### Layout Components (`./app/**/layout.tsx`)

**What it is:** Shared layouts that wrap page components.

**Representative examples:**
- `./app/layout.tsx` - Root layout with Inter font
- `./app/(dashboard)/layout.tsx` - Dashboard layout with auth + sidebar

**Key conventions:**
- Server Components with async auth checks
- Dashboard layout redirects unauthenticated users: `if (!user) redirect("/login")`
- Two-tier system: root layout (HTML structure) + dashboard layout (auth + sidebar)

### Server Actions (`./app/**/actions.ts`)

**What it is:** Server-side functions for mutations and data fetching.

**Representative examples:**
- `./app/(dashboard)/tasks/actions.ts` - Task CRUD operations
- `./app/login/actions.ts` - Authentication actions

**Key conventions:**
- Always start with `"use server"` directive
- Extract data from FormData: `formData.get("fieldName") as string`
- Check authentication: `const user = await getCurrentUser()`
- Use Prisma for all database operations
- Call `revalidatePath()` after mutations
- Return consistent shape: `{ error: string | null, success: boolean, message?: string }`

### React Components (`./components/*.tsx`)

**What it is:** Feature-rich components with interactivity and state management.

**Representative examples:**
- `./components/task-list.tsx` - Task list with optimistic updates
- `./components/kanban-board.tsx` - Drag-and-drop board
- `./components/sidebar.tsx` - Navigation sidebar

**Key conventions:**
- Client Components with `"use client"` directive
- Use `useOptimistic` for instant UI feedback (deletes, status changes)
- Use `useTransition` with `startTransition` for Server Action calls
- Add `data-testid` attributes for E2E tests
- Apply Poppins font to component headings

### UI Components (`./components/ui/*.tsx`)

**What it is:** Reusable shadcn/ui components built on Radix UI primitives.

**Representative examples:**
- `./components/ui/button.tsx` - Button with variants
- `./components/ui/card.tsx` - Card container
- `./components/ui/avatar.tsx` - Avatar with custom AvatarName

**Key conventions:**
- Use `React.forwardRef` for all UI components
- Define variants with `class-variance-authority` (cva)
- Extend Radix UI primitives
- Use `cn()` utility for className merging
- Export interfaces for component props with `VariantProps<typeof componentVariants>`

### Form Components (`./components/*-form.tsx`)

**What it is:** Forms that submit to Server Actions.

**Representative examples:**
- `./components/create-task-form.tsx` - Task creation form
- `./components/edit-task-form.tsx` - Task editing form

**Key conventions:**
- Use `useActionState` to manage form state
- Create wrapper function matching `(prevState, formData) => Promise<ActionState>` signature
- Separate SubmitButton component with `useFormStatus` hook
- Use controlled inputs with local state for better UX
- Show error/success messages from Server Action response

### Data Visualization Components (`./components/*-charts.tsx`, `./components/*-stats.tsx`)

**What it is:** Components that display charts, graphs, and statistics.

**Representative examples:**
- `./components/dashboard-charts.tsx` - Bar chart for task metrics
- `./components/task-overview.tsx` - Recent tasks list
- `./components/team-stats.tsx` - Team statistics cards

**Key conventions:**
- Use Recharts library for all charts
- Wrap charts in `ResponsiveContainer` for responsive sizing
- Custom colors: `#F5532C` (primary), `#00848B` (secondary)
- Aggregate data before rendering (server-side or client-side)

### Utility Functions (`./lib/*.ts`)

**What it is:** Shared utility functions.

**Representative examples:**
- `./lib/utils.ts` - cn() utility for className merging
- `./lib/date-utils.ts` - Date parsing and formatting

**Key conventions:**
- Use custom `cn()` implementation (not classnames/clsx)
- Date utilities always use local noon (12:00) to avoid timezone issues
- Include JSDoc comments
- Export individual functions, not default exports

### Type Definitions (`./lib/types.ts`)

**What it is:** Shared TypeScript type definitions.

**Key conventions:**
- Import base types from Prisma: `import type { Task, User } from "@/app/generated/prisma/client"`
- Extend Prisma types with intersection: `TaskWithProfile = Task & { assignee?: Pick<User, "name"> | null }`
- Use `type` keyword, not `interface`
- Define literal unions for fixed values: `"todo" | "in_progress" | "review" | "done"`

### Database Schema (`./prisma/schema.prisma`)

**What it is:** Prisma schema defining database models.

**Key conventions:**
- Custom Prisma Client output: `output = "../app/generated/prisma"`
- Named relations: `@relation("CreatedTasks")`, `@relation("AssignedTasks")`
- Use `@default(autoincrement())` for ID fields
- Use `@default(now())` for timestamp fields
- Use `@updatedAt` for automatic update timestamps

---

## Architectural Domains

### UI Domain

**Required Patterns:**
- All UI components use shadcn/ui primitives built on Radix UI
- Interactive components require `"use client"` directive
- Tailwind CSS for all styling, use `cn()` for conditional classes
- Lucide React for icons
- Poppins font for headings, Inter for body text

**Constraints:**
- Must use existing shadcn/ui components, no other UI libraries
- Server Components by default, client only when needed
- No CSS modules, styled-components, or inline styles
- Icons only from lucide-react

**Example - Creating a new interactive component:**
```tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"
import { poppins } from "@/lib/fonts"
import { cn } from "@/lib/utils"

export function MyComponent() {
  const [isActive, setIsActive] = useState(false)

  return (
    <Card className={cn("p-6", isActive && "border-primary")}>
      <CardHeader>
        <CardTitle className={`${poppins.className}`}>Title</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={() => setIsActive(!isActive)}>
          <Plus className="mr-2 h-4 w-4" />
          Toggle
        </Button>
      </CardContent>
    </Card>
  )
}
```

### Routing Domain

**Required Patterns:**
- Next.js 15 App Router with file-based routing
- Protected routes use `(dashboard)` route group
- Link component for navigation, useRouter for programmatic navigation
- Server Components by default

**Constraints:**
- No Pages Router patterns
- Dashboard routes must be in `(dashboard)` group
- Use Next.js Link, not `<a>` tags
- Keep pages as Server Components when possible

**Example - Creating a new protected page:**
```tsx
// app/(dashboard)/my-feature/page.tsx
import { Button } from "@/components/ui/button"
import { poppins } from "@/lib/fonts"
import Link from "next/link"
import { getMyData } from "./actions"

export const revalidate = 0

export default async function MyFeaturePage() {
  const data = await getMyData()

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-3xl font-bold tracking-tight ${poppins.className}`}>
          My Feature
        </h2>
        <Link href="/my-feature/new">
          <Button>Add New</Button>
        </Link>
      </div>
      {/* Render data */}
    </div>
  )
}
```

### Data Layer Domain

**Required Patterns:**
- All database operations use Prisma Client from `@/app/generated/prisma`
- Data mutations via Server Actions with `"use server"`
- FormData API for form submissions
- Call `revalidatePath()` after mutations
- Session-based authentication

**Constraints:**
- Database access only through Prisma, no raw SQL
- Mutations must use Server Actions, avoid API routes
- Native FormData, no React Hook Form or Formik
- Always revalidate paths after mutations
- Custom session authentication, no NextAuth/Auth0

**Example - Creating a Server Action:**
```typescript
"use server"

import { getCurrentUser } from "@/app/login/actions"
import { PrismaClient } from "@/app/generated/prisma"
import { revalidatePath } from "next/cache"

const prisma = new PrismaClient()

export async function createItem(formData: FormData) {
  const name = formData.get("name") as string
  const description = formData.get("description") as string

  // Check authentication
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Not authenticated.", success: false }
  }

  // Validate input
  if (!name) {
    return { error: "Name is required.", success: false }
  }

  try {
    await prisma.item.create({
      data: {
        name,
        description,
        creatorId: user.id,
      },
    })
    revalidatePath("/items")
    return { error: null, success: true, message: "Item created!" }
  } catch (e) {
    return { error: "Failed to create item.", success: false }
  }
}
```

### State Management Domain

**Required Patterns:**
- `useState` for component-local state
- `useOptimistic` for immediate UI feedback
- `useTransition` for loading states
- Server Components fetch data, pass to Client Components
- No global state libraries

**Constraints:**
- Keep state colocated with components
- Use `useOptimistic` for instant mutations
- Wrap Server Actions in `startTransition()`
- No Redux, Zustand, or Context API for global state

**Example - Optimistic update:**
```tsx
"use client"

import { useOptimistic, useTransition } from "react"
import { deleteItem } from "./actions"

export function ItemList({ initialItems }) {
  const [optimisticItems, setOptimisticItems] = useOptimistic(
    initialItems,
    (state, { action, id }) => {
      if (action === "delete") {
        return state.filter((item) => item.id !== id)
      }
      return state
    }
  )
  const [isPending, startTransition] = useTransition()

  const handleDelete = async (id: number) => {
    startTransition(async () => {
      setOptimisticItems({ action: "delete", id })
      await deleteItem(id)
    })
  }

  return (
    <div>
      {optimisticItems.map((item) => (
        <div key={item.id}>
          {item.name}
          <button onClick={() => handleDelete(item.id)}>Delete</button>
        </div>
      ))}
    </div>
  )
}
```

### Forms Domain

**Required Patterns:**
- Form actions use Server Actions
- `useActionState` manages form state
- `useFormStatus` in submit buttons for pending state
- Server-side validation with FormData
- Consistent error response: `{ error, success, message }`

**Constraints:**
- Forms submit to Server Actions, not API routes
- Use `useActionState` (React 19), not manual state
- Submit buttons must use `useFormStatus`
- No client-side validation libraries

**Example - Form with Server Action:**
```tsx
"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createItem } from "./actions"

type ActionState = {
  error: string | null
  success: boolean
  message?: string
}

const initialState: ActionState = {
  error: null,
  success: false,
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Creating..." : "Create Item"}
    </Button>
  )
}

export function CreateItemForm({ onFinish }: { onFinish?: () => void }) {
  const createItemAction = async (prevState: ActionState, formData: FormData) => {
    return createItem(formData)
  }

  const [state, formAction] = useActionState(createItemAction, initialState)

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required />
      </div>

      {state.error && (
        <div className="text-red-500 text-sm">{state.error}</div>
      )}
      
      {state.success && state.message && (
        <div className="text-green-500 text-sm">{state.message}</div>
      )}

      <SubmitButton />
    </form>
  )
}
```

### Authentication Domain

**Required Patterns:**
- Session tokens (random hex) stored in database
- httpOnly cookies for session storage
- bcryptjs for password hashing (10 rounds)
- `getCurrentUser()` Server Action for auth checks
- Dashboard layout redirects unauthenticated users

**Constraints:**
- Session-based only, no JWT without refactoring
- httpOnly cookies, no localStorage/sessionStorage
- Use bcryptjs, don't change hashing library
- Always use `getCurrentUser()` for auth checks
- Protected routes in `(dashboard)` group

### Drag-and-Drop Domain

**Required Patterns:**
- `@hello-pangea/dnd` library
- DragDropContext → Droppable → Draggable hierarchy
- Optimistic UI updates before Server Action
- Status update via Server Action

**Constraints:**
- Use `@hello-pangea/dnd`, no dnd-kit or other libraries
- Fixed column structure matching task statuses
- Always update UI optimistically
- Column IDs must match status values exactly

### Data Visualization Domain

**Required Patterns:**
- Recharts for all charts
- Bar charts, pie charts for dashboard
- ResponsiveContainer for responsive sizing
- Data aggregated before rendering

**Constraints:**
- Use Recharts only, no D3.js, Chart.js
- Stick to simple chart types
- Always wrap in ResponsiveContainer
- Aggregate data before passing to charts

### Testing Domain

**Required Patterns:**
- Jest + React Testing Library for unit tests
- Playwright for E2E tests
- `data-testid` attributes for test selectors
- Global setup/teardown for E2E tests

**Constraints:**
- Unit tests use Jest/RTL only
- E2E tests use Playwright only
- Add `data-testid` to interactive elements
- E2E tests rely on seeded data

### Design System Domain

**Required Patterns:**
- shadcn/ui component library
- Radix UI primitives for accessibility
- Tailwind design tokens
- `class-variance-authority` for variants
- `cn()` utility for conditional classes

**Constraints:**
- New UI components follow shadcn/ui patterns
- Place in `components/ui/`
- Maintain Radix UI foundation
- Design tokens in Tailwind config
- Use `cn()`, not classnames/clsx

---

## Feature Scaffold Guide

### How to Plan a New Feature

**Step 1: Determine Required File Categories**

Ask yourself:
- Does it need a new page? → Create route page in `app/(dashboard)/`
- Does it need data operations? → Create server actions file
- Does it need interactive UI? → Create React components in `components/`
- Does it need reusable UI primitives? → Use existing `components/ui/` or add new ones
- Does it need database changes? → Update `prisma/schema.prisma`
- Does it need custom types? → Add to `lib/types.ts`
- Does it need tests? → Add unit tests (`tests/unit/`) and E2E tests (`tests/e2e/`)

**Step 2: Determine File Placement**

**Pages:**
- Public pages → `app/[feature]/page.tsx`
- Protected pages → `app/(dashboard)/[feature]/page.tsx`
- Sub-pages → `app/(dashboard)/[feature]/[subpage]/page.tsx`

**Server Actions:**
- Co-locate with feature → `app/(dashboard)/[feature]/actions.ts`

**Components:**
- Feature-specific → `components/[feature]-*.tsx`
- Reusable UI primitives → `components/ui/[primitive].tsx`

**Types:**
- Feature-specific → `lib/types.ts` (add to existing file)

**Tests:**
- Unit tests → `tests/unit/[feature].test.tsx`
- E2E tests → `tests/e2e/[feature].spec.ts`

**Step 3: Follow Naming Conventions**

- Pages: `page.tsx` (fixed name for Next.js)
- Server actions: `actions.ts` (fixed name pattern)
- Components: `kebab-case.tsx` (e.g., `task-list.tsx`)
- UI components: `kebab-case.tsx` in `components/ui/`
- Types: `types.ts` (single file for project)
- Tests: `[name].test.tsx` or `[name].spec.ts`

**Step 4: Follow Structure Patterns**

**Page structure:**
```tsx
export default async function MyPage() {
  const data = await fetchData()  // Server Component data fetching
  
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-3xl font-bold ${poppins.className}`}>Title</h2>
        <Button>Action</Button>
      </div>
      {/* Content */}
    </div>
  )
}
```

**Server action structure:**
```typescript
"use server"

export async function myAction(formData: FormData) {
  // 1. Extract data
  // 2. Check auth
  // 3. Validate
  // 4. Database operation
  // 5. Revalidate path
  // 6. Return consistent response
}
```

**Component structure:**
```tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export function MyComponent() {
  const [state, setState] = useState()
  
  return <div>{/* Render */}</div>
}
```

---

## Integration Rules

These constraints ensure new features integrate properly with existing architecture:

### UI Integration Rules

1. **Use shadcn/ui components only** - Do not introduce Material-UI, Ant Design, or other UI libraries
2. **Tailwind CSS for styling** - No CSS modules, styled-components, or inline styles
3. **Lucide React for icons** - No Font Awesome, React Icons, or other icon libraries
4. **Poppins for headings** - Import from `lib/fonts.ts`, apply with `className={poppins.className}`
5. **cn() for conditional classes** - Import from `lib/utils.ts`

### Data Integration Rules

1. **Prisma for all database access** - No raw SQL, no other ORMs
2. **Server Actions for mutations** - No REST API routes unless absolutely necessary
3. **FormData for form submissions** - No React Hook Form, Formik, or other form libraries
4. **revalidatePath() after mutations** - Always call after create/update/delete operations
5. **Custom session authentication** - No NextAuth, Auth0, or JWT without major refactoring

### State Integration Rules

1. **No global state libraries** - No Redux, Zustand, or MobX
2. **useOptimistic for instant mutations** - Task deletes, status changes, etc.
3. **useTransition for loading states** - Wrap all Server Action calls
4. **Server Components for data fetching** - Avoid client-side data fetching when possible
5. **Local state with useState** - Keep state colocated with components

### Routing Integration Rules

1. **App Router only** - No Pages Router patterns
2. **Protected routes in (dashboard) group** - Inherit auth check and sidebar layout
3. **Link for navigation** - No `<a>` tags for internal navigation
4. **Server Components by default** - Only use client when necessary

### Testing Integration Rules

1. **Jest + RTL for unit tests** - No Vitest or other test frameworks
2. **Playwright for E2E tests** - No Cypress or Selenium
3. **data-testid for selectors** - Add to all interactive elements
4. **Mock Server Actions** - Use Jest mocks for Prisma and Server Actions

---

## Example Prompt Usage

### Example 1: Create a Searchable Dropdown

**User prompt:**
> "Create a searchable dropdown that lets users filter tasks by assignee"

**AI should generate:**

1. **Component file: `components/assignee-filter.tsx`**
```tsx
"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function AssigneeFilter({ 
  users, 
  onFilterChange 
}: { 
  users: { id: number; name: string }[]
  onFilterChange: (assigneeId: number | null) => void
}) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-2">
      <Label>Filter by Assignee</Label>
      <Input
        placeholder="Search users..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-2"
      />
      <Select onValueChange={(value) => onFilterChange(value ? Number(value) : null)}>
        <SelectTrigger>
          <SelectValue placeholder="All assignees" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All assignees</SelectItem>
          {filteredUsers.map((user) => (
            <SelectItem key={user.id} value={String(user.id)}>
              {user.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
```

2. **Update tasks page to include filter:**
```tsx
// app/(dashboard)/tasks/page.tsx
import { AssigneeFilter } from "@/components/assignee-filter"
import { getAllUsers } from "@/app/login/actions"

export default async function TasksPage() {
  const { tasks } = await getAllTasks()
  const users = await getAllUsers()

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <AssigneeFilter users={users} onFilterChange={(id) => {/* filter logic */}} />
      <TaskList initialTasks={tasks} />
    </div>
  )
}
```

3. **Unit test: `tests/unit/assignee-filter.test.tsx`**
```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AssigneeFilter } from '@/components/assignee-filter'

const mockUsers = [
  { id: 1, name: 'Alice Johnson' },
  { id: 2, name: 'Bob Smith' },
]

test('filters users by search term', async () => {
  const onFilterChange = jest.fn()
  render(<AssigneeFilter users={mockUsers} onFilterChange={onFilterChange} />)
  
  const searchInput = screen.getByPlaceholderText(/search users/i)
  await userEvent.type(searchInput, 'Alice')
  
  // Should only show Alice in filtered results
  expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
})
```

### Example 2: Add Priority Filter to Tasks

**User prompt:**
> "Add a priority filter to the tasks page with options for high, medium, and low"

**AI should generate:**

1. **Component: `components/priority-filter.tsx`**
```tsx
"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

export function PriorityFilter({ 
  onFilterChange 
}: { 
  onFilterChange: (priority: string | null) => void 
}) {
  return (
    <div className="space-y-2">
      <Label>Filter by Priority</Label>
      <Select onValueChange={(value) => onFilterChange(value || null)}>
        <SelectTrigger>
          <SelectValue placeholder="All priorities" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All priorities</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="low">Low</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
```

2. **Update tasks page:**
```tsx
// app/(dashboard)/tasks/page.tsx - Add filter controls
<div className="flex gap-4">
  <PriorityFilter onFilterChange={handlePriorityChange} />
  <AssigneeFilter users={users} onFilterChange={handleAssigneeChange} />
</div>
```

### Example 3: Add Task Comments Feature

**User prompt:**
> "Add a comments section to tasks where users can add comments"

**AI should generate:**

1. **Update schema: `prisma/schema.prisma`**
```prisma
model Comment {
  id        Int      @id @default(autoincrement())
  content   String
  taskId    Int
  task      Task     @relation(fields: [taskId], references: [id])
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())
}

model Task {
  // ... existing fields
  comments  Comment[]
}

model User {
  // ... existing fields
  comments  Comment[]
}
```

2. **Server actions: `app/(dashboard)/tasks/actions.ts`**
```typescript
"use server"

export async function createComment(taskId: number, formData: FormData) {
  const content = formData.get("content") as string
  
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated.", success: false }
  
  if (!content) return { error: "Comment is required.", success: false }
  
  try {
    await prisma.comment.create({
      data: {
        content,
        taskId,
        authorId: user.id,
      },
    })
    revalidatePath("/tasks")
    return { error: null, success: true }
  } catch (e) {
    return { error: "Failed to create comment.", success: false }
  }
}

export async function getTaskWithComments(taskId: number) {
  return prisma.task.findUnique({
    where: { id: taskId },
    include: {
      comments: {
        include: { author: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  })
}
```

3. **Component: `components/task-comments.tsx`**
```tsx
"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarName } from "@/components/ui/avatar"
import { createComment } from "@/app/(dashboard)/tasks/actions"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Adding..." : "Add Comment"}
    </Button>
  )
}

export function TaskComments({ 
  taskId, 
  initialComments 
}: { 
  taskId: number
  initialComments: Array<{
    id: number
    content: string
    author: { name: string }
    createdAt: Date
  }>
}) {
  const [state, formAction] = useActionState(
    async (prevState, formData) => createComment(taskId, formData),
    { error: null, success: false }
  )

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Comments</h3>
      
      {/* Existing comments */}
      <div className="space-y-3">
        {initialComments.map((comment) => (
          <div key={comment.id} className="flex space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarName name={comment.author.name} />
            </Avatar>
            <div className="flex-1">
              <div className="text-sm font-medium">{comment.author.name}</div>
              <div className="text-sm text-muted-foreground">{comment.content}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Add comment form */}
      <form action={formAction} className="space-y-2">
        <Textarea name="content" placeholder="Add a comment..." required />
        {state.error && <div className="text-red-500 text-sm">{state.error}</div>}
        <SubmitButton />
      </form>
    </div>
  )
}
```

4. **Update task detail view to show comments**
5. **Add E2E test: `tests/e2e/comments.spec.ts`**
6. **Add unit test: `tests/unit/task-comments.test.tsx`**

---

## Summary

This instruction file provides:

1. **Architecture Overview** - Tech stack, domains, and constraints
2. **File Category Reference** - What each file type is, where it goes, and its conventions
3. **Architectural Domains** - Detailed patterns for UI, routing, data, state, forms, auth, etc.
4. **Feature Scaffold Guide** - How to plan and structure new features
5. **Integration Rules** - Constraints to ensure consistency with existing code
6. **Example Prompts** - Real-world scenarios showing expected AI-generated code

**When generating code:**
- ✅ Use existing patterns and conventions from this file
- ✅ Follow architectural constraints strictly
- ✅ Match the style and structure of example code
- ✅ Place files in correct locations with correct names
- ✅ Include proper imports and type safety
- ✅ Add data-testid attributes for testing
- ✅ Apply Poppins font to headings
- ✅ Use Server Components unless interactivity needed
- ✅ Call revalidatePath() after mutations
- ✅ Return consistent error response shapes

**Avoid:**
- ❌ Introducing new libraries not in tech stack
- ❌ Using Pages Router patterns
- ❌ Creating API routes instead of Server Actions
- ❌ Using global state management libraries
- ❌ Using form libraries like React Hook Form
- ❌ Using CSS-in-JS or CSS modules
- ❌ Using icon libraries other than Lucide
- ❌ Storing sessions in localStorage or JWT

**This file represents actual, observed patterns from the codebase - not theoretical best practices. Follow these conventions to generate code that seamlessly integrates with the existing application.**
