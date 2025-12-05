# Data Layer Domain Implementation

## Overview

The data layer uses Prisma ORM with SQLite for local development. All database operations are performed through Prisma Client, and mutations are handled via Next.js Server Actions.

## Key Technologies

- **Prisma ORM v6.13.0** - Type-safe database client
- **SQLite** - Local development database
- **Server Actions** - Server-side mutations
- **FormData API** - Form data handling
- **revalidatePath** - Cache invalidation

## Database Schema

**Location:** `prisma/schema.prisma`

```prisma
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

**Key relationships:**
- User has many created tasks (one-to-many via creatorId)
- User has many assigned tasks (one-to-many via assigneeId)
- User has many sessions (one-to-many)
- Task has one creator (required)
- Task has optional assignee

## Prisma Client Usage

### Initialization

```typescript
import { PrismaClient } from "@/app/generated/prisma"

const prisma = new PrismaClient()
```

**Custom output path:**
- Prisma Client is generated to `app/generated/prisma`
- Imported as `@/app/generated/prisma`

### Type-Safe Queries

**From tasks/actions.ts:**
```typescript
import { PrismaClient } from "@/app/generated/prisma"

const prisma = new PrismaClient()

export async function getAllTasks() {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        assignee: { 
          select: { id: true, name: true, email: true, password: true } 
        },
        creator: { 
          select: { id: true, name: true, email: true, password: true } 
        },
      },
      orderBy: { createdAt: "desc" },
    })
    return { tasks, error: null }
  } catch (e) {
    return { tasks: [], error: "Failed to fetch tasks." }
  }
}
```

**Key features:**
- `include` for relations (assignee, creator)
- `select` to limit fields returned
- `orderBy` for sorting
- Error handling with try/catch

## Server Actions Pattern

### Create Operation

**From tasks/actions.ts:**
```typescript
"use server"

import { getCurrentUser } from "@/app/login/actions"
import { PrismaClient } from "@/app/generated/prisma"
import { revalidatePath } from "next/cache"
import { parseDateString } from "@/lib/date-utils"

const prisma = new PrismaClient()

