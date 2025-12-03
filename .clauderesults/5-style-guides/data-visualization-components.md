# Data Visualization Components Style Guide

## Unique Patterns in This Codebase

### 1. **Recharts Library**
All data visualization uses the Recharts library:
```tsx
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
```

### 2. **Server Component Pattern**
Data visualization components are async server components:
```tsx
export async function TeamStats() {
  const { totalMembers, openTasks, tasksCompleted, topPerformer, error } = await getTeamStats()
  
  if (error) {
    console.error("Error fetching team stats:", error)
    // Return a fallback UI
  }
  
  return (
    // JSX
  )
}
```

### 3. **Card-Based Layout**
All visualizations are wrapped in Card components:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Task Overview</CardTitle>
  </CardHeader>
  <CardContent className="pl-2">
    {/* Chart content */}
  </CardContent>
</Card>
```

### 4. **ResponsiveContainer Pattern**
Charts use ResponsiveContainer with explicit height:
```tsx
<ResponsiveContainer width="100%" height={350}>
    <BarChart data={data}>
        {/* chart elements */}
    </BarChart>
</ResponsiveContainer>
```

### 5. **Custom Color Palette**
Charts use project-specific colors:
- Primary action color: `#F5532C` (orange/red)
- Secondary color: `#00848B` (teal)
- Muted color: `#888888` (gray)
- Background dark: `#072427` (dark teal)
```tsx
<Bar dataKey="total" name="Total Tasks" fill="#F5532C" radius={[4, 4, 0, 0]} />
<Bar dataKey="completed" name="Completed" fill="#00848B" radius={[4, 4, 0, 0]} />
```

### 6. **Chart Styling Convention**
Consistent styling across all charts:
```tsx
<XAxis 
    dataKey="month" 
    stroke="#888888" 
    fontSize={12} 
    tickLine={false} 
    axisLine={false} 
/>
<YAxis
    stroke="#888888"
    fontSize={12}
    tickLine={false}
    axisLine={false}
    tickFormatter={(value) => `${value}`}
/>
```

### 7. **Tooltip Customization**
Tooltips use consistent dark theme styling:
```tsx
<Tooltip
    cursor={{ fill: "transparent" }}
    contentStyle={{
        backgroundColor: "#072427",
        borderColor: "hsl(var(--border))",
    }}
/>
```

### 8. **Rounded Bar Corners**
Bar charts use rounded top corners:
```tsx
<Bar dataKey="total" name="Total Tasks" fill="#F5532C" radius={[4, 4, 0, 0]} />
```

### 9. **Legend Styling**
Legends use inline styles:
```tsx
<Legend wrapperStyle={{ fontSize: "14px" }} />
```

### 10. **Grid Stat Cards Pattern**
Stat displays use responsive grid:
```tsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  {stats.map((stat) => (
    <Card key={stat.title}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
        <Icon className={`h-4 w-4 ${stat.color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{stat.value}</div>
        {stat.description && <p className="text-xs text-muted-foreground">{stat.description}</p>}
      </CardContent>
    </Card>
  ))}
</div>
```

### 11. **Icon Configuration Pattern**
Stats cards define icon configurations:
```tsx
const stats = [
    {
        title: "Total Members",
        value: totalMembers || 0,
        icon: Users,
        color: "text-muted-foreground",
    },
    {
        title: "Open Tasks",
        value: openTasks || 0,
        icon: ListTodo,
        color: "text-muted-foreground",
    },
    // ...
]
```

### 12. **Error Handling with Fallback**
Components handle errors gracefully:
```tsx
if (error) {
    console.error("Error fetching team stats:", error)
    // Return a fallback UI or empty stats
}
```

### 13. **Recent Items List Pattern**
TaskOverview shows recent items with avatars:
```tsx
<div className="space-y-4">
  {tasks && tasks.length > 0 ? (
    tasks.map((task) => (
      <div key={task.id} className="flex items-center">
        <Avatar className="h-9 w-9">
          <AvatarName name={task.assignee?.name || "Unassigned"} />
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-5">{task.name}</p>
          <p className="text-sm text-foreground-muted">
            Assigned to {task.assignee?.name || "Unassigned"}
          </p>
        </div>
        <div className="ml-auto font-medium">
          <Badge variant={priorityVariant[task.priority || "Medium"]}>{task.priority}</Badge>
        </div>
      </div>
    ))
  ) : (
    <p className="text-sm text-muted-foreground">No recent tasks.</p>
  )}
