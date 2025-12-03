# Server Actions Style Guide

## Unique Patterns in This Codebase

### 1. **"use server" Directive**
Every server action file starts with:
```typescript
"use server"
```

### 2. **Co-located with Route Pages**
Server actions live in `actions.ts` alongside their route pages:
- `app/(dashboard)/tasks/actions.ts`
- `app/login/actions.ts`
- `app/signup/actions.ts`

### 3. **PrismaClient Instantiation Pattern**
```typescript
import { PrismaClient } from "@/app/generated/prisma";
const prisma = new PrismaClient();
```
Note: Prisma client is generated to `app/generated/prisma` (non-standard location)

### 4. **FormData Parameter Pattern**
Actions accept FormData directly from forms:
```typescript
export async function createTask(formData: FormData) {
    const name = formData.get("title") as string;
    const description = formData.get("description") as string;
    const priority = formData.get("priority") as string;
    // ... more fields
}
```

### 5. **Consistent Return Object Structure**
All actions return objects with `error` and contextual properties:
```typescript
// Success case
return { error: null, success: true, message: "Task created successfully!" };

// Error case
return { error: "Failed to create task.", success: false };

// Read operation
return { tasks, error: null };
```

### 6. **Authentication Pattern**
Actions check authentication using `getCurrentUser()`:
```typescript
const user = await getCurrentUser();
if (!user) return { error: "Not authenticated.", success: false, message: "Not authenticated." };

const creatorId = user.id;
```

### 7. **Manual Path Revalidation**
After mutations, explicitly revalidate affected paths:
```typescript
import { revalidatePath } from "next/cache";

await prisma.task.create({ data: { /* ... */ } });
revalidatePath("/tasks");
return { error: null, success: true, message: "Task created successfully!" };
```

### 8. **Redirect After Auth Actions**
Login/signup actions redirect after success:
```typescript
const { redirect } = await import("next/navigation");
redirect("/");
```

### 9. **Session Management with Cookies**
```typescript
import { cookies } from "next/headers";

const cookieStore = await cookies();
cookieStore.set("session", sessionToken, { httpOnly: true, path: "/" });
```

### 10. **Date Parsing Utility**
Actions use custom date parser for form inputs:
```typescript
import { parseDateString } from "@/lib/date-utils";

dueDate: dueDate ? parseDateString(dueDate) : null,
```

### 11. **Nullable Field Handling**
Convert empty strings to null for optional foreign keys:
```typescript
const assigneeIdRaw = formData.get("assigneeId") as string;
const assigneeId = assigneeIdRaw ? parseInt(assigneeIdRaw, 10) : null;
```

### 12. **Try-Catch Error Handling**
All database operations wrapped in try-catch:
```typescript
try {
    await prisma.task.create({ data: { /* ... */ } });
    revalidatePath("/tasks");
    return { error: null, success: true, message: "Task created successfully!" };
} catch (e) {
    return { error: "Failed to create task.", success: false, message: "Failed to create task." };
}
```

### 13. **Password Hashing with bcryptjs**
```typescript
import bcrypt from "bcryptjs";

const hashed = await bcrypt.hash(password, 10);
const valid = await bcrypt.compare(password, user.password);
```

### 14. **Session Token Generation**
```typescript
import { randomBytes } from "crypto";

const sessionToken = randomBytes(32).toString("hex");
```

### 15. **Prisma Include Pattern**
Actions consistently include related data:
```typescript
const tasks = await prisma.task.findMany({
    include: {
        assignee: { select: { id: true, name: true, email: true, password: true } },
        creator: { select: { id: true, name: true, email: true, password: true } },
    },
    orderBy: { createdAt: "desc" },
});
```

### 16. **getCurrentUser Implementation**
Authentication state retrieved from session cookie:
```typescript
export async function getCurrentUser() {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;
    if (!sessionToken) return null;
    const session = await prisma.session.findUnique({
        where: { token: sessionToken },
        include: { user: true },
    });
    return session?.user || null;
}
```

