# UI Domain Implementation

## Overview

The UI domain in this project is built on a consistent foundation of shadcn/ui components, which are themselves built on Radix UI primitives. All styling uses Tailwind CSS utility classes, and components follow a clear pattern of composition and reusability.

## Key Technologies

- **shadcn/ui** - Component library providing pre-built, accessible components
- **Radix UI** - Headless UI primitives for accessibility and behavior
- **Tailwind CSS v4** - Utility-first CSS framework
- **Lucide React** - Icon library
- **class-variance-authority (cva)** - For component variants
- **Poppins font** - Brand typography for headings

## Component Structure

### UI Components Location

All base UI components are located in `components/ui/` directory:
- `avatar.tsx` - User avatar with fallback initials
- `badge.tsx` - Status and priority badges
- `button.tsx` - Primary interactive element with variants
- `card.tsx` - Container component with header/content sections
- `checkbox.tsx` - Form checkbox element
- `dialog.tsx` - Modal dialog component
- `dropdown-menu.tsx` - Contextual menu component
- `input.tsx` - Form text input
- `label.tsx` - Form label component
- `select.tsx` - Dropdown select input
- `textarea.tsx` - Multi-line text input

### Feature Components Location

Feature-specific components in `components/` directory:
- `task-list.tsx` - Task list view with actions
- `kanban-board.tsx` - Drag-and-drop board view
- `create-task-form.tsx` - Task creation form
- `edit-task-form.tsx` - Task editing form
- `dashboard-charts.tsx` - Data visualization
- `task-overview.tsx` - Recent tasks summary
- `team-stats.tsx` - Team statistics cards
- `sidebar.tsx` - Navigation sidebar
- `auth-dropdown.tsx` - User authentication dropdown

## Implementation Patterns

### 1. Client vs Server Components

**Server Components (default):**
```tsx
// No directive needed - Server Component by default
import { Card, CardContent } from "@/components/ui/card"

export default async function TeamPage() {
  const users = await prisma.user.findMany()
  
  return (
    <div className="p-8">
      <h1>Team</h1>
      {/* Render users */}
    </div>
  )
}
```

**Client Components (when needed):**
```tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export function InteractiveComponent() {
  const [count, setCount] = useState(0)
  
  return (
    <Button onClick={() => setCount(count + 1)}>
      Count: {count}
    </Button>
  )
}
```

**When to use `"use client"`:**
- Component uses React hooks (useState, useEffect, useTransition, etc.)
- Component uses browser APIs (localStorage, window, etc.)
- Component has event handlers (onClick, onChange, etc.)
- Component uses third-party libraries that require client-side code

### 2. Styling with Tailwind CSS

**Basic styling:**
```tsx
<div className="flex items-center space-x-4 p-6 bg-background rounded-lg">
  <h2 className="text-xl font-bold">Title</h2>
</div>
```

**Conditional styling with cn() utility:**
```tsx
import { cn } from "@/lib/utils"

<div className={cn(
  "p-4 rounded-md",
  isActive && "bg-primary text-white",
  isDisabled && "opacity-50 pointer-events-none"
)}>
  Content
</div>
```

**From task-list.tsx:**
```tsx
<Card className={task.status === "done" ? "bg-muted/50" : ""}>
  <CardContent className="p-6">
    <h3 className={`font-semibold ${poppins.className} ${
      task.status === "done" ? "line-through text-muted-foreground" : ""
    }`}>
      {task.name}
    </h3>
  </CardContent>
</Card>
```

### 3. Typography with Poppins Font

**Font configuration (lib/fonts.ts):**
```typescript
import { Poppins } from "next/font/google"

export const poppins = Poppins({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700", "800", "900"]
})
```

**Usage in components:**
```tsx
import { poppins } from "@/lib/fonts"

<h2 className={`text-3xl font-bold tracking-tight ${poppins.className}`}>
  Tasks
</h2>
```

**From sidebar.tsx:**
```tsx
<h2 className={`text-lg font-semibold ${poppins.className}`}>
  TaskFlow
</h2>
```

