# Layout Components Style Guide

## Unique Patterns in This Codebase

### 1. **Two-Tier Layout System**
- **Root Layout** (`app/layout.tsx`): Global setup, minimal UI
- **Dashboard Layout** (`app/(dashboard)/layout.tsx`): Sidebar + auth protection

### 2. **Root Layout Configuration**
Root layout handles global settings without business logic:
```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TaskFlow",
  description: "Task management made easy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-background text-foreground text-xl`}>
        {children}
      </body>
    </html>
  );
}
```

### 3. **Server-Side Authentication Check**
Dashboard layout performs auth check before rendering:
```tsx
import { getCurrentUser } from "@/app/login/actions";
import { redirect } from "next/navigation";

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    return (
        // layout JSX
    );
}
```

### 4. **Flex Layout Structure**
Dashboard uses flex for sidebar + main content:
```tsx
<div className="flex h-screen overflow-hidden">
    <Sidebar />
    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background">{children}</main>
</div>
```

### 5. **Explicit Children Type**
Layouts use TypeScript's Readonly utility type:
```tsx
{
  children,
}: Readonly<{
  children: React.ReactNode;
}>
```

### 6. **Global Font Application**
Root layout applies Inter font to body element:
```tsx
const inter = Inter({ subsets: ["latin"] });
<body className={`${inter.className} bg-background text-foreground text-xl`}>
```

### 7. **No Layout Props Beyond Children**
Layouts in this codebase only accept `children`, no custom props

### 8. **Server Component by Default**
Both layouts are async server components (no "use client" directive)

### 9. **Metadata Export Pattern**
Only root layout exports metadata:
```tsx
export const metadata: Metadata = {
  title: "TaskFlow",
  description: "Task management made easy",
};
```

### 10. **Sidebar Component Import**
Dashboard layout imports sidebar component:
```tsx
import { Sidebar } from "@/components/sidebar";
```

### 11. **No Loading/Error Boundaries in Layouts**
Layouts are minimal, error handling done at page level

## Creating a New Layout

### Root Layout (Global)
```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "My App",
  description: "My app description",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-background text-foreground text-xl`}>
        {children}
      </body>
    </html>
  );
}
```

### Protected Section Layout
```tsx
import { ComponentName } from "@/components/component-name";
import { getCurrentUser } from "@/app/login/actions";
import { redirect } from "next/navigation";

export default async function SectionLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    return (
        <div className="flex h-screen overflow-hidden">
            <ComponentName />
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background">
                {children}
            </main>
        </div>
    );
}
```

### Public Section Layout (No Auth)
```tsx
export default function PublicLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="min-h-screen bg-background">
            {children}
        </div>
    );
}
```

## File Naming Conventions
- All layouts: `layout.tsx`
- Root layout: `app/layout.tsx`
- Route group layouts: `app/(groupname)/layout.tsx`
- Nested layouts: `app/parent/child/layout.tsx`

## Import Order Pattern
1. Next.js/React type imports (Metadata)
2. Font imports
3. CSS imports (globals.css)
4. Component imports
5. Server action imports (for auth checks)
6. Redirect utilities (from next/navigation)

## Key Differences from Route Pages
- Layouts are always server components (async functions)
- Layouts perform authentication checks
- Layouts establish the overall structure (sidebar, navigation)
- Pages consume data and render business logic
- Layouts are structural, pages are functional