### 17. **Complex Aggregation Pattern**
Team stats use Prisma's aggregation features:
```typescript
const topPerformer = await prisma.user.findFirst({
    include: {
        _count: {
            select: {
                assignedTasks: {
                    where: { status: "done" }
                }
            }
        }
    },
    orderBy: {
        assignedTasks: { _count: "desc" },
    },
    where: {
        assignedTasks: {
            some: { status: "done" },
        },
    },
});
```

## Creating a New Server Action File

### CRUD Actions Pattern
```typescript
"use server"

import { getCurrentUser } from "@/app/login/actions";
import { PrismaClient } from "@/app/generated/prisma";
import { revalidatePath } from "next/cache";
import { parseDateString } from "@/lib/date-utils";

const prisma = new PrismaClient();

// CREATE
export async function createItem(formData: FormData) {
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    
    const user = await getCurrentUser();
    if (!user) return { error: "Not authenticated.", success: false };
    
    if (!name) return { error: "Name is required.", success: false };
    
    try {
        await prisma.item.create({
            data: {
                name,
                description,
                userId: user.id,
            },
        });
        revalidatePath("/items");
        return { error: null, success: true, message: "Item created successfully!" };
    } catch (e) {
        return { error: "Failed to create item.", success: false };
    }
}

// READ
export async function getAllItems() {
    try {
        const items = await prisma.item.findMany({
            include: {
                user: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: "desc" },
        });
        return { items, error: null };
    } catch (e) {
        return { items: [], error: "Failed to fetch items." };
    }
}

// UPDATE
export async function updateItem(itemId: number, formData: FormData) {
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    
    const user = await getCurrentUser();
    if (!user) return { error: "Not authenticated.", success: false };
    
    if (!name) return { error: "Name is required.", success: false };
    
    try {
        await prisma.item.update({
            where: { id: itemId },
            data: { name, description },
        });
        revalidatePath("/items");
        return { error: null, success: true, message: "Item updated successfully!" };
    } catch (e) {
        return { error: "Failed to update item.", success: false };
    }
}

// DELETE
export async function deleteItem(itemId: number) {
    try {
        await prisma.item.delete({ where: { id: itemId } });
        revalidatePath("/items");
        return { error: null };
    } catch (e) {
        return { error: "Failed to delete item." };
    }
}
```

### Authentication Action Pattern
```typescript
"use server"

import { cookies } from "next/headers";
import { PrismaClient } from "@/app/generated/prisma";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

export async function authenticate(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    
    if (!email) return { error: "Email is required." };
    if (!password) return { error: "Password is required." };
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return { error: "Invalid credentials." };
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return { error: "Invalid credentials." };
    
    const sessionToken = randomBytes(32).toString("hex");
    await prisma.session.create({
        data: {
            token: sessionToken,
            userId: user.id,
        },
    });
    
    const cookieStore = await cookies();
    cookieStore.set("session", sessionToken, { httpOnly: true, path: "/" });
    
    const { redirect } = await import("next/navigation");
    redirect("/");
}

export async function getCurrentUser() {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;
    if (!sessionToken) return null;
    
    const session = await prisma.session.findUnique({
        where: { token: sessionToken },
        include: { user: true },
    });
    return session?.user || null;
}
```

## File Naming Conventions
- All server action files: `actions.ts`
- Located adjacent to route: `app/route-name/actions.ts`
- Protected routes: `app/(dashboard)/route-name/actions.ts`

## Import Order Pattern
1. "use server" directive (must be first)
2. Next.js server imports (cookies, revalidatePath, redirect)
3. Prisma client import
4. Third-party imports (bcryptjs, crypto)
5. Local utility imports

## Key Principles
- Always include "use server" at top
- Return consistent error/success objects
- Revalidate paths after mutations
- Check authentication before mutations
- Wrap database calls in try-catch
- Use FormData for form submissions
- Redirect after successful auth actions
