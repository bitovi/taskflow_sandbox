# Design System Domain Implementation

## Overview

The design system is built on shadcn/ui components, Radix UI primitives, and Tailwind CSS v4. It provides a comprehensive, accessible, and consistent visual language across the application with custom theming, reusable components, and a well-defined color palette.

## Key Technologies

- **shadcn/ui** - Pre-built component library
- **Radix UI** - Headless accessible primitives
- **Tailwind CSS v4** - Utility-first CSS framework
- **class-variance-authority (cva)** - Component variants
- **Lucide React** - Icon system
- **Poppins font** - Brand typography for headings
- **Inter font** - Body text (default from Next.js)

## Design Tokens

### Color System

**From app/globals.css:**
```css
@theme {
  /* Backgrounds */
  --color-background: #002A2E;           /* Main app background */
  --color-background-light: #00848B;     /* Hover/highlight states */
  --color-background-dark: #072427;      /* Sidebar, darker areas */
  --color-background-muted: #B9BFCC;     /* Muted backgrounds */

  /* Foreground (Text) */
  --color-foreground: #fff;              /* Primary text */
  --color-foreground-light: #00848B;     /* Light/accent text */
  --color-foreground-dark: #072427;      /* Dark text on light */
  --color-foreground-muted: #B9BFCC;     /* Secondary text */

  /* Card */
  --color-card-background: #033538;      /* Card backgrounds */
  --color-card-foreground: #fff;         /* Card text */

  /* Brand */
  --color-primary: #F5532C;              /* Primary orange-red */
  --color-secondary: #F4F5F5;            /* Secondary light gray */
}
```

**Usage in components:**
```tsx
<div className="bg-background text-foreground">
  <div className="bg-card-background text-card-foreground p-6">
    <h2 className="text-primary">Title</h2>
    <p className="text-foreground-muted">Description</p>
  </div>
</div>
```

### Typography

**Font configuration:**
```typescript
// lib/fonts.ts
import { Poppins } from "next/font/google"

export const poppins = Poppins({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700", "800", "900"]
})
```

**Default Inter font in root layout:**
```tsx
// app/layout.tsx
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
```

**Typography scale:**
```tsx
// Headings - use Poppins
<h1 className={`text-3xl font-bold ${poppins.className}`}>Main Title</h1>
<h2 className={`text-2xl font-semibold ${poppins.className}`}>Section</h2>
<h3 className={`text-xl font-medium ${poppins.className}`}>Subsection</h3>

// Body - uses Inter (default)
<p className="text-base">Regular paragraph text</p>
<p className="text-sm text-foreground-muted">Helper text</p>
<p className="text-xs">Fine print</p>
```

**Base font size:**
```css
@layer base {
  html {
    font-size: 20px;  /* Base 20px for better readability */
  }
}
```

### Spacing System

**Tailwind spacing utilities:**
```tsx
// Padding
className="p-4"      // 16px all sides
className="px-6"     // 24px horizontal
className="py-2"     // 8px vertical
className="pt-6"     // 24px top

// Margin
className="m-4"      // 16px all sides
className="mb-6"     // 24px bottom
className="mt-8"     // 32px top

// Gap (Flexbox/Grid)
className="gap-4"    // 16px gap
className="gap-x-2"  // 8px horizontal gap
className="gap-y-4"  // 16px vertical gap

// Space between (Flexbox)
className="space-x-4"  // 16px between horizontal children
className="space-y-4"  // 16px between vertical children
```

### Border Radius

```tsx
className="rounded"      // 4px
className="rounded-md"   // 6px
className="rounded-lg"   // 8px
className="rounded-full" // 9999px (fully rounded)
```

### Shadow System

```tsx
className="shadow-sm"    // Subtle shadow
className="shadow"       // Default shadow
className="shadow-md"    // Medium shadow
className="shadow-lg"    // Large shadow
```

## Component Library

### Button Component

**From components/ui/button.tsx:**
```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn("cursor-pointer", buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

**Usage:**
```tsx
import { Button } from "@/components/ui/button"

// Default primary button
<Button>Click Me</Button>

// Variants
<Button variant="outline">Secondary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link Style</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Plus /></Button>

// With icon
<Button>
  <Plus className="mr-2 h-4 w-4" />
  Add Item
</Button>

// As child (for Link component)
<Button asChild>
  <Link href="/dashboard">Dashboard</Link>
</Button>
```

### Card Component

**From components/ui/card.tsx:**
```tsx
import * as React from "react"
import { Poppins } from "next/font/google"
import { cn } from "@/lib/utils"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"]
})

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border shadow-sm text-card-foreground bg-card-background",
        className
      )}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 p-6", poppins.className, className)}
      {...props}
    />
  )
)
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("text-2xl font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  )
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("text-sm text-foreground-muted", className)}
      {...props}
    />
  )
)
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6", className)} {...props} />
  )
)
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center p-6 pt-0", className)}
      {...props}
    />
  )
)
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
```

**Usage:**
```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description text</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Card content */}
  </CardContent>
