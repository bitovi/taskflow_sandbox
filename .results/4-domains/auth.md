# Authentication Domain

## Overview
Custom session-based authentication using Prisma, bcryptjs for password hashing, and httpOnly cookies for session storage.

## Database Models

```prisma
model User {
  id            Int @id @default(autoincrement())
  email         String @unique
  password      String  // bcrypt hashed
  name          String
  sessions      Session[]
}

model Session {
  id        Int      @id @default(autoincrement())
  token     String   @unique
  userId    Int
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
}
```

## Key Patterns

### 1. User Registration

```typescript
// app/signup/actions.ts
"use server"

import { PrismaClient } from "@/app/generated/prisma";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

const prisma = new PrismaClient();

export async function signup(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;

    if (!email || !password || !name) {
        return { error: "All fields are required." };
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        return { error: "Email already in use." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
        data: { email, password: hashedPassword, name },
    });

    redirect("/login");
}
```

**Key Points:**
- Hash passwords with bcryptjs (10 rounds)
- Check for existing users before creation
- Never store plaintext passwords
- Redirect to login after successful signup

### 2. User Login

```typescript
// app/login/actions.ts
"use server"

import { cookies } from "next/headers";
import { PrismaClient } from "@/app/generated/prisma";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { redirect } from "next/navigation";

const prisma = new PrismaClient();

export async function login(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
        return { error: "Email and password are required." };
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        return { error: "Invalid email or password." };
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
        return { error: "Invalid email or password." };
    }

    // Create session
    const sessionToken = randomBytes(32).toString("hex");
    await prisma.session.create({
        data: {
            token: sessionToken,
            userId: user.id,
        },
    });

    const cookieStore = await cookies();
    cookieStore.set("session", sessionToken, { httpOnly: true, path: "/" });

    redirect("/");
}
```

**Key Points:**
- Verify password with `bcrypt.compare()`
- Generate random session token (32 bytes hex)
- Store session in database
- Set httpOnly cookie for security
- Generic error messages to prevent user enumeration

### 3. Get Current User

```typescript
// app/login/actions.ts
export async function getCurrentUser() {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;
    
    if (!sessionToken) return null;

    const session = await prisma.session.findUnique({
        where: { token: sessionToken },
        include: { user: true },
    });

    if (!session) return null;

    return session.user;
}
```

**Key Points:**
- Read session token from cookies
- Look up session in database
- Return user object or null
- Used for authentication checks

### 4. Logout

```typescript
// app/login/actions.ts
export async function logout() {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;
    
    if (sessionToken) {
        await prisma.session.deleteMany({ where: { token: sessionToken } });
        cookieStore.set("session", "", { maxAge: 0, path: "/" });
    }
    
    redirect("/login");
}
```

**Key Points:**
- Delete session from database
- Clear cookie
- Redirect to login page

### 5. Protected Layouts

```tsx
// app/(dashboard)/layout.tsx
import { getCurrentUser } from "@/app/login/actions";
import { redirect } from "next/navigation";

export default async function RootLayout({ children }) {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    return (
        <div className="flex h-screen">
            <Sidebar />
            <main>{children}</main>
        </div>
    );
}
```

**Key Points:**
- Check authentication in layout
- Redirect unauthenticated users
- Applies to all nested routes

### 6. Auth UI Components

```tsx
// components/auth-dropdown.tsx
"use client"

import { logout } from "@/app/login/actions"

export function AuthDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar>
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem asChild>
          <form action={logout}>
            <button type="submit">Log out</button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

**Key Points:**
- Form submission calls Server Action
- Works without JavaScript (progressive enhancement)
- Dropdown from Radix UI

## Security Best Practices

### Password Hashing
```typescript
const hashedPassword = await bcrypt.hash(password, 10);
```

### Password Verification
```typescript
const valid = await bcrypt.compare(plainPassword, hashedPassword);
```

### Session Token Generation
```typescript
import { randomBytes } from "crypto";
const token = randomBytes(32).toString("hex");
```

### HttpOnly Cookies
```typescript
cookieStore.set("session", token, { 
    httpOnly: true,  // Prevents JavaScript access
    path: "/"        // Available across entire site
});
```

### Safe User Selection
```typescript
// Never expose passwords in API responses
const user = await prisma.user.findUnique({
    where: { email },
    select: {
        id: true,
        name: true,
        email: true,
        // password: false (excluded)
    }
});
```

## Constraints
- **No JWT**: Use database-backed sessions, not JWT tokens
- **No OAuth**: Only email/password authentication
- **Server-Side Only**: All auth logic in Server Actions
- **HttpOnly Cookies**: Never store sessions in localStorage
- **Password Hashing**: Always use bcrypt with 10+ rounds
- **Generic Error Messages**: Don't reveal whether email exists
- **Layout-Level Guards**: Check auth in layouts, not individual pages
