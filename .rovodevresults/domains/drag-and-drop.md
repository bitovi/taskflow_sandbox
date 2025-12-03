# Drag and Drop Domain Implementation

## Overview
TaskFlow implements drag-and-drop functionality using @hello-pangea/dnd for the Kanban board, with optimistic UI updates and server synchronization patterns.

## Required Library and Setup

### @hello-pangea/dnd Integration
All drag-and-drop functionality must use @hello-pangea/dnd library:

```tsx
// components/kanban-board.tsx
"use client"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
```

### Component Hierarchy
Drag-and-drop follows strict component hierarchy:

```
DragDropContext (root)
  └── Droppable (columns)
      └── Draggable (task cards)
```

## Required Patterns

### 1. DragDropContext Implementation
Root component that handles all drag events:

```tsx
// components/kanban-board.tsx
export function KanbanBoard({ initialData }: { initialData: KanbanData }) {
  const [columns, setColumns] = useState(initialData);
  const [isPending, startTransition] = useTransition();

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    // Optimistic UI update logic here
    // Server synchronization here
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {/* Droppable columns */}
    </DragDropContext>
  );
}
```

### 2. Droppable Column Configuration
Each column must be a Droppable with unique ID:

```tsx
{Object.values(columns).map((column) => (
  <Droppable key={column.id} droppableId={column.id}>
    {(provided, snapshot) => (
      <div
        ref={provided.innerRef}
        {...provided.droppableProps}
        className={cn(
          "flex-shrink-0 w-80 transition-colors rounded-lg",
          snapshot.isDraggingOver ? "bg-background-light" : "bg-background-dark",
        )}
      >
        <Card className="bg-transparent border-0 shadow-none">
          <CardHeader className="pb-3 px-4 pt-4">
            <CardTitle className="text-sm font-medium">
              {column.title}
              <Badge variant="secondary" className="ml-2">
                {column.tasks.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 min-h-[100px] px-4 pb-4">
            {/* Draggable items */}
            {provided.placeholder}
          </CardContent>
        </Card>
      </div>
    )}
  </Droppable>
))}
```

### 3. Draggable Item Implementation
Task cards must be wrapped in Draggable components:

```tsx
{column.tasks.map((task, index) => (
  <Draggable key={task.id} draggableId={String(task.id)} index={index}>
    {(provided, snapshot) => (
      <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
        <Card
          className={cn(
            "cursor-pointer hover:shadow-md transition-shadow",
            snapshot.isDragging && "shadow-lg ring-2 ring-primary",
          )}
        >
          <CardContent className="p-3">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h4 className={`font-medium text-sm leading-tight ${poppins.className}`}>
                  {task.name}
                </h4>
                <Badge
                  variant={
                    task.priority === "high"
                      ? "destructive"
                      : task.priority === "medium"
                        ? "default"
                        : "secondary"
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
                    <span>
                      {new Date(task.dueDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )}
  </Draggable>
))}
```

## State Management Patterns

### 1. Optimistic Updates
Update UI immediately on drag, then sync with server:

```tsx
const onDragEnd = (result: DropResult) => {
  const { source, destination, draggableId } = result;

  if (!destination) return;
  if (source.droppableId === destination.droppableId && source.index === destination.index) return;

  const startColId = source.droppableId as keyof KanbanData;
  const finishColId = destination.droppableId as keyof KanbanData;

  const startCol = columns[startColId];
  const finishCol = columns[finishColId];

  const startTasks = Array.from(startCol.tasks);
  const [movedTask] = startTasks.splice(source.index, 1);

  // Optimistically update UI
  if (startColId === finishColId) {
    // Same column reorder
    startTasks.splice(destination.index, 0, movedTask);
    const newCol = { ...startCol, tasks: startTasks };
    setColumns({ ...columns, [startColId]: newCol });
  } else {
    // Cross-column move
    const finishTasks = Array.from(finishCol.tasks);
    finishTasks.splice(destination.index, 0, movedTask);
    const newStartCol = { ...startCol, tasks: startTasks };
    const newFinishCol = { ...finishCol, tasks: finishTasks };
    setColumns({ ...columns, [startColId]: newStartCol, [finishColId]: newFinishCol });
  }

  // Update the database in background
  startTransition(async () => {
    await updateTaskStatus(Number.parseInt(draggableId), finishColId);
  });
};
```

### 2. Background Server Sync
Use useTransition for non-blocking server updates:

```tsx
import { useTransition } from "react";
import { updateTaskStatus } from "@/app/(dashboard)/tasks/actions";

const [isPending, startTransition] = useTransition();

// In onDragEnd handler
startTransition(async () => {
  await updateTaskStatus(Number.parseInt(draggableId), finishColId);
});
```

