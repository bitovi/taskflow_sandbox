# State Management Domain Implementation

## Overview

This application uses a minimal state management approach with React hooks and Server Components. There is no global state management library (Redux, Zustand, etc.). State is kept local to components and coordinated through Server Actions and optimistic updates.

## Key Technologies

- **React hooks** - useState, useEffect, useTransition, useOptimistic
- **Server Components** - Server-side data fetching
- **Server Actions** - Coordinated mutations
- **No global state library**

## State Patterns

### 1. Server Component Data Fetching

**From tasks/page.tsx:**
```tsx
export default async function TasksPage() {
  const { tasks, error } = await getAllTasks()
  
  if (error) {
    return <p>Error loading tasks</p>
  }

  return <TaskList initialTasks={tasks || []} />
}
```

**Pattern:**
- Server Component fetches data directly
- Passes data as props to Client Components
- No loading state needed (streaming/suspense)
- Fresh data on every request (revalidate = 0)

### 2. Local Component State

**From create-task-form.tsx:**
```tsx
"use client"

import { useState, useEffect } from "react"

export function CreateTaskForm({ onFinish }: { onFinish?: () => void }) {
  const [users, setUsers] = useState<Pick<User, "id" | "name">[]>([])

  useEffect(() => {
    getAllUsers().then(setUsers)
  }, [])

  return (
    <form action={formAction}>
      <Select>
        {users.map((user) => (
          <SelectItem key={user.id} value={String(user.id)}>
            {user.name}
          </SelectItem>
        ))}
      </Select>
    </form>
  )
}
```

**When to use useState:**
- Component-local UI state (open/closed, selected, etc.)
- Form input values
- Cached data that doesn't need to be shared
- Derived state calculations

### 3. Optimistic Updates with useOptimistic

**From task-list.tsx:**
```tsx
"use client"

import { useOptimistic, useTransition } from "react"

export function TaskList({ initialTasks }: { initialTasks: TaskWithProfile[] }) {
  const [optimisticTasks, setOptimisticTasks] = useOptimistic(
    initialTasks,
    (state, { action, task }: { action: "delete" | "toggle"; task: TaskWithProfile | { id: number } }) => {
      if (action === "delete") {
        return state.filter((t) => t.id !== task.id)
      }
      if (action === "toggle") {
        return state.map((t) => 
          t.id === task.id 
            ? { ...t, status: t.status === "done" ? "todo" : "done" } 
            : t
        )
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

  const handleToggle = async (task: TaskWithProfile) => {
    startTransition(async () => {
      setOptimisticTasks({ action: "toggle", task })
      await updateTaskStatus(task.id, task.status === "done" ? "todo" : "done")
    })
  }

  return (
    <div className="space-y-4">
      {optimisticTasks.map((task) => (
        <TaskCard 
          key={task.id} 
          task={task} 
          onDelete={handleDelete}
          onToggle={handleToggle}
        />
      ))}
    </div>
  )
}
```

**Key features:**
- `useOptimistic` creates a local optimistic state
- UI updates immediately before server action completes
- If server action fails, state reverts automatically
- Wrapped in `startTransition` for loading states

### 4. Loading States with useTransition

**From kanban-board.tsx:**
```tsx
"use client"

import { useState, useTransition } from "react"

export function KanbanBoard({ initialData }: { initialData: KanbanData }) {
  const [columns, setColumns] = useState(initialData)
  const [isPending, startTransition] = useTransition()

  const onDragEnd = (result: DropResult) => {
    // ... calculate new state

    // Optimistically update UI
    setColumns(newColumns)

    // Update database
    startTransition(async () => {
      await updateTaskStatus(Number.parseInt(draggableId), finishColId)
    })
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {/* Render columns */}
    </DragDropContext>
  )
}
```

**When to use useTransition:**
- Wrap async Server Action calls
- Show loading indicators via `isPending`
- Mark updates as non-blocking transitions
- Better perceived performance

### 5. Dialog and Dropdown State Management

