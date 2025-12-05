# Business Components Style Guide

## Unique Patterns

### 1. Client Component Marking
Business components that need interactivity start with `"use client"`:

```tsx
"use client"

import { useState } from "react"

export function KanbanBoard({ initialData }) {
  const [columns, setColumns] = useState(initialData)
  // ...
}
```

### 2. Optimistic Update Pattern
Components performing mutations use `useOptimistic` and `useTransition`:

```tsx
"use client"

import { useOptimistic, useTransition } from "react"

export function TaskList({ initialTasks }) {
  const [optimisticTasks, setOptimisticTasks] = useOptimistic(
    initialTasks,
    (state, { action, task }) => {
      if (action === "delete") {
        return state.filter((t) => t.id !== task.id)
      }
      return state
    }
  )
  const [isPending, startTransition] = useTransition()

  const handleDelete = async (taskId: number) => {
    startTransition(async () => {
      setOptimisticTasks({ action: "delete", task: { id: taskId } })
      await deleteTask(taskId)
    })
  }
}
```

### 3. Font Integration Pattern
Headings and brand elements use Poppins font:

```tsx
import { poppins } from "@/lib/fonts"

<h2 className={`text-3xl font-bold ${poppins.className}`}>
  Tasks
</h2>
```

### 4. Sidebar Navigation Pattern
Active route detection uses `usePathname`:

```tsx
"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"

const pathname = usePathname()
const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

<Link
  href={item.href}
  className={cn(
    "flex items-center gap-3 rounded-lg px-3 py-2",
    isActive ? "bg-muted text-primary" : "text-muted-foreground"
  )}
>
```

### 5. Dialog State Management
Multiple dialogs/dropdowns use object state:

```tsx
const [openDialogs, setOpenDialogs] = useState<Record<number, boolean>>({})
const [openDropdowns, setOpenDropdowns] = useState<Record<number, boolean>>({})

<Dialog 
  open={openDialogs[task.id]} 
  onOpenChange={(open) => setOpenDialogs(prev => ({ ...prev, [task.id]: open }))}
>
```

### 6. Form with Server Actions
Forms use `useActionState` for submission handling:

```tsx
"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Creating..." : "Create Task"}
        </Button>
    )
}

export function CreateTaskForm() {
    const [state, formAction] = useActionState(createTaskAction, initialState)

    return (
        <form action={formAction}>
            {state.error && <p className="text-red-500">{state.error}</p>}
            <SubmitButton />
        </form>
    )
}
```

### 7. Data Fetching in Client Components
When needed, fetch data client-side with `useEffect`:

```tsx
const [users, setUsers] = useState<User[]>([])

useEffect(() => {
    getAllUsers().then(setUsers)
}, [])
```

### 8. Chart Component Pattern
Charts must be client components with responsive containers:

```tsx
"use client"

import { Bar, BarChart, ResponsiveContainer } from "recharts"

export function DashboardCharts({ data }: { data: TaskStats[] }) {
  return (
    <Card>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            {/* ... */}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
```

## Naming Conventions
- kebab-case file names: `kanban-board.tsx`, `create-task-form.tsx`
- Component names match filename: `KanbanBoard`, `CreateTaskForm`
- Located in `components/` directory (not `components/ui/`)

## Type Imports
Always import types from generated Prisma client:

```tsx
import type { Task as PrismaTask, User } from "@/app/generated/prisma/client"
```

## Common Patterns
- Use `data-testid` attributes for E2E testing:
  ```tsx
  <Card data-testid={`task-card-${task.id}`}>
  ```
- Conditional styling with `cn()`:
  ```tsx
  <div className={cn(
    "base-classes",
    snapshot.isDragging && "shadow-lg ring-2 ring-primary"
  )}>
  ```
