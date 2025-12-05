# Route Pages Style Guide

## Unique Patterns in This Codebase

### 1. **Route Group Pattern with Parentheses**
- Protected routes use `(dashboard)` route group for shared layouts
- Auth routes (`login`, `signup`) are outside the route group
- This enables different layouts without affecting URL structure

### 2. **Mixed Client/Server Component Strategy**
- **Server Components**: Data-fetching pages (`/tasks`, `/board`, `/team`)
- **Client Components**: Interactive auth pages (`/login`, `/signup`) with form state
- Dashboard root is client component for real-time data fetching

### 3. **Poppins Font Import Pattern**
All route pages import and apply Poppins font to page titles:
```tsx
import { poppins } from "@/lib/fonts"

<h2 className={`text-3xl font-bold tracking-tight ${poppins.className}`}>Page Title</h2>
```

### 4. **Consistent Page Layout Structure**
```tsx
<div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
  <div className="flex items-center justify-between">
    <h2 className={`text-3xl font-bold tracking-tight ${poppins.className}`}>Title</h2>
    {/* Optional action button */}
  </div>
  {/* Page content */}
</div>
```

### 5. **Server Actions Direct Import**
Pages import server actions from adjacent `actions.ts` files:
```tsx
import { getAllTasks } from "@/app/(dashboard)/tasks/actions"
```

### 6. **Error Handling Pattern**
Server components destructure error from action responses:
```tsx
const { tasks, error } = await getAllTasks();
if (error) {
    console.error("Error fetching data:", error)
    return <p className="p-8">Could not load data. Please try again later.</p>
}
```

### 7. **Revalidation Configuration**
Server pages that need fresh data use:
```tsx
export const revalidate = 0
```

### 8. **Client State Management for Auth Forms**
Auth pages use `useActionState` hook pattern:
```tsx
const initialState = { error: null };

async function loginAction(state: any, formData: FormData) {
    const result = await login(formData);
    return { error: result?.error ?? null };
}

const [state, formAction] = useActionState(loginAction, initialState);
```

### 9. **Controlled Form Inputs in Auth Pages**
Auth forms maintain controlled state with local handlers:
```tsx
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");

const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "email") setEmail(value);
    if (name === "password") setPassword(value);
};
```

### 10. **Centered Auth Page Layout**
```tsx
<div className="flex items-center justify-center min-h-screen">
    <Card className="w-sm">
        {/* Auth content */}
    </Card>
</div>
```

### 11. **TaskFlow Branding Pattern**
Auth pages include consistent branding header:
```tsx
<div className="flex justify-center items-center mb-4">
    <CheckSquare className="h-8 w-8 mr-2 text-primary" />
    <CardTitle className="text-2xl">TaskFlow</CardTitle>
</div>
```

### 12. **Prisma Type Extension Pattern**
Pages extend Prisma types with included relations:
```tsx
import { Prisma } from "@/app/generated/prisma";

type Task = Prisma.TaskGetPayload<{
  include: {
    assignee: { select: { id: true; name: true; email: true; password: true } };
    creator: { select: { id: true; name: true; email: true; password: true } };
  };
}>;
```

### 13. **Data Transformation on Client**
Dashboard page fetches all tasks once, then derives stats client-side:
```tsx
const totalTasks = allTasks.length;
const completedTasks = allTasks.filter((task) => task.status === "done").length;
const statusData = allTasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
}, {} as Record<string, number>);
```

## Creating a New Route Page

### Server Component Page (Data Fetching)
```tsx
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { MyComponent } from "@/components/my-component"
import { poppins } from "@/lib/fonts"
import { getMyData } from "@/app/(dashboard)/myroute/actions"

export const revalidate = 0

export default async function MyPage() {
    const { data, error } = await getMyData();
    
    if (error) {
        console.error("Error fetching data:", error)
        return <p className="p-8">Could not load data. Please try again later.</p>
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className={`text-3xl font-bold tracking-tight ${poppins.className}`}>My Page</h2>
                <Link href="/myroute/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Item
                    </Button>
                </Link>
            </div>
            <MyComponent data={data || []} />
        </div>
    )
}
```

### Client Component Page (Interactive)
```tsx
"use client"

import { useState } from "react"
import { useActionState } from "react"
import { myAction } from "./actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const initialState = { error: null };

async function submitAction(state: any, formData: FormData) {
    const result = await myAction(formData);
    return { error: result?.error ?? null };
}

export default function MyInteractivePage() {
    const [field, setField] = useState("");
    const [state, formAction] = useActionState(submitAction, initialState);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setField(e.target.value);
    };

    return (
        <div className="flex items-center justify-center min-h-screen">
            <Card className="w-sm">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Page Title</CardTitle>
                    <CardDescription>Description text</CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4" action={formAction}>
                        <div className="space-y-2">
                            <Label htmlFor="field">Field</Label>
                            <Input
                                id="field"
                                name="field"
                                type="text"
                                required
                                value={field}
                                onChange={handleInputChange}
                            />
                        </div>
                        {state.error && (
                            <div className="text-red-500 text-sm text-center">{state.error}</div>
                        )}
                        <Button className="w-full">Submit</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
```

## File Naming Conventions
- All route pages: `page.tsx`
- Located in app directory following Next.js 13+ App Router
- Protected routes: `app/(dashboard)/routename/page.tsx`
- Auth routes: `app/auth-type/page.tsx`
- Nested routes: `app/(dashboard)/parent/child/page.tsx`

## Import Order Pattern
1. Next.js/React imports
2. UI component imports
3. Icon imports (lucide-react)
4. Custom component imports
5. Font imports
6. Server action imports
7. Type imports (last)