export async function createTask(formData: FormData) {
  const name = formData.get("title") as string
  const description = formData.get("description") as string
  const priority = formData.get("priority") as string
  const status = formData.get("status") as string
  const dueDate = formData.get("dueDate") as string
  const assigneeIdRaw = formData.get("assigneeId") as string
  const assigneeId = assigneeIdRaw ? parseInt(assigneeIdRaw, 10) : null

  const user = await getCurrentUser()
  if (!user) return { 
    error: "Not authenticated.", 
    success: false, 
    message: "Not authenticated." 
  }

  const creatorId = user.id

  if (!name) return { 
    error: "Title is required.", 
    success: false, 
    message: "Title is required." 
  }

  try {
    await prisma.task.create({
      data: {
        name,
        description,
        priority,
        status,
        dueDate: dueDate ? parseDateString(dueDate) : null,
        creatorId,
        assigneeId,
      },
    })
    revalidatePath("/tasks")
    return { 
      error: null, 
      success: true, 
      message: "Task created successfully!" 
    }
  } catch (e) {
    return { 
      error: "Failed to create task.", 
      success: false, 
      message: "Failed to create task." 
    }
  }
}
```

**Pattern elements:**
1. `"use server"` directive at top
2. Extract data from FormData
3. Validate authentication
4. Validate input data
5. Perform database operation
6. Call `revalidatePath()` to refresh UI
7. Return consistent response shape

### Read Operation

```typescript
export async function getAllTasks() {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        assignee: { select: { id: true, name: true, email: true, password: true } },
        creator: { select: { id: true, name: true, email: true, password: true } },
      },
      orderBy: { createdAt: "desc" },
    })
    return { tasks, error: null }
  } catch (e) {
    return { tasks: [], error: "Failed to fetch tasks." }
  }
}
```

### Update Operation

```typescript
export async function updateTask(taskId: number, formData: FormData) {
  const name = formData.get("title") as string
  const description = formData.get("description") as string
  const priority = formData.get("priority") as string
  const status = formData.get("status") as string
  const dueDate = formData.get("dueDate") as string
  const assigneeIdRaw = formData.get("assigneeId") as string
  const assigneeId = assigneeIdRaw ? parseInt(assigneeIdRaw, 10) : null

  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated.", success: false }

  if (!name) return { error: "Title is required.", success: false }

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
    })
    revalidatePath("/tasks")
    return { error: null, success: true }
  } catch (e) {
    return { error: "Failed to update task.", success: false }
  }
}
```

### Update Single Field (Status)

```typescript
export async function updateTaskStatus(taskId: number, status: string) {
  try {
    await prisma.task.update({ 
      where: { id: taskId }, 
      data: { status } 
    })
    revalidatePath("/tasks")
    return { error: null }
  } catch (e) {
    return { error: "Failed to update task status." }
  }
}
```

### Delete Operation

```typescript
export async function deleteTask(taskId: number) {
  try {
    await prisma.task.delete({ where: { id: taskId } })
    revalidatePath("/tasks")
    return { error: null }
  } catch (e) {
    return { error: "Failed to delete task." }
  }
}
```

## Query Patterns

### Find Many with Relations

```typescript
const tasks = await prisma.task.findMany({
  include: {
    assignee: { select: { id: true, name: true, email: true } },
    creator: { select: { id: true, name: true, email: true } },
  },
  orderBy: { createdAt: "desc" },
})
```

### Find Unique

```typescript
const user = await prisma.user.findUnique({ 
  where: { email } 
})
```

### Find Unique with Relations

**From login/actions.ts:**
```typescript
const session = await prisma.session.findUnique({
  where: { token: sessionToken },
  include: { user: true },
})
return session?.user || null
```

### Find Many with Select

```typescript
export async function getAllUsers() {
  return prisma.user.findMany({ 
    select: { id: true, name: true } 
  })
}
```

### Count and Aggregation

**From tasks/actions.ts (getTeamStats):**
```typescript
export async function getTeamStats() {
  try {
    const totalMembers = await prisma.user.count()
    
    const openTasks = await prisma.task.count({
      where: {
        status: { in: ["todo", "in_progress", "review"] },
      },
    })
    
    const tasksCompleted = await prisma.task.count({
      where: { status: "done" },
    })

    const tasksWithAssignee = await prisma.task.findMany({
      where: {
        status: "done",
        assigneeId: { not: null },
      },
      select: {
        assigneeId: true,
        assignee: { select: { name: true } },
      },
    })

    // Count tasks per assignee
    const assigneeTaskCount = new Map<number, { name: string; count: number }>()
    for (const task of tasksWithAssignee) {
      if (task.assigneeId) {
        const existing = assigneeTaskCount.get(task.assigneeId)
        if (existing) {
          existing.count++
        } else {
          assigneeTaskCount.set(task.assigneeId, {
            name: task.assignee?.name || "Unknown",
            count: 1,
          })
        }
      }
    }

    const topPerformerEntry = Array.from(assigneeTaskCount.values())
      .sort((a, b) => b.count - a.count)[0]

    return {
      totalMembers,
      openTasks,
      tasksCompleted,
      topPerformer: topPerformerEntry
        ? { name: topPerformerEntry.name, completedCount: topPerformerEntry.count }
        : null,
      error: null,
    }
  } catch (e) {
    return {
      totalMembers: 0,
      openTasks: 0,
      tasksCompleted: 0,
      topPerformer: null,
      error: "Failed to fetch team stats.",
    }
  }
}
```

## Data Type Utilities

### Date Handling

**From lib/date-utils.ts:**
```typescript
// Parse date string to Date object at local noon
export function parseDateString(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day, 12, 0, 0)
}

