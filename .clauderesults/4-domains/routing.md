# Routing Domain Implementation

## Overview

This application uses Next.js 15 App Router with file-based routing. The routing architecture separates public authentication routes from protected dashboard routes using route groups.

## Key Technologies

- **Next.js 15 App Router** - Modern routing with Server Components
- **File-based routing** - Directory structure defines routes
- **Route groups** - Organize routes with shared layouts
- **Server Components** - Default rendering strategy

## Route Structure

```
app/
├── layout.tsx                    # Root layout (Inter font, HTML structure)
├── globals.css                   # Global styles
│
├── login/
│   ├── page.tsx                  # /login route
│   └── actions.ts                # Login server actions
│
├── signup/
│   ├── page.tsx                  # /signup route
│   └── actions.ts                # Signup server actions
│
└── (dashboard)/                  # Route group - protected routes
    ├── layout.tsx                # Dashboard layout (auth check, sidebar)
    ├── page.tsx                  # / route (dashboard home)
    ├── tasks/
    │   ├── page.tsx              # /tasks route
    │   ├── actions.ts            # Task management actions
    │   └── new/
    │       └── page.tsx          # /tasks/new route
    ├── board/
    │   └── page.tsx              # /board route
    └── team/
        └── page.tsx              # /team route
```

## Route Groups

### (dashboard) Route Group

The `(dashboard)` directory is a route group that:
- Shares a common layout with sidebar and authentication
- Protects all routes from unauthenticated access
- Does not add `/dashboard` to the URL path

**Dashboard layout (app/(dashboard)/layout.tsx):**
```tsx
import { Sidebar } from "@/components/sidebar"
import { getCurrentUser } from "@/app/login/actions"
import { redirect } from "next/navigation"

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const user = await getCurrentUser()
    if (!user) redirect("/login")

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background">
                {children}
            </main>
        </div>
    )
}
```

**Key features:**
- Server Component that checks authentication before rendering
- Redirects to `/login` if no active session
- Provides sidebar navigation
- Wraps all dashboard pages in a consistent layout

## Navigation Patterns

### 1. Link Component for Navigation

**From sidebar.tsx:**
```tsx
import Link from "next/link"
import { usePathname } from "next/navigation"

const sidebarNavItems = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Tasks", href: "/tasks", icon: CheckSquare },
  { title: "Board", href: "/board", icon: Kanban },
  { title: "Team", href: "/team", icon: Users },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <nav>
      {sidebarNavItems.map((item) => {
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
              pathname === item.href
                ? "bg-muted text-primary"
                : "text-muted-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.title}
          </Link>
        )
      })}
    </nav>
  )
}
```

**Active route detection:**
- `usePathname()` hook to get current route
- Conditional styling based on pathname match
- Must be used in Client Component

### 2. Programmatic Navigation with useRouter

**From create-task-form.tsx:**
```tsx
"use client"

import { useRouter } from "next/navigation"

export function CreateTaskForm({ onFinish }: { onFinish?: () => void }) {
  const router = useRouter()

  useEffect(() => {
    if (state.success) {
      if (onFinish) {
        onFinish()
      } else {
        router.push("/tasks")
      }
    }
  }, [state.success, router, onFinish])

  return (
    <form action={formAction}>
      {/* Form fields */}
    </form>
  )
}
```

**From new task page:**
```tsx
"use client"

import { useRouter } from "next/navigation"

export default function NewTaskPage() {
  const router = useRouter()

  const handleTaskCreated = () => {
    router.push("/tasks")
  }

  return (
    <CreateTaskForm onFinish={handleTaskCreated} />
  )
}
```

### 3. Server-Side Redirects

**After authentication (login/actions.ts):**
```tsx
"use server"

import { redirect } from "next/navigation"
import { cookies } from "next/headers"

export async function login(formData: FormData) {
  // ... authentication logic
  
  const cookieStore = await cookies()
  cookieStore.set("session", sessionToken, { httpOnly: true, path: "/" })
  
  // Redirect to dashboard after login
  redirect("/")
}

export async function logout() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get("session")?.value
  
  if (sessionToken) {
    await prisma.session.deleteMany({ where: { token: sessionToken } })
    cookieStore.set("session", "", { maxAge: 0, path: "/" })
  }
  
  // Redirect to login after logout
  redirect("/login")
}
```

**In layout for auth protection:**
```tsx
export default async function RootLayout({ children }) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  
  return <>{children}</>
}
```

## Page Patterns

### 1. Server Component Page (Data Fetching)

**From tasks/page.tsx:**
```tsx
import { getAllTasks } from "@/app/(dashboard)/tasks/actions"
import { TaskList } from "@/components/task-list"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { poppins } from "@/lib/fonts"

export const revalidate = 0  // Opt out of caching

export default async function TasksPage() {
  const { tasks, error } = await getAllTasks()
  
  if (error) {
    return <p className="p-8">Could not load data. Please try again later.</p>
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
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

      <TaskList initialTasks={tasks || []} />
    </div>
  )
}
```

**Key features:**
- Server Component (no `"use client"` directive)
- Direct async/await data fetching
- `revalidate = 0` to disable caching for always-fresh data
- Passes data as props to Client Components

### 2. Client Component Page (Interactive)

**From tasks/new/page.tsx:**
```tsx
"use client"

import { CreateTaskForm } from "@/components/create-task-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { poppins } from "@/lib/fonts"

export default function NewTaskPage() {
  const router = useRouter()

  const handleTaskCreated = () => {
    router.push("/tasks")
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-3xl font-bold tracking-tight ${poppins.className}`}>
          Create New Task
        </h2>
      </div>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Task Details</CardTitle>
          <CardDescription>Fill in the information below to create a new task</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateTaskForm onFinish={handleTaskCreated} />
        </CardContent>
      </Card>
    </div>
  )
}
```

**When to make a page a Client Component:**
- Needs to use useRouter for navigation
- Has interactive state management
- Uses other React hooks

### 3. Mixed Server/Client Pattern

**Server Component Page:**
```tsx
// page.tsx - Server Component
import { ClientContent } from "./client-content"

