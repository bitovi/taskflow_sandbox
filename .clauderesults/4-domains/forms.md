# Forms Domain Implementation

## Overview

Forms in this application leverage React 19's `useActionState` hook combined with Next.js Server Actions for a progressive enhancement approach. All forms work without JavaScript and provide optimistic UI updates when JavaScript is available. Form validation and submission are handled server-side through Server Actions that process FormData.

## Key Technologies

- **React 19 useActionState** - Client-side form state management
- **React 19 useFormStatus** - Pending state for submit buttons
- **Next.js Server Actions** - Server-side form processing
- **FormData API** - Native form data handling
- **shadcn/ui Form Components** - Input, Select, Textarea, Label
- **Progressive Enhancement** - Works without JavaScript

## Form Architecture

### Form State Management Pattern

All forms follow this consistent pattern:

1. Define an `ActionState` type for server responses
2. Create a Server Action that accepts FormData
3. Use `useActionState` to manage form state
4. Implement a `SubmitButton` with `useFormStatus`
5. Handle success/error messages in UI

**From create-task-form.tsx:**
```tsx
"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { createTask } from "@/app/(dashboard)/tasks/actions"

type ActionState = {
    error: string | null;
    success: boolean;
    message?: string;
}

const initialState: ActionState = {
    message: "",
    success: false,
    error: null,
}

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Creating..." : "Create Task"}
        </Button>
    )
}

export function CreateTaskForm({ onFinish }: { onFinish?: () => void }) {
    // Create a wrapper function that matches useActionState signature
    const createTaskAction = async (prevState: ActionState, formData: FormData): Promise<ActionState> => {
        return createTask(formData)
    }

    const [state, formAction] = useActionState(createTaskAction, initialState)

    useEffect(() => {
        if (state.message && state.success && onFinish) {
            onFinish()
        }
    }, [state, onFinish])

    return (
        <form action={formAction} className="space-y-4">
            {/* Form fields */}
        </form>
    )
}
```

## Implementation Patterns

### 1. Text Input Fields

**Basic text input with label:**
```tsx
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

<div className="space-y-2">
    <Label htmlFor="title">Title</Label>
    <Input id="title" name="title" required />
</div>
```

**Text input with default value (edit forms):**
```tsx
<div className="space-y-2">
    <Label htmlFor="title">Title</Label>
    <Input id="title" name="title" defaultValue={task.name} required />
</div>
```

**From login/page.tsx - Controlled input with useState:**
```tsx
"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        if (name === "email") setEmail(value)
        if (name === "password") setPassword(value)
    }

    return (
        <form className="space-y-4" action={formAction}>
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={handleInputChange}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={handleInputChange}
                />
            </div>
        </form>
    )
}
```

### 2. Textarea Fields

**From create-task-form.tsx:**
```tsx
import { Textarea } from "@/components/ui/textarea"

<div className="space-y-2">
    <Label htmlFor="description">Description</Label>
    <Textarea id="description" name="description" />
</div>
```

**With default value:**
```tsx
<div className="space-y-2">
    <Label htmlFor="description">Description</Label>
    <Textarea id="description" name="description" defaultValue={task.description || ""} />
</div>
```

### 3. Select Dropdowns

**Basic select with static options:**
```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

<div className="space-y-2">
    <Label htmlFor="status">Status</Label>
    <Select name="status" defaultValue="todo">
        <SelectTrigger>
            <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent>
            <SelectItem value="todo">Todo</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="review">Review</SelectItem>
            <SelectItem value="done">Done</SelectItem>
        </SelectContent>
    </Select>
</div>
```

**Select with dynamic options from server:**
```tsx
import { useEffect, useState } from "react"
import { getAllUsers } from "@/app/login/actions"
import type { User } from "@/app/generated/prisma/client"

export function CreateTaskForm() {
    const [users, setUsers] = useState<Pick<User, "id" | "name">[]>([])

    useEffect(() => {
        // Fetch users when component mounts
        getAllUsers().then(setUsers)
    }, [])

    return (
        <form action={formAction}>
            <div className="space-y-2">
                <Label htmlFor="assigneeId">Assignee</Label>
                <Select name="assigneeId">
                    <SelectTrigger>
                        <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent>
                        {users.map((user) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                                {user.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </form>
    )
}
```

**From edit-task-form.tsx - Select with existing value:**
```tsx
<Select name="assigneeId" defaultValue={task.assigneeId?.toString() || undefined}>
    <SelectTrigger>
        <SelectValue placeholder="Select assignee" />
    </SelectTrigger>
    <SelectContent>
        {users.map((user) => (
            <SelectItem key={user.id} value={user.id.toString()}>
                {user.name}
            </SelectItem>
        ))}
    </SelectContent>
</Select>
```

