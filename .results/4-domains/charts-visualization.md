# Data Visualization Domain

## Overview
Data visualization uses recharts library for creating charts and graphs in the dashboard.

## Key Patterns

### 1. Bar Chart Component

```tsx
// components/dashboard-charts.tsx
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
            <Bar dataKey="total" name="Total Tasks" fill="#F5532C" radius={[4, 4, 0, 0]} />
            <Bar dataKey="completed" name="Completed" fill="#00848B" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
```

**Key Points:**
- Must be client component (`"use client"`)
- Wrap in `ResponsiveContainer` for responsive sizing
- Use Card component for consistent layout
- Custom styling via props (colors, stroke, fontSize)
- Format tooltips to match app theme

### 2. Data Processing for Charts

```tsx
// app/(dashboard)/page.tsx
"use client"

export default function IndexPage() {
  const [allTasks, setAllTasks] = useState<Task[]>([]);

  useEffect(() => {
    getAllTasks().then(({ tasks }) => {
      setAllTasks(tasks);
    });
  }, []);

  // Group tasks by month
  const statsMap = new Map();
  for (const task of allTasks) {
    const createdMonth = task.createdAt.toISOString().slice(0, 7); // 'YYYY-MM'
    if (!statsMap.has(createdMonth)) {
      statsMap.set(createdMonth, { month: createdMonth, total: 0, completed: 0 });
    }
    statsMap.get(createdMonth).total++;
    if (task.status === "done") {
      statsMap.get(createdMonth).completed++;
    }
  }
  
  const taskStats = Array.from(statsMap.values()).sort((a, b) => 
    a.month.localeCompare(b.month)
  );

  return <DashboardCharts data={taskStats} />;
}
```

**Key Points:**
- Process data client-side for charts
- Group/aggregate data into chart-friendly format
- Sort data for proper chart ordering
- Pass formatted data as props

### 3. Pie Chart Pattern

```tsx
import { PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#F5532C', '#00848B', '#8884d8', '#82ca9d'];

<ResponsiveContainer width="100%" height={300}>
  <PieChart>
    <Pie
      data={statusChartData}
      cx="50%"
      cy="50%"
      labelLine={false}
      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
      outerRadius={80}
      fill="#8884d8"
      dataKey="value"
    >
      {statusChartData.map((entry, index) => (
        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
      ))}
    </Pie>
    <Tooltip />
  </PieChart>
</ResponsiveContainer>
```

**Key Points:**
- Use `Cell` components for custom colors per slice
- Custom label rendering with percentages
- Tooltip for additional info on hover

### 4. Chart Color Scheme

```tsx
// Match app theme colors
const colors = {
  primary: "#F5532C",
  secondary: "#00848B",
  muted: "#888888",
  background: "#072427",
  border: "hsl(var(--border))",
}
```

**Key Points:**
- Use project's color palette
- Match tooltip background to app theme
- Consistent stroke and text colors

## Common Patterns

### Responsive Chart Container
```tsx
<ResponsiveContainer width="100%" height={350}>
  <BarChart data={data}>
    {/* ... */}
  </BarChart>
</ResponsiveContainer>
```

### Custom Tooltip Styling
```tsx
<Tooltip
  cursor={{ fill: "transparent" }}
  contentStyle={{
    backgroundColor: "#072427",
    borderColor: "hsl(var(--border))",
  }}
/>
```

### Axis Customization
```tsx
<XAxis 
  dataKey="month" 
  stroke="#888888" 
  fontSize={12} 
  tickLine={false} 
  axisLine={false} 
/>
```

### Data Aggregation Pattern
```tsx
const statusData = tasks.reduce((acc, task) => {
  acc[task.status] = (acc[task.status] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

const chartData = Object.entries(statusData).map(([status, count]) => ({
  name: status,
  value: count,
}));
```

## Constraints
- **Client Components Only**: recharts requires browser APIs
- **ResponsiveContainer**: Always wrap charts for proper sizing
- **Theme Colors**: Use project color palette
- **Data Processing**: Format data before passing to charts
- **Performance**: Process data efficiently, avoid re-renders
- **recharts Library**: Don't use other charting libraries
