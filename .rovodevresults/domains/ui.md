# UI Domain Implementation

## Overview
The UI domain in TaskFlow follows a component-driven architecture built on shadcn/ui and Radix UI primitives, ensuring accessibility and consistent design patterns.

## Component Architecture

### UI Components Structure
```
components/ui/          # Base UI primitives
components/             # Business logic components
```

### Required Patterns

#### 1. Component Composition with Radix Primitives
All interactive components must use Radix UI primitives:

```tsx
// components/ui/button.tsx
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

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
```

#### 2. Styling with Tailwind + CVA
Use `class-variance-authority` for variant-based styling:

```tsx
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
```

#### 3. Typography Implementation
Business components must import and use Poppins font for headings:

```tsx
// components/task-list.tsx
import { poppins } from "@/lib/fonts"

<h3 className={`font-semibold ${poppins.className} ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>
  {task.name}
</h3>
```

#### 4. Conditional Styling Utility
All components must use the `cn()` utility for conditional classes:

```tsx
// lib/utils.ts
export function cn(...classes: (string | undefined | false | null)[]): string {
    return classes.filter(Boolean).join(" ");
}

// Usage in components
<Card className={cn(
  "cursor-pointer hover:shadow-md transition-shadow",
  snapshot.isDragging && "shadow-lg ring-2 ring-primary",
)}>
```

## Component Categories

### Base UI Components (`components/ui/`)
- Must use `forwardRef` for ref forwarding
- Export both component and variant functions
- Support `asChild` prop when appropriate
- Include proper TypeScript interfaces

### Business Components (`components/`)
- Import UI components from `@/components/ui/`
- Handle business logic and state management
- Use `"use client"` directive when client features are needed
- Include proper TypeScript props interfaces

## Accessibility Requirements

### Radix UI Integration
All interactive elements must use Radix primitives:
- `Button` → `@radix-ui/react-slot`
- `Dialog` → `@radix-ui/react-dialog`
- `DropdownMenu` → `@radix-ui/react-dropdown-menu`
- `Checkbox` → `@radix-ui/react-checkbox`
- `Avatar` → `@radix-ui/react-avatar`

### ARIA and Semantic HTML
Components automatically inherit ARIA patterns from Radix:

```tsx
// components/task-list.tsx
<DropdownMenuTrigger asChild>
  <Button data-testid={`task-menu-${task.id}`} variant="ghost" size="icon" className="h-8 w-8">
    <MoreHorizontal className="h-4 w-4" />
  </Button>
</DropdownMenuTrigger>
```

## Visual Design Patterns

### Design Tokens
Components use CSS custom properties for theming:
- `text-foreground`, `text-muted-foreground`
- `bg-background`, `bg-background-light`
- `border-border`
- `ring-ring`

### Responsive Design
All components follow mobile-first approach:

```tsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-6 mb-6">
```

### Icons and Visual Elements
Use Lucide React icons consistently:

```tsx
import { MoreHorizontal, Clock, Edit, Trash2 } from "lucide-react"
```

## Testing Integration

### Test Attributes
Components must include `data-testid` for testing:

```tsx
<Card data-testid={`task-card-${task.id}`} className={task.status === "done" ? "bg-muted/50" : ""}>
```

### Testing Patterns
UI components follow Testing Library best practices:

```tsx
// tests/unit/button.test.tsx
test('renders with children and is enabled by default', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
})
```

## Implementation Examples

### Form Component Pattern
```tsx
"use client"
import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createTask } from "@/app/(dashboard)/tasks/actions"

export function CreateTaskForm() {
  const [state, formAction] = useActionState(createTask, { success: false })
  
  return (
    <form action={formAction} className="space-y-4">
      <Input name="title" placeholder="Task name" required />
      <Button type="submit">Create Task</Button>
      {state.error && <p className="text-destructive">{state.error}</p>}
    </form>
  )
}
```

### Interactive Component Pattern
```tsx
"use client"
import { useOptimistic, useTransition } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"

export function TaskList({ initialTasks }: { initialTasks: Task[] }) {
  const [optimisticTasks, setOptimisticTasks] = useOptimistic(
    initialTasks,
    (state, { action, task }) => {
      if (action === "toggle") {
        return state.map((t) => (t.id === task.id ? { ...t, status: t.status === "done" ? "todo" : "done" } : t))
      }
      return state
    },
  )
  
  return (
    <div className="space-y-4">
      {optimisticTasks.map((task) => (
        <Card key={task.id}>
          <CardContent>
            <Checkbox 
              checked={task.status === "done"}
              onCheckedChange={() => handleToggle(task)}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```