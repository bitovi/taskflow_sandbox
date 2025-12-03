# Data Visualization Domain Implementation

## Overview

Data visualization in this application uses Recharts, a composable charting library built on React components and D3. Charts display task metrics and statistics, providing visual insights into project progress and team performance.

## Key Technologies

- **Recharts v2.15.0** - Declarative React charting library
- **D3 (via Recharts)** - Data-driven transformations
- **Responsive design** - Charts adapt to container size
- **Custom styling** - Themed to match application design
- **Server-side data aggregation** - Prepared data from Server Components

## Chart Components

### 1. Bar Chart for Task Overview

**From components/dashboard-charts.tsx:**
```tsx
"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface TaskStats {
  month: string
  total: number
  completed: number
}

export function DashboardCharts({ data }: { data: TaskStats[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Task Overview</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
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
            <Tooltip
              cursor={{ fill: "transparent" }}
              contentStyle={{
                backgroundColor: "#072427",
                borderColor: "hsl(var(--border))",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "14px" }} />
            <Bar 
              dataKey="total" 
              name="Total Tasks" 
              fill="#F5532C" 
              radius={[4, 4, 0, 0]} 
            />
            <Bar 
              dataKey="completed" 
              name="Completed" 
              fill="#00848B" 
              radius={[4, 4, 0, 0]} 
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
```

