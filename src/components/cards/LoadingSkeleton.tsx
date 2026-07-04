import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface LoadingSkeletonProps {
  variant?: 'hero' | 'stat' | 'list' | 'chart' | 'page'
  count?: number
  className?: string
}

export function LoadingSkeleton({
  variant = 'stat',
  count = 1,
  className,
}: LoadingSkeletonProps) {
  if (variant === 'page') {
    return (
      <div
        className={cn('mx-auto w-full max-w-6xl space-y-4 px-4 py-6 sm:px-6', className)}
        role="status"
        aria-label="Loading page"
      >
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Skeleton className="h-56 w-full rounded-3xl" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-32 rounded-3xl" />
          <Skeleton className="h-32 rounded-3xl" />
        </div>
        <Skeleton className="h-40 w-full rounded-3xl" />
      </div>
    )
  }

  if (variant === 'hero') {
    return (
      <Skeleton
        className={cn('h-64 w-full rounded-3xl', className)}
        aria-label="Loading"
      />
    )
  }

  if (variant === 'chart') {
    return (
      <Skeleton
        className={cn('h-72 w-full rounded-3xl', className)}
        aria-label="Loading chart"
      />
    )
  }

  if (variant === 'list') {
    return (
      <div className={cn('space-y-3', className)} role="status" aria-label="Loading list">
        {Array.from({ length: count }).map((_, index) => (
          <Skeleton key={index} className="h-20 w-full rounded-3xl" />
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn('grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4', className)}
      role="status"
      aria-label="Loading stats"
    >
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className="h-28 w-full rounded-3xl" />
      ))}
    </div>
  )
}