### 4. Date Input Fields

**From create-task-form.tsx:**
```tsx
<div className="space-y-2">
    <Label htmlFor="dueDate">Due Date</Label>
    <Input
        id="dueDate"
        name="dueDate"
        type="date"
    />
</div>
```

**From edit-task-form.tsx - With formatted default value:**
```tsx
import { formatDateForInput } from "@/lib/date-utils"

<div className="space-y-2">
    <Label htmlFor="dueDate">Due Date</Label>
    <Input
        id="dueDate"
        name="dueDate"
        type="date"
        defaultValue={task.dueDate ? formatDateForInput(task.dueDate) : ""}
    />
</div>
```

### 5. Submit Buttons with Loading States

**Pattern with useFormStatus:**
```tsx
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Creating..." : "Create Task"}
        </Button>
    )
}

// Must be inside form component
export function MyForm() {
    return (
        <form action={formAction}>
            {/* Form fields */}
            <div className="flex justify-end">
                <SubmitButton />
            </div>
        </form>
    )
}
```

**From edit-task-form.tsx:**
```tsx
function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save Changes"}
        </Button>
    )
}
```

### 6. Error and Success Messages

**Display server-side validation errors:**
```tsx
{state.error && (
    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
        {state.error}
    </div>
)}

{state.success && state.message && (
    <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
        {state.message}
    </div>
)}
```

**From login/page.tsx:**
```tsx
{state.error && (
    <div className="text-red-500 text-sm text-center">{state.error}</div>
)}
```

### 7. Grid Layout for Multiple Fields

**From create-task-form.tsx:**
```tsx
<div className="grid grid-cols-2 gap-4">
    <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select name="status" defaultValue="todo">
            <SelectTrigger>
                <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="todo">Todo</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="done">Done</SelectItem>
            </SelectContent>
        </Select>
    </div>
    <div className="space-y-2">
        <Label htmlFor="priority">Priority</Label>
        <Select name="priority" defaultValue="medium">
            <SelectTrigger>
                <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
            </SelectContent>
        </Select>
    </div>
</div>
```

## Server Action Processing

### FormData Extraction

**From tasks/actions.ts:**
```typescript
"use server"

import { PrismaClient } from "@/app/generated/prisma"
import { revalidatePath } from "next/cache"
import { parseDateString } from "@/lib/date-utils"

const prisma = new PrismaClient()

export async function createTask(formData: FormData) {
    // Extract form fields
    const name = formData.get("title") as string
    const description = formData.get("description") as string
    const priority = formData.get("priority") as string
    const status = formData.get("status") as string
    const dueDate = formData.get("dueDate") as string
    const assigneeIdRaw = formData.get("assigneeId") as string
    const assigneeId = assigneeIdRaw ? parseInt(assigneeIdRaw, 10) : null

    // Get current user
    const user = await getCurrentUser()
    if (!user) return { 
        error: "Not authenticated.", 
        success: false, 
        message: "Not authenticated." 
    }

    // Validate required fields
    if (!name) return { 
        error: "Title is required.", 
        success: false, 
        message: "Title is required." 
    }

    // Database operation
    try {
        await prisma.task.create({
            data: {
                name,
                description,
                priority,
                status,
                dueDate: dueDate ? parseDateString(dueDate) : null,
                creatorId: user.id,
                assigneeId,
            },
        })
        revalidatePath("/tasks")
        return { 
            error: null, 
            success: true, 
            message: "Task created successfully!" 
        }
    } catch (e) {
        return { 
            error: "Failed to create task.", 
            success: false, 
            message: "Failed to create task." 
        }
    }
}
```

### Update Action Pattern

**From tasks/actions.ts:**
```typescript
export async function updateTask(id: number, formData: FormData) {
    const name = formData.get("title") as string
    const description = formData.get("description") as string
    const priority = formData.get("priority") as string
    const status = formData.get("status") as string
    const dueDate = formData.get("dueDate") as string
    const assigneeIdRaw = formData.get("assigneeId") as string
    const assigneeId = assigneeIdRaw ? parseInt(assigneeIdRaw, 10) : null

    const user = await getCurrentUser()
    if (!user) return { 
        error: "Not authenticated.", 
        success: false, 
        message: "Not authenticated." 
    }

    if (!name) return { 
        error: "Title is required.", 
        success: false, 
        message: "Title is required." 
    }

    try {
        await prisma.task.update({
            where: { id },
            data: {
                name,
                description,
                priority,
                status,
                dueDate: dueDate ? parseDateString(dueDate) : null,
                assigneeId,
            },
        })
        revalidatePath("/tasks")
        return { 
            error: null, 
            success: true, 
            message: "Task updated successfully!" 
        }
    } catch (e) {
        return { 
            error: "Failed to update task.", 
            success: false, 
            message: "Failed to update task." 
        }
    }
}
```

