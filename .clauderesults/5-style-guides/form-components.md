# Form Components Style Guide

## Unique Patterns in This Codebase

### 1. **useActionState Hook Pattern**
Form components use React's useActionState for server actions:
```tsx
import { useActionState } from "react"

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

// Wrapper function that matches useActionState signature
const createTaskAction = async (prevState: ActionState, formData: FormData): Promise<ActionState> => {
    return createTask(formData)
}

const [state, formAction] = useActionState(createTaskAction, initialState)
```

### 2. **Separate SubmitButton Component**
Form components define internal SubmitButton using useFormStatus:
```tsx
import { useFormStatus } from "react-dom"

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Creating..." : "Create Task"}
        </Button>
    )
}
```

### 3. **Effect-Based Success Handler**
Forms use useEffect to handle success and call onFinish callback:
```tsx
useEffect(() => {
    if (state.message) {
        if (state.success && onFinish) {
            onFinish()
        }
    }
}, [state, onFinish])
```

### 4. **User Fetching Pattern**
Forms fetch users on mount for assignee dropdowns:
```tsx
import { getAllUsers } from "@/app/login/actions"
import type { User } from "@/app/generated/prisma/client"

const [users, setUsers] = useState<Pick<User, "id" | "name">[]>([])

useEffect(() => {
    getAllUsers().then(setUsers)
}, [])
```

### 5. **Select Component Usage Pattern**
Forms use Select components with controlled defaultValue:
```tsx
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
```

### 6. **Date Input Pattern**
Date fields use HTML5 date input with formatDateForInput utility:
```tsx
import { formatDateForInput } from "@/lib/date-utils"

<Input
    id="dueDate"
    name="dueDate"
    type="date"
    defaultValue={task.dueDate ? formatDateForInput(task.dueDate) : ""}
/>
```

### 7. **Grid Layout for Form Fields**
Forms use grid for side-by-side fields:
```tsx
<div className="grid grid-cols-2 gap-4">
    <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        {/* field */}
    </div>
    <div className="space-y-2">
        <Label htmlFor="priority">Priority</Label>
        {/* field */}
    </div>
</div>
```

### 8. **Consistent Field Structure**
Each field follows this pattern:
```tsx
<div className="space-y-2">
    <Label htmlFor="fieldName">Field Label</Label>
    <Input id="fieldName" name="fieldName" required />
</div>
```

### 9. **Error/Success Message Display**
Forms display conditional messages:
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

### 10. **Optional onFinish Callback**
Form components accept optional callback:
```tsx
export function CreateTaskForm({ onFinish }: { onFinish?: () => void }) {
```

### 11. **Form Action Attribute**
Forms pass formAction to action attribute:
```tsx
<form action={formAction} className="space-y-4">
```

### 12. **Edit Form Differences**
Edit forms receive existing data and use defaultValue:
```tsx
export function EditTaskForm({ task, onFinish }: { task: TaskWithProfile; onFinish?: () => void })

<Input id="title" name="title" defaultValue={task.name} required />
<Textarea id="description" name="description" defaultValue={task.description || ""} />
<Select name="status" defaultValue={task.status}>
```

### 13. **ID Passing Pattern for Updates**
Edit forms pass ID to action via wrapper function:
```tsx
const updateTaskAction = async (prevState: ActionState, formData: FormData): Promise<ActionState> => {
    return updateTask(task.id, formData)
}
```

### 14. **Field Naming Convention**
- Form field names match server action expectations
- Exception: form uses "title" but model uses "name"
- This is handled in server action: `const name = formData.get("title") as string`

### 15. **Assignee Select with Optional Value**
Assignee field allows undefined/null:
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

## Creating a New Form Component

### Create Form
```tsx
"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createItem } from "@/app/(dashboard)/items/actions"
import { getAllUsers } from "@/app/login/actions"
import type { User } from "@/app/generated/prisma/client"
import { useEffect, useState } from "react"

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
            {pending ? "Creating..." : "Create Item"}
        </Button>
    )
}

export function CreateItemForm({ onFinish }: { onFinish?: () => void }) {
    const [users, setUsers] = useState<Pick<User, "id" | "name">[]>([])

    const createItemAction = async (prevState: ActionState, formData: FormData): Promise<ActionState> => {
        return createItem(formData)
    }

    const [state, formAction] = useActionState(createItemAction, initialState)

    useEffect(() => {
        getAllUsers().then(setUsers)
    }, [])

    useEffect(() => {
        if (state.message) {
            if (state.success && onFinish) {
                onFinish()
            }
        }
    }, [state, onFinish])

    return (
        <form action={formAction} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required />
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select name="status" defaultValue="active">
                        <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="userId">Assignee</Label>
                    <Select name="userId">
                        <SelectTrigger>
                            <SelectValue placeholder="Select user" />
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

### Edit Form
```tsx
"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateItem } from "@/app/(dashboard)/items/actions"
import { getAllUsers } from "@/app/login/actions"
import type { Item as PrismaItem, User } from "@/app/generated/prisma/client"
import { useEffect, useState } from "react"

type ItemWithUser = PrismaItem & {
    user?: Pick<User, "name"> | null;
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

export function EditItemForm({ item, onFinish }: { item: ItemWithUser; onFinish?: () => void }) {
    const [users, setUsers] = useState<Pick<User, "id" | "name">[]>([])

    const updateItemAction = async (prevState: ActionState, formData: FormData): Promise<ActionState> => {
        return updateItem(item.id, formData)
    }

    const [state, formAction] = useActionState(updateItemAction, initialState)

    useEffect(() => {
        getAllUsers().then(setUsers)
    }, [])

    useEffect(() => {
        if (state.message) {
            if (state.success && onFinish) {
                onFinish()
            }
        }
    }, [state, onFinish])

    return (
        <form action={formAction} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" defaultValue={item.name} required />
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={item.description || ""} />
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="userId">Assignee</Label>
                <Select name="userId" defaultValue={item.userId?.toString() || undefined}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select user" />
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

## File Naming Conventions
- Kebab-case: `create-task-form.tsx`, `edit-task-form.tsx`
- Pattern: `{action}-{entity}-form.tsx`
- Located in: `components/` directory

## Import Order Pattern
1. "use client" directive
2. React hooks (useActionState, useFormStatus, useEffect, useState)
3. Next.js hooks (useRouter)
4. UI component imports
5. Server action imports
6. Type imports

## Key Principles
- Always use "use client" directive
- Use useActionState for server action integration
- Create internal SubmitButton with useFormStatus
- Include onFinish callback for post-submission handling
- Fetch users on mount for assignee fields
- Use defaultValue for edit forms, no value for create forms
- Display error and success messages
- Wrap actions in async function matching useActionState signature
- Use grid layout for side-by-side fields
- Apply space-y-4 to form, space-y-2 to field containers
