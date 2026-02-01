import * as React from "react"
import { cn } from "@/lib/utils"
import { Search, X, Eye, EyeOff } from "lucide-react"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "flex h-12 w-full rounded-xl border bg-background px-4 py-3 text-sm",
            "transition-all duration-200",
            "placeholder:text-muted-foreground/60",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            error && "border-destructive focus-visible:ring-destructive/20 focus-visible:border-destructive",
            leftIcon && "pl-11",
            rightIcon && "pr-11",
            className
          )}
          ref={ref}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {rightIcon}
          </div>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

// Search Input Component
interface SearchInputProps extends Omit<InputProps, 'leftIcon' | 'type'> {
  onClear?: () => void
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, value, onClear, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          className={cn(
            "flex h-12 w-full rounded-xl border bg-background pl-11 pr-10 py-3 text-sm",
            "transition-all duration-200",
            "placeholder:text-muted-foreground/60",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary",
            "[&::-webkit-search-cancel-button]:hidden",
            className
          )}
          ref={ref}
          value={value}
          {...props}
        />
        {value && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    )
  }
)
SearchInput.displayName = "SearchInput"

// Password Input with toggle
interface PasswordInputProps extends Omit<InputProps, 'type' | 'rightIcon'> {}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)

    return (
      <div className="relative w-full">
        <input
          type={showPassword ? "text" : "password"}
          className={cn(
            "flex h-12 w-full rounded-xl border bg-background px-4 pr-11 py-3 text-sm",
            "transition-all duration-200",
            "placeholder:text-muted-foreground/60",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary",
            className
          )}
          ref={ref}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          {showPassword ? (
            <EyeOff className="w-5 h-5" />
          ) : (
            <Eye className="w-5 h-5" />
          )}
        </button>
      </div>
    )
  }
)
PasswordInput.displayName = "PasswordInput"

// Input with label and error message
interface FormInputProps extends InputProps {
  label?: string
  helperText?: string
  errorMessage?: string
}

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ className, label, helperText, errorMessage, error, id, ...props }, ref) => {
    const generatedId = React.useId()
    const inputId = id || generatedId
    const hasError = error || !!errorMessage

    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={inputId}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
          </label>
        )}
        <Input
          ref={ref}
          id={inputId}
          error={hasError}
          className={className}
          {...props}
        />
        {(errorMessage || helperText) && (
          <p className={cn(
            "text-xs",
            hasError ? "text-destructive" : "text-muted-foreground"
          )}>
            {errorMessage || helperText}
          </p>
        )}
      </div>
    )
  }
)
FormInput.displayName = "FormInput"

export { Input, SearchInput, PasswordInput, FormInput }
