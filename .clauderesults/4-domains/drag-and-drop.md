# Drag-and-Drop Domain Implementation

## Overview

The drag-and-drop functionality in this application powers the Kanban board, allowing users to drag task cards between columns. It uses the `@hello-pangea/dnd` library (maintained fork of react-beautiful-dnd) with React transitions for optimistic UI updates and Server Actions for persistence.

## Key Technologies

- **@hello-pangea/dnd v17.0.0** - Drag and drop library
- **React useTransition** - Non-blocking updates
- **Server Actions** - Status updates on drop
- **Optimistic UI** - Immediate visual feedback
- **Type-safe drag data** - TypeScript types for drag operations

## Kanban Board Architecture

The Kanban board manages four columns representing task statuses:
- **Todo** - Tasks not yet started
- **In Progress** - Tasks being worked on
- **Review** - Tasks awaiting review
- **Done** - Completed tasks

**From components/kanban-board.tsx:**
```tsx
"use client"

import { useState, useTransition } from "react"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import { updateTaskStatus } from "@/app/(dashboard)/tasks/actions"
import type { KanbanColumn, KanbanData } from "@/lib/types"

export function KanbanBoard({ initialData }: { initialData: KanbanData }) {
  const [columns, setColumns] = useState(initialData)
  const [isPending, startTransition] = useTransition()

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result

    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    const startColId = source.droppableId as keyof KanbanData
    const finishColId = destination.droppableId as keyof KanbanData

    const startCol = columns[startColId]
    const finishCol = columns[finishColId]

    const startTasks = Array.from(startCol.tasks)
    const [movedTask] = startTasks.splice(source.index, 1)

    // Optimistically update UI
    if (startColId === finishColId) {
      // Same column - just reorder
      startTasks.splice(destination.index, 0, movedTask)
      const newCol = { ...startCol, tasks: startTasks }
      setColumns({ ...columns, [startColId]: newCol })
    } else {
      // Different columns - move task
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

    // Update the database
    startTransition(async () => {
      await updateTaskStatus(Number.parseInt(draggableId), finishColId)
    })
  }

  return (
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
                  snapshot.isDraggingOver ? "bg-background-light" : "bg-background-dark",
                )}
              >
                {/* Column content */}
                {column.tasks.map((task, index) => (
                  <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef} 
                        {...provided.draggableProps} 
                        {...provided.dragHandleProps}
                      >
                        {/* Task card */}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  )
}
```

## Implementation Patterns

### 1. DragDropContext Setup

**Wrapper for entire drag-and-drop area:**
```tsx
import { DragDropContext, type DropResult } from "@hello-pangea/dnd"

const onDragEnd = (result: DropResult) => {
  // Handle drag end
}

<DragDropContext onDragEnd={onDragEnd}>
  {/* Droppable areas and draggable items */}
</DragDropContext>
```

**Key points:**
- Wraps all drag-and-drop components
- `onDragEnd` callback receives drag result
- Must be a Client Component (`"use client"`)

### 2. Droppable Areas (Columns)

**Each column is a droppable area:**
```tsx
import { Droppable } from "@hello-pangea/dnd"

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
      {/* Draggable items */}
      {provided.placeholder}
    </div>
  )}
</Droppable>
```

**Key elements:**
- `droppableId`: Unique identifier (column id: "todo", "in_progress", "review", "done")
- `provided.innerRef`: Required ref for drop area
- `provided.droppableProps`: Required props
- `provided.placeholder`: Space for dragging items
- `snapshot.isDraggingOver`: Boolean for visual feedback

### 3. Draggable Items (Task Cards)

**Each task card is draggable:**
```tsx
import { Draggable } from "@hello-pangea/dnd"

{column.tasks.map((task, index) => (
  <Draggable key={task.id} draggableId={String(task.id)} index={index}>
    {(provided, snapshot) => (
      <div 
        ref={provided.innerRef} 
        {...provided.draggableProps} 
        {...provided.dragHandleProps}
      >
        <Card
          className={cn(
            "cursor-pointer hover:shadow-md transition-shadow",
            snapshot.isDragging && "shadow-lg ring-2 ring-primary",
          )}
        >
          {/* Task content */}
        </Card>
      </div>
    )}
  </Draggable>
))}
```

**Key elements:**
- `draggableId`: Unique identifier (task id as string)
- `index`: Current position in list
- `provided.innerRef`: Required ref for draggable item
- `provided.draggableProps`: Required props for dragging
- `provided.dragHandleProps`: Makes entire element draggable
- `snapshot.isDragging`: Boolean for visual feedback

### 4. Drag End Handler Logic