</div>
```

### 14. **Priority Variant Mapping**
Components map priority to badge variants:
```tsx
const priorityVariant: Record<string, "default" | "secondary" | "destructive"> = {
  Low: "secondary",
  Medium: "default",
  High: "destructive",
}
```

### 15. **Data Type Interfaces**
Components accept specific data shapes:
```tsx
interface TaskStats {
  month: string
  total: number
  completed: number
}

export function DashboardCharts({ data }: { data: TaskStats[] }) {
```

## Creating a New Data Visualization Component

### Chart Component
```tsx
"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ChartData {
  label: string
  value: number
}

export function MyChart({ data }: { data: ChartData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Chart Title</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <XAxis 
              dataKey="label" 
              stroke="#888888" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip
              cursor={{ fill: "transparent" }}
              contentStyle={{
                backgroundColor: "#072427",
                borderColor: "hsl(var(--border))",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "14px" }} />
            <Bar 
              dataKey="value" 
              name="Value" 
              fill="#F5532C" 
              radius={[4, 4, 0, 0]} 
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
```

### Stat Cards Component
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, CheckCircle, ListTodo } from "lucide-react"
import { getMyStats } from "@/app/(dashboard)/mystats/actions"

export async function MyStats() {
  const { metric1, metric2, metric3, error } = await getMyStats()

  if (error) {
    console.error("Error fetching stats:", error)
    return <div>Could not load statistics</div>
  }

  const stats = [
    {
      title: "Metric 1",
      value: metric1 || 0,
      icon: Users,
      color: "text-muted-foreground",
    },
    {
      title: "Metric 2",
      value: metric2 || 0,
      icon: CheckCircle,
      color: "text-muted-foreground",
    },
    {
      title: "Metric 3",
      value: metric3 || 0,
      icon: ListTodo,
      color: "text-muted-foreground",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
```

### Recent Items List Component
```tsx
import { Avatar, AvatarName } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Item as PrismaItem, User } from "@/app/generated/prisma/client"

type ItemWithUser = PrismaItem & {
  user?: Pick<User, "name"> | null;
};

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  Active: "default",
  Pending: "secondary",
  Inactive: "destructive",
}

export function RecentItems({ items }: { items: ItemWithUser[] | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Items</CardTitle>
        <CardDescription>An overview of recently created items.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items && items.length > 0 ? (
            items.map((item) => (
              <div key={item.id} className="flex items-center">
                <Avatar className="h-9 w-9">
                  <AvatarName name={item.user?.name || "Unassigned"} />
                </Avatar>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-5">{item.name}</p>
                  <p className="text-sm text-foreground-muted">
                    Assigned to {item.user?.name || "Unassigned"}
                  </p>
                </div>
                <div className="ml-auto font-medium">
                  <Badge variant={statusVariant[item.status || "Active"]}>
                    {item.status}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No recent items.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

## File Naming Conventions
- Kebab-case: `dashboard-charts.tsx`, `task-overview.tsx`, `team-stats.tsx`
- Pattern: `{entity}-{type}.tsx` or `{page}-charts.tsx`
- Located in: `components/` directory

## Import Order Pattern
1. "use client" directive (for chart components using Recharts)
2. Recharts imports
3. UI component imports
4. Icon imports (lucide-react)
5. Server action imports (for server components)
6. Type imports

## Key Principles
- Charts are client components ("use client")
- Stat displays are async server components
- Always wrap in Card components
- Use ResponsiveContainer with explicit height
- Apply consistent color palette (#F5532C, #00848B, #888888)
- Style axes with no tick/axis lines, gray stroke, 12px font
- Customize tooltip with dark background (#072427)
- Use rounded bar corners: radius={[4, 4, 0, 0]}
- Handle errors with fallback UI
- Use grid layout for stat cards
- Include icons in stat card headers
- Map status/priority to badge variants
