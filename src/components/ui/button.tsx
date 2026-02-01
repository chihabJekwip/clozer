import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] touch-manipulation",
  {
    variants: {
      variant: {
        default: 
          "bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30",
        destructive:
          "bg-destructive text-destructive-foreground shadow-md shadow-destructive/20 hover:bg-destructive/90",
        outline:
          "border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-primary/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: 
          "hover:bg-accent hover:text-accent-foreground",
        link: 
          "text-primary underline-offset-4 hover:underline",
        success:
          "bg-emerald-600 text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700 hover:shadow-lg",
        warning:
          "bg-amber-500 text-white shadow-md shadow-amber-500/20 hover:bg-amber-600 hover:shadow-lg",
        info:
          "bg-sky-500 text-white shadow-md shadow-sky-500/20 hover:bg-sky-600 hover:shadow-lg",
        gradient:
          "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25 hover:from-blue-700 hover:to-blue-600",
        "gradient-success":
          "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-700 hover:to-emerald-600",
        "gradient-warning":
          "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25 hover:from-amber-600 hover:to-orange-600",
        "gradient-danger":
          "bg-gradient-to-r from-rose-600 to-red-500 text-white shadow-lg shadow-rose-500/25 hover:from-rose-700 hover:to-red-600",
        subtle:
          "bg-primary/10 text-primary hover:bg-primary/20",
        "subtle-success":
          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20",
        "subtle-warning":
          "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20",
        "subtle-danger":
          "bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-6 text-base",
        xl: "h-14 rounded-xl px-8 text-base font-semibold",
        "2xl": "h-16 rounded-2xl px-10 text-lg font-semibold",
        icon: "h-11 w-11",
        "icon-sm": "h-9 w-9 rounded-lg",
        "icon-lg": "h-12 w-12",
        "icon-xl": "h-14 w-14 rounded-xl",
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
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {children}
          </>
        ) : (
          <>
            {leftIcon && <span className="mr-2 -ml-1">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="ml-2 -mr-1">{rightIcon}</span>}
          </>
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

// Icon Button component for convenience
const IconButton = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'leftIcon' | 'rightIcon'>>(
  ({ className, size = "icon", ...props }, ref) => (
    <Button
      ref={ref}
      size={size}
      className={cn("p-0", className)}
      {...props}
    />
  )
)
IconButton.displayName = "IconButton"

export { Button, IconButton, buttonVariants }
