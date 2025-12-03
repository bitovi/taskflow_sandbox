# Authentication Domain Implementation

## Overview

Authentication in this application uses a session-based approach with bcrypt password hashing. Sessions are stored in the database and referenced via HTTP-only cookies. All authentication logic is implemented through Next.js Server Actions, providing a secure, server-side authentication flow.

## Key Technologies

- **bcryptjs v2.4.3** - Password hashing
- **Next.js cookies()** - HTTP-only cookie management
- **Prisma ORM** - Session and user storage
- **Server Actions** - Authentication operations
- **crypto.randomBytes** - Secure token generation
- **Route protection** - Server Component authentication checks

## Database Schema

**Authentication-related models from prisma/schema.prisma:**
```prisma
model User {
  id            Int @id @default(autoincrement())
  email         String @unique
  password      String  // bcrypt hash
  name          String
  sessions      Session[]
  createdTasks  Task[] @relation("CreatedTasks")
  assignedTasks Task[] @relation("AssignedTasks")
}

model Session {
  id        Int      @id @default(autoincrement())
  token     String   @unique
  userId    Int
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
}
```

**Key features:**
- User email is unique
- Password stored as bcrypt hash
- One user can have multiple active sessions
- Session tokens are unique strings

## Authentication Flow

### Signup Flow

**From signup/actions.ts:**
```typescript
"use server"

import { cookies } from "next/headers"
import { PrismaClient } from "@/app/generated/prisma"
import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"

const prisma = new PrismaClient()

export async function signup(formData: FormData) {
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const name = formData.get("name") as string | undefined

    // Validation
    if (!email) return { error: "Email is required." }
    if (!password) return { error: "Password is required." }
    if (!name) return { error: "Name is required." }

    // Check if user exists
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return { error: "User already exists." }

    // Hash password
    const hashed = await bcrypt.hash(password, 10)
    
    // Create user
    const user = await prisma.user.create({
        data: {
            email,
            password: hashed,
            name: name || "User",
        },
    })

    // Create session
    const sessionToken = randomBytes(32).toString("hex")
    await prisma.session.create({
        data: {
            token: sessionToken,
            userId: user.id,
        },
    })

    // Set HTTP-only cookie
    const cookieStore = await cookies()
    cookieStore.set("session", sessionToken, { httpOnly: true, path: "/" })

    // Redirect to home
    const { redirect } = await import("next/navigation")
    redirect("/")
}
```

**Signup flow steps:**
1. Extract email, password, and name from FormData
2. Validate required fields
3. Check if user already exists
4. Hash password with bcrypt (10 salt rounds)
5. Create user in database
6. Generate secure session token (32 random bytes)
7. Create session in database
8. Set HTTP-only cookie
9. Redirect to dashboard

### Login Flow

**From login/actions.ts:**
```typescript
"use server"

import { cookies } from "next/headers"
import { PrismaClient } from "@/app/generated/prisma"
import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"

const prisma = new PrismaClient()

export async function login(formData: FormData) {
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    // Validation
    if (!email) return { error: "Email is required." }
    if (!password) return { error: "Password is required." }

    // Find user
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
        return { error: "Invalid email or password." }
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
        return { error: "Invalid email or password." }
    }

    // Create session
    const sessionToken = randomBytes(32).toString("hex")
    await prisma.session.create({
        data: {
            token: sessionToken,
            userId: user.id,
        },
    })

    // Set HTTP-only cookie
    const cookieStore = await cookies()
    cookieStore.set("session", sessionToken, { httpOnly: true, path: "/" })

    // Redirect to home
    const { redirect } = await import("next/navigation")
    redirect("/")
}
```

**Login flow steps:**
1. Extract email and password from FormData
2. Validate required fields
3. Find user by email
4. Compare password with bcrypt hash
5. Generate new session token
6. Create session in database
7. Set HTTP-only cookie
8. Redirect to dashboard

### Logout Flow

