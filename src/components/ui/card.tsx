import * as React from "react"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const cardVariants = cva(
  "rounded-xl bg-card text-card-foreground transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border shadow-sm",
        elevated: "shadow-md hover:shadow-lg",
        interactive: "border shadow-sm hover:shadow-md hover:border-primary/30 cursor-pointer active:scale-[0.99]",
        ghost: "bg-transparent border-0 shadow-none",
        outlined: "border-2 border-dashed",
        glass: "backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border border-white/20 shadow-lg",
      },
      padding: {
        none: "",
        sm: "p-3",
        default: "p-4",
        lg: "p-6",
      }
    },
    defaultVariants: {
      variant: "default",
      padding: "none",
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, padding, className }))}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-4 lg:p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4 lg:p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-4 lg:p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

// Stat Card Component - for dashboard stats
interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    label?: string
    positive?: boolean
  }
  variant?: 'primary' | 'success' | 'warning' | 'info' | 'default'
}

const statCardColors = {
  primary: "from-blue-500 to-blue-600 text-white",
  success: "from-emerald-500 to-emerald-600 text-white",
  warning: "from-amber-500 to-orange-500 text-white",
  info: "from-sky-500 to-cyan-500 text-white",
  default: "from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 text-foreground",
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ className, title, value, subtitle, icon, trend, variant = 'default', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col p-4 rounded-xl bg-gradient-to-br shadow-md",
        statCardColors[variant],
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between mb-2">
        <span className={cn(
          "text-sm font-medium",
          variant === 'default' ? "text-muted-foreground" : "text-white/80"
        )}>
          {title}
        </span>
        {icon && (
          <span className={cn(
            "p-2 rounded-lg",
            variant === 'default' ? "bg-gray-200 dark:bg-gray-600" : "bg-white/20"
          )}>
            {icon}
          </span>
        )}
      </div>
      <span className="text-2xl lg:text-3xl font-bold">{value}</span>
      {(subtitle || trend) && (
        <div className="flex items-center gap-2 mt-1">
          {trend && (
            <span className={cn(
              "text-xs font-medium px-1.5 py-0.5 rounded",
              variant === 'default' 
                ? trend.positive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                : "bg-white/20"
            )}>
              {trend.positive ? '+' : ''}{trend.value}%
            </span>
          )}
          {subtitle && (
            <span className={cn(
              "text-xs",
              variant === 'default' ? "text-muted-foreground" : "text-white/70"
            )}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  )
)
StatCard.displayName = "StatCard"

// List Item Card Component
interface ListItemCardProps extends React.HTMLAttributes<HTMLDivElement> {
  avatar?: React.ReactNode
  title: string
  subtitle?: string
  badge?: React.ReactNode
  rightContent?: React.ReactNode
  clickable?: boolean
}

const ListItemCard = React.forwardRef<HTMLDivElement, ListItemCardProps>(
  ({ className, avatar, title, subtitle, badge, rightContent, clickable = true, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center gap-4 p-4 bg-card rounded-xl border border-transparent",
        clickable && "hover:border-primary/20 cursor-pointer active:scale-[0.99]",
        "transition-all duration-200",
        className
      )}
      {...props}
    >
      {avatar && (
        <div className="flex-shrink-0">
          {avatar}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{title}</span>
          {badge}
        </div>
        {subtitle && (
          <span className="text-sm text-muted-foreground truncate block">{subtitle}</span>
        )}
      </div>
      {rightContent && (
        <div className="flex-shrink-0">
          {rightContent}
        </div>
      )}
    </div>
  )
)
ListItemCard.displayName = "ListItemCard"

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent,
  StatCard,
  ListItemCard,
  cardVariants 
}
