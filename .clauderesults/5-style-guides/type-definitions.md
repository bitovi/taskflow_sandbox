# Type Definitions Style Guide

## Unique Patterns in This Codebase

### 1. **Single types.ts File**
All shared type definitions live in one file: `lib/types.ts`

### 2. **Extending Prisma Types**
Types extend Prisma-generated types rather than duplicating:
```typescript
import type { Task as PrismaTask, User } from "@/app/generated/prisma/client"

type TaskWithProfile = PrismaTask & {
  assignee?: Pick<User, "name"> | null;
};
```

### 3. **Domain-Specific Type Definitions**
Types are organized by domain (Kanban in this case):
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

### 4. **Literal Union Types for Status**
Status values use literal string unions in mapped types:
```typescript
[key in "todo" | "in_progress" | "review" | "done"]: KanbanColumn
```

### 5. **Pick Utility for Partial User Data**
When only specific fields are needed, use TypeScript's Pick:
```typescript
type TaskWithProfile = PrismaTask & {
  assignee?: Pick<User, "name"> | null;
};
```

### 6. **Custom Prisma Output Location**
Prisma client is generated to a non-standard location:
```typescript
import type { Task as PrismaTask, User } from "@/app/generated/prisma/client"
```
Standard would be: `@prisma/client`

### 7. **Type Imports Use `import type`**
All type imports use TypeScript's `import type` syntax:
```typescript
import type { Task as PrismaTask, User } from "@/app/generated/prisma/client"
```

### 8. **Inline Type Definitions in Components**
Components often define local types inline rather than in lib/types.ts:
```typescript
// In component file
type TaskWithProfile = PrismaTask & {
  assignee?: Pick<User, "name"> | null;
};
```

### 9. **No Interface Keyword**
Codebase uses `type` keyword exclusively, not `interface`:
```typescript
export type KanbanColumn = { ... }  // Used
export interface KanbanColumn { ... }  // Not used
```

### 10. **Mapped Types Pattern**
KanbanData uses mapped type for all status values:
```typescript
export type KanbanData = {
  [key in "todo" | "in_progress" | "review" | "done"]: KanbanColumn
}
```

### 11. **Optional Relations Pattern**
Relations from Prisma are marked optional with `?`:
```typescript
type TaskWithProfile = PrismaTask & {
  assignee?: Pick<User, "name"> | null;  // Optional and nullable
};
```

### 12. **No Enum Types**
Status values are string literals, not enums:
```typescript
// Used
id: "todo" | "in_progress" | "review" | "done"

// Not used
enum TaskStatus {
  TODO = "todo",
  IN_PROGRESS = "in_progress",
  REVIEW = "review",
  DONE = "done"
}
```

### 13. **Type Aliasing Prisma Types**
Prisma types are imported with aliases:
```typescript
import type { Task as PrismaTask, User } from "@/app/generated/prisma/client"
```

### 14. **No Generic Types**
No generic type definitions in lib/types.ts. All types are concrete.

### 15. **Component-Level Type Definitions**
Many components define their own types instead of sharing:
```typescript
// In task-list.tsx
type TaskWithProfile = PrismaTask & {
  assignee?: Pick<User, "name"> | null;
};

// In kanban-board.tsx  
// Same type defined again locally
```

## Creating New Type Definitions

### Extending Prisma Types
```typescript
import type { MyModel as PrismaMyModel, RelatedModel } from "@/app/generated/prisma/client"

type MyModelWithRelations = PrismaMyModel & {
  relation?: Pick<RelatedModel, "id" | "name"> | null;
};

export type MyModelData = {
  items: MyModelWithRelations[]
  totalCount: number
}
```

### Domain-Specific Types
```typescript
import type { Item as PrismaItem } from "@/app/generated/prisma/client"

type ItemWithUser = PrismaItem & {
  user?: Pick<User, "name"> | null;
};

export type ItemColumn = {
  id: "pending" | "active" | "completed"
  title: string
  items: ItemWithUser[]
}

export type ItemBoardData = {
  [key in "pending" | "active" | "completed"]: ItemColumn
}
```

### Component-Level Types
```typescript
// In component file
import type { Task as PrismaTask, User } from "@/app/generated/prisma/client";

type TaskWithProfile = PrismaTask & {
  assignee?: Pick<User, "name"> | null;
};

type ActionState = {
  error: string | null;
  success: boolean;
  message?: string;
}
```

### Form State Types
```typescript
type ActionState = {
  error: string | null;
  success: boolean;
  message?: string;
}

type FormData = {
  name: string;
  description: string | null;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
}
```

### API Response Types
```typescript
type ApiResponse<T> = {
  data: T | null;
  error: string | null;
}

type TasksResponse = ApiResponse<Task[]>
type TaskResponse = ApiResponse<Task>
```

### Variant Mapping Types
```typescript
type BadgeVariant = "default" | "secondary" | "destructive"

type PriorityVariantMap = Record<string, BadgeVariant>

const priorityVariant: PriorityVariantMap = {
  Low: "secondary",
  Medium: "default",
  High: "destructive",
}
```

## File Organization Guidelines

### Add to `lib/types.ts` when:
- Type is used in 3+ files
- Type represents core domain concept (like KanbanData)
- Type is exported from multiple components
- Type is part of public API

### Define inline when:
- Type is component-specific
- Type is only used in one file
- Type is a form state or action state
- Type is a local helper type

### Import Pattern
```typescript
// From lib/types.ts
import type { KanbanColumn, KanbanData } from "@/lib/types"

// From Prisma
import type { Task as PrismaTask, User } from "@/app/generated/prisma/client"

// Inline definition
type LocalType = {
  // ...
}
```

## Key Principles
- Use `type` keyword, not `interface`
- Always use `import type` for type imports
- Extend Prisma types rather than duplicate
- Use Pick<> to select specific fields
- Use literal unions for status/enum values
- Don't create generic types unless needed
- Mark Prisma relations as optional (`?`)
- Include null in union for nullable fields
- Use mapped types for key-based structures
- Alias Prisma types (e.g., `Task as PrismaTask`)
- Keep component-specific types inline
- Only share types used in multiple places
- Use Record<> for key-value mappings
- No enums, use string literal unions

## Common Type Patterns

### Prisma Extension Pattern
```typescript
type EntityWithRelations = PrismaEntity & {
  relation1?: Pick<RelatedEntity1, "field1" | "field2"> | null;
  relation2?: Pick<RelatedEntity2, "id" | "name"> | null;
};
```

### Status/State Pattern
```typescript
type Status = "pending" | "active" | "completed"
type Priority = "low" | "medium" | "high"
```

### Response Pattern
```typescript
type SuccessResponse = {
  error: null;
  success: true;
  data: T;
}

type ErrorResponse = {
  error: string;
  success: false;
  data: null;
}

type Response<T> = SuccessResponse | ErrorResponse
```

### Variant Mapping Pattern
```typescript
type VariantName = "default" | "secondary" | "destructive"
const variantMap: Record<string, VariantName> = { ... }
```