export default async function Page() {
  const data = await fetchData()  // Server-side data fetching
  
  return <ClientContent initialData={data} />
}
```

**Client Component:**
```tsx
// client-content.tsx
"use client"

export function ClientContent({ initialData }) {
  const [data, setData] = useState(initialData)
  // Interactive logic
  return <div>{/* Render */}</div>
}
```

## Dynamic Routing (Not Currently Used)

While not implemented in this app, dynamic routes would follow this pattern:

```
app/
└── tasks/
    └── [id]/
        └── page.tsx              # Dynamic route /tasks/:id
```

```tsx
// app/tasks/[id]/page.tsx
export default async function TaskDetailPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const task = await getTask(params.id)
  
  return <div>{task.name}</div>
}
```

## Loading States

**Using Suspense (not currently implemented, but recommended pattern):**
```tsx
import { Suspense } from "react"

export default function TasksPage() {
  return (
    <Suspense fallback={<div>Loading tasks...</div>}>
      <TaskList />
    </Suspense>
  )
}
```

**Current pattern in tasks/page.tsx:**
```tsx
import { Suspense } from "react"

<Suspense fallback={<div>Loading tasks...</div>}>
  <TaskList initialTasks={tasks || []} />
</Suspense>
```

## Authentication Flow

```
User visits /tasks
    ↓
Dashboard layout checks session
    ↓
No session found
    ↓
redirect("/login")
    ↓
User sees login page
    ↓
User submits credentials
    ↓
login() Server Action
    ↓
Session created, cookie set
    ↓
redirect("/")
    ↓
Dashboard layout checks session
    ↓
Session found
    ↓
Render dashboard with sidebar
```

## Revalidation Strategies

### Opt Out of Caching

```tsx
// Force fresh data on every request
export const revalidate = 0

export default async function Page() {
  const data = await getData()  // Always fresh
  return <div>{/* render */}</div>
}
```

### Revalidate After Mutations

```tsx
"use server"

import { revalidatePath } from "next/cache"

export async function createTask(formData: FormData) {
  await prisma.task.create({ data })
  revalidatePath("/tasks")  // Refresh /tasks page
  return { success: true }
}
```

**From tasks/actions.ts:**
```tsx
export async function deleteTask(taskId: number) {
  try {
    await prisma.task.delete({ where: { id: taskId } })
    revalidatePath("/tasks")  // Invalidate cache
    return { error: null }
  } catch (e) {
    return { error: "Failed to delete task." }
  }
}
```

## Best Practices

### 1. Use Server Components by Default

```tsx
// ✅ Good - Server Component
export default async function Page() {
  const data = await getData()
  return <div>{data.title}</div>
}

// ❌ Bad - Unnecessary Client Component
"use client"
export default function Page() {
  const [data, setData] = useState(null)
  useEffect(() => {
    fetchData().then(setData)
  }, [])
  return <div>{data?.title}</div>
}
```

### 2. Fetch Data at the Route Level

```tsx
// ✅ Good - Fetch in page, pass to components
export default async function TasksPage() {
  const tasks = await getAllTasks()
  return <TaskList initialTasks={tasks} />
}

// ❌ Bad - Fetch in component
"use client"
export function TaskList() {
  const [tasks, setTasks] = useState([])
  useEffect(() => {
    getAllTasks().then(setTasks)
  }, [])
  return <div>{/* render */}</div>
}
```

### 3. Use Link for Internal Navigation

```tsx
// ✅ Good - Next.js Link
import Link from "next/link"
<Link href="/tasks">View Tasks</Link>

// ❌ Bad - Regular anchor tag
<a href="/tasks">View Tasks</a>
```

### 4. Protect Routes with Layout

```tsx
// ✅ Good - Check auth in layout
export default async function DashboardLayout({ children }) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  return <>{children}</>
}

// ❌ Bad - Check auth in every page
export default async function TasksPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  // ...
}
```

### 5. Use Route Groups for Shared Layouts

```
// ✅ Good - Route group
app/
└── (dashboard)/
    ├── layout.tsx
    ├── tasks/page.tsx
    └── board/page.tsx

// ❌ Bad - Duplicate layout code
app/
├── tasks/
│   ├── layout.tsx
│   └── page.tsx
└── board/
    ├── layout.tsx
    └── page.tsx
```

## Testing Routes

**E2E tests with Playwright (from auth.spec.ts):**
```typescript
test('should redirect to login when not authenticated', async ({ page }) => {
  await page.goto('http://localhost:3000/tasks')
  await expect(page).toHaveURL('http://localhost:3000/login')
})

test('should navigate to tasks page after login', async ({ page }) => {
  await page.goto('http://localhost:3000/login')
  await page.fill('[name="email"]', 'alice@example.com')
  await page.fill('[name="password"]', 'password123')
  await page.click('button[type="submit"]')
  
  await expect(page).toHaveURL('http://localhost:3000/')
})
```

## Summary

The routing domain follows Next.js App Router best practices:

1. **File-based routing** - URLs map directly to file structure
2. **Server Components by default** - Client only when needed
3. **Route groups** for shared layouts and authentication
4. **Link component** for client-side navigation
5. **redirect()** for server-side navigation
6. **Layout hierarchy** for nested auth checks
7. **revalidatePath()** after mutations to refresh data
