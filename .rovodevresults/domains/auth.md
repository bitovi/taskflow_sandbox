# Auth Domain Implementation

## Overview
TaskFlow implements session-based authentication using bcryptjs for password hashing, database-stored sessions, and layout-based route protection.

## Authentication Architecture

### Session-Based Authentication
Uses database sessions instead of JWT tokens:

```prisma
// prisma/schema.prisma
model Session {
  id        Int      @id @default(autoincrement())
  token     String   @unique
  userId    Int
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
}

model User {
  id            Int @id @default(autoincrement())
  email         String @unique
  password      String
  name          String
  sessions      Session[]
  createdTasks  Task[] @relation("CreatedTasks")
  assignedTasks Task[] @relation("AssignedTasks")
}
```

## Required Patterns

### 1. Password Hashing with bcryptjs
All password operations must use bcryptjs with consistent salt rounds:

```typescript
// app/signup/actions.ts
import bcrypt from "bcryptjs";

export async function signUp(formData: FormData) {
    const password = formData.get("password") as string;
    
    // Hash password with 10 salt rounds
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
        },
    });
}
```

### 2. Server Actions for Authentication
Authentication operations use server actions with form validation:

```typescript
// app/login/actions.ts
"use server";

import bcrypt from "bcryptjs";
import { PrismaClient } from "@/app/generated/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const prisma = new PrismaClient();

export async function logIn(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
        return { error: "Email and password are required." };
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        return { error: "Invalid credentials." };
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
        return { error: "Invalid credentials." };
    }

    // Create session
    const session = await prisma.session.create({
        data: {
            token: generateSessionToken(),
            userId: user.id,
        },
    });

    // Set session cookie
    cookies().set("session", session.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    redirect("/");
}
```

### 3. Session Management
Get current user from session token:

```typescript
// app/login/actions.ts
export async function getCurrentUser() {
    const sessionToken = cookies().get("session")?.value;
    if (!sessionToken) return null;

    const session = await prisma.session.findUnique({
        where: { token: sessionToken },
        include: { user: true },
    });

    return session?.user || null;
}
```

### 4. Route Protection via Layouts
Protected routes use layout.tsx for authentication guards:

```tsx
// app/(dashboard)/layout.tsx
import { getCurrentUser } from "@/app/login/actions";
import { redirect } from "next/navigation";

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
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

## Authentication Flow Implementation

### Signup Process
```typescript
// app/signup/actions.ts
"use server";

export async function signUp(formData: FormData) {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // Validation
    if (!name || !email || !password) {
        return { error: "All fields are required." };
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        return { error: "User with this email already exists." };
    }

    try {
        // Create user with hashed password
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                name: name || "User",
                email,
                password: hashedPassword,
            },
        });

        // Auto-login by creating session
        const session = await prisma.session.create({
            data: {
                token: generateSessionToken(),
                userId: user.id,
            },
        });

        cookies().set("session", session.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7,
        });

    } catch (error) {
        return { error: "Something went wrong. Please try again." };
    }

    redirect("/");
}
```

### Login Process
```typescript
// app/login/actions.ts
export async function logIn(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // Validation
    if (!email || !password) {
        return { error: "Email and password are required." };
    }

    try {
        // Find user
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return { error: "Invalid credentials." };
        }

        // Verify password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return { error: "Invalid credentials." };
        }

        // Create session
        const session = await prisma.session.create({
            data: {
                token: generateSessionToken(),
                userId: user.id,
            },
        });

        // Set cookie
        cookies().set("session", session.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7,
        });

    } catch (error) {
        return { error: "Something went wrong. Please try again." };
    }

    redirect("/");
}
```

### Logout Process
```typescript
// app/login/actions.ts
export async function logOut() {
    const sessionToken = cookies().get("session")?.value;
    
    if (sessionToken) {
        // Delete session from database
        await prisma.session.delete({
            where: { token: sessionToken },
        });
    }

    // Clear session cookie
    cookies().delete("session");
    redirect("/login");
}
```

## Form Integration

### Login Form
```tsx
// app/login/page.tsx
import { logIn } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <Card className="w-[400px]">
                <CardHeader>
                    <CardTitle>Log In</CardTitle>
                </CardHeader>
                <CardContent>
                    <form action={logIn} className="space-y-4">
                        <Input 
                            id="email"
                            name="email" 
                            type="email" 
                            placeholder="Email" 
                            required 
                        />
                        <Input 
                            id="password"
                            name="password" 
                            type="password" 
                            placeholder="Password" 
                            required 
                        />
                        <Button type="submit" className="w-full">
                            Log In
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
```

### User Context in Components
```tsx
// components/auth-dropdown.tsx
import { getCurrentUser, logOut } from "@/app/login/actions";

export async function AuthDropdown() {
    const user = await getCurrentUser();
    
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" data-testid="auth-avatar">
                    <Avatar>
                        <AvatarFallback>
                            {getInitials(user?.name)}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    {user?.name}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <form action={logOut}>
                    <DropdownMenuItem asChild>
                        <button type="submit" className="w-full">
                            <LogOut className="mr-2 h-4 w-4" />
                            Log out
                        </button>
                    </DropdownMenuItem>
                </form>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
```

## Security Implementation

### Session Token Generation
```typescript
function generateSessionToken(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
```

### Cookie Configuration
```typescript
cookies().set("session", session.token, {
    httpOnly: true,                          // Prevent XSS
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "lax",                        // CSRF protection
    maxAge: 60 * 60 * 24 * 7,              // 1 week expiration
});
```

### Input Validation
```typescript
// Validate required fields
if (!email || !password) {
    return { error: "Email and password are required." };
}

// Validate user existence
const existingUser = await prisma.user.findUnique({ where: { email } });
if (existingUser) {
    return { error: "User with this email already exists." };
}
```

## Testing Integration

### Authentication Test Patterns
```typescript
// tests/e2e/auth.spec.ts
test('login with seeded user and logout', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input#email', 'alice@example.com');
    await page.fill('input#password', 'password123');
    await Promise.all([
        page.waitForNavigation(),
        page.click('button:has-text("Log In")'),
    ]);

    await expect(page).toHaveURL(/\//);
    
    const avatarTrigger = page.locator('[data-testid="auth-avatar"]');
    await expect(avatarTrigger).toBeVisible({ timeout: 5000 });
    await avatarTrigger.first().click();
    await page.click('text=Log out');
    await expect(page).toHaveURL(/\/login/);
});
```

## Authorization Patterns

### Protected Server Actions
```typescript
export async function createTask(formData: FormData) {
    // Check authentication before proceeding
    const user = await getCurrentUser();
    if (!user) {
        return { error: "Not authenticated.", success: false };
    }
    
    // Use user context for authorization
    const creatorId = user.id;
    
    // Proceed with authorized operation
}
```

### User Context for Business Logic
```typescript
// Use current user for task assignment logic
const user = await getCurrentUser();
const isTaskOwner = task.creatorId === user?.id;
const isTaskAssignee = task.assigneeId === user?.id;
```