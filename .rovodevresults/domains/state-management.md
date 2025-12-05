# State Management Domain Implementation

## Overview
TaskFlow follows a server-first state management approach, avoiding global state libraries in favor of React's built-in state management combined with Next.js server actions and optimistic updates.

## Core Principles

### 1. Server State Priority
Data fetching happens in server components, passed to client components as props:

```tsx
// app/(dashboard)/tasks/page.tsx (Server Component)
import { getAllTasks } from "./actions";
import { TasksPageClient } from "@/components/tasks-page-client";

export default async function TasksPage() {
    const { tasks, error } = await getAllTasks();
    
    return <TasksPageClient initialTasks={tasks} />;
}
```

### 2. Client State Boundaries
Use `"use client"` only when necessary for interactivity:

```tsx
// components/tasks-page-client.tsx
"use client"
import { useState, useEffect } from "react";

export function TasksPageClient({ initialTasks }: { initialTasks: Task[] }) {
    const [tasks, setTasks] = useState(initialTasks);
    // Client-side state management here
}
```

## Required Patterns

### 1. Optimistic Updates with useOptimistic
Use `useOptimistic` for immediate UI feedback during mutations:

```tsx
// components/task-list.tsx
"use client"
import { useOptimistic, useTransition } from "react";

export function TaskList({ initialTasks }: { initialTasks: TaskWithProfile[] }) {
    const [optimisticTasks, setOptimisticTasks] = useOptimistic(
        initialTasks,
        (state, { action, task }: { action: "delete" | "toggle"; task: TaskWithProfile | { id: number } }) => {
            if (action === "delete") {
                return state.filter((t) => t.id !== task.id)
            }
            if (action === "toggle") {
                return state.map((t) => (t.id === task.id ? { ...t, status: t.status === "done" ? "todo" : "done" } : t))
            }
            return state
        },
    );

    const [isPending, startTransition] = useTransition();

    const handleToggle = async (task: TaskWithProfile) => {
        startTransition(async () => {
            setOptimisticTasks({ action: "toggle", task });
            await updateTaskStatus(task.id, task.status === "done" ? "todo" : "done");
        });
    };
}
```

### 2. Form State with useActionState
Use `useActionState` for form submissions with server actions:

```tsx
// components/create-task-form.tsx
"use client"
import { useActionState } from "react";
import { createTask } from "@/app/(dashboard)/tasks/actions";

export function CreateTaskForm() {
    const [state, formAction, isPending] = useActionState(createTask, {
        success: false,
        error: null,
        message: null,
    });

    return (
        <form action={formAction} className="space-y-4">
            <Input name="title" placeholder="Task name" required />
            <Button type="submit" disabled={isPending}>
                {isPending ? "Creating..." : "Create Task"}
            </Button>
            {state.error && (
                <div className="text-destructive text-sm">{state.error}</div>
            )}
            {state.success && state.message && (
                <div className="text-green-600 text-sm">{state.message}</div>
            )}
        </form>
    );
}
```

### 3. Non-blocking Updates with useTransition
Use `useTransition` for non-blocking state updates:

```tsx
// components/kanban-board.tsx
"use client"
import { useState, useTransition } from "react";
import { updateTaskStatus } from "@/app/(dashboard)/tasks/actions";

export function KanbanBoard({ initialData }: { initialData: KanbanData }) {
    const [columns, setColumns] = useState(initialData);
    const [isPending, startTransition] = useTransition();

    const onDragEnd = (result: DropResult) => {
        // Optimistically update UI immediately
        setColumns(updatedColumns);

        // Update database in background
        startTransition(async () => {
            await updateTaskStatus(Number.parseInt(draggableId), finishColId);
        });
    };
}
```

### 4. Component State Colocation
Keep state close to where it's used, avoiding prop drilling:

