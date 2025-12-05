# TaskFlow - Detailed Fix Suggestions

## Table of Contents

1. [Critical Security Issues](#critical-security-issues)
2. [Configuration Problems](#configuration-problems)
3. [Code Quality Issues](#code-quality-issues)
4. [Performance Optimizations](#performance-optimizations)
5. [Accessibility Improvements](#accessibility-improvements)
6. [Error Handling & Logging](#error-handling--logging)
7. [Database Optimizations](#database-optimizations)
8. [Testing Enhancements](#testing-enhancements)

---

## Critical Security Issues

### 🔴 Issue 1: Password Exposure in API Responses

**Problem Location**: `app/(dashboard)/tasks/actions.ts:48-49`

**Current Code**:
```typescript
include: {
    assignee: { select: { id: true, name: true, email: true, password: true } },
    creator: { select: { id: true, name: true, email: true, password: true } },
},
```

**Explanation**: 
The `getAllTasks()` function is selecting and potentially exposing hashed passwords in API responses. Even though passwords are hashed, they should never be included in API responses as this violates security best practices and could lead to data exposure.

**Security Risk**: 
- **Severity**: Critical
- **Impact**: Potential password hash exposure
- **Exploitability**: High if API responses are logged or cached

**Fix Implementation**:
```typescript
// File: app/(dashboard)/tasks/actions.ts
export async function getAllTasks() {
    try {
        const tasks = await prisma.task.findMany({
            include: {
                // Remove password and email from selection
                assignee: { 
                    select: { 
                        id: true, 
                        name: true 
                    } 
                },
                creator: { 
                    select: { 
                        id: true, 
                        name: true 
                    } 
                },
            },
            orderBy: { createdAt: "desc" },
        });
        return { tasks, error: null };
    } catch (e) {
        return { tasks: [], error: "Failed to fetch tasks." };
    }
}
```

**Additional Security Measures**:
1. Create a dedicated type for public user data:
```typescript
// File: lib/types.ts
export type PublicUser = Pick<User, 'id' | 'name'>;
```

2. Add a utility function for safe user selection:
```typescript
// File: lib/user-utils.ts
export const safeUserSelect = {
    id: true,
    name: true,
    // Explicitly exclude sensitive fields
} as const;
```

---

### 🔴 Issue 2: Insecure Session Management

**Problem Location**: `app/login/actions.ts:24-32`

**Current Code**:
```typescript
const sessionToken = randomBytes(32).toString("hex");
await prisma.session.create({
    data: {
        token: sessionToken,
        userId: user.id,
    },
});
cookieStore.set("session", sessionToken, { httpOnly: true, path: "/" });
```

**Explanation**: 
The current session implementation lacks critical security features:
- No session expiration
- No secure cookie flags
- No CSRF protection
- Sessions are never cleaned up

**Security Risk**: 
- **Severity**: High
- **Impact**: Session hijacking, indefinite session persistence
- **Exploitability**: Medium to High

**Fix Implementation**:

1. **Update Session Schema**:
```typescript
// File: prisma/schema.prisma
model Session {
  id        Int      @id @default(autoincrement())
  token     String   @unique
  userId    Int
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  expiresAt DateTime // Add expiration
  isActive  Boolean  @default(true) // Add active status
}
```

2. **Secure Session Creation**:
```typescript
// File: app/login/actions.ts
export async function login(formData: FormData) {
    // ... validation code ...

    // Create session with expiration (7 days)
    const sessionToken = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    await prisma.session.create({
        data: {
            token: sessionToken,
            userId: user.id,
            expiresAt,
        },
    });

    const cookieStore = await cookies();
    cookieStore.set("session", sessionToken, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: "/",
        expires: expiresAt
    });

    redirect("/");
}
```

3. **Session Validation with Expiration**:
```typescript
// File: app/login/actions.ts
export async function getCurrentUser() {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;
    if (!sessionToken) return null;

    const session = await prisma.session.findUnique({
        where: { 
            token: sessionToken,
            expiresAt: { gte: new Date() }, // Check expiration
            isActive: true
        },
        include: { 
            user: {
                select: safeUserSelect // Use safe selection
            }
        },
    });

    if (!session) {
        // Clean up expired session
        await prisma.session.deleteMany({ 
            where: { token: sessionToken } 
        });
        return null;
    }

    return session.user;
}
```

4. **Session Cleanup Job**:
```typescript
// File: lib/session-cleanup.ts
export async function cleanupExpiredSessions() {
    const result = await prisma.session.deleteMany({
        where: {
            OR: [
                { expiresAt: { lt: new Date() } },
                { isActive: false }
            ]
        }
    });
    console.log(`Cleaned up ${result.count} expired sessions`);
    return result.count;
}
```

---

## Configuration Problems

### 🔴 Issue 3: Dangerous Build Configuration

**Problem Location**: `next.config.ts:8-14`

**Current Code**:
```typescript
eslint: {
    ignoreDuringBuilds: true,
},
typescript: {
    ignoreBuildErrors: true,
},
```

**Explanation**: 
These settings ignore TypeScript and ESLint errors during builds, which can lead to deploying broken or insecure code to production. This defeats the purpose of having these tools for code quality and type safety.

**Risk**: 
- **Severity**: High
- **Impact**: Broken code in production, security vulnerabilities
- **Best Practice Violation**: Ignoring static analysis tools

**Fix Implementation**:

1. **Environment-Specific Configuration**:
```typescript
// File: next.config.ts
import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ["localhost:3000"]
    }
  },
  eslint: {
    // Only ignore in development for faster builds
    ignoreDuringBuilds: isDevelopment,
  },
  typescript: {
    // Never ignore TypeScript errors in production
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
```

2. **Environment Variables Setup**:
```bash
# File: .env.example
NODE_ENV=development
ALLOWED_ORIGINS=localhost:3000,yourdomain.com
DATABASE_URL=file:./app.db
SESSION_SECRET=your-secret-key-here
```

3. **Add Build Validation Script**:
```json
// File: package.json (add to scripts)
{
  "scripts": {
    "build:check": "npm run lint && npm run type-check && npm run build",
    "type-check": "tsc --noEmit",
    "lint:fix": "next lint --fix"
  }
}
```

---

### 🟠 Issue 4: Missing Environment Configuration

**Problem**: No environment variable setup or validation

**Explanation**: 
The application lacks proper environment configuration, making it difficult to deploy securely across different environments (development, staging, production).

**Fix Implementation**:

1. **Environment Schema Validation**:
```typescript
// File: lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  ALLOWED_ORIGINS: z.string().default('localhost:3000'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

export const env = envSchema.parse(process.env);
```

2. **Update Dependencies**:
```bash
npm install zod
```

3. **Use Environment Variables**:
```typescript
// File: app/login/actions.ts
import { env } from '@/lib/env';

// Use environment-based session secret
const sessionToken = randomBytes(32).toString("hex");
// Add HMAC signing with secret for additional security
```

---

## Code Quality Issues

### 🟡 Issue 5: Inconsistent Error Handling

**Problem Location**: Multiple server actions

**Current Code Examples**:
```typescript
// Some return { error, success, message }
return { error: "Failed to create task.", success: false, message: "Failed to create task." };

// Others return just { error }
return { error: "Failed to delete task." };

// Others return different shapes
return { tasks: [], error: "Failed to fetch tasks." };
```

**Explanation**: 
Inconsistent error response formats make it difficult to handle errors uniformly across the application and can lead to bugs in error handling logic.

**Fix Implementation**:

1. **Standardized Response Types**:
```typescript
// File: lib/action-types.ts
export type ActionSuccess<T = void> = {
  success: true;
  data: T;
  error: null;
  message?: string;
};

export type ActionError = {
  success: false;
  data: null;
  error: string;
  message?: string;
};

export type ActionResult<T = void> = ActionSuccess<T> | ActionError;

// Helper functions
export function createSuccessResult<T>(data: T, message?: string): ActionSuccess<T> {
  return {
    success: true,
    data,
    error: null,
    message,
  };
}

export function createErrorResult(error: string, message?: string): ActionError {
  return {
    success: false,
    data: null,
    error,
    message: message || error,
  };
}
```

2. **Refactor Server Actions**:
```typescript
// File: app/(dashboard)/tasks/actions.ts
import { ActionResult, createSuccessResult, createErrorResult } from '@/lib/action-types';

export async function createTask(formData: FormData): Promise<ActionResult<void>> {
    const name = formData.get("title") as string;
    // ... other validations ...

    const user = await getCurrentUser();
    if (!user) {
        return createErrorResult("Not authenticated.", "Please log in to create tasks.");
    }

    if (!name) {
        return createErrorResult("Title is required.", "Please provide a task title.");
    }

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
        return createSuccessResult(undefined, "Task created successfully!");
    } catch (e) {
        console.error('Failed to create task:', e);
        return createErrorResult("Failed to create task.", "An unexpected error occurred. Please try again.");
    }
}

export async function getAllTasks(): Promise<ActionResult<TaskWithProfile[]>> {
    try {
        const tasks = await prisma.task.findMany({
            include: {
                assignee: { select: safeUserSelect },
                creator: { select: safeUserSelect },
            },
            orderBy: { createdAt: "desc" },
        });
        
        return createSuccessResult(tasks);
    } catch (e) {
        console.error('Failed to fetch tasks:', e);
        return createErrorResult("Failed to fetch tasks.", "Unable to load tasks. Please refresh the page.");
    }
}
```

3. **Update Components to Use New Format**:
```typescript
// File: components/create-task-form.tsx
const [state, formAction] = useActionState(createTaskAction, {
    success: false,
    data: null,
    error: null,
    message: ""
});

// Handle success/error consistently
useEffect(() => {
    if (state.success && state.message && onFinish) {
        onFinish();
    }
}, [state, onFinish]);

// Render errors consistently
{state.error && (
    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
        {state.message || state.error}
    </div>
)}
{state.success && state.message && (
    <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
        {state.message}
    </div>
)}
```

---

### 🟡 Issue 6: Magic Numbers and Hard-coded Values

**Problem Locations**: Various files

**Current Issues**:
```typescript
// Hard-coded status values
const statuses = ['todo', 'in_progress', 'done', 'review'];

// Magic numbers
const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

// Hard-coded origins
allowedOrigins: ["localhost:3000"]
```

**Fix Implementation**:

1. **Create Constants File**:
```typescript
// File: lib/constants.ts
export const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  REVIEW: 'review',
  DONE: 'done',
} as const;

export const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export const SESSION_CONFIG = {
  EXPIRY_DAYS: 7,
  CLEANUP_INTERVAL_HOURS: 24,
} as const;

export const UI_CONFIG = {
  AVATAR_SIZE: {
    SM: 'h-6 w-6',
    MD: 'h-8 w-8',
    LG: 'h-10 w-10',
  },
} as const;

// Derived types
export type TaskStatus = typeof TASK_STATUS[keyof typeof TASK_STATUS];
export type TaskPriority = typeof TASK_PRIORITY[keyof typeof TASK_PRIORITY];
```

2. **Update Prisma Schema with Enums**:
```prisma
// File: prisma/schema.prisma
enum TaskStatus {
  todo
  in_progress
  review
  done
}

enum TaskPriority {
  low
  medium
  high
}

model Task {
  id          Int         @id @default(autoincrement())
  name        String
  description String
  priority    TaskPriority
  status      TaskStatus
  // ... rest of fields
}
```

3. **Use Constants Throughout Application**:
```typescript
// File: components/create-task-form.tsx
import { TASK_STATUS, TASK_PRIORITY } from '@/lib/constants';

<Select name="status" defaultValue={TASK_STATUS.TODO}>
  <SelectContent>
    <SelectItem value={TASK_STATUS.TODO}>Todo</SelectItem>
    <SelectItem value={TASK_STATUS.IN_PROGRESS}>In Progress</SelectItem>
    <SelectItem value={TASK_STATUS.REVIEW}>Review</SelectItem>
    <SelectItem value={TASK_STATUS.DONE}>Done</SelectItem>
  </SelectContent>
</Select>
```

---

## Performance Optimizations

### 🟡 Issue 7: Missing Database Indexes

**Problem**: Database queries without proper indexing

**Explanation**: 
The current Prisma schema lacks indexes on frequently queried fields, which could lead to slow query performance as the dataset grows.

**Fix Implementation**:

1. **Add Database Indexes**:
```prisma
// File: prisma/schema.prisma
model Task {
  id          Int         @id @default(autoincrement())
  name        String
  description String
  priority    TaskPriority
  status      TaskStatus
  dueDate     DateTime?
  assigneeId  Int?
  assignee    User?       @relation("AssignedTasks", fields: [assigneeId], references: [id])
  creatorId   Int
  creator     User        @relation("CreatedTasks", fields: [creatorId], references: [id])
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  // Add indexes for common queries
  @@index([status])
  @@index([priority])
  @@index([assigneeId])
  @@index([creatorId])
  @@index([createdAt])
  @@index([status, assigneeId]) // Composite index for common filtering
}

model Session {
  id        Int      @id @default(autoincrement())
  token     String   @unique
  userId    Int
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  expiresAt DateTime
  isActive  Boolean  @default(true)

  // Index for session cleanup
  @@index([expiresAt])
  @@index([isActive])
}
```

2. **Migration Command**:
```bash
npx prisma db push
```

### 🟡 Issue 8: Potential N+1 Query Problems

**Problem Location**: Task list components

**Explanation**: 
While the current implementation uses proper `include` statements, there's potential for N+1 queries in future development if individual task operations fetch related data separately.

**Fix Implementation**:

1. **Optimized Query Patterns**:
```typescript
// File: app/(dashboard)/tasks/actions.ts
export async function getTasksWithFilters(filters?: {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: number;
}) {
  try {
    const whereClause = filters ? {
      ...(filters.status && { status: filters.status }),
      ...(filters.priority && { priority: filters.priority }),
      ...(filters.assigneeId && { assigneeId: filters.assigneeId }),
    } : {};

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        assignee: { select: safeUserSelect },
        creator: { select: safeUserSelect },
      },
      orderBy: [
        { status: 'asc' }, // Show todos first
        { priority: 'desc' }, // High priority first
        { createdAt: 'desc' }
      ],
    });

    return createSuccessResult(tasks);
  } catch (e) {
    console.error('Failed to fetch filtered tasks:', e);
    return createErrorResult("Failed to fetch tasks.");
  }
}
```

2. **Connection Pooling Configuration**:
```typescript
// File: lib/prisma.ts
import { PrismaClient } from '@/app/generated/prisma';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['query', 'error', 'warn'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

---

## Accessibility Improvements

### 🟡 Issue 9: Missing ARIA Labels and Keyboard Navigation

**Problem Location**: Various UI components

**Current Issues**:
- Kanban board lacks proper ARIA labels
- Drag-and-drop operations not accessible via keyboard
- Form elements missing proper labeling

**Fix Implementation**:

1. **Improve Kanban Board Accessibility**:
```typescript
// File: components/kanban-board.tsx
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function KanbanBoard({ tasks }: { tasks: TaskWithProfile[] }) {
  const [columns, setColumns] = useState(() => groupTasksByStatus(tasks));

  const handleKeyDown = (event: KeyboardEvent, taskId: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      // Handle keyboard-based task selection/movement
      setSelectedTask(taskId);
    }
  };

  return (
    <div 
      className="grid grid-cols-1 md:grid-cols-4 gap-6"
      role="application"
      aria-label="Task management board"
    >
      {Object.entries(columns).map(([status, statusTasks]) => (
        <div
          key={status}
          className="bg-gray-50 p-4 rounded-lg"
          role="region"
          aria-label={`${status.replace('_', ' ')} tasks column`}
        >
          <h2 
            className="font-semibold mb-4 text-gray-700"
            id={`column-${status}`}
          >
            {status.replace('_', ' ').toUpperCase()}
            <span className="ml-2 text-sm text-gray-500" aria-label={`${statusTasks.length} tasks`}>
              ({statusTasks.length})
            </span>
          </h2>
          
          <Droppable droppableId={status}>
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2 min-h-[200px]"
                aria-labelledby={`column-${status}`}
                role="list"
              >
                {statusTasks.map((task, index) => (
                  <Draggable
                    key={task.id}
                    draggableId={task.id.toString()}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        role="listitem"
                        tabIndex={0}
                        aria-label={`Task: ${task.name}. Priority: ${task.priority}. Assigned to: ${task.assignee?.name || 'Unassigned'}`}
                        onKeyDown={(e) => handleKeyDown(e, task.id)}
                        className={`bg-white p-3 rounded shadow-sm border cursor-pointer hover:shadow-md transition-shadow ${
                          snapshot.isDragging ? 'shadow-lg' : ''
                        }`}
                      >
                        <TaskCard task={task} />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      ))}
    </div>
  );
}
```

2. **Improve Form Accessibility**:
```typescript
// File: components/create-task-form.tsx
export default function CreateTaskForm({ onFinish }: { onFinish?: () => void }) {
  const [state, formAction] = useActionState(createTaskAction, initialState);
  const { pending } = useFormStatus();

  return (
    <form action={formAction} className="space-y-4">
      <fieldset disabled={pending} className="space-y-4">
        <legend className="sr-only">Create new task form</legend>
        
        <div>
          <Label htmlFor="task-title" className="required">
            Task Title
          </Label>
          <Input
            id="task-title"
            name="title"
            type="text"
            placeholder="Enter task title"
            required
            aria-describedby={state.error ? "title-error" : undefined}
            className={state.error ? "border-red-500" : ""}
          />
          {state.error && (
            <div id="title-error" role="alert" aria-live="polite" className="text-sm text-red-600 mt-1">
              {state.error}
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="task-description">Description</Label>
          <Textarea
            id="task-description"
            name="description"
            placeholder="Enter task description"
            aria-describedby="description-help"
          />
          <div id="description-help" className="text-sm text-gray-500 mt-1">
            Optional: Provide additional details about the task
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="task-priority">Priority Level</Label>
            <Select name="priority" defaultValue={TASK_PRIORITY.MEDIUM}>
              <SelectTrigger id="task-priority" aria-label="Select task priority">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent role="listbox">
                <SelectItem value={TASK_PRIORITY.LOW} role="option">Low Priority</SelectItem>
                <SelectItem value={TASK_PRIORITY.MEDIUM} role="option">Medium Priority</SelectItem>
                <SelectItem value={TASK_PRIORITY.HIGH} role="option">High Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </fieldset>

      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onFinish}
          aria-label="Cancel task creation"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={pending}
          aria-label={pending ? "Creating task..." : "Create new task"}
        >
          {pending ? (
            <>
              <span className="sr-only">Creating task...</span>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" aria-hidden="true"></div>
            </>
          ) : (
            'Create Task'
          )}
        </Button>
      </div>
    </form>
  );
}
```

---

## Error Handling & Logging

### 🟡 Issue 10: Missing Centralized Error Handling

**Problem**: No unified error handling strategy

**Fix Implementation**:

1. **Create Error Boundary Component**:
```typescript
// File: components/error-boundary.tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // TODO: Send to error reporting service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Something went wrong
              </h2>
              <p className="text-gray-600">
                We apologize for the inconvenience. Please try refreshing the page.
              </p>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
                  {this.state.error.message}
                  {'\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            
            <div className="flex space-x-2 justify-center">
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
              >
                Refresh Page
              </Button>
              <Button
                onClick={() => this.setState({ hasError: false })}
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

2. **Centralized Logging System**:
```typescript
// File: lib/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  meta?: Record<string, any>;
  userId?: string;
  sessionId?: string;
}

class Logger {
  private logLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  private log(level: LogLevel, message: string, meta?: Record<string, any>) {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      meta,
    };

    if (process.env.NODE_ENV === 'development') {
      console[level](entry);
    } else {
      // TODO: Send to logging service (e.g., Datadog, LogRocket)
      console[level](JSON.stringify(entry));
    }
  }

  debug(message: string, meta?: Record<string, any>) {
    this.log('debug', message, meta);
  }

  info(message: string, meta?: Record<string, any>) {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: Record<string, any>) {
    this.log('warn', message, meta);
  }

  error(message: string, error?: Error, meta?: Record<string, any>) {
    this.log('error', message, {
      ...meta,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : undefined,
    });
  }
}

export const logger = new Logger();
```

3. **Update Server Actions with Proper Logging**:
```typescript
// File: app/(dashboard)/tasks/actions.ts
import { logger } from '@/lib/logger';

export async function createTask(formData: FormData): Promise<ActionResult<void>> {
  const startTime = Date.now();
  const user = await getCurrentUser();
  
  logger.info('Task creation started', { 
    userId: user?.id,
    hasTitle: !!formData.get('title'),
  });

  try {
    // ... task creation logic ...
    
    const duration = Date.now() - startTime;
    logger.info('Task created successfully', {
      userId: user.id,
      taskId: result.id,
      duration,
    });
    
    return createSuccessResult(undefined, "Task created successfully!");
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Failed to create task', error as Error, {
      userId: user?.id,
      formData: Object.fromEntries(formData.entries()),
      duration,
    });
    
    return createErrorResult("Failed to create task.", "An unexpected error occurred. Please try again.");
  }
}
```

---

## Database Optimizations

### 🟡 Issue 11: Missing Input Validation

**Problem**: Server actions lack comprehensive input validation

**Fix Implementation**:

1. **Create Validation Schemas**:
```typescript
// File: lib/validations.ts
import { z } from 'zod';
import { TASK_STATUS, TASK_PRIORITY } from '@/lib/constants';

export const createTaskSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(100, 'Title must be less than 100 characters')
    .trim(),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  priority: z.enum([TASK_PRIORITY.LOW, TASK_PRIORITY.MEDIUM, TASK_PRIORITY.HIGH]),
  status: z.enum([TASK_STATUS.TODO, TASK_STATUS.IN_PROGRESS, TASK_STATUS.REVIEW, TASK_STATUS.DONE])
    .default(TASK_STATUS.TODO),
  dueDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
    .optional()
    .transform((val) => val ? new Date(val) : undefined),
  assigneeId: z.number().int().positive().optional(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  id: z.number().int().positive(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = loginSchema.extend({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .trim(),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
```

2. **Update Server Actions with Validation**:
```typescript
// File: app/(dashboard)/tasks/actions.ts
import { createTaskSchema, updateTaskSchema } from '@/lib/validations';

export async function createTask(formData: FormData): Promise<ActionResult<void>> {
  const user = await getCurrentUser();
  if (!user) {
    return createErrorResult("Not authenticated.");
  }

  try {
    // Parse and validate form data
    const rawData = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      priority: formData.get("priority") as TaskPriority,
      status: formData.get("status") as TaskStatus,
      dueDate: formData.get("dueDate") as string,
      assigneeId: formData.get("assigneeId") ? parseInt(formData.get("assigneeId") as string) : undefined,
    };

    const validatedData = createTaskSchema.parse(rawData);
    
    await prisma.task.create({
      data: {
        name: validatedData.title,
        description: validatedData.description || '',
        priority: validatedData.priority,
        status: validatedData.status,
        dueDate: validatedData.dueDate,
        creatorId: user.id,
        assigneeId: validatedData.assigneeId,
      },
    });
    
    revalidatePath("/tasks");
    logger.info('Task created successfully', { userId: user.id });
    return createSuccessResult(undefined, "Task created successfully!");
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      logger.warn('Task creation validation failed', { 
        userId: user.id, 
        errors: fieldErrors 
      });
      return createErrorResult(`Validation error: ${fieldErrors.join(', ')}`);
    }
    
    logger.error('Failed to create task', error as Error, { userId: user.id });
    return createErrorResult("Failed to create task.");
  }
}
```

---

## Testing Enhancements

### 🟡 Issue 12: Limited Test Coverage

**Problem**: Missing integration tests and API testing

**Fix Implementation**:

1. **Add API Route Testing**:
```typescript
// File: tests/api/tasks.test.ts
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createTaskSchema } from '@/lib/validations';
import { prisma } from '@/lib/prisma';

describe('Task API Functions', () => {
  const testUser = {
    id: 999,
    name: 'Test User',
    email: 'test@example.com',
  };

  beforeAll(async () => {
    // Create test user
    await prisma.user.create({
      data: {
        ...testUser,
        password: 'hashed_password',
      },
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.task.deleteMany({ where: { creatorId: testUser.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
  });

  describe('createTask validation', () => {
    it('should validate task creation data correctly', () => {
      const validData = {
        title: 'Test Task',
        description: 'Test Description',
        priority: 'medium' as const,
        status: 'todo' as const,
      };

      const result = createTaskSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid task data', () => {
      const invalidData = {
        title: '', // Empty title
        priority: 'invalid' as any,
      };

      const result = createTaskSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors).toHaveLength(2);
      }
    });
  });
});
```

2. **Component Integration Tests**:
```typescript
// File: tests/integration/task-form.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateTaskForm } from '@/components/create-task-form';
import '@testing-library/jest-dom';

// Mock server action
jest.mock('@/app/(dashboard)/tasks/actions', () => ({
  createTask: jest.fn().mockResolvedValue({ 
    success: true, 
    data: null, 
    error: null 
  }),
}));

describe('CreateTaskForm Integration', () => {
  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    const mockOnFinish = jest.fn();
    
    render(<CreateTaskForm onFinish={mockOnFinish} />);
    
    // Fill out form
    await user.type(screen.getByLabelText(/task title/i), 'Test Task');
    await user.type(screen.getByLabelText(/description/i), 'Test Description');
    await user.selectOptions(screen.getByLabelText(/priority/i), 'high');
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /create task/i }));
    
    // Wait for submission
    await waitFor(() => {
      expect(mockOnFinish).toHaveBeenCalled();
    });
  });

  it('should display validation errors for invalid input', async () => {
    const user = userEvent.setup();
    
    render(<CreateTaskForm />);
    
    // Try to submit empty form
    await user.click(screen.getByRole('button', { name: /create task/i }));
    
    // Check for error messages
    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });
  });
});
```

---

## Summary

This comprehensive fix suggestions document provides detailed solutions for all identified issues in the TaskFlow application. Each fix includes:

- **Clear problem identification** with specific file locations
- **Detailed explanations** of why each issue matters
- **Complete implementation examples** with actual code
- **Security considerations** and best practices
- **Migration steps** where applicable

### Implementation Priority:

1. **🔴 Critical (Immediate)**: Security fixes, password exposure, session management
2. **🟠 High (Week 1)**: Configuration issues, error handling standardization  
3. **🟡 Medium (Week 2-4)**: Performance optimizations, accessibility improvements
4. **🟢 Low (Ongoing)**: Testing enhancements, code quality improvements

### Next Steps:

1. Review and prioritize these fixes based on your deployment timeline
2. Create development tickets for each fix category
3. Implement critical security fixes immediately
4. Test each fix thoroughly before deployment
5. Consider setting up monitoring and error tracking services

Would you like me to elaborate on any specific fix or help implement any of these solutions?