**Complete onDragEnd implementation:**
```tsx
const onDragEnd = (result: DropResult) => {
  const { source, destination, draggableId } = result

  // No destination (dropped outside)
  if (!destination) return

  // Dropped in same position
  if (
    source.droppableId === destination.droppableId && 
    source.index === destination.index
  ) return

  const startColId = source.droppableId as keyof KanbanData
  const finishColId = destination.droppableId as keyof KanbanData

  const startCol = columns[startColId]
  const finishCol = columns[finishColId]

  const startTasks = Array.from(startCol.tasks)
  const [movedTask] = startTasks.splice(source.index, 1)

  // Same column - reorder only
  if (startColId === finishColId) {
    startTasks.splice(destination.index, 0, movedTask)
    const newCol = { ...startCol, tasks: startTasks }
    setColumns({ ...columns, [startColId]: newCol })
  } 
  // Different columns - move task
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

  // Persist to server
  startTransition(async () => {
    await updateTaskStatus(Number.parseInt(draggableId), finishColId)
  })
}
```

**Flow:**
1. Extract source and destination from result
2. Early returns for invalid drops
3. Get source and destination columns
4. Create mutable copy of source tasks
5. Remove task from source
6. If same column, reorder tasks
7. If different columns, move to destination
8. Update state optimistically
9. Persist to server in transition

### 5. Optimistic UI with useTransition

**Non-blocking server updates:**
```tsx
import { useTransition } from "react"

const [isPending, startTransition] = useTransition()

// In onDragEnd, after updating local state
startTransition(async () => {
  await updateTaskStatus(taskId, newStatus)
})
```

**Benefits:**
- UI updates immediately
- Server call doesn't block UI
- User can continue interacting
- `isPending` available for loading states

### 6. Server Action for Status Updates

**From tasks/actions.ts:**
```typescript
"use server"

import { PrismaClient } from "@/app/generated/prisma"
import { revalidatePath } from "next/cache"

const prisma = new PrismaClient()

export async function updateTaskStatus(taskId: number, status: string) {
  try {
    await prisma.task.update({
      where: { id: taskId },
      data: { status },
    })
    revalidatePath("/board")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to update task status" }
  }
}
```

## Type Definitions

**From lib/types.ts:**
```typescript
import type { Task, User } from "@/app/generated/prisma/client"

export type TaskWithAssignee = Task & {
  assignee?: Pick<User, "name"> | null
}

export type KanbanColumn = {
  id: string
  title: string
  tasks: TaskWithAssignee[]
}

export type KanbanData = {
  todo: KanbanColumn
  in_progress: KanbanColumn
  review: KanbanColumn
  done: KanbanColumn
}
```

## Visual Feedback

### 1. Dragging State

**Show visual feedback while dragging:**
```tsx
<Card
  className={cn(
    "cursor-pointer hover:shadow-md transition-shadow",
    snapshot.isDragging && "shadow-lg ring-2 ring-primary",
  )}
>
  {/* Task content */}
</Card>
```

### 2. Drop Target Highlight

**Highlight column when dragging over:**
```tsx
<div
  className={cn(
    "flex-shrink-0 w-80 transition-colors rounded-lg",
    snapshot.isDraggingOver ? "bg-background-light" : "bg-background-dark",
  )}
>
  {/* Column content */}
</div>
```

### 3. Smooth Transitions

**CSS transitions for smooth movement:**
```tsx
className="transition-shadow hover:shadow-md"
className="transition-colors rounded-lg"
```

## Complete Kanban Board Component

**Full implementation from kanban-board.tsx:**
```tsx
"use client"

import { useState, useTransition } from "react"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarName } from "@/components/ui/avatar"
import { Clock } from "lucide-react"
import { updateTaskStatus } from "@/app/(dashboard)/tasks/actions"
import { cn } from "@/lib/utils"
import type { KanbanData } from "@/lib/types"
import { poppins } from "@/lib/fonts"

export function KanbanBoard({ initialData }: { initialData: KanbanData }) {
  const [columns, setColumns] = useState(initialData)
  const [isPending, startTransition] = useTransition()

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result

    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    const startColId = source.droppableId as keyof KanbanData
    const finishColId = destination.droppableId as keyof KanbanData

    const startCol = columns[startColId]
    const finishCol = columns[finishColId]

    const startTasks = Array.from(startCol.tasks)
    const [movedTask] = startTasks.splice(source.index, 1)

    if (startColId === finishColId) {
      startTasks.splice(destination.index, 0, movedTask)
      const newCol = { ...startCol, tasks: startTasks }
      setColumns({ ...columns, [startColId]: newCol })
    } else {
      const finishTasks = Array.from(finishCol.tasks)
      finishTasks.splice(destination.index, 0, movedTask)
      const newStartCol = { ...startCol, tasks: startTasks }
      const newFinishCol = { ...finishCol, tasks: finishTasks }
      setColumns({ ...columns, [startColId]: newStartCol, [finishColId]: newFinishCol })
    }

    startTransition(async () => {
      await updateTaskStatus(Number.parseInt(draggableId), finishColId)
    })
  }

  return (
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
                  snapshot.isDraggingOver ? "bg-background-light" : "bg-background-dark",
                )}
              >
                <Card className="bg-transparent border-0 shadow-none">
                  <CardHeader className="pb-3 px-4 pt-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">
                        {column.title}
                        <Badge variant="secondary" className="ml-2">
                          {column.tasks.length}
                        </Badge>
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 min-h-[100px] px-4 pb-4">
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
                    {provided.placeholder}
                  </CardContent>
                </Card>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  )
}
```

