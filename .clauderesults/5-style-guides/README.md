# TaskFlow Style Guides - Overview

This directory contains comprehensive style guides extracted from the TaskFlow codebase. Each guide focuses on UNIQUE, PROJECT-SPECIFIC patterns rather than generic best practices.

## Style Guides

### 1. [route-pages.md](./route-pages.md)
Route pages using Next.js App Router patterns
- Mixed client/server component strategy
- Route groups with (dashboard) pattern
- Poppins font import pattern
- Server action integration
- Prisma type extensions
- Auth form state management

### 2. [layout-components.md](./layout-components.md)
Layout components for structural organization
- Two-tier layout system
- Server-side authentication checks
- Flex layout with sidebar pattern
- Minimal layout philosophy
- Root vs nested layout patterns

### 3. [server-actions.md](./server-actions.md)
Server actions for data mutations and fetching
- "use server" directive usage
- Co-located actions with routes
- Custom Prisma client location
- FormData parameter pattern
- Consistent return object structure
- Cookie-based session management
- Path revalidation strategy

### 4. [react-components.md](./react-components.md)
Interactive React components
- "use client" directive pattern
- Optimistic updates with useOptimistic
- useTransition for loading states
- Dialog and dropdown state management
- Drag-and-drop with @hello-pangea/dnd
- Inline icon components
- Test ID attributes

### 5. [ui-components.md](./ui-components.md)
Radix UI-based primitive components
- Radix UI wrapper pattern
- Class Variance Authority (CVA)
- Custom AvatarName component
- Portal-based dropdowns
- Custom background color tokens
- forwardRef pattern
- DisplayName assignment

### 6. [form-components.md](./form-components.md)
Form components with server action integration
- useActionState hook pattern
- Separate SubmitButton with useFormStatus
- Effect-based success handlers
- User fetching for assignee dropdowns
- Grid layout for side-by-side fields
- Error/success message display
- Edit vs create form differences

### 7. [data-visualization-components.md](./data-visualization-components.md)
Charts and statistics displays
- Recharts library integration
- Server component data fetching
- Card-based layout
- Custom color palette (#F5532C, #00848B)
- ResponsiveContainer pattern
- Stat cards with icons
- Priority variant mapping

### 8. [utility-functions.md](./utility-functions.md)
Helper functions for common operations
- Custom minimal cn() implementation
- Date utilities with noon convention
- No external utility libraries
- JSDoc comments
- Manual date formatting
- Local time handling

### 9. [type-definitions.md](./type-definitions.md)
TypeScript type patterns
- Extending Prisma types
- Pick utility for partial data
- Literal union types for status
- Type over interface
- Custom Prisma output location
- Component-level vs shared types
- Mapped types for key-based structures

### 10. [database-schema.md](./database-schema.md)
Prisma schema patterns
- Custom client output location
- SQLite file-based database
- Session-based authentication
- Named relation pattern
- String types for enums
- Optional foreign keys
- Autoincrement integer IDs

## How to Use These Guides

### For New Features
1. Identify which category your new code falls into
2. Read the relevant style guide(s)
3. Follow the patterns and conventions shown
4. Use the "Creating a New..." sections as templates

### For Code Review
1. Check if new code follows patterns in relevant guides
2. Ensure naming conventions match
3. Verify import order patterns
4. Confirm architectural decisions align

### For Refactoring
1. Compare existing code to style guide patterns
2. Identify inconsistencies
3. Update code to match established patterns
4. Ensure all related files follow same conventions

## Key Principles Across All Guides

### Consistency
- Follow established patterns even if you'd do it differently
- Match import order patterns
- Use consistent naming conventions
- Apply the same architectural decisions

### Simplicity
- Minimal custom implementations (cn function)
- No unnecessary abstractions
- Self-contained utilities
- Clear, explicit code

### TypeScript
- Explicit type annotations
- Extend Prisma types, don't duplicate
- Use `type` over `interface`
- Component-level types when appropriate

### Next.js App Router
- Server components by default
- "use client" only when needed
- Server actions for mutations
- Proper use of revalidatePath

### Testing
- data-testid attributes on interactive elements
- Consistent naming: `{component}-{action}-{id}`

### Accessibility
- Proper form labels
- Focus management
- Keyboard navigation support

## Pattern Quick Reference

### Client vs Server Components
- **Client**: "use client", interactive, forms, hooks
- **Server**: async, data fetching, no directive needed

### Import Order
1. Directives ("use client", "use server")
2. React/Next.js imports
3. UI component imports
4. Icon imports
5. Custom component imports
6. Utility/font imports
7. Server action imports
8. Type imports (import type)

### File Naming
- **Components**: kebab-case (task-list.tsx)
- **Routes**: page.tsx in app directory
- **Actions**: actions.ts co-located with routes
- **Utils**: {domain}-utils.ts in lib/

### Common Imports
```typescript
import { poppins } from "@/lib/fonts"
import { cn } from "@/lib/utils"
import type { Task as PrismaTask, User } from "@/app/generated/prisma/client"
```

## Project-Specific Quirks

1. **Prisma client location**: `@/app/generated/prisma` (not standard)
2. **Font pattern**: Import and apply Poppins to titles/headers
3. **Date handling**: Noon convention for timezone safety
4. **cn() function**: Custom implementation, no tailwind-merge
5. **No enums**: String literals for status/priority
6. **Session auth**: Cookie-based with Session model
7. **Custom colors**: #F5532C (primary), #00848B (secondary)

## Getting Started with a New Feature

1. **Identify the type**: Is it a route, component, form, or utility?
2. **Read the guide**: Review the relevant style guide
3. **Find similar code**: Look at existing examples in the codebase
4. **Copy patterns**: Use the "Creating a New..." templates
5. **Follow imports**: Match the import order pattern
6. **Test thoroughly**: Add data-testid attributes for testing

## Questions?

When in doubt:
1. Look for similar existing code
2. Check the relevant style guide
3. Follow the established patterns
4. Prioritize consistency over personal preference