**From task-list.tsx:**
```tsx
const [openDialogs, setOpenDialogs] = useState<Record<number, boolean>>({})
const [openDropdowns, setOpenDropdowns] = useState<Record<number, boolean>>({})

const handleCloseDialog = (taskId: number) => {
  setOpenDialogs(prev => ({ ...prev, [taskId]: false }))
}

const handleEditClick = (taskId: number) => {
  setOpenDropdowns(prev => ({ ...prev, [taskId]: false }))
  setOpenDialogs(prev => ({ ...prev, [taskId]: true }))
}

return (
  <>
    <Dialog 
      open={openDialogs[task.id]} 
      onOpenChange={(open) => setOpenDialogs(prev => ({ ...prev, [task.id]: open }))}
    >
      {/* Dialog content */}
    </Dialog>
    
    <DropdownMenu 
      open={openDropdowns[task.id]} 
      onOpenChange={(open) => setOpenDropdowns(prev => ({ ...prev, [task.id]: open }))}
    >
      {/* Dropdown content */}
    </DropdownMenu>
  </>
)
```

**Pattern:**
- Record/Map of IDs to boolean states
- Allows multiple modals/dropdowns simultaneously
- Controlled component pattern for full control

### 6. Dashboard Client-Side Aggregation

**From (dashboard)/page.tsx:**
```tsx
"use client"

import { useEffect, useState } from "react"

export default function IndexPage() {
  const [allTasks, setAllTasks] = useState<Task[]>([])

  useEffect(() => {
    getAllTasks().then(({ tasks }) => {
      setAllTasks(tasks)
    })
  }, [])

  // Derive data client-side from allTasks
  const totalTasks = allTasks.length
  const completedTasks = allTasks.filter((task) => task.status === "done").length
  const openTasks = allTasks.filter((task) => task.status === "in_progress").length
  
  // Group tasks by month
  const statsMap = new Map()
  for (const task of allTasks) {
    const createdMonth = task.createdAt.toISOString().slice(0, 7)
    if (!statsMap.has(createdMonth)) {
      statsMap.set(createdMonth, { month: createdMonth, total: 0, completed: 0 })
    }
    statsMap.get(createdMonth).total++
    if (task.status === "done") {
      statsMap.get(createdMonth).completed++
    }
  }
  const taskStats = Array.from(statsMap.values()).sort((a, b) => 
    a.month.localeCompare(b.month)
  )

  return (
    <>
      <StatsCards 
        totalTasks={totalTasks} 
        completedTasks={completedTasks} 
        openTasks={openTasks}
      />
      <DashboardCharts data={taskStats} />
    </>
  )
}
```

**Pattern:**
- Fetch data once in useEffect
- Derive all stats client-side
- No additional server requests for aggregations
- Single source of truth for dashboard

## State Coordination Patterns

### Parent-Child State Sharing

**Parent (page) fetches, child displays:**
```tsx
// page.tsx (Server Component)
export default async function TasksPage() {
  const tasks = await getAllTasks()
  return <TaskList initialTasks={tasks} />
}

// task-list.tsx (Client Component)
"use client"
export function TaskList({ initialTasks }) {
  const [tasks, setTasks] = useState(initialTasks)
  // Local state management
}
```

### Callback Props for Actions

```tsx
// Parent manages state
const [isOpen, setIsOpen] = useState(false)

<CreateTaskForm onFinish={() => setIsOpen(false)} />

// Child calls callback
export function CreateTaskForm({ onFinish }) {
  useEffect(() => {
    if (state.success && onFinish) {
      onFinish()
    }
  }, [state.success, onFinish])
}
```

### Server Actions as State Coordinators

```tsx
// Multiple components can call the same Server Action
// Server Action handles coordination and revalidation

// In component A
const handleCreate = async () => {
  await createTask(formData)
  // revalidatePath() in Server Action refreshes all pages
}

// In component B
const handleUpdate = async () => {
  await updateTask(id, formData)
  // Same revalidatePath() refreshes all pages
}
```

## State Anti-Patterns (Avoided)

### ❌ No Global State Library

```typescript
// ❌ Not used - Redux
const store = configureStore({ reducer: tasksReducer })

// ❌ Not used - Zustand
const useTaskStore = create((set) => ({ tasks: [], addTask: ... }))

// ✅ Used instead - Server Components + local state
export default async function Page() {
  const tasks = await getAllTasks()
  return <TaskList initialTasks={tasks} />
}
```