```tsx
// components/task-list.tsx
export function TaskList({ initialTasks }: { initialTasks: TaskWithProfile[] }) {
    // Dialog state localized to this component
    const [openDialogs, setOpenDialogs] = useState<Record<number, boolean>>({});
    const [openDropdowns, setOpenDropdowns] = useState<Record<number, boolean>>({});

    const handleEditClick = (taskId: number) => {
        setOpenDropdowns(prev => ({ ...prev, [taskId]: false }));
        setOpenDialogs(prev => ({ ...prev, [taskId]: true }));
    };
}
```

## State Patterns by Use Case

### Dashboard Analytics
Client-side data processing for charts and metrics:

```tsx
// app/(dashboard)/page.tsx
"use client"
export default function IndexPage() {
    const [allTasks, setAllTasks] = useState<Task[]>([]);

    useEffect(() => {
        getAllTasks().then(({ tasks }) => {
            setAllTasks(tasks);
        });
    }, []);

    // Derive metrics client-side
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter((task) => task.status === "done").length;
    const statusData = allTasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
}
```

### Form State Management
Combine local state with server actions:

```tsx
// components/edit-task-form.tsx
"use client"
export function EditTaskForm({ task, onFinish }: EditTaskFormProps) {
    const [state, formAction, isPending] = useActionState(
        (prevState: any, formData: FormData) => updateTask(task.id, formData),
        { success: false, error: null }
    );

    // Close dialog on successful submission
    useEffect(() => {
        if (state.success) {
            onFinish?.();
        }
    }, [state.success, onFinish]);

    return (
        <form action={formAction}>
            {/* form fields */}
        </form>
    );
}
```

### Interactive Component State
Manage UI interactions locally:

```tsx
// components/task-list.tsx
export function TaskList({ initialTasks }: { initialTasks: TaskWithProfile[] }) {
    // Multiple pieces of local state for UI interactions
    const [openDialogs, setOpenDialogs] = useState<Record<number, boolean>>({});
    const [openDropdowns, setOpenDropdowns] = useState<Record<number, boolean>>({});

    const handleCloseDialog = (taskId: number) => {
        setOpenDialogs(prev => ({ ...prev, [taskId]: false }));
    };
}
```

## State Update Patterns

### Optimistic UI Updates
Update UI immediately, handle server sync in background:

```tsx
const handleDelete = async (taskId: number) => {
    startTransition(async () => {
        // Update UI optimistically
        setOptimisticTasks({ action: "delete", task: { id: taskId } });
        // Sync with server
        await deleteTask(taskId);
    });
};
```

### Dependent State Updates
Chain state updates for dependent operations:

```tsx
const handleEditClick = (taskId: number) => {
    // Close dropdown first
    setOpenDropdowns(prev => ({ ...prev, [taskId]: false }));
    // Then open dialog
    setOpenDialogs(prev => ({ ...prev, [taskId]: true }));
};
```

## Error State Management

### Server Action Error Handling
Handle errors in server actions and display in UI:

```tsx
// Server action error pattern
export async function createTask(formData: FormData) {
    try {
        await prisma.task.create({ data });
        return { error: null, success: true, message: "Task created!" };
    } catch (e) {
        return { error: "Failed to create task.", success: false };
    }
}

// Component error display
{state.error && (
    <div className="text-destructive text-sm">{state.error}</div>
)}
```

### Loading States
Show loading states during transitions:

```tsx
const [isPending, startTransition] = useTransition();

<Button disabled={isPending}>
    {isPending ? "Updating..." : "Update Task"}
</Button>
```

## Architectural Constraints

### No Global State Libraries
- Avoid Redux, Zustand, or other global state libraries
- Rely on React's built-in state management
- Pass data through props or server component patterns

### Client Boundaries
- Minimize `"use client"` usage
- Prefer server components for data fetching
- Use client components only for interactivity

### State Colocation
- Keep state close to where it's used
- Avoid prop drilling through multiple levels
- Use composition patterns to share state when needed

## Data Flow Architecture

```
Server Component (Data Fetching)
    ↓ props
Client Component (UI State)
    ↓ user interaction
Server Action (Data Mutation)
    ↓ revalidatePath
Server Component (Fresh Data)
```

This creates a unidirectional data flow that keeps the UI in sync with server state while providing immediate feedback through optimistic updates.