**Key features:**
- **ResponsiveContainer** - Adapts to parent width/height
- **Custom colors** - Brand colors (#F5532C primary, #00848B accent)
- **Themed tooltip** - Matches dark background (#072427)
- **Rounded bars** - Border radius for visual polish
- **Minimal axes** - No tick lines or axis lines for clean look

### 2. Task Overview List

**From components/task-overview.tsx:**
```tsx
import { Avatar, AvatarName } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Task as PrismaTask, User } from "@/app/generated/prisma/client"

type Task = PrismaTask & {
  assignee?: Pick<User, "name"> | null
}

const priorityVariant: Record<string, "default" | "secondary" | "destructive"> = {
  Low: "secondary",
  Medium: "default",
  High: "destructive",
}

export function TaskOverview({ tasks }: { tasks: Task[] | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Tasks</CardTitle>
        <CardDescription>
          An overview of the most recently created tasks.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
                  <Badge variant={priorityVariant[task.priority || "Medium"]}>
                    {task.priority}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No recent tasks.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

**Key features:**
- **Avatar display** - User initials from AvatarName component
- **Priority badges** - Color-coded by priority level
- **Flexible layout** - Flex container with auto margins
- **Empty state** - Friendly message when no tasks

## Implementation Patterns

### 1. Responsive Container

**All charts use ResponsiveContainer:**
```tsx
import { ResponsiveContainer } from "recharts"

<ResponsiveContainer width="100%" height={350}>
  {/* Chart component */}
</ResponsiveContainer>
```

**Benefits:**
- Adapts to parent container size
- Maintains aspect ratio
- Works with CSS Grid and Flexbox layouts

### 2. Custom Axis Styling

**Minimal, clean axis design:**
```tsx
<XAxis 
  dataKey="month"           // Data field for x-axis
  stroke="#888888"          // Subtle axis color
  fontSize={12}             // Readable font size
  tickLine={false}          // Remove tick marks
  axisLine={false}          // Remove axis line
/>

<YAxis
  stroke="#888888"
  fontSize={12}
  tickLine={false}
  axisLine={false}
  tickFormatter={(value) => `${value}`}  // Custom formatting
/>
```

### 3. Tooltip Customization

**Styled tooltip matching app theme:**
```tsx
<Tooltip
  cursor={{ fill: "transparent" }}  // No highlight bar
  contentStyle={{
    backgroundColor: "#072427",      // Dark background
    borderColor: "hsl(var(--border))",  // Themed border
  }}
/>
```

**Tooltip automatically shows:**
- Data point values
- Series labels
- Formatted values

### 4. Legend Configuration

**Custom legend styling:**
```tsx
<Legend 
  wrapperStyle={{ fontSize: "14px" }}  // Readable font size
/>
```

**Legend displays:**
- Series names (e.g., "Total Tasks", "Completed")
- Color indicators
- Interactive toggle (click to hide/show series)

### 5. Bar Chart Configuration

**Styled bars with custom colors:**
```tsx
<Bar 
  dataKey="total"              // Data field
  name="Total Tasks"           // Display name in legend
  fill="#F5532C"              // Primary brand color
  radius={[4, 4, 0, 0]}       // Rounded top corners
/>

<Bar 
  dataKey="completed" 
  name="Completed" 
  fill="#00848B"              // Accent color
  radius={[4, 4, 0, 0]} 
/>
```

**Border radius format:** `[topLeft, topRight, bottomRight, bottomLeft]`

### 6. Data Shape for Charts

**TypeScript interface for chart data:**
```typescript
interface TaskStats {
  month: string      // X-axis label
  total: number      // First bar value
  completed: number  // Second bar value
}

// Example data
const data: TaskStats[] = [
  { month: "Jan", total: 15, completed: 12 },
  { month: "Feb", total: 20, completed: 18 },
  { month: "Mar", total: 18, completed: 15 },
]
```

### 7. Server-Side Data Preparation

**Aggregate data in Server Component:**
```typescript
// In dashboard page.tsx (Server Component)
import { DashboardCharts } from "@/components/dashboard-charts"
import { PrismaClient } from "@/app/generated/prisma"

const prisma = new PrismaClient()

export default async function DashboardPage() {
  // Fetch all tasks
  const tasks = await prisma.task.findMany({
    select: {
      createdAt: true,
      status: true,
    },
  })

  // Aggregate by month
  const monthlyStats = tasks.reduce((acc, task) => {
    const month = new Date(task.createdAt).toLocaleDateString("en-US", {
      month: "short",
    })
    
    if (!acc[month]) {
      acc[month] = { month, total: 0, completed: 0 }
    }
    
    acc[month].total++
    if (task.status === "done") {
      acc[month].completed++
    }
    
    return acc
  }, {} as Record<string, TaskStats>)

  const chartData = Object.values(monthlyStats)

  return (
    <div>
      <DashboardCharts data={chartData} />
    </div>
  )
}
```

## Chart Variants

### Bar Chart

**Best for:**
- Comparing categories
- Showing multiple series
- Discrete data points

```tsx
import { Bar, BarChart } from "recharts"

<BarChart data={data}>
  <Bar dataKey="value" fill="#F5532C" />
</BarChart>
```

### Line Chart

**Best for:**
- Trends over time
- Continuous data
- Multiple series comparison

```tsx
import { Line, LineChart } from "recharts"

<LineChart data={data}>
  <Line 
    type="monotone" 
    dataKey="value" 
    stroke="#F5532C" 
    strokeWidth={2} 
  />
</LineChart>
```

### Area Chart

**Best for:**
- Cumulative values
- Part-to-whole relationships
- Volume visualization

```tsx
import { Area, AreaChart } from "recharts"

<AreaChart data={data}>
  <Area 
    type="monotone" 
    dataKey="value" 
    fill="#F5532C" 
    stroke="#F5532C" 
  />
</AreaChart>
```

### Pie Chart

**Best for:**
- Percentage distribution
- Part-to-whole relationships
- Simple proportions

```tsx
import { Pie, PieChart, Cell } from "recharts"

const COLORS = ["#F5532C", "#00848B", "#888888"]

<PieChart>
  <Pie 
    data={data} 
    dataKey="value" 
    nameKey="name"
    cx="50%" 
    cy="50%" 
  >
    {data.map((entry, index) => (
      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
    ))}
  </Pie>
</PieChart>
```

## Color Palette

**Brand colors used in visualizations:**
```typescript
const CHART_COLORS = {
  primary: "#F5532C",      // Primary brand color (orange-red)
  accent: "#00848B",       // Accent color (teal)
  muted: "#888888",        // Muted/secondary data
  background: "#072427",   // Dark background
  border: "hsl(var(--border))",  // Themed border
}
```

## Grid Layout for Multiple Charts

**Dashboard grid with multiple visualizations:**
```tsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
  {/* Main chart - spans 4 columns */}
  <div className="lg:col-span-4">
    <DashboardCharts data={chartData} />
  </div>
  
  {/* Side panel - spans 3 columns */}
  <div className="lg:col-span-3">
    <TaskOverview tasks={recentTasks} />
  </div>
</div>
```

## Card Wrapper Pattern

**All visualizations wrapped in Card:**
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Chart Title</CardTitle>
  </CardHeader>
  <CardContent className="pl-2">
    <ResponsiveContainer width="100%" height={350}>
      {/* Chart */}
    </ResponsiveContainer>
  </CardContent>
</Card>
```

**Benefits:**
- Consistent styling
- Proper spacing
- Visual hierarchy
- Responsive behavior

## Best Practices

### 1. Always Use ResponsiveContainer

```tsx
// ✅ Good - Responsive to parent
<ResponsiveContainer width="100%" height={350}>
  <BarChart data={data}>
    {/* Chart config */}
  </BarChart>
</ResponsiveContainer>

// ❌ Bad - Fixed width
<BarChart width={600} height={350} data={data}>
  {/* Chart config */}
</BarChart>
```

### 2. Prepare Data Server-Side

```tsx
// ✅ Good - Aggregate in Server Component
export default async function DashboardPage() {
  const tasks = await prisma.task.findMany()
  const chartData = aggregateTasks(tasks)
  return <DashboardCharts data={chartData} />
}

// ❌ Bad - Raw data to client
export default async function DashboardPage() {
  const tasks = await prisma.task.findMany()
  return <DashboardCharts tasks={tasks} />  // Process client-side
}
```

### 3. Use Brand Colors Consistently

```tsx
// ✅ Good - Consistent brand colors
<Bar dataKey="total" fill="#F5532C" />
<Bar dataKey="completed" fill="#00848B" />

// ❌ Bad - Random colors
<Bar dataKey="total" fill="blue" />
<Bar dataKey="completed" fill="green" />
```

### 4. Provide Empty States

```tsx
// ✅ Good - Handle empty data
{tasks && tasks.length > 0 ? (
  tasks.map(task => <TaskCard key={task.id} task={task} />)
) : (
  <p className="text-sm text-muted-foreground">No recent tasks.</p>
)}

// ❌ Bad - No empty state
{tasks.map(task => <TaskCard key={task.id} task={task} />)}
```

### 5. Type Chart Data

```typescript
// ✅ Good - TypeScript interface
interface TaskStats {
  month: string
  total: number
  completed: number
}

export function DashboardCharts({ data }: { data: TaskStats[] }) {
  // Type-safe usage
}

// ❌ Bad - Any type
export function DashboardCharts({ data }: { data: any[] }) {
  // No type safety
}
```

### 6. Use Card Wrapper for Consistency

```tsx
// ✅ Good - Wrapped in Card
<Card>
  <CardHeader>
    <CardTitle>Task Overview</CardTitle>
  </CardHeader>
  <CardContent>
    <ResponsiveContainer>
      {/* Chart */}
    </ResponsiveContainer>
  </CardContent>
</Card>

// ❌ Bad - No wrapper
<ResponsiveContainer>
  {/* Chart */}
</ResponsiveContainer>
```

### 7. Optimize Data Queries

```typescript
// ✅ Good - Select only needed fields
const tasks = await prisma.task.findMany({
  select: {
    createdAt: true,
    status: true,
  },
})

// ❌ Bad - Fetch all fields
const tasks = await prisma.task.findMany()
```

## Common Visualization Patterns

### Monthly Aggregation

```typescript
const monthlyStats = tasks.reduce((acc, task) => {
  const month = new Date(task.createdAt).toLocaleDateString("en-US", {
    month: "short",
  })
  
  if (!acc[month]) {
    acc[month] = { month, total: 0, completed: 0 }
  }
  
  acc[month].total++
  if (task.status === "done") {
    acc[month].completed++
  }
  
  return acc
}, {} as Record<string, TaskStats>)
```

### Status Distribution

```typescript
const statusCounts = tasks.reduce((acc, task) => {
  acc[task.status] = (acc[task.status] || 0) + 1
  return acc
}, {} as Record<string, number>)

const pieData = Object.entries(statusCounts).map(([status, count]) => ({
  name: status,
  value: count,
}))
```

### Priority Breakdown

```typescript
const priorityBreakdown = tasks.reduce((acc, task) => {
  const key = task.priority || "none"
  acc[key] = (acc[key] || 0) + 1
  return acc
}, {} as Record<string, number>)
```

## Advanced Customization

### Custom Tooltip Content

```tsx
import { TooltipProps } from "recharts"

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card-background p-3 rounded-md border">
        <p className="text-sm font-medium">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

<BarChart data={data}>
  <Tooltip content={<CustomTooltip />} />
  {/* Other components */}
</BarChart>
```

### Custom Legend Content

```tsx
const CustomLegend = ({ payload }: any) => {
  return (
    <div className="flex justify-center space-x-4">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center space-x-2">
          <div 
            className="w-3 h-3 rounded-sm" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

<BarChart data={data}>
  <Legend content={<CustomLegend />} />
  {/* Other components */}
</BarChart>
```

## Performance Considerations

### Memoize Data Transformations

```tsx
"use client"

import { useMemo } from "react"

export function DashboardCharts({ tasks }: { tasks: Task[] }) {
  const chartData = useMemo(() => {
    // Expensive aggregation
    return aggregateTasks(tasks)
  }, [tasks])

  return (
    <ResponsiveContainer>
      <BarChart data={chartData}>
        {/* Chart */}
      </BarChart>
    </ResponsiveContainer>
  )
}
```

### Limit Data Points

```typescript
// Limit to last 12 months
const recentData = chartData.slice(-12)

// Or use pagination for large datasets
const pageSize = 50
const paginatedData = allData.slice(page * pageSize, (page + 1) * pageSize)
```

## Summary

The data visualization domain demonstrates effective use of Recharts for insights:

1. **Recharts library** - Declarative, composable React charts
2. **Responsive design** - Charts adapt to container size
3. **Brand consistency** - Custom colors matching app theme
4. **Server-side aggregation** - Data prepared efficiently
5. **Type safety** - TypeScript interfaces for data
6. **Card wrappers** - Consistent component structure
7. **Empty states** - Graceful handling of no data
8. **Custom styling** - Themed tooltips, axes, and legends
9. **Performance** - Optimized queries and memoization
10. **Accessibility** - Semantic markup and labels

This implementation provides clear, performant data visualizations that integrate seamlessly with the application's design system.
