# Routing Domain

## Overview
The project uses Next.js 15 App Router with file-based routing, route groups for authentication boundaries, and server-first navigation patterns.

## File Structure
```
app/
├── layout.tsx                    # Root layout
├── globals.css                   # Global styles
├── (dashboard)/                  # Route group for authenticated routes
│   ├── layout.tsx               # Dashboard layout with Sidebar
│   ├── page.tsx                 # Dashboard home (/
│   ├── board/
│   │   └── page.tsx            # Kanban board (/board)
│   ├── tasks/
│   │   ├── page.tsx            # Task list (/tasks)
│   │   ├── actions.ts          # Task-related Server Actions
│   │   └── new/
│   │       └── page.tsx        # Create task form (/tasks/new)
│   └── team/
│       └── page.tsx            # Team view (/team)
├── login/
│   ├── page.tsx                # Login page (/login)
│   └── actions.ts              # Auth Server Actions
└── signup/
    ├── page.tsx                # Signup page (/signup)
    └── actions.ts              # Signup Server Actions
```

## Key Patterns

### 1. Route Groups for Authentication
The `(dashboard)` route group provides a shared layout for authenticated routes:

```tsx
// app/(dashboard)/layout.tsx
import { Sidebar } from "@/components/sidebar";
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
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background">{children}</main>
        </div>
    );
}
```

**Key Points:**
- Authentication check happens in layout (server-side)
- Unauthenticated users are redirected to `/login`
- Sidebar is shared across all dashboard routes
- Layout only renders for routes within `(dashboard)/` group

### 2. Server Components by Default
All page components are Server Components unless explicitly marked with `"use client"`:

```tsx
// app/(dashboard)/tasks/page.tsx
import { Suspense } from "react"
import { TaskList } from "@/components/task-list"
import { getAllTasks } from "@/app/(dashboard)/tasks/actions"

export const revalidate = 0

export default async function TasksPage() {
    const { tasks, error } = await getAllTasks();
    if (error) {
        return <p className="p-8">Could not load data. Please try again later.</p>
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <Suspense fallback={<div>Loading tasks...</div>}>
                <TaskList initialTasks={tasks || []} />
            </Suspense>
        </div>
    )
}
```

**Key Points:**
- Direct async/await in Server Components
- `export const revalidate = 0` disables caching for dynamic data
- Error handling happens on server before rendering
- Data fetched via Server Actions, passed as props to client components

### 3. Client-Side Navigation
Navigation between routes uses Next.js built-in hooks:

```tsx
// components/sidebar.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export function Sidebar() {
  const pathname = usePathname()

  return (
    <nav>
      {sidebarNavItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
              isActive ? "bg-muted text-primary" : "text-muted-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.title}
          </Link>
        )
      })}
    </nav>
  )
}
```

**Key Points:**
- `usePathname()` hook for active route detection
- `Link` component for client-side navigation (no full page reload)
- Active state styling based on current route

### 4. Programmatic Navigation
Forms and actions redirect after successful operations:

```tsx
// app/login/actions.ts
"use server"

export async function login(formData: FormData) {
    // ... authentication logic ...
    const { redirect } = await import("next/navigation");
    redirect("/");
}
```

**Key Points:**
- Server Actions can trigger redirects using `redirect()` from `next/navigation`
- Client components use `useRouter()` hook for programmatic navigation
- Redirects happen after successful mutations

## Common Patterns

### Adding a New Authenticated Route
1. Create a new folder under `app/(dashboard)/`
2. Add a `page.tsx` file (Server Component)
3. Authentication is automatically enforced by dashboard layout
4. Add navigation link to `components/sidebar.tsx` if needed

### Adding a Public Route
1. Create a new folder under `app/`
2. Add a `page.tsx` file
3. No authentication required (outside dashboard route group)

### Route-Specific Server Actions
- Co-locate Server Actions with routes in `actions.ts` files
- Use `"use server"` directive at the top
- Import and use in page or client components

## Constraints
- **No API Routes**: Do not create routes in `app/api/` directory; use Server Actions instead
- **Authentication in Layouts**: Authentication logic belongs in layouts, not individual pages
- **Server Components First**: Default to Server Components; only use `"use client"` when necessary (interactivity, hooks)
- **File-Based Routing**: Route structure matches file structure; no custom routing configuration