### 4. Icon Usage with Lucide React

```tsx
import { Plus, Search, Clock, Edit, Trash2, MoreHorizontal } from "lucide-react"

// In button
<Button>
  <Plus className="mr-2 h-4 w-4" />
  New Task
</Button>

// As standalone icon
<Clock className="h-4 w-4 text-muted-foreground" />
```

**From task-list.tsx:**
```tsx
<DropdownMenuItem onClick={() => handleEditClick(task.id)}>
  <Edit className="mr-2 h-4 w-4" />
  Edit
</DropdownMenuItem>
<DropdownMenuItem onClick={() => handleDelete(task.id)}>
  <Trash2 className="mr-2 h-4 w-4" />
  Delete
</DropdownMenuItem>
```

### 5. Component Variants with CVA

**From button.tsx:**
```tsx
import { cva, type VariantProps } from "class-variance-authority"

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
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
```

**Usage:**
```tsx
<Button variant="outline" size="sm">Cancel</Button>
<Button variant="destructive">Delete</Button>
```

### 6. Card Component Pattern

**From task-overview.tsx:**
```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Recent Tasks</CardTitle>
    <CardDescription>An overview of the most recently created tasks.</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      {tasks.map((task) => (
        <div key={task.id} className="flex items-center">
          {/* Task content */}
        </div>
      ))}
    </div>
  </CardContent>
</Card>
```

### 7. Avatar Component with Fallback

**Custom AvatarName component (from avatar.tsx):**
```tsx
const AvatarName = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { name: string }
>(({ className, name, ...props }, ref) => {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <AvatarFallback ref={ref} className={cn(className)} {...props}>
      {getInitials(name)}
    </AvatarFallback>
  )
})
```

**Usage in components:**
```tsx
import { Avatar, AvatarName } from "@/components/ui/avatar"

<Avatar className="h-9 w-9">
  <AvatarName name={task.assignee?.name || "Unassigned"} />
</Avatar>
```

### 8. Dialog (Modal) Pattern

**From edit-task-form.tsx:**
```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

<Dialog open={openDialogs[task.id]} onOpenChange={(open) =>
  setOpenDialogs(prev => ({ ...prev, [task.id]: open }))
}>
  <DialogTrigger asChild>
    <Button>Edit</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit Task</DialogTitle>
    </DialogHeader>
    <EditTaskForm task={task} onFinish={() => handleCloseDialog(task.id)} />
  </DialogContent>
</Dialog>
```

### 9. Dropdown Menu Pattern

**From task-list.tsx:**
```tsx
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

<DropdownMenu 
  open={openDropdowns[task.id]} 
  onOpenChange={(open) => setOpenDropdowns(prev => ({ ...prev, [task.id]: open }))}
>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <MoreHorizontal className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={() => handleEditClick(task.id)}>
      <Edit className="mr-2 h-4 w-4" />
      Edit
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => handleDelete(task.id)}>
      <Trash2 className="mr-2 h-4 w-4" />
      Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### 10. Badge Component for Status

**From task-overview.tsx:**
```tsx
import { Badge } from "@/components/ui/badge"

const priorityVariant: Record<string, "default" | "secondary" | "destructive"> = {
  Low: "secondary",
  Medium: "default",
  High: "destructive",
}

<Badge variant={priorityVariant[task.priority || "Medium"]}>
  {task.priority}
</Badge>
```

## Design Tokens

Design tokens are managed through Tailwind configuration:

**Colors:**
- `bg-background` - Main background color
- `bg-background-dark` - Darker background (sidebar)
- `bg-background-light` - Lighter background (hover states)
- `text-foreground` - Primary text color
- `text-foreground-muted` - Muted text color
- `text-muted-foreground` - Even more muted text
- `bg-primary` - Primary brand color
- `text-primary-foreground` - Text on primary background
- `bg-destructive` - Destructive actions (delete)
- `bg-muted` - Muted backgrounds

**Spacing:**
- Space utilities: `space-x-2`, `space-y-4`, etc.
- Padding: `p-4`, `px-6`, `py-2`, etc.
- Margin: `m-4`, `mb-6`, etc.
- Gap: `gap-4`, `gap-x-2`, etc.

**Typography:**
- Sizes: `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl`
- Weights: `font-medium`, `font-semibold`, `font-bold`
- Families: Poppins for headings, Inter for body

## Best Practices

### 1. Always Use Existing UI Components

```tsx
// ✅ Good - Use existing Button component
import { Button } from "@/components/ui/button"
<Button variant="outline">Click Me</Button>

