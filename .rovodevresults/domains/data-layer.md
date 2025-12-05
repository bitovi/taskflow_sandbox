# Data Layer Domain Implementation

## Overview
TaskFlow implements a server-first data layer using Prisma ORM with SQLite, Next.js server actions for mutations, and type-safe database operations throughout.

## Database Architecture

### Prisma Schema Structure
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  output   = "../app/generated/prisma"
  engineType = "binary"
}

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

### Database Client Configuration
```typescript
// Prisma client instantiation pattern
const prisma = new PrismaClient();
```

## Required Patterns

### 1. Server Actions for Data Mutations
All data mutations must use Next.js server actions with the `"use server"` directive:

```typescript
// app/(dashboard)/tasks/actions.ts
"use server";

import { getCurrentUser } from "@/app/login/actions";
import { PrismaClient } from "@/app/generated/prisma";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function createTask(formData: FormData) {
    const name = formData.get("title") as string;
    const description = formData.get("description") as string;
    const priority = formData.get("priority") as string;
    const status = formData.get("status") as string;
    const dueDate = formData.get("dueDate") as string;
    const assigneeIdRaw = formData.get("assigneeId") as string;
    const assigneeId = assigneeIdRaw ? parseInt(assigneeIdRaw, 10) : null;

    const user = await getCurrentUser();
    if (!user) return { error: "Not authenticated.", success: false, message: "Not authenticated." };

    if (!name) return { error: "Title is required.", success: false, message: "Title is required." };

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
        return { error: "Failed to create task.", success: false, message: "Failed to create task." };
    }
}
```

### 2. Type-Safe Database Queries
Use Prisma-generated types with include/select patterns:

```typescript
// Type-safe query with relationships
export async function getAllTasks() {
    try {
        const tasks = await prisma.task.findMany({
            include: {
                assignee: { select: { id: true, name: true, email: true } },
                creator: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: "desc" },
        });
        return { tasks, error: null };
    } catch (e) {
        return { tasks: [], error: "Failed to fetch tasks." };
    }
}
```

### 3. Structured Error Handling
Return consistent error response patterns:

```typescript
// Success response
return { error: null, success: true, message: "Operation successful!" };

// Error response
return { error: "Error message", success: false, message: "User-friendly message" };

// Query response
return { tasks: [], error: "Failed to fetch tasks." };
```

### 4. Cache Revalidation
Use `revalidatePath()` after mutations to refresh cached data:

```typescript
import { revalidatePath } from "next/cache";

export async function updateTask(taskId: number, formData: FormData) {
    try {
        await prisma.task.update({
            where: { id: taskId },
            data: { /* update data */ },
        });
        revalidatePath("/tasks"); // Refresh the tasks page cache
        return { error: null, success: true };
    } catch (e) {
        return { error: "Failed to update task.", success: false };
    }
}
```

## Form Data Processing

### FormData Extraction Pattern
Extract and validate form data consistently:

```typescript
export async function createTask(formData: FormData) {
    // Extract form fields
    const name = formData.get("title") as string; // Note: form field is "title", model field is "name"
    const description = formData.get("description") as string;
    const priority = formData.get("priority") as string;
    const status = formData.get("status") as string;
    const dueDate = formData.get("dueDate") as string;
    const assigneeIdRaw = formData.get("assigneeId") as string;
    
    // Type conversion and validation
    const assigneeId = assigneeIdRaw ? parseInt(assigneeIdRaw, 10) : null;
    
    // Required field validation
    if (!name) return { error: "Title is required.", success: false };
}
```

### Date Processing
Use date utilities for consistent date handling:

```typescript
import { parseDateString } from "@/lib/date-utils";

// Convert string dates to Date objects
dueDate: dueDate ? parseDateString(dueDate) : null,
```

## Authentication Integration

### User Context Pattern
Get current user context in server actions:

```typescript
export async function createTask(formData: FormData) {
    const user = await getCurrentUser();
    if (!user) return { error: "Not authenticated.", success: false };
    
    // Use user.id for creator/assignee logic
    const creatorId = user.id;
}
```

## Database Operations

### CRUD Operations
Follow consistent patterns for database operations:

```typescript
// Create
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

// Read with relationships
await prisma.task.findMany({
    include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
});

// Update
await prisma.task.update({
    where: { id: taskId },
    data: { status: newStatus },
});

// Delete
await prisma.task.delete({ 
    where: { id: taskId } 
});
```

### Complex Queries
Use Prisma's relationship and aggregation features:

```typescript
// Get team statistics with aggregations
export async function getTeamStats() {
    const totalMembers = await prisma.user.count();
    
    const openTasks = await prisma.task.count({
        where: {
            status: {
                in: ["todo", "in_progress", "review"],
            },
        },
    });
    
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
            assignedTasks: {
                _count: "desc",
            },
        },
        where: {
            assignedTasks: {
                some: { status: "done" },
            },
        },
    });
}
```

## Type Definitions

### Prisma Type Extensions
Extend Prisma types for component use:

```typescript
// lib/types.ts
import type { Task as PrismaTask, User } from "@/app/generated/prisma/client";

type TaskWithProfile = PrismaTask & {
  assignee?: Pick<User, "name"> | null;
};
```

### Complex Type Definitions
Create type-safe structures for UI components:

```typescript
// Dashboard page type definition
type Task = Prisma.TaskGetPayload<{
  include: {
    assignee: {
      select: {
        id: true;
        name: true;
        email: true;
        password: true;  // WARNING: This should be removed for security
      };
    };
    creator: {
      select: {
        id: true;
        name: true;
        email: true;
        password: true;  // WARNING: This should be removed for security
      };
    };
  };
}>;
```

## Database Utilities

### Seeding Pattern
Database seeding follows structured patterns:

```javascript
// prisma/seed.js
const { PrismaClient } = require('../app/generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedDatabase() {
    // Create users with hashed passwords
    const createdUsers = [];
    for (const userData of users) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        const user = await prisma.user.create({
            data: {
                ...userData,
                password: hashedPassword,
            },
        });
        createdUsers.push(user);
    }
    
    // Create tasks with relationships
    for (let i = 0; i < 30; i++) {
        const creator = getRandomElement(createdUsers);
        const assignee = Math.random() > 0.2 ? getRandomElement(createdUsers) : null;
        
        await prisma.task.create({
            data: {
                name: template.name,
                description: template.description,
                priority: template.priority,
                status: getRandomElement(statuses),
                dueDate: hasDueDate ? getRandomDate(new Date(), futureDate) : null,
                creatorId: creator.id,
                assigneeId: assignee?.id || null,
            },
        });
    }
}
```

## Performance Considerations

### Query Optimization
- Use `select` to limit fields when full objects aren't needed
- Use `include` sparingly and only for required relationships
- Order results consistently with `orderBy`

### Connection Management
- Create single PrismaClient instance per server action
- Disconnect properly in utility scripts
- Consider connection pooling for production

## Security Patterns

### Data Validation
- Validate all user inputs before database operations
- Check authentication before mutations
- Use proper TypeScript types for type safety

### Relationship Integrity
- Use Prisma's relationship features for referential integrity
- Handle optional relationships with nullable types
- Validate foreign key references before creation