## Form Submission Flow

1. **User submits form** → triggers form action
2. **FormData created** → automatically by browser
3. **Server Action receives FormData** → extracts values
4. **Validation** → check authentication and required fields
5. **Database operation** → create/update/delete
6. **Revalidate cache** → `revalidatePath()` refreshes UI
7. **Return response** → success/error message
8. **UI updates** → via `useActionState` state
9. **Callback executed** → optional `onFinish()` handler

## Complete Form Examples

### Create Form with All Features

**From create-task-form.tsx (complete):**
```tsx
"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createTask } from "@/app/(dashboard)/tasks/actions"
import { getAllUsers } from "@/app/login/actions"
import type { User } from "@/app/generated/prisma/client"

type ActionState = {
    error: string | null;
    success: boolean;
    message?: string;
}

const initialState: ActionState = {
    message: "",
    success: false,
    error: null,
}

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Creating..." : "Create Task"}
        </Button>
    )
}

export function CreateTaskForm({ onFinish }: { onFinish?: () => void }) {
    const [users, setUsers] = useState<Pick<User, "id" | "name">[]>([])

    const createTaskAction = async (prevState: ActionState, formData: FormData): Promise<ActionState> => {
        return createTask(formData)
    }

    const [state, formAction] = useActionState(createTaskAction, initialState)

    useEffect(() => {
        getAllUsers().then(setUsers)
    }, [])

    useEffect(() => {
        if (state.message && state.success && onFinish) {
            onFinish()
        }
    }, [state, onFinish])

    return (
        <form action={formAction} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select name="status" defaultValue="todo">
                        <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="todo">Todo</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="review">Review</SelectItem>
                            <SelectItem value="done">Done</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select name="priority" defaultValue="medium">
                        <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="assigneeId">Assignee</Label>
                    <Select name="assigneeId">
                        <SelectTrigger>
                            <SelectValue placeholder="Select assignee" />
                        </SelectTrigger>
                        <SelectContent>
                            {users.map((user) => (
                                <SelectItem key={user.id} value={user.id.toString()}>
                                    {user.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                        id="dueDate"
                        name="dueDate"
                        type="date"
                    />
                </div>
            </div>
            {state.error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                    {state.error}
                </div>
            )}
            {state.success && state.message && (
                <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
                    {state.message}
                </div>
            )}
            <div className="flex justify-end">
                <SubmitButton />
            </div>
        </form>
    )
}
```

### Edit Form with Existing Data

**From edit-task-form.tsx (complete):**
```tsx
"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateTask } from "@/app/(dashboard)/tasks/actions"
import { getAllUsers } from "@/app/login/actions"
import { formatDateForInput } from "@/lib/date-utils"
import type { Task as PrismaTask, User } from "@/app/generated/prisma/client"

type TaskWithProfile = PrismaTask & {
    assignee?: Pick<User, "name"> | null;
};

type ActionState = {
    error: string | null;
    success: boolean;
    message?: string;
}

const initialState: ActionState = {
    message: "",
    success: false,
    error: null,
}

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save Changes"}
        </Button>
    )
}

export function EditTaskForm({ task, onFinish }: { task: TaskWithProfile; onFinish?: () => void }) {
    const [users, setUsers] = useState<Pick<User, "id" | "name">[]>([])

    const updateTaskAction = async (prevState: ActionState, formData: FormData): Promise<ActionState> => {
        return updateTask(task.id, formData)
    }

    const [state, formAction] = useActionState(updateTaskAction, initialState)

    useEffect(() => {
        getAllUsers().then(setUsers)
    }, [])

    useEffect(() => {
        if (state.message && state.success && onFinish) {
            onFinish()
        }
    }, [state, onFinish])

    return (
        <form action={formAction} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" defaultValue={task.name} required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={task.description || ""} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select name="status" defaultValue={task.status}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="todo">Todo</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="review">Review</SelectItem>
                            <SelectItem value="done">Done</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select name="priority" defaultValue={task.priority}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="assigneeId">Assignee</Label>
                    <Select name="assigneeId" defaultValue={task.assigneeId?.toString() || undefined}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select assignee" />
                        </SelectTrigger>
                        <SelectContent>
                            {users.map((user) => (
                                <SelectItem key={user.id} value={user.id.toString()}>
                                    {user.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                        id="dueDate"
                        name="dueDate"
                        type="date"
                        defaultValue={task.dueDate ? formatDateForInput(task.dueDate) : ""}
                    />
                </div>
            </div>
            <div className="flex justify-end">
                <SubmitButton />
            </div>
        </form>
    )
}
```

