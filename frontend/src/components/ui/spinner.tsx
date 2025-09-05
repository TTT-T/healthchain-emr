import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const spinnerVariants = cva(
  "inline-block animate-spin rounded-full",
  {
    variants: {
      variant: {
        default: "border-2 border-current border-t-transparent text-primary",
        secondary: "border-2 border-secondary border-t-transparent",
      },
      size: {
        default: "h-4 w-4",
        sm: "h-3 w-3",
        lg: "h-6 w-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface SpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {}

function Spinner({ className, variant, size, ...props }: SpinnerProps) {
  return (
    <div
      className={cn(spinnerVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Spinner, spinnerVariants }