## Data Structure Requirements

### KanbanData Type Definition
Define strict types for drag-and-drop data:

```typescript
// lib/types.ts
import type { Task as PrismaTask, User } from "@/app/generated/prisma/client";

type TaskWithProfile = PrismaTask & {
  assignee?: Pick<User, "name"> | null;
};

export type KanbanColumn = {
  id: "todo" | "in_progress" | "review" | "done";
  title: string;
  tasks: TaskWithProfile[];
};

export type KanbanData = {
  [key in "todo" | "in_progress" | "review" | "done"]: KanbanColumn;
};
```

### Data Transformation Pattern
Transform server data to Kanban structure:

```tsx
// app/(dashboard)/board/page.tsx
export default async function BoardPage() {
  const { tasks } = await getAllTasks();
  
  // Transform tasks into column structure
  const kanbanData: KanbanData = {
    todo: { id: "todo", title: "To Do", tasks: [] },
    in_progress: { id: "in_progress", title: "In Progress", tasks: [] },
    review: { id: "review", title: "Review", tasks: [] },
    done: { id: "done", title: "Done", tasks: [] },
  };

  // Group tasks by status
  tasks.forEach((task) => {
    const status = task.status as keyof KanbanData;
    if (kanbanData[status]) {
      kanbanData[status].tasks.push(task);
    }
  });

  return <KanbanBoard initialData={kanbanData} />;
}
```

## Visual Feedback Patterns

### Drag State Styling
Provide visual feedback during drag operations:

```tsx
// Droppable container styling
className={cn(
  "flex-shrink-0 w-80 transition-colors rounded-lg",
  snapshot.isDraggingOver ? "bg-background-light" : "bg-background-dark",
)}

// Draggable item styling
className={cn(
  "cursor-pointer hover:shadow-md transition-shadow",
  snapshot.isDragging && "shadow-lg ring-2 ring-primary",
)}
```

### Placeholder Management
Always include the required placeholder:

```tsx
<CardContent className="space-y-3 min-h-[100px] px-4 pb-4">
  {/* Draggable items */}
  {provided.placeholder} {/* Required for proper spacing */}
</CardContent>
```

## ID Management

### String vs Number ID Conversion
Handle ID type conversion between UI and database:

```tsx
// Draggable uses string IDs
<Draggable key={task.id} draggableId={String(task.id)} index={index}>

// Server action expects number IDs
await updateTaskStatus(Number.parseInt(draggableId), finishColId);
```

### Unique Key Requirements
Ensure unique keys for React reconciliation:

```tsx
// Column keys
{Object.values(columns).map((column) => (
  <Droppable key={column.id} droppableId={column.id}>

// Task keys
{column.tasks.map((task, index) => (
  <Draggable key={task.id} draggableId={String(task.id)} index={index}>
```

## Performance Optimization

### Array Cloning for Immutability
Always clone arrays before modification:

```tsx
const startTasks = Array.from(startCol.tasks);
const finishTasks = Array.from(finishCol.tasks);
```

### Minimal Re-renders
Update only the affected columns:

```tsx
// Same column - update only one
const newCol = { ...startCol, tasks: startTasks };
setColumns({ ...columns, [startColId]: newCol });

// Different columns - update both
setColumns({ 
  ...columns, 
  [startColId]: newStartCol, 
  [finishColId]: newFinishCol 
});
```

## Error Handling

### Drag Validation
Validate drag operations before processing:

```tsx
const onDragEnd = (result: DropResult) => {
  const { source, destination, draggableId } = result;

  // No destination (dropped outside)
  if (!destination) return;
  
  // No actual movement
  if (source.droppableId === destination.droppableId && source.index === destination.index) return;

  // Proceed with valid drag operation
};
```

### Server Sync Error Handling
Handle server action failures gracefully:

```tsx
startTransition(async () => {
  try {
    await updateTaskStatus(Number.parseInt(draggableId), finishColId);
  } catch (error) {
    // Revert optimistic update or show error
    console.error('Failed to update task status:', error);
  }
});
```

## Integration with Server Actions

### Status Update Server Action
Server action must handle status changes:

```typescript
// app/(dashboard)/tasks/actions.ts
export async function updateTaskStatus(taskId: number, status: string) {
    try {
        await prisma.task.update({ 
            where: { id: taskId }, 
            data: { status } 
        });
        revalidatePath("/board"); // Revalidate board page
        return { error: null };
    } catch (e) {
        return { error: "Failed to update task status." };
    }
}
```