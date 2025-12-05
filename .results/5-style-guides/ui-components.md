# UI Components Style Guide

## Unique Patterns in This Codebase

### 1. Class Variance Authority (CVA) for Variants
All variant-based components use `cva` for type-safe variant management:

```tsx
import { cva, type VariantProps } from "class-variance-authority"

const buttonVariants = cva(
  "base-classes-here",
  {
    variants: {
      variant: {
        default: "classes",
        destructive: "classes",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
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
```

**Key Convention**: Extract variants to a `cva()` call, then use `VariantProps` to type component props.

### 2. asChild Pattern with Radix Slot
Components support composition via `asChild` prop:

```tsx
import { Slot } from "@radix-ui/react-slot"

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
```

**Usage**:
```tsx
<Button asChild>
  <Link href="/tasks">View Tasks</Link>
</Button>
```

### 3. Custom AvatarName Extension
The Avatar component includes a project-specific extension for displaying initials:

```tsx
const AvatarName = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & { name: string | null | undefined }
>(({ name, className, ...props }, ref) => {
  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").toUpperCase()
    : "??";

  return (
    <AvatarFallback ref={ref} className={className} {...props}>
      <span className="text-xs font-semibold">{initials}</span>
    </AvatarFallback>
  );
});
AvatarName.displayName = "AvatarName";

export { Avatar, AvatarImage, AvatarFallback, AvatarName }
```

**Key Convention**: Extend Radix primitives with custom helpers specific to this app's needs.

### 4. cn() Utility for Class Merging
All components use the `cn()` utility from `@/lib/utils` for className composition:

```tsx
import { cn } from "@/lib/utils"

<div className={cn(
  "base-classes",
  conditionalClass && "conditional-classes",
  className  // Allow override
)} />
```

**Key Convention**: Always allow `className` prop override and merge with `cn()`.

### 5. Component Composition Pattern
UI components are composed of multiple sub-components:

```tsx
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }

// Usage:
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

**Key Convention**: Export all sub-components for flexible composition.

### 6. Forwarded Refs Standard
All UI components forward refs for DOM access:

```tsx
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn("base-classes", className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"
```

**Key Convention**: Always use `React.forwardRef` and set `displayName` to component name.

### 7. Radix Primitive Wrapping
Radix components are wrapped with Tailwind styling:

```tsx
"use client"  // Required for Radix

import * as DialogPrimitive from "@radix-ui/react-dialog"

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 bg-black/80" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn("fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]", className)}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4">
        <X className="h-4 w-4" />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

export { Dialog, DialogTrigger, DialogContent }
```

**Key Conventions**:
- Use `"use client"` directive
- Wrap Radix primitives with styled versions
- Maintain Radix prop types with `React.ElementRef` and `ComponentPropsWithoutRef`
- Re-export primitives that don't need styling

## File Naming
- All UI component files: lowercase with hyphens (e.g., `button.tsx`, `dropdown-menu.tsx`)
- Located in `components/ui/` directory

## Import Pattern
```tsx
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
```

## Styling Standards
- **No inline styles**: Use Tailwind classes only
- **Design tokens**: Use CSS variable-based classes (`bg-background`, `text-foreground`)
- **Hover states**: Include hover variants (`hover:bg-primary/90`)
- **Focus states**: Keyboard focus styling (`focus-visible:ring-2`)
- **Transitions**: Smooth transitions (`transition-colors`, `transition-shadow`)
