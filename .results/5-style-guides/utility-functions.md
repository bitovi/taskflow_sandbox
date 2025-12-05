# Utility Functions Style Guide

## Unique Patterns

### 1. cn() Utility for Class Names
Simple utility for merging Tailwind classes:

```typescript
// lib/utils.ts
export function cn(...classes: (string | undefined | false | null)[]): string {
    return classes.filter(Boolean).join(" ");
}
```

**Usage**:
```tsx
<div className={cn(
  "base-classes",
  isActive && "active-classes",
  className  // Allow override
)} />
```

### 2. Date Utility Functions
Consistent date handling to avoid timezone issues:

```typescript
// lib/date-utils.ts

// Parse date string to Date at local noon
export function parseDateString(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number)
    return new Date(year, month - 1, day, 12, 0, 0)
}

// Format Date for input[type="date"]
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

// Format Date for display (e.g., "Aug 08")
export function formatDateForDisplay(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const month = months[dateObj.getMonth()]
    const day = String(dateObj.getDate()).padStart(2, '0')
    return `${month} ${day}`
}
```

**Key Conventions**:
- Always parse dates at local noon to avoid timezone shifts
- Use local date components (not UTC)
- Consistent YYYY-MM-DD format for inputs

### 3. Safe User Selection
Utility to prevent password exposure:

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

**Usage**:
```typescript
const tasks = await prisma.task.findMany({
    include: {
        assignee: { select: safeUserSelect },
        creator: { select: safeUserSelect },
    },
});
```

### 4. Font Imports
Centralized font configuration:

```typescript
// lib/fonts.ts
import { Poppins } from "next/font/google"

export const poppins = Poppins({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700", "800", "900"]
})
```

**Usage**:
```tsx
import { poppins } from "@/lib/fonts"

<h1 className={`font-bold ${poppins.className}`}>
  Title
</h1>
```

## Type Definitions

### Types File Structure
```typescript
// lib/types.ts
import type { Task as PrismaTask, User } from "@/app/generated/prisma/client"

// Extend Prisma types with relations
type TaskWithProfile = PrismaTask & {
  assignee?: Pick<User, "name"> | null;
};

export type KanbanColumn = {
  id: "todo" | "in_progress" | "review" | "done"
  title: string
  tasks: TaskWithProfile[]
}

export type KanbanData = {
  [key in "todo" | "in_progress" | "review" | "done"]: KanbanColumn
}
```

**Key Conventions**:
- Import Prisma types from generated client
- Extend Prisma types for app-specific needs
- Use strict literal types for enums (task status, etc.)

## File Organization
- **lib/utils.ts** - General utilities (cn, etc.)
- **lib/date-utils.ts** - Date-specific utilities
- **lib/safe-user-select.ts** - Security utilities
- **lib/fonts.ts** - Font configurations
- **lib/types.ts** - TypeScript type definitions

## Naming Conventions
- Utility functions: camelCase (`parseDateString`, `formatDateForInput`)
- Constants: camelCase (`safeUserSelect`)
- Type exports: PascalCase (`SafeUser`, `KanbanData`)

## Documentation Pattern
Include JSDoc comments for complex utilities:

```typescript
/**
 * Convert a date string (YYYY-MM-DD) to a Date object at local noon
 * This prevents timezone issues when storing and displaying dates
 */
export function parseDateString(dateString: string): Date {
    // ...
}
```
