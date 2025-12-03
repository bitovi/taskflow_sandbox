# React Components Style Guide

## Unique Patterns in This Codebase

### 1. **"use client" Directive for Interactive Components**
All interactive React components start with:
```tsx
"use client"
```

### 2. **Poppins Font Import Pattern**
Components import and apply Poppins font to titles/headers:
```tsx
import { poppins } from "@/lib/fonts"

<h3 className={`font-semibold ${poppins.className}`}>{task.name}</h3>
```

### 3. **Extended Prisma Types**
Components define local types that extend Prisma types:
```tsx
import type { Task as PrismaTask, User } from "@/app/generated/prisma/client";

type TaskWithProfile = PrismaTask & {
  assignee?: Pick<User, "name"> | null;
};
```

### 4. **Optimistic Updates with useOptimistic**
TaskList component uses React's useOptimistic for instant UI updates:
```tsx
const [optimisticTasks, setOptimisticTasks] = useOptimistic(
    initialTasks,
    (state, { action, task }: { action: "delete" | "toggle"; task: TaskWithProfile | { id: number } }) => {
        if (action === "delete") {
            return state.filter((t) => t.id !== task.id)
        }
        if (action === "toggle") {
            return state.map((t) => (t.id === task.id ? { ...t, status: t.status === "done" ? "todo" : "done" } : t))
        }
        return state
    },
)
```

### 5. **useTransition for Loading States**
Components use useTransition for pending states during mutations:
```tsx
const [isPending, startTransition] = useTransition()

const handleDelete = async (taskId: number) => {
    startTransition(async () => {
        setOptimisticTasks({ action: "delete", task: { id: taskId } })
        await deleteTask(taskId)
    })
}
```

### 6. **Dialog State Management Pattern**
Components track dialog/dropdown state with record objects:
```tsx
const [openDialogs, setOpenDialogs] = useState<Record<number, boolean>>({})
const [openDropdowns, setOpenDropdowns] = useState<Record<number, boolean>>({})

const handleCloseDialog = (taskId: number) => {
    setOpenDialogs(prev => ({ ...prev, [taskId]: false }))
}
```

### 7. **Inline Icon Components Pattern**
Icons imported from lucide-react and used inline:
```tsx
import { MoreHorizontal, Clock, Edit, Trash2 } from "lucide-react"

<Button variant="ghost" size="icon">
    <MoreHorizontal className="h-4 w-4" />
</Button>
```

### 8. **Badge Color Mapping**
Components define color variant maps for dynamic badges:
```tsx
const priorityVariant: Record<string, "default" | "secondary" | "destructive"> = {
  Low: "secondary",
  Medium: "default",
  High: "destructive",
}

<Badge variant={priorityVariant[task.priority || "Medium"]}>{task.priority}</Badge>
```

### 9. **Initials Helper Function**
Components include getInitials utility for avatars:
```tsx
const getInitials = (name: string | null) => {
    if (!name) return "??"
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
}
```

### 10. **Drag and Drop with @hello-pangea/dnd**
KanbanBoard uses specific drag-drop library:
```tsx
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"

<DragDropContext onDragEnd={onDragEnd}>
    <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
                {/* content */}
                {provided.placeholder}
            </div>
        )}
    </Droppable>
</DragDropContext>
```

### 11. **cn() Utility for Conditional Classes**
Components use cn() from lib/utils for class combinations:
```tsx
import { cn } from "@/lib/utils"

<div className={cn(
    "flex-shrink-0 w-80 transition-colors rounded-lg",
    snapshot.isDraggingOver ? "bg-background-light" : "bg-background-dark",
)} />
```

### 12. **Async Server Components for Data Fetching**
TeamStats is an async server component:
```tsx
export async function TeamStats() {
  const { totalMembers, openTasks, tasksCompleted, topPerformer, error } = await getTeamStats()
  
  if (error) {
    console.error("Error fetching team stats:", error)
    // Return a fallback UI or empty stats
  }
  // ... render
}
```

### 13. **Navigation with usePathname**
Sidebar uses usePathname for active link highlighting:
```tsx
import { usePathname } from "next/navigation"

const pathname = usePathname()

<Link
    href={item.href}
    className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
        pathname === item.href && "bg-background text-primary",
    )}
>
```