</Card>
```

### Input Component

**From components/ui/input.tsx:**
```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
```

**Usage:**
```tsx
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input 
    id="email" 
    type="email" 
    placeholder="m@example.com"
    required
  />
</div>
```

### Badge Component

**From components/ui/badge.tsx:**
```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-background-dark text-foreground-muted hover:bg-primary/80",
        secondary: "border-transparent bg-background-dark text-secondary hover:bg-secondary/80",
        destructive: "border-transparent bg-background-dark text-primary hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
```

**Usage:**
```tsx
import { Badge } from "@/components/ui/badge"

// Default
<Badge>Default</Badge>

// Variants
<Badge variant="secondary">Low Priority</Badge>
<Badge variant="default">Medium Priority</Badge>
<Badge variant="destructive">High Priority</Badge>
<Badge variant="outline">Outline</Badge>

// With custom styling
<Badge className="capitalize">{task.priority}</Badge>
```

### Dialog (Modal) Component

**From components/ui/dialog.tsx:**
```tsx
"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
)
DialogHeader.displayName = "DialogHeader"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

export { Dialog, DialogPortal, DialogOverlay, DialogClose, DialogTrigger, DialogContent, DialogHeader, DialogTitle }
```

**Usage:**
```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit Task</DialogTitle>
    </DialogHeader>
    {/* Dialog content */}
  </DialogContent>
</Dialog>
```

### Dropdown Menu Component

**From components/ui/dropdown-menu.tsx:**
```tsx
"use client"

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { Check, ChevronRight, Circle } from "lucide-react"
import { cn } from "@/lib/utils"

const DropdownMenu = DropdownMenuPrimitive.Root
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger
const DropdownMenuGroup = DropdownMenuPrimitive.Group
const DropdownMenuPortal = DropdownMenuPrimitive.Portal

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-background-dark p-1 shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem }
```

**Usage:**
```tsx
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Edit, Trash2 } from "lucide-react"

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <MoreHorizontal className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={handleEdit}>
      <Edit className="mr-2 h-4 w-4" />
      Edit
    </DropdownMenuItem>
    <DropdownMenuItem onClick={handleDelete}>
      <Trash2 className="mr-2 h-4 w-4" />
      Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Avatar Component

**From components/ui/avatar.tsx:**
```tsx
import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

// Custom component for name-based avatars
const AvatarName = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { name: string }
>(({ className, name, ...props }, ref) => {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <AvatarFallback ref={ref} className={cn(className)} {...props}>
      {getInitials(name)}
    </AvatarFallback>
  )
})
AvatarName.displayName = "AvatarName"

export { Avatar, AvatarFallback, AvatarName }
```

**Usage:**
```tsx
import { Avatar, AvatarName } from "@/components/ui/avatar"

<Avatar className="h-9 w-9">
  <AvatarName name={user.name} />
</Avatar>
```

## Utility Functions

### cn() Utility

**From lib/utils.ts:**
```typescript
// Simple utility for conditionally joining class names
export function cn(...classes: (string | undefined | false | null)[]): string {
    return classes.filter(Boolean).join(" ")
}
```

**Usage:**
```tsx
import { cn } from "@/lib/utils"

<div className={cn(
  "p-4 rounded-md",
  isActive && "bg-primary text-white",
  isDisabled && "opacity-50 pointer-events-none"
)}>
  Content
</div>
```

## Icon System

**Lucide React icons:**
```tsx
import { 
  Plus, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  CheckSquare,
  Users,
  LayoutDashboard,
  Kanban,
  Clock,
  LogOut
} from "lucide-react"

// With button
<Button>
  <Plus className="mr-2 h-4 w-4" />
  Add Task
</Button>

// Standalone
<Clock className="h-4 w-4 text-muted-foreground" />

// In dropdown
<DropdownMenuItem>
  <Edit className="mr-2 h-4 w-4" />
  Edit
</DropdownMenuItem>
```

## Responsive Design Patterns

### Breakpoints

```tsx
// Mobile first approach
className="text-base md:text-sm"  // Base size on mobile, smaller on desktop
className="p-4 md:p-8"            // Less padding on mobile
className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"  // Responsive grid

// Tailwind breakpoints:
// sm: 640px
// md: 768px
// lg: 1024px
// xl: 1280px
// 2xl: 1536px
```

### Common Layout Patterns

**Page container:**
```tsx
<div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
  <h2 className={`text-3xl font-bold tracking-tight ${poppins.className}`}>
    Page Title
  </h2>
  {/* Page content */}
</div>
```

**Grid layout:**
```tsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  {/* Grid items */}
</div>
```

