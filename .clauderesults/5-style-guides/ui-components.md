# UI Components Style Guide

## Unique Patterns in This Codebase

### 1. **Based on Radix UI Primitives**
All UI components wrap Radix UI primitives with custom styling:
```tsx
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import * as SelectPrimitive from "@radix-ui/react-select"
```

### 2. **Class Variance Authority (CVA) for Variants**
Button component uses CVA for variant management:
```tsx
import { cva, type VariantProps } from "class-variance-authority"

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
```

### 3. **cn() Utility for Class Merging**
All UI components use cn() from lib/utils:
```tsx
import { cn } from "@/lib/utils"

className={cn("flex h-10 w-full rounded-md border", className)}
```

### 4. **React.forwardRef Pattern**
UI components forward refs for composition:
```tsx
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(/* classes */)}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"
```

### 5. **Custom Cursor Pointer on Buttons**
Button component explicitly adds cursor-pointer:
```tsx
<Comp
    className={cn("cursor-pointer", buttonVariants({ variant, size, className }))}
    ref={ref}
    {...props}
/>
```

### 6. **Slot Pattern from Radix**
Button supports asChild prop for polymorphic rendering:
```tsx
import { Slot } from "@radix-ui/react-slot"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Comp = asChild ? Slot : "button"
```

### 7. **Poppins Font in Card Headers**
Card component imports and applies Poppins font:
```tsx
import { Poppins } from "next/font/google"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"]
})

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", poppins.className, className)}
    {...props}
  />
))
```

### 8. **Custom AvatarName Component**
Avatar includes a custom component for displaying initials:
```tsx
interface AvatarNameProps {
  name: string;
  className?: string;
}

const AvatarName = ({ name, className }: AvatarNameProps) => {
  const parts = name.trim().split(/\s+/);
  let initials = "";
  if (parts.length === 1) {
    initials = parts[0][0]?.toUpperCase() || "";
  } else if (parts.length > 1) {
    initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-background-light font-medium w-full h-full",
        className
      )}
    >
      {initials}
    </span>
  );
}

export { Avatar, AvatarImage, AvatarFallback, AvatarName }
```

### 9. **SelectContent Uses Portal**
Select dropdown renders in a portal:
```tsx
const SelectContent = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
    <SelectPrimitive.Portal>
        <SelectPrimitive.Content
            ref={ref}
            className={cn(/* classes */)}
            position={position}
            {...props}
        >
            <SelectScrollUpButton />
            <SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
            <SelectScrollDownButton />
        </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
))
```

### 10. **Custom Background Colors**
UI components use custom background color tokens:
- `bg-background` - Main background
- `bg-background-dark` - Dark variant (sidebar, dropdowns)
- `bg-background-light` - Light variant (avatars)
- `bg-card-background` - Card background

### 11. **DisplayName Assignment**
All forwarded components set displayName:
```tsx
Input.displayName = "Input"
CardHeader.displayName = "CardHeader"
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName
```

### 12. **Lucide Icons Integration**
UI components use lucide-react for icons:
```tsx
import { Check, ChevronDown, ChevronUp } from "lucide-react"

<ChevronDown className="h-4 w-4 opacity-50" />
```

### 13. **Tailwind Animation Classes**
Components use Tailwind animation utilities:
```tsx
className={cn(
    "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-background-dark shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
    className
)}
```

### 14. **Type Inference from Radix**
Components infer types from Radix primitives:
```tsx
React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>
```

### 15. **Consistent Padding/Spacing**
- Input/Button height: `h-10`
- Card padding: `p-6`
- CardHeader padding: `p-6` with `space-y-1.5`
- Avatar sizes: `h-10 w-10` default

## Creating a New UI Component

### Basic Input-Style Component
```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

const MyInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
MyInput.displayName = "MyInput"

export { MyInput }
```

### Component with Variants (CVA)
```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const myComponentVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        outline: "border border-input bg-background",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface MyComponentProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof myComponentVariants> {}

const MyComponent = React.forwardRef<HTMLDivElement, MyComponentProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <div
        className={cn(myComponentVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
MyComponent.displayName = "MyComponent"

export { MyComponent, myComponentVariants }
```

### Radix-Based Component
```tsx
"use client"

import * as React from "react"
import * as MyPrimitive from "@radix-ui/react-my-primitive"
import { cn } from "@/lib/utils"

const MyComponent = MyPrimitive.Root

const MyTrigger = React.forwardRef<
    React.ElementRef<typeof MyPrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof MyPrimitive.Trigger>
>(({ className, ...props }, ref) => (
    <MyPrimitive.Trigger
        ref={ref}
        className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2",
            className
        )}
        {...props}
    />
))
MyTrigger.displayName = MyPrimitive.Trigger.displayName

const MyContent = React.forwardRef<
    React.ElementRef<typeof MyPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof MyPrimitive.Content>
>(({ className, ...props }, ref) => (
    <MyPrimitive.Portal>
        <MyPrimitive.Content
            ref={ref}
            className={cn(
                "z-50 rounded-md border bg-background-dark shadow-md",
                className
            )}
            {...props}
        />
    </MyPrimitive.Portal>
))
MyContent.displayName = MyPrimitive.Content.displayName

export { MyComponent, MyTrigger, MyContent }
```

## File Naming Conventions
- Kebab-case: `button.tsx`, `input.tsx`, `dropdown-menu.tsx`
- Located in: `components/ui/` directory
- One component per file (may export multiple related sub-components)

## Import Order Pattern
1. "use client" directive (if using hooks or Radix)
2. React import
3. Radix UI primitive imports
4. Third-party imports (CVA, lucide-react)
5. Local utility imports (cn from lib/utils)

## Key Principles
- Wrap Radix UI primitives, don't create from scratch
- Use CVA for complex variant management
- Always forward refs for composition
- Set displayName for debugging
- Use cn() for class merging
- Apply custom background color tokens
- Include cursor-pointer on interactive elements
- Use Poppins font for headers/titles
- Export both component and variants (if using CVA)
