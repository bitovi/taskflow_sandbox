# Business Components Style Guide

## Unique Patterns and Conventions

### 1. Client Component Declaration Pattern
Business components that need interactivity use "use client" directive and import specific hooks:

```tsx
// components/task-list.tsx
"use client"
import { useOptimistic, useTransition } from "react";
```

### 2. Server Action Integration with useActionState
Forms use useActionState pattern for server action integration:

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
}
```

### 3. Optimistic Update Pattern
Interactive lists use useOptimistic for immediate UI feedback:

```tsx
// components/task-list.tsx
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
```

### 4. Poppins Font Usage Pattern
Task titles and headings use Poppins font import:

```tsx
// components/task-list.tsx
import { poppins } from "@/lib/fonts";

<h3 className={`font-semibold ${poppins.className} ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>
    {task.name}
</h3>
```

### 5. Multi-State Management Pattern
Components managing multiple UI states use Record pattern:

```tsx
// components/task-list.tsx
const [openDialogs, setOpenDialogs] = useState<Record<number, boolean>>({});
const [openDropdowns, setOpenDropdowns] = useState<Record<number, boolean>>({});

const handleEditClick = (taskId: number) => {
    setOpenDropdowns(prev => ({ ...prev, [taskId]: false }));
    setOpenDialogs(prev => ({ ...prev, [taskId]: true }));
};
```

### 6. Data-TestId Pattern for Testing
Interactive elements include data-testid attributes:

```tsx
<Card data-testid={`task-card-${task.id}`}>
    <Button data-testid={`task-menu-${task.id}`} variant="ghost" size="icon">
```

### 7. Transition-Based Server Sync
Background server operations use useTransition:

```tsx
const [isPending, startTransition] = useTransition();

const handleDelete = async (taskId: number) => {
    startTransition(async () => {
        setOptimisticTasks({ action: "delete", task: { id: taskId } });
        await deleteTask(taskId);
    });
};
```

### 8. Conditional Success Effects
Forms handle success states with useEffect:

```tsx
// components/edit-task-form.tsx
useEffect(() => {
    if (state.success) {
        onFinish?.();
    }
}, [state.success, onFinish]);
```

### 9. TypeScript Interface Pattern
Components define clear TypeScript interfaces for props:

```tsx
interface EditTaskFormProps {
    task: TaskWithProfile;
    onFinish?: () => void;
}

export function EditTaskForm({ task, onFinish }: EditTaskFormProps) {
```

### 10. Chart Data Processing Pattern
Dashboard components process raw data client-side:

```tsx
// app/(dashboard)/page.tsx
const statusData = allTasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
}, {} as Record<string, number>);

const statusChartData = Object.entries(statusData).map(([status, count]) => ({
    name: status,
    value: count,
}));
```

### 11. Error State Display Pattern
Forms display errors with consistent styling:

```tsx
{state.error && (
    <div className="text-destructive text-sm">{state.error}</div>
)}
{state.success && state.message && (
    <div className="text-green-600 text-sm">{state.message}</div>
)}
```