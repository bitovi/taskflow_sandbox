# Routing Domain Implementation

## Overview
TaskFlow uses Next.js 15 App Router with server-first architecture, route groups for organization, and layout-based authentication guards.

## Route Structure

### App Router Organization
```
app/
├── layout.tsx                 # Root layout
├── globals.css               # Global styles
├── (dashboard)/              # Protected route group
│   ├── layout.tsx           # Auth guard + sidebar
│   ├── page.tsx             # Dashboard home
│   ├── tasks/
│   │   ├── page.tsx         # Task list
│   │   ├── new/page.tsx     # Create task
│   │   └── actions.ts       # Server actions
│   ├── board/page.tsx       # Kanban board
│   └── team/page.tsx        # Team management
├── login/
│   ├── page.tsx             # Login form
│   └── actions.ts           # Auth actions
└── signup/
    ├── page.tsx             # Signup form
    └── actions.ts           # Auth actions
```

## Required Patterns

### 1. Route Groups for Organization
Use parentheses to group related routes without affecting URL structure:

```tsx
// app/(dashboard)/layout.tsx - Protected routes layout
import { getCurrentUser } from "@/app/login/actions";
import { redirect } from "next/navigation";

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
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

### 2. Server Components by Default
All pages default to server components unless client features are needed:

```tsx
// app/(dashboard)/page.tsx - Uses "use client" for state management
"use client"
import { useEffect, useState } from "react";
import { getAllTasks } from "@/app/(dashboard)/tasks/actions";

export default function IndexPage() {
    const [allTasks, setAllTasks] = useState<Task[]>([]);
    
    useEffect(() => {
        getAllTasks().then(({ tasks }) => {
            setAllTasks(tasks);
        });
    }, []);
    // ... component logic
}
```

### 3. Server Actions Co-location
Place server actions in `actions.ts` files within route directories:

```tsx
// app/(dashboard)/tasks/actions.ts
"use server";

import { getCurrentUser } from "@/app/login/actions";
import { PrismaClient } from "@/app/generated/prisma";
import { revalidatePath } from "next/cache";

export async function createTask(formData: FormData) {
    const user = await getCurrentUser();
    if (!user) return { error: "Not authenticated.", success: false };
    
    // ... task creation logic
    revalidatePath("/tasks");
    return { error: null, success: true, message: "Task created successfully!" };
}
```

## Authentication Integration

### Layout-based Protection
Protected routes use layout.tsx for authentication checks:

```tsx
// app/(dashboard)/layout.tsx
const user = await getCurrentUser();
if (!user) redirect("/login");
```

### Redirect Patterns
Use `next/navigation` for server-side redirects:

```tsx
import { redirect } from "next/navigation";

// In server components or server actions
if (!authenticated) {
    redirect("/login");
}
```

## Page Implementation Patterns

### Dashboard Pages
Dashboard pages follow a consistent structure:

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

### Form Pages
Form pages integrate with server actions:

```tsx
// app/(dashboard)/tasks/new/page.tsx
import { CreateTaskForm } from "@/components/create-task-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

### Authentication Pages
Auth pages use server actions for form handling:

```tsx
// app/login/page.tsx
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <LoginForm />
        </div>
    );
}
```

## Metadata and SEO

### Root Layout Metadata
```tsx
// app/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "TaskFlow",
    description: "Task management made easy",
};
```

### Font Integration
Fonts are configured in the root layout:

```tsx
// app/layout.tsx
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className={`${inter.className} bg-background text-foreground text-xl`}>
                {children}
            </body>
        </html>
    );
}
```

## Navigation Patterns

### Sidebar Navigation
Navigation is handled through the Sidebar component in dashboard layout:

```tsx
// components/sidebar.tsx
import Link from "next/link";

export function Sidebar() {
    return (
        <nav className="sidebar">
            <Link href="/" className="nav-link">Dashboard</Link>
            <Link href="/tasks" className="nav-link">Tasks</Link>
            <Link href="/board" className="nav-link">Board</Link>
            <Link href="/team" className="nav-link">Team</Link>
        </nav>
    );
}
```

## Route-specific Constraints

### Protected Route Requirements
- All dashboard routes must be wrapped in `(dashboard)` group
- Layout.tsx must call `getCurrentUser()` and redirect if not authenticated
- Use `redirect()` from `next/navigation` for server-side redirects

### Public Route Requirements
- Login/signup pages must be outside route groups
- Should redirect authenticated users to dashboard
- Form submissions use server actions with proper error handling

### URL Structure
- Dashboard routes: `/`, `/tasks`, `/board`, `/team`
- Task operations: `/tasks`, `/tasks/new`
- Authentication: `/login`, `/signup`
- Route groups don't affect URLs: `(dashboard)/page.tsx` → `/`

## Error Handling

### Route-level Error Boundaries
Future implementation should include error.tsx files:

```tsx
// app/(dashboard)/error.tsx (not currently implemented)
'use client'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <div>
            <h2>Something went wrong!</h2>
            <button onClick={() => reset()}>Try again</button>
        </div>
    )
}
```

## Server Action Integration

### Form Handling Pattern
Pages integrate with server actions through form components:

```tsx
// Form component uses server action
<form action={serverAction}>
    <input name="title" />
    <button type="submit">Submit</button>
</form>

// Server action handles the form
export async function createTask(formData: FormData) {
    const title = formData.get("title") as string;
    // ... processing logic
    revalidatePath("/tasks"); // Refresh the page data
}
```