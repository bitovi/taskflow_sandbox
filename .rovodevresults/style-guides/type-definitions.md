# Type Definitions Style Guide

## Unique Patterns and Conventions

### 1. Prisma Type Extensions
Extend Prisma-generated types for component use:

```typescript
// lib/types.ts
import type { Task as PrismaTask, User } from "@/app/generated/prisma/client";

type TaskWithProfile = PrismaTask & {
  assignee?: Pick<User, "name"> | null;
};
```

### 2. Kanban-Specific Type Definitions
Define domain-specific types for drag-and-drop functionality:

```typescript
export type KanbanColumn = {
  id: "todo" | "in_progress" | "review" | "done";
  title: string;
  tasks: TaskWithProfile[];
};

export type KanbanData = {
  [key in "todo" | "in_progress" | "review" | "done"]: KanbanColumn;
};
```

### 3. Complex Prisma Payload Types
Use Prisma.ModelGetPayload for complex relationship types:

```typescript
// For dashboard components with full relationship data
type Task = Prisma.TaskGetPayload<{
  include: {
    assignee: {
      select: {
        id: true;
        name: true;
        email: true;
        password: true;  // NOTE: Should be removed for security
      };
    };
    creator: {
      select: {
        id: true;
        name: true;
        email: true;
        password: true;  // NOTE: Should be removed for security
      };
    };
  };
}>;
```

### 4. User Selection Types
Define specific user field selections for different contexts:

```typescript
type UserProfile = Pick<User, "id" | "name" | "email">;
type UserBasic = Pick<User, "name">;
```

### 5. Form State Types
Define type-safe form state structures:

```typescript
type FormState = {
  success: boolean;
  error: string | null;
  message?: string | null;
};
```

### 6. Import Pattern from Generated Prisma
Always import types from the generated Prisma client:

```typescript
import type { Task as PrismaTask, User, Prisma } from "@/app/generated/prisma/client";
```

### 7. Union Type Definitions for Enums
Define union types for database enums:

```typescript
type TaskStatus = "todo" | "in_progress" | "review" | "done";
type TaskPriority = "high" | "medium" | "low";
```

### 8. Optional Relationship Types
Handle optional relationships with proper null typing:

```typescript
type TaskWithProfile = PrismaTask & {
  assignee?: Pick<User, "name"> | null;
  creator?: Pick<User, "name"> | null;
};
```