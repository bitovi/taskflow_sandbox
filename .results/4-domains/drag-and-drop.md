# Drag-and-Drop Domain

## Overview
Drag-and-drop functionality uses @hello-pangea/dnd library for the Kanban board interface with optimistic UI updates.

## Key Patterns

### 1. Basic Setup

```tsx
// components/kanban-board.tsx
"use client"

import { useState, useTransition } from "react"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import { updateTaskStatus } from "@/app/(dashboard)/tasks/actions"

export function KanbanBoard({ initialData }: { initialData: KanbanData }) {
  const [columns, setColumns] = useState(initialData)
  const [isPending, startTransition] = useTransition()

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result

    if (!destination) return
    if (source.droppableId === destination.droppableId && 
        source.index === destination.index) return

    // Update UI optimistically
    // ... state updates ...

    // Sync with server
    startTransition(async () => {
      await updateTaskStatus(Number.parseInt(draggableId), destination.droppableId)
    })
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {/* ... */}
    </DragDropContext>
  )
}
```

**Key Points:**
- Must be client component (`"use client"`)
- Wrap entire board in `DragDropContext`
- `onDragEnd` handler updates state and syncs to server
- Use `startTransition` for non-blocking server updates

### 2. Droppable Columns

```tsx
<DragDropContext onDragEnd={onDragEnd}>
  <div className="flex space-x-6 overflow-x-auto pb-4">
    {Object.values(columns).map((column) => (
      <Droppable key={column.id} droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-shrink-0 w-80 transition-colors rounded-lg",
              snapshot.isDraggingOver ? "bg-background-light" : "bg-background-dark"
            )}
          >
            <Card>
              <CardHeader>
                <CardTitle>{column.title}</CardTitle>
              </CardHeader>
              <CardContent>
                {column.tasks.map((task, index) => (
                  <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                    {/* ... */}
                  </Draggable>
                ))}
                {provided.placeholder}
              </CardContent>
            </Card>
          </div>
        )}
      </Droppable>
    ))}
  </div>
</DragDropContext>
```

**Key Points:**
- Each column is a `Droppable` with unique `droppableId`
- Use `provided.innerRef` and spread `provided.droppableProps`
- Render `provided.placeholder` at the end for spacing
- Use `snapshot.isDraggingOver` for visual feedback

### 3. Draggable Items

```tsx
{column.tasks.map((task, index) => (
  <Draggable key={task.id} draggableId={String(task.id)} index={index}>
    {(provided, snapshot) => (
      <div 
        ref={provided.innerRef} 
        {...provided.draggableProps} 
        {...provided.dragHandleProps}
      >
        <Card className={cn(
          "cursor-pointer hover:shadow-md transition-shadow",
          snapshot.isDragging && "shadow-lg ring-2 ring-primary"
        )}>
          <CardContent className="p-3">
            <h4>{task.name}</h4>
            <Badge>{task.priority}</Badge>
          </CardContent>
        </Card>
      </div>
    )}
  </Draggable>
))}
```

**Key Points:**
- `draggableId` must be string (convert numbers with `String()`)
- Use `provided.innerRef`, `draggableProps`, and `dragHandleProps`
- `snapshot.isDragging` for visual feedback during drag
- Index determines position in column

### 4. Optimistic State Updates

```tsx
const onDragEnd = (result: DropResult) => {
  const { source, destination, draggableId } = result

  if (!destination) return

  const startColId = source.droppableId as keyof KanbanData
  const finishColId = destination.droppableId as keyof KanbanData

  const startCol = columns[startColId]
  const finishCol = columns[finishColId]

  const startTasks = Array.from(startCol.tasks)
  const [movedTask] = startTasks.splice(source.index, 1)

  // Same column reorder
  if (startColId === finishColId) {
    startTasks.splice(destination.index, 0, movedTask)
    const newCol = { ...startCol, tasks: startTasks }
    setColumns({ ...columns, [startColId]: newCol })
  } 
  // Move to different column
  else {
    const finishTasks = Array.from(finishCol.tasks)
    finishTasks.splice(destination.index, 0, movedTask)
    
    const newStartCol = { ...startCol, tasks: startTasks }
    const newFinishCol = { ...finishCol, tasks: finishTasks }
    
    setColumns({ 
      ...columns, 
      [startColId]: newStartCol, 
      [finishColId]: newFinishCol 
    })
  }

  // Sync to server
  startTransition(async () => {
    await updateTaskStatus(Number.parseInt(draggableId), finishColId)
  })
}
```

**Key Points:**
- Immediately update UI state before server call
- Handle both same-column reorder and cross-column moves
- Use immutable updates (Array.from, spread operators)
- Server call happens after UI update

### 5. Server Action Integration

```typescript
// app/(dashboard)/tasks/actions.ts
export async function updateTaskStatus(taskId: number, status: string) {
    try {
        await prisma.task.update({ 
            where: { id: taskId }, 
            data: { status } 
        });
        revalidatePath("/tasks");
        return { error: null };
    } catch (e) {
        return { error: "Failed to update task status." };
    }
}
```

**Key Points:**
- Simple update to change task status
- Revalidate path to update other views
- Return error for client error handling

## Data Structure

### KanbanData Type

```typescript
// lib/types.ts
type TaskWithProfile = Task & {
  assignee?: Pick<User, "name"> | null;
};

export type KanbanColumn = {
  id: "todo" | "in_progress" | "review" | "done"
  title: string
  tasks: TaskWithProfile[]
}

export type KanbanData = {
  [key in "todo" | "in_progress" | "review" | "done"]: KanbanColumn
}
```

**Key Points:**
- Column IDs match task status values
- Tasks include assignee info for display
- Structure supports easy access by column ID

## Common Patterns

### Loading Kanban Data

```tsx
// app/(dashboard)/board/page.tsx
export default async function BoardPage() {
    const { tasks } = await getAllTasks();
    
    // Transform flat task list into kanban structure
    const kanbanData: KanbanData = {
        todo: { id: "todo", title: "To Do", tasks: [] },
        in_progress: { id: "in_progress", title: "In Progress", tasks: [] },
        review: { id: "review", title: "In Review", tasks: [] },
        done: { id: "done", title: "Done", tasks: [] },
    };

    tasks?.forEach(task => {
        const columnId = task.status as keyof KanbanData;
        if (kanbanData[columnId]) {
            kanbanData[columnId].tasks.push(task);
        }
    });

    return <KanbanBoard initialData={kanbanData} />;
}
```

### Visual Feedback

```tsx
<Card className={cn(
  "cursor-pointer hover:shadow-md transition-shadow",
  snapshot.isDragging && "shadow-lg ring-2 ring-primary"
)}>
```

```tsx
<div className={cn(
  "flex-shrink-0 w-80 transition-colors rounded-lg",
  snapshot.isDraggingOver ? "bg-background-light" : "bg-background-dark"
)}>
```

## Constraints
- **Client Components Only**: Drag-and-drop requires `"use client"`
- **String IDs**: `draggableId` must be string, convert numbers
- **Optimistic Updates**: Update UI immediately, sync later
- **startTransition**: Wrap server calls for non-blocking updates
- **Revalidation**: Call `revalidatePath()` after status updates
- **@hello-pangea/dnd**: Don't use other drag libraries