// ❌ Bad - Create custom button
<button className="px-4 py-2 border rounded">Click Me</button>
```

### 2. Maintain Client/Server Component Separation

```tsx
// ✅ Good - Server Component fetches data, Client Component handles interaction
// page.tsx (Server Component)
export default async function TasksPage() {
  const tasks = await getAllTasks()
  return <TaskList initialTasks={tasks} />
}

// task-list.tsx (Client Component)
"use client"
export function TaskList({ initialTasks }) {
  const [tasks, setTasks] = useState(initialTasks)
  // Interactive logic here
}

// ❌ Bad - Mixing concerns
"use client"
export default function TasksPage() {
  const [tasks, setTasks] = useState([])
  useEffect(() => {
    // Fetching in client component
  }, [])
}
```

### 3. Use cn() for Conditional Classes

```tsx
// ✅ Good - Use cn() utility
import { cn } from "@/lib/utils"
<div className={cn("p-4", isActive && "bg-primary", "rounded-lg")}>

// ❌ Bad - String concatenation
<div className={`p-4 ${isActive ? 'bg-primary' : ''} rounded-lg`}>
```

### 4. Follow Tailwind Naming Conventions

```tsx
// ✅ Good - Tailwind utilities
<div className="flex items-center justify-between space-x-4 p-6">

// ❌ Bad - Custom classes or inline styles
<div style={{ display: 'flex', padding: '24px' }}>
```

### 5. Apply Poppins to Headings Only

```tsx
// ✅ Good - Poppins on headings
import { poppins } from "@/lib/fonts"
<h1 className={`text-3xl font-bold ${poppins.className}`}>Title</h1>
<p className="text-base">Regular text uses Inter from layout</p>

// ❌ Bad - Poppins on body text
<p className={poppins.className}>This should use Inter</p>
```

## Common Patterns

### Page Layout Pattern

```tsx
import { poppins } from "@/lib/fonts"

export default function MyPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-3xl font-bold tracking-tight ${poppins.className}`}>
          Page Title
        </h2>
        <Button>Action</Button>
      </div>
      
      {/* Page content */}
    </div>
  )
}
```

### List Item Pattern

```tsx
<Card>
  <CardContent className="p-6">
    <div className="flex items-start justify-between">
      <div className="flex items-start space-x-4">
        <Avatar className="h-9 w-9">
          <AvatarName name={user.name} />
        </Avatar>
        <div className="flex-1">
          <h3 className={`font-semibold ${poppins.className}`}>
            {item.title}
          </h3>
          <p className="text-sm text-muted-foreground">
            {item.description}
          </p>
        </div>
      </div>
      <DropdownMenu>
        {/* Actions */}
      </DropdownMenu>
    </div>
  </CardContent>
</Card>
```

## Testing UI Components

**Example from button.test.tsx:**
```tsx
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('applies variant classes', () => {
    render(<Button variant="outline">Click me</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('border')
  })
})
```

## Summary

The UI domain in this application is built on a solid foundation of accessible, composable components. Key principles:

1. **Use shadcn/ui components** as building blocks
2. **Server Components by default**, client only when needed
3. **Tailwind CSS for all styling**, no CSS modules or inline styles
4. **Lucide React for icons** consistently across the app
5. **Poppins font for headings**, Inter for body text
6. **cn() utility for conditional classes**
7. **Component variants with CVA** for flexible, type-safe APIs
8. **Accessibility through Radix primitives**
