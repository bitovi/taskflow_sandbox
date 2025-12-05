# UI Domain

## Overview
The UI layer uses shadcn/ui components built on Radix UI primitives, styled with Tailwind CSS. All components follow a consistent design system with accessibility built-in.

## Component Structure

### UI Primitives (`components/ui/`)
Reusable, unstyled components wrapped from Radix UI:

```
components/ui/
├── avatar.tsx          # User avatars with fallback
├── badge.tsx           # Status and priority badges
├── button.tsx          # Primary interaction element
├── card.tsx            # Content containers
├── checkbox.tsx        # Boolean input
├── dialog.tsx          # Modal overlays
├── dropdown-menu.tsx   # Contextual menus
├── input.tsx           # Text input
├── label.tsx           # Form labels
├── select.tsx          # Dropdown selection
└── textarea.tsx        # Multi-line text input
```

### Business Components (`components/`)
Feature-specific components built from UI primitives:

```
components/
├── auth-dropdown.tsx       # User menu in header
├── create-task-form.tsx    # Task creation form
├── dashboard-charts.tsx    # Data visualization
├── edit-task-form.tsx      # Task editing form
├── kanban-board.tsx        # Drag-and-drop board
├── sidebar.tsx             # Navigation sidebar
├── task-form.tsx           # Shared task form logic
├── task-list.tsx           # Task list view
├── task-overview.tsx       # Recent tasks widget
├── tasks-page-client.tsx   # Client wrapper for tasks page
└── team-stats.tsx          # Team statistics widget
```

## Key Patterns

### 1. shadcn/ui Component Pattern

Example: Button component with variants

```tsx
// components/ui/button.tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn("cursor-pointer", buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

**Key Points:**
- Use `class-variance-authority` (cva) for variant styling
- Use `cn()` utility from `@/lib/utils` to merge className
- Support `asChild` prop via Radix's `Slot` for composition
- Forward refs for proper DOM access
- Export both component and variants

### 2. Radix UI Integration

Example: Avatar component

```tsx
// components/ui/avatar.tsx
"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-background-light",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

// Custom extension for displaying initials
const AvatarName = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & { name: string | null | undefined }
>(({ name, className, ...props }, ref) => {
  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").toUpperCase()
    : "??";

  return (
    <AvatarFallback ref={ref} className={className} {...props}>
      <span className="text-xs font-semibold">{initials}</span>
    </AvatarFallback>
  );
});
AvatarName.displayName = "AvatarName";

export { Avatar, AvatarImage, AvatarFallback, AvatarName }
```

**Key Points:**
- Wrap Radix primitives with Tailwind styling
- Use `"use client"` for interactive Radix components
- Maintain Radix's accessibility features
- Extend with custom variants (e.g., `AvatarName`)

### 3. Card Component Pattern

```tsx
// components/ui/card.tsx
import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
```

**Key Points:**
- Compose multiple sub-components (Header, Title, Content, etc.)
- Use semantic HTML elements
- Allow className override via `cn()` utility

### 4. Business Component Composition

Example: Task card in Kanban board

```tsx
// components/kanban-board.tsx (excerpt)
<Card className={cn(
  "cursor-pointer hover:shadow-md transition-shadow",
  snapshot.isDragging && "shadow-lg ring-2 ring-primary"
)}>
  <CardContent className="p-3">
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <h4 className={`font-medium text-sm leading-tight ${poppins.className}`}>
          {task.name}
        </h4>
        <Badge
          variant={
            task.priority === "high" ? "destructive" :
            task.priority === "medium" ? "default" :
            "secondary"
          }
          className="text-xs flex-shrink-0 capitalize"
        >
          {task.priority}
        </Badge>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Avatar className="h-6 w-6">
            <AvatarName name={task.assignee?.name || "??"} />
          </Avatar>
          <span className="text-xs text-muted-foreground">
            {task.assignee?.name || "Unassigned"}
          </span>
        </div>
        {task.dueDate && (
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{formatDate(task.dueDate)}</span>
          </div>
        )}
      </div>
    </div>
  </CardContent>
</Card>
```

**Key Points:**
- Compose UI primitives (Card, Badge, Avatar) into feature components
- Use conditional styling with `cn()` utility
- Apply Tailwind utilities for spacing and layout
- Use design tokens for colors (`text-muted-foreground`, `bg-primary`, etc.)

## Styling Patterns

### Tailwind Utility Classes
- **Spacing**: Use Tailwind scale (`space-y-4`, `p-6`, `gap-2`)
- **Colors**: Use CSS variables (`bg-background`, `text-foreground`, `border`)
- **Typography**: Combine with custom fonts (`${poppins.className}`)
- **Responsive**: Use breakpoint prefixes (`md:p-8`, `lg:px-4`)

### Custom Font Integration

```typescript
// lib/fonts.ts
import { Poppins } from "next/font/google"

export const poppins = Poppins({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700", "800", "900"]
})

// Usage in components
<h2 className={`text-3xl font-bold ${poppins.className}`}>
  Tasks
</h2>
```

### Theme Colors
Defined in `app/globals.css`:

```css
@layer base {
  :root {
    --background: 180 20% 97%;
    --foreground: 180 5% 6%;
    --primary: 10 80% 57%;
    /* ... more tokens ... */
  }
}
```

Use via Tailwind classes: `bg-background`, `text-primary`, etc.

## Common Patterns

### Icon Usage
```tsx
import { Plus, Search, Clock } from "lucide-react"

<Button>
  <Plus className="mr-2 h-4 w-4" />
  New Task
</Button>
```

### Conditional Styling
```tsx
<Card className={task.status === "done" ? "bg-muted/50" : ""}>
```

### Badge Variants
```tsx
<Badge variant={
  priority === "high" ? "destructive" :
  priority === "medium" ? "default" :
  "secondary"
}>
  {priority}
</Badge>
```

## Constraints
- **No Inline Styles**: Always use Tailwind utilities, never `style={{...}}`
- **No Custom UI Primitives**: Use shadcn/ui components, don't reinvent (Button, Input, etc.)
- **Radix for Interactivity**: Interactive components (Dialog, Dropdown) must use Radix
- **Consistent Spacing**: Use Tailwind spacing scale for all padding/margin
- **Design Tokens**: Use CSS variables for colors, not hardcoded values
- **Icon Library**: Use lucide-react for all icons
