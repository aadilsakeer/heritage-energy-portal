/* eslint-disable react-refresh/only-export-components */
import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'android-ripple relative inline-flex min-h-12 items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-[16px] text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-45 active:scale-[0.97] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-soft hover:bg-primary/90 active:bg-primary/95',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70',
        outline:
          'border-2 border-border bg-card text-foreground shadow-soft hover:bg-muted active:bg-muted/80',
        accent:
          'bg-accent text-accent-foreground shadow-soft hover:bg-accent/90 active:bg-accent/95',
        ghost:
          'hover:bg-muted hover:text-foreground active:bg-muted/80',
        link: 'text-primary underline-offset-4 hover:underline',
        destructive:
          'bg-destructive text-destructive-foreground shadow-soft hover:bg-destructive/90 active:bg-destructive/95',
      },
      size: {
        default: 'h-12 px-5 py-2.5',
        sm: 'h-10 min-h-10 rounded-[12px] px-3.5 text-xs',
        lg: 'h-12 min-h-12 rounded-[16px] px-6 text-base',
        icon: 'h-12 w-12 min-h-12 min-w-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading

    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          aria-disabled={isDisabled || undefined}
          {...props}
        >
          {children}
        </Slot>
      )
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <Loader2 className="animate-spin" aria-hidden="true" />
        ) : null}
        {children}
      </button>
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