### 14. **Static Navigation Config**
Sidebar defines navigation items as const array:
```tsx
const sidebarNavItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Tasks",
    href: "/tasks",
    icon: CheckSquare,
  },
  // ...
]
```

### 15. **Recharts Integration Pattern**
Chart components use recharts library:
```tsx
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"

<ResponsiveContainer width="100%" height={350}>
    <BarChart data={data}>
        <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip
            cursor={{ fill: "transparent" }}
            contentStyle={{
                backgroundColor: "#072427",
                borderColor: "hsl(var(--border))",
            }}
        />
        <Legend wrapperStyle={{ fontSize: "14px" }} />
        <Bar dataKey="total" name="Total Tasks" fill="#F5532C" radius={[4, 4, 0, 0]} />
        <Bar dataKey="completed" name="Completed" fill="#00848B" radius={[4, 4, 0, 0]} />
    </BarChart>
</ResponsiveContainer>
```

### 16. **Custom Avatar Name Component**
Uses custom AvatarName component for initials:
```tsx
import { Avatar, AvatarName } from "@/components/ui/avatar"

<Avatar className="h-9 w-9">
    <AvatarName name={task.assignee?.name || "Unassigned"} />
</Avatar>
```

### 17. **Test ID Attributes**
Interactive elements include data-testid for e2e tests:
```tsx
<Card data-testid={`task-card-${task.id}`}>
<Button data-testid={`task-menu-${task.id}`}>
<DropdownMenuItem data-testid={`task-edit-${task.id}`}>
```

## Creating a New React Component

### Interactive List Component
```tsx
"use client"

import { useOptimistic, useTransition, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { deleteItem, updateItem } from "@/app/(dashboard)/items/actions"
import { poppins } from "@/lib/fonts"
import { cn } from "@/lib/utils"

import type { Item as PrismaItem, User } from "@/app/generated/prisma/client";

type ItemWithUser = PrismaItem & {
  user?: Pick<User, "name"> | null;
};

export function ItemList({ initialItems }: { initialItems: ItemWithUser[] }) {
  const [optimisticItems, setOptimisticItems] = useOptimistic(
    initialItems,
    (state, { action, item }: { action: "delete" | "update"; item: ItemWithUser | { id: number } }) => {
      if (action === "delete") {
        return state.filter((i) => i.id !== item.id)
      }
      if (action === "update") {
        return state.map((i) => (i.id === item.id ? { ...i, ...item } : i))
      }
      return state
    },
  )
  const [isPending, startTransition] = useTransition()

  const handleDelete = async (itemId: number) => {
    startTransition(async () => {
      setOptimisticItems({ action: "delete", item: { id: itemId } })
      await deleteItem(itemId)
    })
  }

  return (
    <div className="space-y-4">
      {optimisticItems.map((item) => (
        <Card key={item.id} data-testid={`item-card-${item.id}`}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className={`font-semibold ${poppins.className}`}>{item.name}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <Button
                data-testid={`item-delete-${item.id}`}
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(item.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

### Server Component with Data Fetching
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getStats } from "@/app/(dashboard)/stats/actions"

export async function StatsComponent() {
  const { data, error } = await getStats()

  if (error) {
    console.error("Error fetching stats:", error)
    return <div>Could not load stats</div>
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {data.map((stat) => (
        <Card key={stat.title}>
          <CardHeader>
            <CardTitle>{stat.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

## File Naming Conventions
- Kebab-case: `task-list.tsx`, `kanban-board.tsx`
- Located in: `components/` directory
- No subdirectories for non-UI components
- UI components in: `components/ui/`

## Import Order Pattern
1. "use client" directive (if needed)
2. React hooks
3. UI component imports
4. Icon imports (lucide-react)
5. Server action imports
6. Font/utility imports
7. Type imports (last)

## Key Principles
- Use "use client" for interactive components
- Server components for data fetching (async)
- Apply Poppins font to titles/headers
- Include data-testid for testable elements
- Use optimistic updates for instant feedback
- Extend Prisma types for component-specific needs
- Use cn() for conditional classes
