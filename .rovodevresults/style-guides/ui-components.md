# UI Components Style Guide

## Unique Patterns and Conventions

### 1. forwardRef with Radix Integration
All UI components use React.forwardRef with Radix Slot pattern:

```tsx
// components/ui/button.tsx
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
Button.displayName = "Button"
```

### 2. Class Variance Authority Pattern
Components use CVA for variant-based styling:

```tsx
import { cva, type VariantProps } from "class-variance-authority"

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground hover:bg-primary/90",
                destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                // ... more variants
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-md px-3",
                // ... more sizes
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)
```

### 3. TypeScript Interface Extension
Components extend Radix component props:

```tsx
export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
}
```

### 4. Design Token Integration
Components use CSS custom properties for theming:

```tsx
// Uses tokens like:
// bg-primary, text-primary-foreground
// bg-secondary, text-secondary-foreground
// border-input, bg-background
// ring-ring, ring-offset-background
```

### 5. Accessibility-First Approach
All interactive components use Radix primitives for built-in accessibility:

```tsx
// components/ui/checkbox.tsx
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"

const Checkbox = React.forwardRef<
    React.ElementRef<typeof CheckboxPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
    <CheckboxPrimitive.Root
        ref={ref}
        className={cn(
            "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
            className
        )}
        {...props}
    >
```

### 6. Compound Component Pattern
Complex components like Card use compound pattern:

```tsx
// components/ui/card.tsx
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn("rounded-xl border bg-card text-card-foreground shadow", className)} {...props} />
    )
)

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
    )
)

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
```

### 7. Avatar Component with Fallback Pattern
Avatar components implement fallback system:

```tsx
// components/ui/avatar.tsx
const Avatar = React.forwardRef<
    React.ElementRef<typeof AvatarPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
    <AvatarPrimitive.Root
        ref={ref}
        className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
        {...props}
    />
))
```

### 8. Badge Variant System
Badge components use specific variant mapping:

```tsx
// components/ui/badge.tsx
const badgeVariants = cva(
    "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    {
        variants: {
            variant: {
                default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
                secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
                destructive: "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
                outline: "text-foreground",
            },
        },
        defaultVariants: { variant: "default" },
    }
)
```

### 9. Form Control Integration
Input and form components integrate with form libraries:

```tsx
// components/ui/input.tsx
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
```

### 10. Component Export Pattern
All UI components export both the component and related types:

```tsx
// Export pattern
export { Button, buttonVariants }
export type { ButtonProps }
```