# Layout Components Style Guide

## Unique Patterns and Conventions

### 1. Root Layout Font and Global Styling
Root layout integrates fonts and global styling:

```tsx
// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className={`${inter.className} bg-background text-foreground text-xl`}>
                {children}
            </body>
        </html>
    );
}
```

### 2. Authentication Guard Pattern
Dashboard layout implements authentication check with redirect:

```tsx
// app/(dashboard)/layout.tsx
import { getCurrentUser } from "@/app/login/actions";
import { redirect } from "next/navigation";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background">
                {children}
            </main>
        </div>
    );
}
```

### 3. Flex-Based Layout Structure
Dashboard layout uses flex with overflow control:

```tsx
<div className="flex h-screen overflow-hidden">
    <Sidebar />  {/* Fixed sidebar */}
    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background">
        {children}  {/* Scrollable main content */}
    </main>
</div>
```

### 4. Server Component Layout
Layouts are server components that handle authentication and data:

```tsx
// Server component with async authentication
export default async function RootLayout({ children }: { children: React.ReactNode }) {
    const user = await getCurrentUser();
    // Server-side logic here
}
```

### 5. Component Import Pattern
Layouts import shared components like Sidebar:

```tsx
import { Sidebar } from "@/components/sidebar";
```

### 6. Metadata Export
Root layout exports metadata for SEO:

```tsx
export const metadata: Metadata = {
    title: "TaskFlow",
    description: "Task management made easy",
};
```

### 7. Global CSS Integration
Root layout imports global styles at the top level:

```tsx
import "./globals.css";
```

### 8. Readonly Props Pattern
Layout props are typed as Readonly for immutability:

```tsx
export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
```