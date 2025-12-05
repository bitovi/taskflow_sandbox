# Data Layer Domain

## Overview
All database operations use Prisma ORM with Server Actions as the exclusive data access layer. The project follows a server-first approach with no REST/GraphQL API layer.

## Database Schema

```prisma
// prisma/schema.prisma
datasource db {
  provider = "sqlite"
  url      = "file:app.db"
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

model Session {
  id        Int      @id @default(autoincrement())
  token     String   @unique
  userId    Int
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
}

model Task {
  id          Int      @id @default(autoincrement())
  name        String
  description String
  priority    String
  status      String
  dueDate     DateTime?
  assigneeId  Int?
  assignee    User?    @relation("AssignedTasks", fields: [assigneeId], references: [id])
  creatorId   Int
  creator     User     @relation("CreatedTasks", fields: [creatorId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## Key Patterns

### 1. Server Actions for Data Access

All data operations happen through Server Actions:

```typescript
// app/(dashboard)/tasks/actions.ts
"use server";

import { PrismaClient } from "@/app/generated/prisma";
import { revalidatePath } from "next/cache";
import { safeUserSelect } from "@/lib/safe-user-select";

const prisma = new PrismaClient();

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

**Key Points:**
- `"use server"` directive at the top of file
- Create new `PrismaClient()` instance per file
- Return object with `{ data, error }` pattern
- Include related data with `include` and `select`
- Always use `safeUserSelect` for user data

### 2. Safe User Data Selection

**Critical Security Pattern**: Never expose password fields in API responses.

```typescript
// lib/safe-user-select.ts
export const safeUserSelect = {
  id: true,
  name: true,
  // Explicitly excluding email and password for security
} as const;

export type SafeUser = {
  id: number;
  name: string;
};
```

Usage in queries:
```typescript
const tasks = await prisma.task.findMany({
    include: {
        assignee: { select: safeUserSelect },
        creator: { select: safeUserSelect },
    },
});
```

**Key Points:**
- Always use `safeUserSelect` when including user relations
- Never select password field
- Limit email exposure (not in safeUserSelect)
- Export type for type safety

### 3. Data Mutations with Revalidation

```typescript
export async function createTask(formData: FormData) {
    const name = formData.get("title") as string;
    const description = formData.get("description") as string;
    const priority = formData.get("priority") as string;
    const status = formData.get("status") as string;
    const dueDate = formData.get("dueDate") as string;
    const assigneeIdRaw = formData.get("assigneeId") as string;
    const assigneeId = assigneeIdRaw ? parseInt(assigneeIdRaw, 10) : null;

    const user = await getCurrentUser();
    if (!user) return { error: "Not authenticated.", success: false };

    if (!name) return { error: "Title is required.", success: false };

    try {
        await prisma.task.create({
            data: {
                name,
                description,
                priority,
                status,
                dueDate: dueDate ? parseDateString(dueDate) : null,
                creatorId: user.id,
                assigneeId,
            },
        });
        revalidatePath("/tasks");
        return { error: null, success: true, message: "Task created successfully!" };
    } catch (e) {
        return { error: "Failed to create task.", success: false };
    }
}
```

**Key Points:**
- Parse FormData fields (Server Actions receive FormData, not JSON)
- Validate required fields before mutation
- Check authentication using `getCurrentUser()`
- Call `revalidatePath()` after successful mutation to update cache
- Return success/error status for client handling

### 4. Update Operations

```typescript
export async function updateTask(taskId: number, formData: FormData) {
    const name = formData.get("title") as string;
    const description = formData.get("description") as string;
    const priority = formData.get("priority") as string;
    const status = formData.get("status") as string;
    const dueDate = formData.get("dueDate") as string;
    const assigneeIdRaw = formData.get("assigneeId") as string;
    const assigneeId = assigneeIdRaw ? parseInt(assigneeIdRaw, 10) : null;

    const user = await getCurrentUser();
    if (!user) return { error: "Not authenticated.", success: false };

    if (!name) return { error: "Title is required.", success: false };

    try {
        await prisma.task.update({
            where: { id: taskId },
            data: {
                name,
                description,
                priority,
                status,
                dueDate: dueDate ? parseDateString(dueDate) : null,
                assigneeId,
            },
        });
        revalidatePath("/tasks");
        return { error: null, success: true, message: "Task updated successfully!" };
    } catch (e) {
        return { error: "Failed to update task.", success: false };
    }
}
```

### 5. Delete Operations

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

### 6. Partial Updates

```typescript
export async function updateTaskStatus(taskId: number, status: string) {
    try {
        await prisma.task.update({ 
            where: { id: taskId }, 
            data: { status } 
        });
        revalidatePath("/tasks");
        return { error: null };
    } catch (e) {
        return { error: "Failed to update task status." };
    }
}
```

## Common Patterns

### Date Handling
Use utility functions for consistent date parsing:

```typescript
import { parseDateString } from "@/lib/date-utils";

const dueDate = formData.get("dueDate") as string;
const parsedDate = dueDate ? parseDateString(dueDate) : null;

await prisma.task.create({
    data: {
        // ...
        dueDate: parsedDate,
    },
});
```

### Error Handling Pattern
Consistent error response structure:

```typescript
try {
    // ... database operation ...
    return { error: null, success: true, data: result };
} catch (e) {
    return { error: "User-friendly error message", success: false };
}
```

### Authentication Check
Always verify user before mutations:

```typescript
const user = await getCurrentUser();
if (!user) return { error: "Not authenticated.", success: false };
```

## Constraints
- **No API Routes**: Never create REST endpoints in `app/api/`; use Server Actions
- **No Direct Prisma in Client Components**: Prisma calls only in Server Actions or Server Components
- **Always Use safeUserSelect**: Never expose password or sensitive user data
- **Always Revalidate**: Call `revalidatePath()` after mutations
- **Consistent Error Handling**: Return `{ error: string | null }` pattern
- **FormData Parsing**: Server Actions receive FormData, not JSON objects
- **New PrismaClient Per File**: Instantiate Prisma client at the module level in each actions file
