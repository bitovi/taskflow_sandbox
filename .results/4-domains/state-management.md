# State Management Domain

## Overview
The project uses server-first state management with React hooks for client-side state. No global state management libraries are used.

## Key Patterns

### 1. Server State via Server Components

```tsx
// app/(dashboard)/tasks/page.tsx
export default async function TasksPage() {
    const { tasks, error } = await getAllTasks();
    
    return (
        <TaskList initialTasks={tasks || []} />
    )
}
```

**Key Points:**
- Server Components fetch data directly via Server Actions
- Data passed as props to client components
- No client-side data fetching libraries (React Query, SWR, etc.)

### 2. Client State with useState

```tsx
// components/task-list.tsx
"use client"

export function TaskList({ initialTasks }: { initialTasks: Task[]; }) {
  const [openDialogs, setOpenDialogs] = useState<Record<number, boolean>>({})
  const [openDropdowns, setOpenDropdowns] = useState<Record<number, boolean>>({})

  const handleCloseDialog = (taskId: number) => {
    setOpenDialogs(prev => ({ ...prev, [taskId]: false }))
  }

  return (
    <Dialog open={openDialogs[task.id]} onOpenChange={(open) =>
      setOpenDialogs(prev => ({ ...prev, [task.id]: open }))
    }>
      {/* ... */}
    </Dialog>
  )
}
```

**Key Points:**
- `useState` for local UI state (modals, dropdowns, selections)
- State is component-scoped, not global
- Use object/array state for managing multiple instances

### 3. Optimistic Updates with useOptimistic

```tsx
// components/task-list.tsx
"use client"

import { useOptimistic, useTransition } from "react"

export function TaskList({ initialTasks }: { initialTasks: Task[]; }) {
  const [optimisticTasks, setOptimisticTasks] = useOptimistic(
    initialTasks,
    (state, { action, task }: { action: "delete" | "toggle"; task: Task | { id: number } }) => {
      if (action === "delete") {
        return state.filter((t) => t.id !== task.id)
      }
      if (action === "toggle") {
        return state.map((t) => 
          t.id === task.id ? { ...t, status: t.status === "done" ? "todo" : "done" } : t
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

  return (
    <div>
      {optimisticTasks.map(task => (
        <TaskCard key={task.id} task={task} onDelete={handleDelete} />
      ))}
    </div>
  )
}
```

**Key Points:**
- Use `useOptimistic` for immediate UI feedback before server response
- Wrap mutations in `startTransition` from `useTransition`
- Reducer-style state updates for complex optimistic changes
- UI updates instantly, then syncs with server

### 4. Form State with useActionState

```tsx
// components/create-task-form.tsx
"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"

type ActionState = {
    error: string | null;
    success: boolean;
    message?: string;
}

const initialState: ActionState = {
    message: "",
    success: false,
    error: null,
}

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Creating..." : "Create Task"}
        </Button>
    )
}

export function CreateTaskForm({ onFinish }: { onFinish?: () => void }) {
    const createTaskAction = async (prevState: ActionState, formData: FormData): Promise<ActionState> => {
        return createTask(formData)
    }

    const [state, formAction] = useActionState(createTaskAction, initialState)

    return (
        <form action={formAction}>
            {state.error && <p className="text-red-500">{state.error}</p>}
            <Input name="title" />
            <SubmitButton />
        </form>
    )
}
```

**Key Points:**
- `useActionState` manages form submission state
- `useFormStatus` provides pending state in submit button
- Server Action returns state object with error/success
- Progressive enhancement: works without JavaScript

### 5. Drag-and-Drop State

```tsx
// components/kanban-board.tsx
"use client"

import { useState, useTransition } from "react"

export function KanbanBoard({ initialData }: { initialData: KanbanData }) {
  const [columns, setColumns] = useState(initialData)
  const [isPending, startTransition] = useTransition()

  const onDragEnd = (result: DropResult) => {
    // Optimistically update UI
    const newColumns = { /* ... updated columns ... */ }
    setColumns(newColumns)

    // Update the database
    startTransition(async () => {
      await updateTaskStatus(taskId, newStatus)
    })
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {/* ... */}
    </DragDropContext>
  )
}
```

**Key Points:**
- Local state tracks column structure
- Optimistic updates before server sync
- `startTransition` for non-blocking database writes

## Common Patterns

### Fetching Data Client-Side
```tsx
const [users, setUsers] = useState<User[]>([])

useEffect(() => {
    getAllUsers().then(setUsers)
}, [])
```

**Note**: Prefer Server Components for initial data fetching; use client-side only when needed (e.g., dependent on user input).

### Tracking Pending Operations
```tsx
const [isPending, startTransition] = useTransition()

const handleUpdate = () => {
  startTransition(async () => {
    await updateTask(taskId, data)
  })
}

return <Button disabled={isPending}>Update</Button>
```

## Constraints
- **No Global State Libraries**: Don't use Redux, Zustand, Jotai, etc.
- **Server-First**: Prefer fetching data in Server Components
- **Optimistic Updates**: Use `useOptimistic` for better UX on mutations
- **Transitions**: Wrap async operations in `startTransition` for non-blocking UI
- **Props Over Context**: Pass data via props; avoid React Context for state
