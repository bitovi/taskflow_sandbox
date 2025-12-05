# Utility Functions Style Guide

## Unique Patterns in This Codebase

### 1. **Minimal cn() Implementation**
The codebase has a simple, custom implementation of cn (classnames utility):
```typescript
export function cn(...classes: (string | undefined | false | null)[]): string {
    return classes.filter(Boolean).join(" ");
}
```
**Note**: This does NOT use the popular `clsx` or `classnames` packages. It's a lightweight custom implementation that filters falsy values and joins with spaces.

### 2. **No Tailwind Merge**
Unlike many projects, this cn() does NOT use `tailwind-merge` to dedupe conflicting Tailwind classes. Classes are simply concatenated.

### 3. **Date Utilities Use Local Time**
All date functions work with local time to avoid timezone issues:
```typescript
export function parseDateString(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number)
    return new Date(year, month - 1, day, 12, 0, 0) // month is 0-indexed, set to noon
}
```

### 4. **Noon Convention for Dates**
Dates are set to 12:00 noon local time to prevent timezone edge cases:
```typescript
return new Date(year, month - 1, day, 12, 0, 0) // set to noon
```

### 5. **Defensive Date Parsing**
formatDateForInput handles both string and Date inputs:
```typescript
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
    // ...
}
```

### 6. **Manual Date Formatting**
No date formatting libraries (date-fns, moment, etc.). Manual string building:
```typescript
export function formatDateForInput(date: Date | string): string {
    // ...
    const year = dateObj.getFullYear()
    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
    const day = String(dateObj.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}
```

### 7. **Short Month Names Array**
formatDateForDisplay uses hardcoded month abbreviations:
```typescript
const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

const month = months[dateObj.getMonth()]
const day = String(dateObj.getDate()).padStart(2, '0')

return `${month} ${day}`
```

### 8. **JSDoc Comments**
All utility functions include JSDoc descriptions:
```typescript
/**
 * Convert a date string (YYYY-MM-DD) to a Date object at local noon
 * This prevents timezone issues when storing and displaying dates
 */
export function parseDateString(dateString: string): Date {
```

### 9. **Three Date Functions Pattern**
The codebase has exactly three date utilities:
1. `parseDateString` - Convert YYYY-MM-DD string to Date at noon
2. `formatDateForInput` - Convert Date to YYYY-MM-DD string
3. `formatDateForDisplay` - Convert Date to "Mon DD" format

### 10. **No Other Utility Libraries**
The lib directory contains only:
- `utils.ts` - One function (cn)
- `date-utils.ts` - Three date functions
- `types.ts` - Type definitions (not utilities)
- `fonts.ts` - Font configuration (not utilities)

### 11. **Explicit File Structure**
```
lib/
  ├── utils.ts         (cn function)
  ├── date-utils.ts    (date utilities)
  ├── types.ts         (types, not utils)
  └── fonts.ts         (font config, not utils)
```

### 12. **Export Pattern**
Functions are exported individually, not as default:
```typescript
export function cn(...classes: (string | undefined | false | null)[]): string {
export function parseDateString(dateString: string): Date {
export function formatDateForInput(date: Date | string): string {
export function formatDateForDisplay(date: Date | string): string {
```

### 13. **Type Annotations**
All parameters and return types are explicitly typed:
```typescript
export function cn(...classes: (string | undefined | false | null)[]): string
export function parseDateString(dateString: string): Date
export function formatDateForInput(date: Date | string): string
```

### 14. **No Helper Imports**
Date utilities are self-contained with no external imports. Only built-in JavaScript Date methods.

### 15. **String Regex Pattern**
YYYY-MM-DD detection uses simple regex:
```typescript
if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
```

## Creating a New Utility Function

### String Utility Example
```typescript
/**
 * Capitalize the first letter of a string
 */
export function capitalize(str: string): string {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
```

### Number Utility Example
```typescript
/**
 * Format a number as currency
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
}
```

### Array Utility Example
```typescript
/**
 * Group an array of objects by a key
 */
export function groupBy<T, K extends keyof T>(array: T[], key: K): Record<string, T[]> {
    return array.reduce((result, item) => {
        const groupKey = String(item[key]);
        if (!result[groupKey]) {
            result[groupKey] = [];
        }
        result[groupKey].push(item);
        return result;
    }, {} as Record<string, T[]>);
}
```

### Date Utility Example (Following Project Pattern)
```typescript
/**
 * Calculate days between two dates
 * Uses local date components to avoid timezone issues
 */
export function daysBetween(date1: Date, date2: Date): number {
    const ms1 = date1.getTime();
    const ms2 = date2.getTime();
    const diffMs = Math.abs(ms2 - ms1);
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
```

### Validation Utility Example
```typescript
/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
```

## File Organization Guidelines

### When to Add to `utils.ts`
- Generic string/array/object manipulation
- Class name utilities (like cn)
- General helper functions used across multiple components

### When to Create New Utility File
- Domain-specific utilities (e.g., `date-utils.ts`)
- Group of related functions (3+ functions)
- When utilities need their own test file

### File Naming Convention
- Kebab-case: `date-utils.ts`, `string-utils.ts`
- Descriptive: `validation-utils.ts` not `validators.ts`
- Suffix: `-utils.ts`

## Import Pattern in Components
```typescript
import { cn } from "@/lib/utils"
import { formatDateForDisplay, parseDateString } from "@/lib/date-utils"
```

## Key Principles
- Keep utilities simple and self-contained
- No external dependencies if possible
- Use native JavaScript methods
- Explicit type annotations
- JSDoc comments for all functions
- Export named functions, not default
- Avoid premature abstraction
- One clear responsibility per function
- Work with local time for dates (noon convention)
- Filter falsy values in class name utilities
