# Charts Visualization Domain Implementation

## Overview
TaskFlow implements data visualization using Recharts library with responsive containers, consistent theming, and client-side data transformation patterns.

## Required Library and Setup

### Recharts Integration
All data visualization must use Recharts library:

```tsx
// app/(dashboard)/page.tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
```

### Component Structure
Charts are embedded within Card components for consistent layout:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Chart Title</CardTitle>
  </CardHeader>
  <CardContent>
    <ResponsiveContainer width="100%" height={300}>
      {/* Chart component */}
    </ResponsiveContainer>
  </CardContent>
</Card>
```

## Required Patterns

### 1. ResponsiveContainer Wrapper
All charts must be wrapped in ResponsiveContainer:

```tsx
<ResponsiveContainer width="100%" height={300}>
  <BarChart data={chartData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="name" fontSize={20} />
    <YAxis />
    <Tooltip cursor={{ fill: "transparent" }} />
    <Bar dataKey="count" fill="#4BBEC5" />
  </BarChart>
</ResponsiveContainer>
```

### 2. Consistent Color Palette
Use predefined color constants for chart theming:

```tsx
// Color palette for charts
const COLORS = ['#BCECEF', '#4BBEC5', '#00848B', '#F5532C', '#8dd1e1', '#d084d0'];
```

### 3. Clean Tooltip Configuration
Configure tooltips with transparent cursor for clean appearance:

```tsx
<Tooltip cursor={{ fill: "transparent" }} />
```

## Chart Type Implementations

### 1. Pie Chart with Custom Labels
Use for status distribution and percentage-based data:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Task Status Distribution</CardTitle>
  </CardHeader>
  <CardContent>
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={statusChartData}
          cx="50%"
          cy="50%"
          outerRadius={100}
          fill="#F5532C"
          dataKey="value"
          fontSize={16}
          label={({ name, value, percent }) => `${name}: ${value} (${((percent || 0) * 100).toFixed(0)}%)`}
        >
          {statusChartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip cursor={{ fill: "transparent" }} />
      </PieChart>
    </ResponsiveContainer>
  </CardContent>
</Card>
```

### 2. Bar Chart for Categorical Data
Use for priority distribution, assignee data, and other categorical metrics:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Tasks by Priority</CardTitle>
  </CardHeader>
  <CardContent>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={priorityChartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" fontSize={20} />
        <YAxis />
        <Tooltip cursor={{ fill: "transparent" }} />
        <Bar dataKey="count" fill="#4BBEC5" />
      </BarChart>
    </ResponsiveContainer>
  </CardContent>
</Card>
```

### 3. Bar Chart with Rotated Labels
For data with long labels (user names, etc.):

```tsx
<Card>
  <CardHeader>
    <CardTitle>Tasks by Assignee</CardTitle>
  </CardHeader>
  <CardContent>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={assigneeChartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="name" 
          angle={-45} 
          textAnchor="end" 
          height={80} 
          fontSize={16} 
          stroke="#888888" 
        />
        <YAxis />
        <Tooltip cursor={{ fill: "transparent" }} />
        <Bar dataKey="tasks" fill="#4BBEC5" />
      </BarChart>
    </ResponsiveContainer>
  </CardContent>
</Card>
```

## Data Transformation Patterns

### 1. Client-Side Data Processing
Transform raw server data into chart-friendly format:

```tsx
// app/(dashboard)/page.tsx
export default function IndexPage() {
  const [allTasks, setAllTasks] = useState<Task[]>([]);

  useEffect(() => {
    getAllTasks().then(({ tasks }) => {
      setAllTasks(tasks);
    });
  }, []);

  // Process data for charts
  const statusData = allTasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const priorityData = allTasks.reduce((acc, task) => {
    acc[task.priority] = (acc[task.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Convert to chart-friendly format
  const statusChartData = Object.entries(statusData).map(([status, count]) => ({
    name: status,
    value: count,
  }));

  const priorityChartData = Object.entries(priorityData).map(([priority, count]) => ({
    name: priority,
    count: count,
  }));
}
```

### 2. Label Truncation for Long Text
Handle long user names and labels gracefully:

```tsx
const assigneeChartData = Object.entries(assigneeData).map(([assignee, count]) => ({
  name: assignee.length > 15 ? assignee.substring(0, 15) + '...' : assignee,
  tasks: count,
}));

const creatorChartData = Object.entries(creatorData).map(([creator, count]) => ({
  name: creator.length > 15 ? creator.substring(0, 15) + '...' : creator,
  created: count,
}));
```

### 3. Time-Series Data Processing
Handle date-based aggregations:

```tsx
// Group tasks by month (YYYY-MM)
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

// Convert to sorted array
const taskStats = Array.from(statsMap.values()).sort((a, b) => a.month.localeCompare(b.month));
```

## Component Integration

### 1. Dedicated Chart Components
Create reusable chart components for complex visualizations:

```tsx
// components/dashboard-charts.tsx
interface DashboardChartsProps {
  data: Array<{
    month: string;
    total: number;
    completed: number;
  }>;
}

export function DashboardCharts({ data }: DashboardChartsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Task Creation Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="total" fill="#4BBEC5" name="Total Tasks" />
            <Bar dataKey="completed" fill="#F5532C" name="Completed" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

### 2. Chart Grid Layout
Organize multiple charts in responsive grid:

```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
  {/* Task Status Distribution - Pie Chart */}
  <Card>
    <CardHeader>
      <CardTitle>Task Status Distribution</CardTitle>
    </CardHeader>
    <CardContent>
      {/* Pie chart implementation */}
    </CardContent>
  </Card>

  {/* Priority Distribution - Bar Chart */}
  <Card>
    <CardHeader>
      <CardTitle>Tasks by Priority</CardTitle>
    </CardHeader>
    <CardContent>
      {/* Bar chart implementation */}
    </CardContent>
  </Card>
</div>
```

## Styling and Theming

### 1. Chart Color Consistency
Use consistent colors across all charts:

```tsx
// Primary brand colors
const BRAND_COLORS = {
  primary: '#4BBEC5',
  secondary: '#F5532C',
  tertiary: '#00848B',
  light: '#BCECEF',
  accent: '#8dd1e1',
  purple: '#d084d0'
};

// Apply to different chart types
<Bar dataKey="count" fill={BRAND_COLORS.primary} />
<Bar dataKey="created" fill={BRAND_COLORS.secondary} />
```

### 2. Typography Integration
Match chart text styling with application fonts:

```tsx
<XAxis 
  dataKey="name" 
  fontSize={20}        // Consistent with app font size
  stroke="#888888"     // Muted text color
/>
```

### 3. Responsive Typography
Scale text appropriately for different screen sizes:

```tsx
<XAxis 
  dataKey="name" 
  angle={-45} 
  textAnchor="end" 
  height={80}          // Provide space for rotated text
  fontSize={16} 
  stroke="#888888" 
/>
```

## Performance Optimization

### 1. Data Memoization
Memoize expensive data transformations:

```tsx
const chartData = useMemo(() => {
  return allTasks.reduce((acc, task) => {
    // Expensive calculation
    return processedData;
  }, {});
}, [allTasks]);
```

### 2. Conditional Rendering
Only render charts when data is available:

```tsx
{allTasks.length > 0 && (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={chartData}>
      {/* Chart configuration */}
    </BarChart>
  </ResponsiveContainer>
)}
```

## Accessibility Considerations

### 1. Alternative Text and Descriptions
Provide meaningful descriptions for screen readers:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Task Status Distribution</CardTitle>
    <p className="text-sm text-muted-foreground">
      Visual breakdown of tasks by current status
    </p>
  </CardHeader>
  <CardContent>
    {/* Chart with accessible data table as fallback */}
  </CardContent>
</Card>
```

### 2. Color Accessibility
Ensure sufficient color contrast and don't rely solely on color:

```tsx
// Use patterns or labels in addition to colors
label={({ name, value, percent }) => 
  `${name}: ${value} (${((percent || 0) * 100).toFixed(0)}%)`
}
```

## Chart Data Structure Requirements

### Standard Data Formats
Charts expect specific data structures:

```typescript
// Pie chart data
interface PieChartData {
  name: string;
  value: number;
}

// Bar chart data
interface BarChartData {
  name: string;
  count: number;        // or tasks, created, etc.
}

// Time series data
interface TimeSeriesData {
  month: string;        // YYYY-MM format
  total: number;
  completed: number;
}
```

### Data Validation
Ensure data integrity before rendering:

```tsx
// Validate data exists and has proper structure
if (!chartData || chartData.length === 0) {
  return <div>No data available</div>;
}

// Ensure required fields exist
const validData = chartData.filter(item => 
  item.name && typeof item.value === 'number'
);
```