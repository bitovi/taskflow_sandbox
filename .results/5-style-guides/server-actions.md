# Server Actions Style Guide

## Unique Patterns

### 1. File Structure
Server Actions are co-located with route segments in `actions.ts` files:

```
app/
├── (dashboard)/
│   └── tasks/
│       ├── page.tsx
│       └── actions.ts      # Task-related actions
├── login/
│   ├── page.tsx
│   └── actions.ts          # Auth actions
└── signup/
    ├── page.tsx
    └── actions.ts          # Signup actions
```

### 2. "use server" Directive
All Server Action files start with `"use server"`:

```typescript
"use server";

import { PrismaClient } from "@/app/generated/prisma";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function getAllTasks() {
    // ...
}
```

### 3. FormData Parameter Pattern
Server Actions receive FormData and manually parse fields:

```typescript
export async function createTask(formData: FormData) {
    const name = formData.get("title") as string;
    const description = formData.get("description") as string;
    const priority = formData.get("priority") as string;
    const status = formData.get("status") as string;
    const assigneeIdRaw = formData.get("assigneeId") as string;
    const assigneeId = assigneeIdRaw ? parseInt(assigneeIdRaw, 10) : null;
    
    // ... validation and mutation
}
```

### 4. Consistent Return Pattern
All actions return `{ error: string | null, success?: boolean, data?: any }`:

```typescript
export async function getAllTasks() {
    try {
        const tasks = await prisma.task.findMany({ /* ... */ });
        return { tasks, error: null };
    } catch (e) {
        return { tasks: [], error: "Failed to fetch tasks." };
    }
}

export async function createTask(formData: FormData) {
    // ... validation ...
    
    try {
        await prisma.task.create({ /* ... */ });
        revalidatePath("/tasks");
        return { error: null, success: true, message: "Task created successfully!" };
    } catch (e) {
        return { error: "Failed to create task.", success: false };
    }
}
```

### 5. Authentication Check Pattern
Actions requiring auth check current user first:

```typescript
const user = await getCurrentUser();
if (!user) return { error: "Not authenticated.", success: false };
```

### 6. safeUserSelect Usage
Always use `safeUserSelect` when including user relations:

```typescript
import { safeUserSelect } from "@/lib/safe-user-select";

const tasks = await prisma.task.findMany({
    include: {
        assignee: { select: safeUserSelect },
        creator: { select: safeUserSelect },
    },
});
```

### 7. revalidatePath After Mutations
Call `revalidatePath()` after successful data mutations:

```typescript
await prisma.task.create({ /* ... */ });
revalidatePath("/tasks");
return { error: null, success: true };
```

### 8. Date Handling
Use `parseDateString` utility for date fields:

```typescript
import { parseDateString } from "@/lib/date-utils";

const dueDate = formData.get("dueDate") as string;
await prisma.task.create({
    data: {
        // ...
        dueDate: dueDate ? parseDateString(dueDate) : null,
    },
});
```

### 9. Field Validation
Validate required fields before database operations:

```typescript
if (!name) return { error: "Title is required.", success: false };
if (!email) return { error: "Email is required." };
```

### 10. Prisma Client Instantiation
Create new `PrismaClient()` instance at module level:

```typescript
const prisma = new PrismaClient();
```

## Common Action Patterns

### Create Action
```typescript
export async function createTask(formData: FormData) {
    const user = await getCurrentUser();
    if (!user) return { error: "Not authenticated.", success: false };

    const name = formData.get("title") as string;
    if (!name) return { error: "Title is required.", success: false };

    try {
        await prisma.task.create({ data: { /* ... */ } });
        revalidatePath("/tasks");
        return { error: null, success: true, message: "Task created successfully!" };
    } catch (e) {
        return { error: "Failed to create task.", success: false };
    }
}
```

### Read Action
```typescript
export async function getAllTasks() {
    try {
        const tasks = await prisma.task.findMany({
            include: {
                assignee: { select: safeUserSelect },
                creator: { select: safeUserSelect },
            },
            orderBy: { createdAt: "desc" },
        });
        return { tasks, error: null };
    } catch (e) {
        return { tasks: [], error: "Failed to fetch tasks." };
    }
}
```

### Update Action
```typescript
export async function updateTask(taskId: number, formData: FormData) {
    const user = await getCurrentUser();
    if (!user) return { error: "Not authenticated.", success: false };

    try {
        await prisma.task.update({
            where: { id: taskId },
            data: { /* parsed fields */ },
        });
        revalidatePath("/tasks");
        return { error: null, success: true };
    } catch (e) {
        return { error: "Failed to update task.", success: false };
    }
}
```

### Delete Action
```typescript
export async function deleteTask(taskId: number) {
    try {
        await prisma.task.delete({ where: { id: taskId } });
        revalidatePath("/tasks");
        return { error: null };
    } catch (e) {
        return { error: "Failed to delete task." };
    }
}
```

## Security Conventions
- Never expose password field in queries
- Use `safeUserSelect` for user data
- Validate authentication before mutations
- Use generic error messages to prevent information leakage
- Use bcryptjs for password hashing (10 rounds)
- Store session tokens as httpOnly cookies
