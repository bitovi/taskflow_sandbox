# Utility Functions Style Guide

## Unique Patterns and Conventions

### 1. Conditional Class Name Utility (cn)
Custom implementation for combining class names with filtering:

```typescript
// lib/utils.ts
export function cn(...classes: (string | undefined | false | null)[]): string {
    return classes.filter(Boolean).join(" ");
}

// Usage pattern throughout components
<Card className={cn(
  "cursor-pointer hover:shadow-md transition-shadow",
  snapshot.isDragging && "shadow-lg ring-2 ring-primary",
)}>
```

### 2. Date Parsing with Local Noon Convention
Date utilities use local noon as the default time:

```typescript
// lib/date-utils.ts
export function parseDateString(dateString: string): Date {
    const date = new Date(dateString);
    date.setHours(12, 0, 0, 0); // Set to local noon
    return date;
}
```

### 3. Date Formatting for Form Inputs
YYYY-MM-DD format for HTML date inputs:

```typescript
// lib/date-utils.ts
export function formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
}
```

### 4. Month Abbreviation Display Format
Consistent date display using month abbreviations:

```typescript
// lib/date-utils.ts
export function formatDateForDisplay(date: Date): string {
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });
}
```

### 5. Google Fonts Integration Pattern
Font utilities with specific subset configuration:

```typescript
// lib/fonts.ts
import { Inter, Poppins } from "next/font/google";

export const inter = Inter({ subsets: ["latin"] });

export const poppins = Poppins({
    weight: ["400", "500", "600", "700"],
    subsets: ["latin"],
});
```

### 6. Type-Safe Utility Functions
All utilities include proper TypeScript typing:

```typescript
// lib/utils.ts
export function cn(...classes: (string | undefined | false | null)[]): string {
    return classes.filter(Boolean).join(" ");
}

// lib/date-utils.ts
export function parseDateString(dateString: string): Date
export function formatDateForInput(date: Date): string
export function formatDateForDisplay(date: Date): string
```

### 7. Local Time Zone Handling
Date utilities work with local time zones rather than UTC:

```typescript
// Ensures dates work with user's local timezone
const date = new Date(dateString);
date.setHours(12, 0, 0, 0); // Local noon, not UTC
```

### 8. Minimalist Utility Design
Utilities are focused and single-purpose without external dependencies:

```typescript
// Simple, focused functions without complex dependencies
export function cn(...classes: (string | undefined | false | null)[]): string {
    return classes.filter(Boolean).join(" ");
}
```