**From login/actions.ts:**
```typescript
export async function logout() {
    // Get current session token
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session")?.value

    // Delete session from database
    if (sessionToken) {
        await prisma.session.deleteMany({ where: { token: sessionToken } })
        // Clear cookie
        cookieStore.set("session", "", { maxAge: 0, path: "/" })
    }

    // Redirect to login
    const { redirect } = await import("next/navigation")
    redirect("/login")
}
```

**Logout flow steps:**
1. Get session token from cookie
2. Delete session from database
3. Clear cookie
4. Redirect to login page

### Get Current User

**From login/actions.ts:**
```typescript
export async function getCurrentUser() {
    // Get session token from cookie
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session")?.value
    if (!sessionToken) return null

    // Find session and include user
    const session = await prisma.session.findUnique({
        where: { token: sessionToken },
        include: { user: true },
    })

    return session?.user || null
}
```

**Usage pattern:**
- Called in Server Components to get authenticated user
- Returns full User object or null
- Used for route protection and user-specific data

## Route Protection

### Dashboard Layout Protection

**From app/(dashboard)/layout.tsx:**
```tsx
import { Sidebar } from "@/components/sidebar"
import { getCurrentUser } from "@/app/login/actions"
import { redirect } from "next/navigation"

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    // Check authentication
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

**Protection mechanism:**
1. Layout is a Server Component
2. Calls `getCurrentUser()` to check authentication
3. If no user, redirects to `/login`
4. If authenticated, renders layout with sidebar

**Protected routes:**
- `/` - Dashboard home
- `/tasks` - Task list
- `/tasks/new` - Create task
- `/board` - Kanban board
- `/team` - Team page

All routes under `(dashboard)` route group are protected.

### Action-Level Protection

**From tasks/actions.ts:**
```typescript
"use server"

import { getCurrentUser } from "@/app/login/actions"

export async function createTask(formData: FormData) {
    // Check authentication in action
    const user = await getCurrentUser()
    if (!user) return { 
        error: "Not authenticated.", 
        success: false, 
        message: "Not authenticated." 
    }

    const creatorId = user.id

    // Continue with task creation...
    await prisma.task.create({
        data: {
            name,
            description,
            priority,
            status,
            creatorId,  // Use authenticated user's ID
            assigneeId,
        },
    })
}
```

**Pattern:**
- Every Server Action that modifies data checks authentication
- Returns error if not authenticated
- Uses user ID for database operations

## Authentication UI Components

### Login Page

**From app/login/page.tsx:**
```tsx
"use client"

import { useState } from "react"
import { useActionState } from "react"
import { login } from "./actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckSquare } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const initialState = { error: null }