## Data Preparation

**Server-side data transformation for Kanban board:**
```typescript
// In board/page.tsx (Server Component)
import { KanbanBoard } from "@/components/kanban-board"
import { getAllTasks } from "@/app/(dashboard)/tasks/actions"
import type { KanbanData } from "@/lib/types"

export default async function BoardPage() {
  const { tasks } = await getAllTasks()

  // Transform flat task list into column structure
  const kanbanData: KanbanData = {
    todo: {
      id: "todo",
      title: "To Do",
      tasks: tasks.filter(t => t.status === "todo"),
    },
    in_progress: {
      id: "in_progress",
      title: "In Progress",
      tasks: tasks.filter(t => t.status === "in_progress"),
    },
    review: {
      id: "review",
      title: "Review",
      tasks: tasks.filter(t => t.status === "review"),
    },
    done: {
      id: "done",
      title: "Done",
      tasks: tasks.filter(t => t.status === "done"),
    },
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className={`text-3xl font-bold tracking-tight ${poppins.className}`}>
        Board
      </h2>
      <KanbanBoard initialData={kanbanData} />
    </div>
  )
}
```

## Best Practices

### 1. Use Optimistic Updates

```tsx
// ✅ Good - Update UI immediately, then persist
setColumns(newColumns)
startTransition(async () => {
  await updateTaskStatus(taskId, status)
})

// ❌ Bad - Wait for server response
await updateTaskStatus(taskId, status)
setColumns(newColumns)
```

### 2. Validate Drop Operations

```tsx
// ✅ Good - Check for valid drops
if (!destination) return
if (source.droppableId === destination.droppableId && 
    source.index === destination.index) return

// ❌ Bad - Process all drops
const { source, destination } = result
// Always move task...
```

### 3. Use useTransition for Non-Blocking Updates

```tsx
// ✅ Good - Non-blocking with useTransition
startTransition(async () => {
  await updateTaskStatus(taskId, status)
})

// ❌ Bad - Blocking update
await updateTaskStatus(taskId, status)
```

### 4. Provide Visual Feedback

```tsx
// ✅ Good - Visual states for dragging
snapshot.isDragging && "shadow-lg ring-2 ring-primary"
snapshot.isDraggingOver && "bg-background-light"

// ❌ Bad - No visual feedback
<Card>{/* content */}</Card>
```

### 5. Type Drag Operations

```tsx
// ✅ Good - Import and use DropResult type
import type { DropResult } from "@hello-pangea/dnd"
const onDragEnd = (result: DropResult) => { }

// ❌ Bad - Untyped drag result
const onDragEnd = (result) => { }
```

### 6. Always Include Placeholder

```tsx
// ✅ Good - Placeholder maintains space
{column.tasks.map((task, index) => (
  <Draggable key={task.id} draggableId={String(task.id)} index={index}>
    {/* Task */}
  </Draggable>
))}
{provided.placeholder}

// ❌ Bad - No placeholder
{column.tasks.map((task, index) => (
  <Draggable>{/* Task */}</Draggable>
))}
```

### 7. Use Immutable State Updates

```tsx
// ✅ Good - Create new arrays
const startTasks = Array.from(startCol.tasks)
const newCol = { ...startCol, tasks: startTasks }

// ❌ Bad - Mutate existing state
startCol.tasks.splice(source.index, 1)
setColumns(columns)
```

## Common Patterns

### Horizontal Scrolling Layout

```tsx
<div className="flex space-x-6 overflow-x-auto pb-4">
  {/* Columns */}
</div>
```

### Fixed-Width Columns

```tsx
<div className="flex-shrink-0 w-80">
  {/* Column content */}
</div>
```

### Task Count Badge

```tsx
<CardTitle className="text-sm font-medium">
  {column.title}
  <Badge variant="secondary" className="ml-2">
    {column.tasks.length}
  </Badge>
</CardTitle>
```

## Summary

The drag-and-drop domain demonstrates modern, performant interaction patterns:

1. **@hello-pangea/dnd** - Maintained, accessible drag-and-drop
2. **Optimistic UI** - Immediate visual feedback
3. **useTransition** - Non-blocking server updates
4. **Type-safe operations** - Full TypeScript support
5. **Visual feedback** - Clear dragging and drop states
6. **Server persistence** - Automatic status updates
7. **Immutable state** - Predictable state management
8. **Accessible** - Keyboard navigation supported by library
9. **Smooth transitions** - CSS animations for polish

This implementation provides an excellent user experience with minimal code complexity.
