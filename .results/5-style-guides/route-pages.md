# Route Pages Style Guide

## Unique Patterns

### 1. Server Components by Default
All pages are Server Components unless they need client interactivity:

```tsx
// app/(dashboard)/tasks/page.tsx - Server Component
import { getAllTasks } from "@/app/(dashboard)/tasks/actions"

export const revalidate = 0  // Disable caching

export default async function TasksPage() {
    const { tasks, error } = await getAllTasks();
    
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <TaskList initialTasks={tasks || []} />
        </div>
    )
}
```

### 2. Client Page Pattern
When pages need interactivity, use `"use client"`:

```tsx
// app/(dashboard)/page.tsx - Client Component
"use client"

import { useEffect, useState } from "react"

export default function IndexPage() {
  const [allTasks, setAllTasks] = useState<Task[]>([]);

  useEffect(() => {
    getAllTasks().then(({ tasks }) => {
      setAllTasks(tasks);
    });
  }, []);

  return (
    <div className="flex-1 p-8">
      <DashboardCharts data={taskStats} />
    </div>
  )
}
```

### 3. Suspense for Loading States
Wrap async components in Suspense:

```tsx
import { Suspense } from "react"

<Suspense fallback={<div>Loading tasks...</div>}>
    <TaskList initialTasks={tasks || []} />
</Suspense>
```

### 4. Error Handling Pattern
Check for errors before rendering:

```tsx
const { tasks, error } = await getAllTasks();
if (error) {
    return <p className="p-8">Could not load data. Please try again later.</p>
}
```

### 5. Page Header Pattern
Consistent header with title and action button:

```tsx
<div className="flex items-center justify-between">
    <h2 className={`text-3xl font-bold tracking-tight ${poppins.className}`}>
        Tasks
    </h2>
    <Link href="/tasks/new">
        <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Task
        </Button>
    </Link>
</div>
```

### 6. Form Pages with Progressive Enhancement
Form pages work without JavaScript:

```tsx
// app/(dashboard)/tasks/new/page.tsx
export default function NewTaskPage() {
    return (
        <div className="flex-1 p-8">
            <h1>Create New Task</h1>
            <CreateTaskForm onFinish={() => {
                // Client-side redirect on finish
            }} />
        </div>
    );
}
```

### 7. Revalidate Export for Caching
Control caching behavior at page level:

```tsx
export const revalidate = 0  // Disable caching (always fresh)
export const dynamic = 'force-dynamic'  // Force dynamic rendering
```

## Layout Pattern

### Protected Dashboard Layout

```tsx
// app/(dashboard)/layout.tsx
import { getCurrentUser } from "@/app/login/actions";
import { redirect } from "next/navigation";

export default async function RootLayout({ children }) {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background">
                {children}
            </main>
        </div>
    );
}
```

### Root Layout

```tsx
// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TaskFlow",
  description: "Task management made easy",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-background text-foreground`}>
        {children}
      </body>
    </html>
  );
}
```

## File Structure Conventions
- `page.tsx` - Route component
- `layout.tsx` - Layout component for route group
- `actions.ts` - Server Actions for that route segment
- Route groups use parentheses: `(dashboard)`

## Common Patterns

### Fetching Data
```tsx
const { tasks, error } = await getAllTasks();
```

### Passing Initial Data to Client Components
```tsx
<TaskList initialTasks={tasks || []} />
```

### Responsive Padding
```tsx
<div className="p-4 md:p-8">
```

### Font Integration
```tsx
import { poppins } from "@/lib/fonts"

<h1 className={`text-4xl font-bold ${poppins.className}`}>
```