## Best Practices

### 1. Always Use Server Actions for Form Submission

```tsx
// ✅ Good - Server Action with FormData
"use server"
export async function createTask(formData: FormData) {
    const name = formData.get("title") as string
    // Process form...
}

// ❌ Bad - Client-side fetch
async function handleSubmit(e) {
    e.preventDefault()
    await fetch('/api/tasks', { method: 'POST', body: JSON.stringify(data) })
}
```

### 2. Use useFormStatus for Submit Button States

```tsx
// ✅ Good - useFormStatus in separate component
function SubmitButton() {
    const { pending } = useFormStatus()
    return <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save"}
    </Button>
}

// ❌ Bad - Manual state management
const [loading, setLoading] = useState(false)
<Button disabled={loading}>Save</Button>
```

### 3. Provide Consistent Error/Success Feedback

```tsx
// ✅ Good - Consistent response shape
return { 
    error: null, 
    success: true, 
    message: "Task created successfully!" 
}

// ❌ Bad - Inconsistent responses
return { ok: true }
return { error: "Failed" }
```

### 4. Use defaultValue for Edit Forms

```tsx
// ✅ Good - Uncontrolled with defaultValue
<Input name="title" defaultValue={task.name} />

// ❌ Bad - Controlled without proper state management
<Input name="title" value={task.name} />
```

### 5. Always Revalidate After Mutations

```tsx
// ✅ Good - Revalidate to update UI
import { revalidatePath } from "next/cache"

await prisma.task.create({ data })
revalidatePath("/tasks")

// ❌ Bad - No revalidation
await prisma.task.create({ data })
return { success: true }
```

### 6. Extract and Validate FormData Properly

```tsx
// ✅ Good - Type casting and null handling
const name = formData.get("title") as string
const assigneeIdRaw = formData.get("assigneeId") as string
const assigneeId = assigneeIdRaw ? parseInt(assigneeIdRaw, 10) : null

// ❌ Bad - No type safety
const name = formData.get("title")
const assigneeId = formData.get("assigneeId")
```

### 7. Use Semantic HTML and Accessibility

```tsx
// ✅ Good - Proper label association
<Label htmlFor="email">Email</Label>
<Input id="email" name="email" type="email" required />

// ❌ Bad - No label or accessibility
<div>Email</div>
<Input name="email" />
```

## Testing Forms

**From create-task-form.test.tsx:**
```tsx
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

jest.mock('@/app/(dashboard)/tasks/actions', () => ({
    createTask: jest.fn(async (formData: FormData) => ({ 
        success: true, 
        message: 'ok', 
        error: null 
    }))
}))

jest.mock('@/app/login/actions', () => ({
    getAllUsers: jest.fn(async () => [{ id: 1, name: 'Alice' }])
}))

import { CreateTaskForm } from '@/components/create-task-form'
import { createTask } from '@/app/(dashboard)/tasks/actions'

describe('CreateTaskForm', () => {
    test('renders form fields and submits', async () => {
        render(<CreateTaskForm />)

        const title = screen.getByLabelText(/title/i)
        await userEvent.type(title, 'New Task')

        const submit = screen.getByRole('button', { name: /create task/i })
        await userEvent.click(submit)

        await waitFor(() => expect(createTask).toHaveBeenCalled())
    })
})
```

## Summary

The forms domain in this application demonstrates modern React patterns:

1. **Progressive enhancement** - Forms work without JavaScript
2. **React 19 hooks** - `useActionState` and `useFormStatus` for elegant state management
3. **Server Actions** - All form processing happens server-side
4. **Type safety** - TypeScript throughout form handling
5. **Consistent patterns** - All forms follow the same structure
6. **Proper validation** - Server-side validation with user feedback
7. **Accessible forms** - Semantic HTML with proper labels
8. **Optimistic UI** - Immediate feedback with pending states
9. **Cache revalidation** - Automatic UI updates after mutations

This approach provides excellent user experience while maintaining simplicity and reliability.
