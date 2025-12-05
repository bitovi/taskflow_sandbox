# Server Actions Style Guide

## Unique Patterns and Conventions

### 1. "use server" Directive and File Organization
All server actions are in dedicated actions.ts files within route directories with mandatory "use server" directive:

```typescript
// app/(dashboard)/tasks/actions.ts
"use server";

import { getCurrentUser } from "@/app/login/actions";
// ... action implementations
```

### 2. Authentication-First Pattern
Every server action that modifies data must start with authentication check:

```typescript
export async function createTask(formData: FormData) {
    const user = await getCurrentUser();
    if (!user) return { error: "Not authenticated.", success: false, message: "Not authenticated." };
    
    // Continue with authenticated logic
}
```

### 3. FormData Extraction Pattern
Use specific field name extraction with type casting:

```typescript
export async function createTask(formData: FormData) {
    const name = formData.get("title") as string; // Note: form field "title" maps to model field "name"
    const description = formData.get("description") as string;
    const priority = formData.get("priority") as string;
    const assigneeIdRaw = formData.get("assigneeId") as string;
    const assigneeId = assigneeIdRaw ? parseInt(assigneeIdRaw, 10) : null;
}
```

### 4. Structured Response Pattern
Return objects with consistent structure for error handling:

```typescript
// Success response
return { error: null, success: true, message: "Task created successfully!" };

// Error response
return { error: "Failed to create task.", success: false, message: "Failed to create task." };

// Query response
return { tasks: [], error: "Failed to fetch tasks." };
```

### 5. Date Processing Pattern
Use utility functions for date conversion from form strings:

```typescript
import { parseDateString } from "@/lib/date-utils";

const dueDate = formData.get("dueDate") as string;
// ...
dueDate: dueDate ? parseDateString(dueDate) : null,
```

### 6. Prisma Client Instantiation
Create new PrismaClient instance at the top of each actions file:

```typescript
"use server";
import { PrismaClient } from "@/app/generated/prisma";

const prisma = new PrismaClient();
```

### 7. Revalidation After Mutations
Always call revalidatePath after successful mutations:

```typescript
try {
    await prisma.task.create({ data });
    revalidatePath("/tasks");
    return { error: null, success: true, message: "Task created successfully!" };
} catch (e) {
    return { error: "Failed to create task.", success: false };
}
```

### 8. Field Validation Pattern
Validate required fields early and return specific error messages:

```typescript
if (!name) return { error: "Title is required.", success: false, message: "Title is required." };
```

### 9. Relationship Handling
Include related data in queries using Prisma select/include patterns:

```typescript
const tasks = await prisma.task.findMany({
    include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
});
```

### 10. Try-Catch Error Handling
Wrap database operations in try-catch with generic error messages:

```typescript
try {
    await prisma.task.create({ data });
    // Success path
} catch (e) {
    return { error: "Failed to create task.", success: false, message: "Failed to create task." };
}
```