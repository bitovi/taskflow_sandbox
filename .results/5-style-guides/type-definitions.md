# Type Definitions Style Guide

## Unique Patterns

### 1. Prisma Type Imports
Always import types from the generated Prisma client:

```typescript
import type { Task as PrismaTask, User } from "@/app/generated/prisma/client"
```

**Key Convention**: Use `type` imports for Prisma types.

### 2. Extending Prisma Types
Create app-specific types by extending Prisma types:

```typescript
type TaskWithProfile = PrismaTask & {
  assignee?: Pick<User, "name"> | null;
  creator?: Pick<User, "name"> | null;
};
```

**Key Convention**: Extend with relations needed for UI, don't query full objects.

### 3. Literal Union Types for Enums
Use literal unions for task statuses and priorities:

```typescript
export type KanbanColumn = {
  id: "todo" | "in_progress" | "review" | "done"
  title: string
  tasks: TaskWithProfile[]
}

export type KanbanData = {
  [key in "todo" | "in_progress" | "review" | "done"]: KanbanColumn
}
```

**Key Convention**: Use string literals, not enums, for type safety with dynamic keys.

### 4. SafeUser Type
Type for user data without sensitive fields:

```typescript
export type SafeUser = {
  id: number;
  name: string;
};
```

**Usage**: Return this type from Server Actions instead of full User.

## File Structure
Single types file: `lib/types.ts`

## Common Patterns

### Prisma Payload Types
Use Prisma's utility types for complex queries:

```typescript
import { Prisma } from "@/app/generated/prisma"

type Task = Prisma.TaskGetPayload<{
  include: {
    assignee: {
      select: {
        id: true;
        name: true;
      };
    };
  };
}>;
```

### Pick Utility Type
Extract specific fields from Prisma types:

```typescript
type TaskWithProfile = PrismaTask & {
  assignee?: Pick<User, "name"> | null;
};
```