**Flex layout:**
```tsx
<div className="flex items-center justify-between">
  <div className="flex items-center space-x-4">
    {/* Left content */}
  </div>
  <div>
    {/* Right content */}
  </div>
</div>
```

## Accessibility Features

### Keyboard Navigation

All Radix UI components support keyboard navigation:
- **Tab** - Navigate between focusable elements
- **Enter/Space** - Activate buttons and triggers
- **Escape** - Close dialogs and dropdowns
- **Arrow keys** - Navigate menu items

### Screen Reader Support

**Semantic HTML:**
```tsx
// ✅ Good - Semantic elements
<button>Click Me</button>
<nav>Navigation</nav>
<main>Content</main>

// ✅ Good - ARIA labels
<Button aria-label="Close dialog">
  <X className="h-4 w-4" />
</Button>

// Hidden from screen readers
<span className="sr-only">Accessible description</span>
```

### Focus Management

All components have focus states:
```tsx
className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
```

## Animation System

### Tailwind Animations

```tsx
// Transitions
className="transition-colors"      // Color transitions
className="transition-shadow"      // Shadow transitions
className="transition-all"         // All properties

// Hover effects
className="hover:bg-accent"
className="hover:shadow-md"
className="hover:text-accent-foreground"

// Data state animations (Radix)
className="data-[state=open]:animate-in"
className="data-[state=closed]:animate-out"
className="data-[state=closed]:fade-out-0"
className="data-[state=open]:fade-in-0"
```

## Best Practices

### 1. Use Existing Components

```tsx
// ✅ Good - Use design system components
import { Button } from "@/components/ui/button"
<Button variant="outline">Click Me</Button>

// ❌ Bad - Create custom button
<button className="px-4 py-2 border rounded">Click Me</button>
```

### 2. Apply Poppins Only to Headings

```tsx
// ✅ Good - Poppins for headings
<h1 className={`text-3xl font-bold ${poppins.className}`}>Title</h1>
<p className="text-base">Body text uses Inter</p>

// ❌ Bad - Poppins on body text
<p className={poppins.className}>Wrong font</p>
```

### 3. Use Design Tokens

```tsx
// ✅ Good - Use theme colors
<div className="bg-background text-foreground">

// ❌ Bad - Hard-coded colors
<div style={{ backgroundColor: '#002A2E', color: '#fff' }}>
```

### 4. Use cn() for Conditional Styles

```tsx
// ✅ Good - cn() utility
<div className={cn("p-4", isActive && "bg-primary")}>

// ❌ Bad - Template literals
<div className={`p-4 ${isActive ? 'bg-primary' : ''}`}>
```

### 5. Maintain Consistent Spacing

```tsx
// ✅ Good - Consistent spacing scale
<div className="space-y-4">  {/* 16px vertical spacing */}
  <Card className="p-6">     {/* 24px padding */}
    <div className="space-y-2">  {/* 8px between elements */}
      {/* Content */}
    </div>
  </Card>
</div>

// ❌ Bad - Arbitrary values
<div style={{ marginBottom: '13px' }}>
```

### 6. Use Semantic HTML

```tsx
// ✅ Good - Semantic elements
<nav>
  <ul>
    <li><Link href="/">Home</Link></li>
  </ul>
</nav>

// ❌ Bad - Divs for everything
<div>
  <div>
    <div><a href="/">Home</a></div>
  </div>
</div>
```

## Component Composition

### Example: Task Card

```tsx
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarName } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { poppins } from "@/lib/fonts"

<Card>
  <CardContent className="p-6">
    <div className="flex items-start justify-between">
      <div className="flex items-start space-x-4">
        <Avatar className="h-9 w-9">
          <AvatarName name={task.assignee?.name || "Unassigned"} />
        </Avatar>
        <div className="flex-1">
          <h3 className={`font-semibold ${poppins.className}`}>
            {task.name}
          </h3>
          <p className="text-sm text-foreground-muted">
            {task.description}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Badge variant={priorityVariant[task.priority]}>
          {task.priority}
        </Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  </CardContent>
</Card>
```

## Summary

The design system provides a comprehensive foundation for building consistent, accessible user interfaces:

1. **shadcn/ui components** - Pre-built, customizable components
2. **Radix UI primitives** - Accessible, headless components
3. **Tailwind CSS v4** - Utility-first styling with custom theme
4. **Custom color palette** - Dark theme with brand colors
5. **Typography system** - Poppins for headings, Inter for body
6. **Component variants** - cva for type-safe variant APIs
7. **Icon system** - Lucide React for consistent iconography
8. **Utility functions** - cn() for conditional styling
9. **Responsive design** - Mobile-first breakpoints
10. **Accessibility** - Keyboard navigation, focus management, ARIA

This design system ensures visual consistency, developer productivity, and excellent user experience across the application.
