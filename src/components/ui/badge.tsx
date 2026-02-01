import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 font-medium transition-colors",
  {
    variants: {
      variant: {
        default: 
          "bg-primary/10 text-primary dark:bg-primary/20",
        secondary: 
          "bg-secondary text-secondary-foreground",
        destructive: 
          "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
        outline: 
          "border-2 text-foreground bg-transparent",
        success: 
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
        warning: 
          "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
        info: 
          "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
        pending: 
          "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
        active:
          "bg-emerald-500 text-white shadow-sm",
        inactive:
          "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
        // Status-specific badges
        "status-new":
          "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
        "status-in-progress":
          "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        "status-completed":
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
        "status-cancelled":
          "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
        // Gradient badges
        "gradient-primary":
          "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm",
        "gradient-success":
          "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm",
        "gradient-warning":
          "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs rounded-full",
        sm: "px-2 py-0.5 text-[10px] rounded-full",
        lg: "px-3 py-1 text-sm rounded-full",
        pill: "px-3 py-1.5 text-xs rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
  dotColor?: string
  icon?: React.ReactNode
}

function Badge({ className, variant, size, dot, dotColor, icon, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span 
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            dotColor || "bg-current opacity-70"
          )} 
        />
      )}
      {icon && <span className="w-3 h-3">{icon}</span>}
      {children}
    </div>
  )
}

// Convenience Status Badge
interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'in_progress' | 'cancelled' | 'absent' | 'planning' | 'paused'
}

function StatusBadge({ status, ...props }: StatusBadgeProps) {
  const statusConfig: Record<string, { variant: BadgeProps['variant'], label: string, dot: boolean }> = {
    active: { variant: 'success', label: 'Actif', dot: true },
    inactive: { variant: 'inactive', label: 'Inactif', dot: true },
    pending: { variant: 'warning', label: 'En attente', dot: true },
    completed: { variant: 'status-completed', label: 'Terminé', dot: true },
    in_progress: { variant: 'status-in-progress', label: 'En cours', dot: true },
    cancelled: { variant: 'status-cancelled', label: 'Annulé', dot: true },
    absent: { variant: 'warning', label: 'Absent', dot: true },
    planning: { variant: 'info', label: 'Planification', dot: true },
    paused: { variant: 'secondary', label: 'En pause', dot: true },
  }

  const config = statusConfig[status] || statusConfig.pending

  return (
    <Badge variant={config.variant} dot={config.dot} {...props}>
      {props.children || config.label}
    </Badge>
  )
}

// Count Badge for notifications
interface CountBadgeProps extends Omit<BadgeProps, 'children'> {
  count: number
  max?: number
}

function CountBadge({ count, max = 99, className, ...props }: CountBadgeProps) {
  const displayCount = count > max ? `${max}+` : count

  if (count === 0) return null

  return (
    <Badge 
      variant="destructive" 
      size="sm"
      className={cn(
        "min-w-[18px] h-[18px] flex items-center justify-center p-0 text-[10px]",
        className
      )}
      {...props}
    >
      {displayCount}
    </Badge>
  )
}

export { Badge, StatusBadge, CountBadge, badgeVariants }