// Convert Date to YYYY-MM-DD for input fields
export function formatDateForInput(date: Date | string): string {
  let dateObj: Date
  if (typeof date === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      dateObj = parseDateString(date)
    } else {
      dateObj = new Date(date)
    }
  } else {
    dateObj = date
  }
  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const day = String(dateObj.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Format date for display (e.g., "Aug 08")
export function formatDateForDisplay(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const month = months[dateObj.getMonth()]
  const day = String(dateObj.getDate()).padStart(2, '0')
  return `${month} ${day}`
}
```

## Database Scripts

### Seeding

**From prisma/seed.js:**
```javascript
const { PrismaClient } = require('../app/generated/prisma')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  // Hash password for all users
  const hashedPassword = await bcrypt.hash('password123', 10)

  // Create users
  const createdUsers = []
  for (const userData of users) {
    const user = await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
      },
    })
    createdUsers.push(user)
  }

  // Create tasks
  for (let i = 0; i < 30; i++) {
    const template = taskTemplates[i % taskTemplates.length]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const creator = createdUsers[Math.floor(Math.random() * createdUsers.length)]
    const assignee = Math.random() > 0.2 
      ? createdUsers[Math.floor(Math.random() * createdUsers.length)]
      : null

    await prisma.task.create({
      data: {
        name: template.name,
        description: template.description,
        priority: template.priority,
        status: status,
        dueDate: randomDueDate(),
        creatorId: creator.id,
        assigneeId: assignee?.id,
      },
    })
  }

  console.log('✅ Database seeded successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

### Clearing

**From prisma/clear.js:**
```javascript
const { PrismaClient } = require('../app/generated/prisma')

const prisma = new PrismaClient()

async function clearDatabase() {
  try {
    // Delete in correct order due to foreign key constraints
    await prisma.task.deleteMany({})
    await prisma.session.deleteMany({})
    await prisma.user.deleteMany({})
    
    console.log('🎉 Database cleared successfully!')
  } catch (error) {
    console.error('❌ Error clearing database:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

clearDatabase()
```

## Cache Invalidation

### revalidatePath Pattern

After every mutation, call `revalidatePath()`:

```typescript
import { revalidatePath } from "next/cache"

export async function createTask(formData: FormData) {
  await prisma.task.create({ data })
  revalidatePath("/tasks")  // ← Invalidate tasks page cache
  return { success: true }
}
```

**Paths to revalidate:**
- `/tasks` - After creating, updating, or deleting tasks
- `/board` - If Kanban board has its own page (currently shares data)
- `/` - Dashboard page if aggregated data changes

## Type Safety

### Using Prisma Types

```typescript
import type { Task as PrismaTask, User } from "@/app/generated/prisma/client"

type TaskWithProfile = PrismaTask & {
  assignee?: Pick<User, "name"> | null
}
```

### Prisma Payload Types

```typescript
import { Prisma } from "@/app/generated/prisma"

type Task = Prisma.TaskGetPayload<{
  include: {
    assignee: {
      select: {
        id: true
        name: true
        email: true
      }
    }
    creator: {
      select: {
        id: true
        name: true
        email: true
      }
    }
  }
}>
```

## Best Practices

### 1. Always Use Prisma Client

```typescript
// ✅ Good - Use Prisma
const tasks = await prisma.task.findMany()

// ❌ Bad - Raw SQL
const tasks = await prisma.$queryRaw`SELECT * FROM Task`
```

### 2. Include Relations When Needed

```typescript
// ✅ Good - Include related data
const tasks = await prisma.task.findMany({
  include: {
    assignee: { select: { id: true, name: true } },
  },
})

// ❌ Bad - Separate queries
const tasks = await prisma.task.findMany()
for (const task of tasks) {
  task.assignee = await prisma.user.findUnique({ 
    where: { id: task.assigneeId } 
  })
}
```

### 3. Validate Auth Before Mutations

```typescript
// ✅ Good - Check authentication
export async function createTask(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated." }
  
  await prisma.task.create({ data })
}

// ❌ Bad - No auth check
export async function createTask(formData: FormData) {
  await prisma.task.create({ data })
}
```

### 4. Always Revalidate After Mutations

```typescript
// ✅ Good - Revalidate cache
export async function deleteTask(taskId: number) {
  await prisma.task.delete({ where: { id: taskId } })
  revalidatePath("/tasks")
}

// ❌ Bad - No revalidation
export async function deleteTask(taskId: number) {
  await prisma.task.delete({ where: { id: taskId } })
}
```

### 5. Consistent Error Handling

```typescript
// ✅ Good - Consistent response shape
try {
  await prisma.task.create({ data })
  return { error: null, success: true }
} catch (e) {
  return { error: "Failed to create task.", success: false }
}

// ❌ Bad - Throwing errors
try {
  await prisma.task.create({ data })
} catch (e) {
  throw new Error("Failed")
}
```

## Testing

**From tasks-actions.test.ts:**
```typescript
import { createTask, getAllTasks } from '@/app/(dashboard)/tasks/actions'

// Mock Prisma
jest.mock('@/app/generated/prisma', () => ({
  PrismaClient: jest.fn(() => ({
    task: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  })),
}))

describe('Task Actions', () => {
  it('creates a task', async () => {
    const formData = new FormData()
    formData.append('title', 'Test Task')
    formData.append('description', 'Test Description')
    
    const result = await createTask(formData)
    expect(result.success).toBe(true)
  })
})
```

## Summary

The data layer follows these principles:

1. **Prisma ORM for all database operations**
2. **Server Actions for mutations**
3. **FormData API for form submissions**
4. **revalidatePath() after every mutation**
5. **Consistent error handling and response shapes**
6. **Type safety with Prisma types**
7. **Authentication checks before mutations**
8. **Relations included when needed for UI**
