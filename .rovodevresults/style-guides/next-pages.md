# Next.js Pages Style Guide

## Unique Patterns and Conventions

### 1. Route Group Organization
Pages are organized using Next.js route groups with parentheses for logical grouping without affecting URLs:

```tsx
// app/(dashboard)/page.tsx - Dashboard home at "/"
// app/(dashboard)/tasks/page.tsx - Tasks page at "/tasks"
// app/login/page.tsx - Login page at "/login"
```

### 2. Server-First Data Fetching Pattern
Dashboard pages follow server-first architecture where data is fetched in server components and passed to client components:

```tsx
// app/(dashboard)/tasks/page.tsx
import { getAllTasks } from "./actions";
import { TasksPageClient } from "@/components/tasks-page-client";

export default async function TasksPage() {
    const { tasks, error } = await getAllTasks();
    
    if (error) {
        return <div>Error loading tasks: {error}</div>;
    }
    
    return <TasksPageClient initialTasks={tasks} />;
}
```

### 3. Client Component Delegation Pattern
Pages delegate interactivity to dedicated client components rather than using "use client" at the page level:

```tsx
// Server component page delegates to client component
export default async function TasksPage() {
    const { tasks } = await getAllTasks();
    return <TasksPageClient initialTasks={tasks} />;
}

// Client component handles all interactions
"use client"
export function TasksPageClient({ initialTasks }: { initialTasks: Task[] }) {
    // All client-side logic here
}
```

### 4. Form-Centric Page Structure
Form pages (like /tasks/new) use simple server components with form component delegation:

```tsx
// app/(dashboard)/tasks/new/page.tsx
import { CreateTaskForm } from "@/components/create-task-form";

export default function NewTaskPage() {
    return (
        <div className="p-8">
            <Card>
                <CardHeader>
                    <CardTitle>Create New Task</CardTitle>
                </CardHeader>
                <CardContent>
                    <CreateTaskForm />
                </CardContent>
            </Card>
        </div>
    );
}
```

### 5. Authentication Page Simplicity
Authentication pages (login/signup) are minimal server components that focus solely on form rendering:

```tsx
// app/login/page.tsx
export default function LoginPage() {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <LoginForm />
        </div>
    );
}
```

### 6. Dashboard State Pattern
Dashboard pages that need client-side state management use the "use client" directive and useState/useEffect for data fetching:

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
    
    // Client-side data processing for charts
}
```

### 7. Consistent Error Handling
Pages handle server action errors consistently using the same error structure:

```tsx
if (error) {
    return <div>Error loading tasks: {error}</div>;
}
```

### 8. Layout Integration
Dashboard pages rely on layout.tsx for authentication, navigation, and page structure - pages only contain content:

```tsx
// Pages assume they're wrapped in authenticated layout
export default async function TasksPage() {
    // No auth checks needed - handled in layout
    // No navigation needed - handled in layout
    // Direct content implementation
}
```