### ❌ No Complex State Machines

```typescript
// ❌ Not used - XState
const taskMachine = createMachine({ ... })

// ✅ Used instead - Simple useState
const [status, setStatus] = useState<"idle" | "loading" | "error">("idle")
```

### ❌ No Context API for Global State

```typescript
// ❌ Not used - Context for app-wide state
const TaskContext = createContext()

// ✅ Used instead - Server Components fetch at route level
export default async function TasksPage() {
  const tasks = await getAllTasks()
  return <TaskList initialTasks={tasks} />
}
```

## Best Practices

### 1. Fetch Data in Server Components

```tsx
// ✅ Good - Server Component
export default async function Page() {
  const data = await getData()
  return <ClientComponent initialData={data} />
}

// ❌ Bad - Fetching in Client Component
"use client"
export default function Page() {
  const [data, setData] = useState(null)
  useEffect(() => {
    fetchData().then(setData)
  }, [])
}
```

### 2. Use Optimistic Updates for Better UX

```tsx
// ✅ Good - Optimistic update
const [optimisticTasks, setOptimisticTasks] = useOptimistic(tasks, reducer)

const handleDelete = async (id) => {
  startTransition(async () => {
    setOptimisticTasks({ action: "delete", id })
    await deleteTask(id)
  })
}

// ❌ Bad - Wait for server
const handleDelete = async (id) => {
  setLoading(true)
  await deleteTask(id)
  await refreshTasks()
  setLoading(false)
}
```

### 3. Keep State Local

```tsx
// ✅ Good - State where it's used
export function EditDialog({ task }) {
  const [isOpen, setIsOpen] = useState(false)
  // Dialog manages its own open state
}

// ❌ Bad - State in parent when not needed
export function Parent() {
  const [dialogStates, setDialogStates] = useState({})
  return <EditDialog isOpen={dialogStates[task.id]} />
}
```

### 4. Derive State, Don't Store It

```tsx
// ✅ Good - Derive stats
const completedCount = tasks.filter(t => t.status === "done").length

// ❌ Bad - Store derived state
const [completedCount, setCompletedCount] = useState(0)
useEffect(() => {
  setCompletedCount(tasks.filter(t => t.status === "done").length)
}, [tasks])
```

### 5. Use Server Actions for Coordination

```tsx
// ✅ Good - Server Action coordinates
export async function deleteTask(id: number) {
  await prisma.task.delete({ where: { id } })
  revalidatePath("/tasks")  // All pages refresh
  return { success: true }
}

// ❌ Bad - Client coordinates manually
const handleDelete = async (id) => {
  await fetch(`/api/tasks/${id}`, { method: "DELETE" })
  router.refresh()  // Manual refresh
  onDeleteCallback()  // Manual notification
}
```

## Testing State

**From create-task-form.test.tsx:**
```typescript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

test('form manages local state', async () => {
  render(<CreateTaskForm />)
  
  const titleInput = screen.getByLabelText(/title/i)
  await userEvent.type(titleInput, 'New Task')
  
  expect(titleInput).toHaveValue('New Task')
})

test('optimistic update shows immediate feedback', async () => {
  render(<TaskList initialTasks={mockTasks} />)
  
  const deleteButton = screen.getByRole('button', { name: /delete/i })
  await userEvent.click(deleteButton)
  
  // Task should be removed from UI immediately
  expect(screen.queryByText('Task Name')).not.toBeInTheDocument()
})
```

## Summary

State management in this application follows these principles:

1. **Server Components for data fetching** - No client-side fetching when not needed
2. **Local state with useState** - Keep state colocated with components
3. **Optimistic updates with useOptimistic** - Instant UI feedback
4. **useTransition for loading states** - Non-blocking updates
5. **No global state library** - Server Actions coordinate across components
6. **Derive state rather than store** - Calculate from source of truth
7. **Server Actions revalidate** - All pages refresh automatically
8. **Minimal state surface area** - Only store what's necessary
