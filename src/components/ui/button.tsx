/* eslint-disable react-refresh/only-export-components */
import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'android-ripple relative inline-flex min-h-12 items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-2xl text-sm font-semibold tracking-tight transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-45 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-soft hover:bg-primary/92 active:bg-primary/88',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/85 active:bg-secondary/75',
        outline:
          'border border-border bg-card text-foreground shadow-soft hover:bg-muted/70 active:bg-muted',
        accent:
          'bg-accent text-accent-foreground shadow-soft hover:bg-accent/92 active:bg-accent/88',
        ghost: 'hover:bg-muted/80 hover:text-foreground active:bg-muted',
        link: 'text-primary underline-offset-4 hover:underline',
        destructive:
          'bg-destructive text-white shadow-soft hover:bg-destructive/92 active:bg-destructive/88',
      },
      size: {
        default: 'h-12 px-5 py-2.5',
        sm: 'h-10 min-h-10 rounded-xl px-3.5 text-xs',
        lg: 'h-12 min-h-12 rounded-2xl px-6 text-[15px]',
        icon: 'h-12 w-12 min-h-12 min-w-12 rounded-2xl',
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