async function loginAction(state: any, formData: FormData) {
    const result = await login(formData)
    return { error: result?.error ?? null }
}

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [state, formAction] = useActionState(loginAction, initialState)

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        if (name === "email") setEmail(value)
        if (name === "password") setPassword(value)
    }

    return (
        <div className="flex items-center justify-center min-h-screen">
            <Card className="w-sm">
                <CardHeader className="text-center">
                    <div className="flex justify-center items-center mb-4">
                        <CheckSquare className="h-8 w-8 mr-2 text-primary" />
                        <CardTitle className="text-2xl">TaskFlow</CardTitle>
                    </div>
                    <CardDescription>
                        Enter your credentials to access your dashboard
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form className="space-y-4" action={formAction}>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="m@example.com"
                                required
                                value={email}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                                value={password}
                                onChange={handleInputChange}
                            />
                        </div>

                        {state.error && (
                            <div className="text-red-500 text-sm text-center">
                                {state.error}
                            </div>
                        )}

                        <div className="flex space-x-2">
                            <Button className="w-full">
                                Log&nbsp;In
                            </Button>

                            <a href="/signup" className="w-full">
                                <Button className="w-full" variant="outline" type="button">
                                    Sign Up
                                </Button>
                            </a>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
```

**Features:**
- Centered card layout
- Controlled form inputs with useState
- useActionState for form submission
- Error display
- Link to signup page

### Auth Dropdown

**Pattern for displaying logged-in user:**
```tsx
import { Avatar, AvatarName } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { LogOut } from "lucide-react"
import { logout } from "@/app/login/actions"

// In Sidebar or Header
const user = await getCurrentUser()

<DropdownMenu>
    <DropdownMenuTrigger data-testid="auth-avatar">
        <Avatar>
            <AvatarName name={user.name} />
        </Avatar>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
        <DropdownMenuItem onClick={() => logout()}>
            <LogOut className="mr-2 h-4 w-4" />
            Log out
        </DropdownMenuItem>
    </DropdownMenuContent>
</DropdownMenu>
```

## Helper Functions

### Get All Users

**From login/actions.ts:**
```typescript
export async function getAllUsers() {
    // Returns all users with id and name
    return prisma.user.findMany({ 
        select: { id: true, name: true } 
    })
}
```

**Usage:**
- Used in task forms to populate assignee dropdown
- Returns limited fields for security

## Security Considerations

### 1. Password Hashing

```typescript
// ✅ Good - bcrypt with 10 rounds
const hashed = await bcrypt.hash(password, 10)

// ✅ Good - Secure password comparison
const valid = await bcrypt.compare(password, user.password)
```

### 2. Session Token Generation

```typescript
// ✅ Good - Cryptographically secure random bytes
const sessionToken = randomBytes(32).toString("hex")

// ❌ Bad - Predictable tokens
const sessionToken = `${userId}-${Date.now()}`
```

### 3. HTTP-Only Cookies

```typescript
// ✅ Good - HTTP-only prevents XSS attacks
cookieStore.set("session", sessionToken, { 
    httpOnly: true, 
    path: "/" 
})

// ❌ Bad - Accessible to JavaScript
cookieStore.set("session", sessionToken)
```

### 4. Error Messages

```typescript
// ✅ Good - Generic error message
if (!user || !valid) {
    return { error: "Invalid email or password." }
}

// ❌ Bad - Reveals user existence
if (!user) return { error: "User not found" }
if (!valid) return { error: "Wrong password" }
```

### 5. Server-Side Authentication Checks

```tsx
// ✅ Good - Server Component checks auth
export default async function DashboardLayout() {
    const user = await getCurrentUser()
    if (!user) redirect("/login")
    // Render protected content
}

// ❌ Bad - Client-side only check
"use client"
export default function DashboardLayout() {
    const { user } = useAuth()  // Client state
    if (!user) return <Navigate to="/login" />
}
```

## Complete Authentication Examples

### Signup Page Pattern

**Similar to login, with additional name field:**
```tsx
"use client"

import { useActionState } from "react"
import { signup } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

const initialState = { error: null }

async function signupAction(state: any, formData: FormData) {
    const result = await signup(formData)
    return { error: result?.error ?? null }
}

export default function SignupPage() {
    const [state, formAction] = useActionState(signupAction, initialState)

    return (
        <div className="flex items-center justify-center min-h-screen">
            <Card className="w-sm">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Create Account</CardTitle>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4" action={formAction}>
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                name="name"
                                type="text"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                            />
                        </div>

                        {state.error && (
                            <div className="text-red-500 text-sm text-center">
                                {state.error}
                            </div>
                        )}

                        <Button type="submit" className="w-full">
                            Sign Up
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
```

## Best Practices

### 1. Always Hash Passwords

```typescript
// ✅ Good - Hash before storing
const hashed = await bcrypt.hash(password, 10)
await prisma.user.create({ data: { email, password: hashed } })

// ❌ Bad - Plain text passwords
await prisma.user.create({ data: { email, password } })
```

### 2. Check Authentication in Protected Routes

```tsx
// ✅ Good - Check in layout
export default async function ProtectedLayout() {
    const user = await getCurrentUser()
    if (!user) redirect("/login")
    return <div>{children}</div>
}

// ❌ Bad - No authentication check
export default function ProtectedLayout() {
    return <div>{children}</div>
}
```

### 3. Use Server Actions for Auth Operations

```typescript
// ✅ Good - Server Action
"use server"
export async function login(formData: FormData) {
    // Secure server-side processing
}

// ❌ Bad - Client-side API calls
async function login(data) {
    await fetch('/api/login', { method: 'POST', body: JSON.stringify(data) })
}
```

### 4. Include User Info in Server Actions

```typescript
// ✅ Good - Get user in action
export async function createTask(formData: FormData) {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated" }
    // Use user.id for operations
}

// ❌ Bad - Trust client-provided user ID
export async function createTask(formData: FormData) {
    const userId = formData.get("userId")  // Can be forged!
}
```

### 5. Clean Up Sessions on Logout

```typescript
// ✅ Good - Delete session from database
await prisma.session.deleteMany({ where: { token: sessionToken } })
cookieStore.set("session", "", { maxAge: 0 })

// ❌ Bad - Only clear cookie
cookieStore.set("session", "", { maxAge: 0 })
```

## Testing Authentication

**From tests/e2e/auth.spec.ts:**
```typescript
import { test, expect } from '@playwright/test'

test.describe('Auth flows', () => {
    test('signup, see avatar, and logout', async ({ page }) => {
        // Use unique email to avoid conflicts
        const email = `e2e-${Date.now()}@example.com`
        await page.goto('/signup')

        await page.fill('input#name', 'E2E Tester')
        await page.fill('input#email', email)
        await page.fill('input#password', 'testpassword')
        await Promise.all([
            page.waitForNavigation(),
            page.click('button:has-text("Sign Up")'),
        ])

        // After signup, redirected to home
        await expect(page).toHaveURL(/\///)

        // Avatar should be visible
        const avatarTrigger = page.locator('[data-testid="auth-avatar"]')
        await expect(avatarTrigger).toBeVisible({ timeout: 5000 })
        
        // Logout
        await avatarTrigger.first().click()
        await page.click('text=Log out')
        await expect(page).toHaveURL(/\/login/)
    })

    test('login with seeded user and logout', async ({ page }) => {
        await page.goto('/login')
        await page.fill('input#email', 'alice@example.com')
        await page.fill('input#password', 'password123')
        await Promise.all([
            page.waitForNavigation(),
            page.click('button:has-text("Log In")'),
        ])

        await expect(page).toHaveURL(/\///)

        const avatarTrigger = page.locator('[data-testid="auth-avatar"]')
        await expect(avatarTrigger).toBeVisible({ timeout: 5000 })
        await avatarTrigger.first().click()
        await page.click('text=Log out')
        await expect(page).toHaveURL(/\/login/)
    })
})
```

## Session Management Considerations

### Session Lifecycle

1. **Creation** - When user logs in or signs up
2. **Validation** - On every protected route access
3. **Termination** - When user logs out

### Session Storage

```typescript
// Sessions stored in database with:
// - id: Auto-increment primary key
// - token: Unique random string
// - userId: Foreign key to User
// - createdAt: Timestamp
```

### Cookie Configuration

```typescript
cookieStore.set("session", sessionToken, {
    httpOnly: true,  // Prevents XSS
    path: "/",       // Available on all routes
    // Note: In production, also add:
    // secure: true,     // HTTPS only
    // sameSite: "lax",  // CSRF protection
})
```

## Summary

The authentication domain demonstrates secure, modern authentication patterns:

1. **Session-based authentication** with database storage
2. **bcrypt password hashing** with appropriate salt rounds
3. **HTTP-only cookies** to prevent XSS attacks
4. **Server Actions** for all authentication operations
5. **Cryptographically secure tokens** using crypto.randomBytes
6. **Route protection** at the layout level
7. **Action-level checks** for all mutations
8. **Generic error messages** to prevent user enumeration
9. **Server-side validation** for all operations
10. **Type-safe Prisma queries** with proper relations

This implementation provides robust security while maintaining simplicity and developer ergonomics.
