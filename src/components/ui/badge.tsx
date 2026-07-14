/* eslint-disable react-refresh/only-export-components */
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary/10 text-primary',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        accent: 'border-transparent bg-accent/15 text-accent-foreground',
        outline: 'border-border/80 text-foreground',
        success:
          'border-transparent bg-emerald-500/12 text-emerald-800 dark:text-emerald-300',
        warning:
          'border-transparent bg-amber-500/12 text-amber-800 dark:text-amber-300',
        danger:
          'border-transparent bg-red-500/12 text-red-700 dark:text-red-300',
        info: 'border-transparent bg-blue-500/12 text-blue-700 dark:text-blue-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
