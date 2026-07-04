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
        className={cn('space-y-6 sm:space-y-8', className)}
        role="status"
        aria-label="Loading page"
      >
        <div className="space-y-4">
          <Skeleton className="h-16 w-48 rounded-2xl" />
          <Skeleton className="h-[52px] w-full rounded-2xl" />
        </div>
        <Skeleton className="h-80 w-full rounded-3xl" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Skeleton className="h-28 rounded-3xl" />
          <Skeleton className="h-28 rounded-3xl" />
          <Skeleton className="h-28 rounded-3xl" />
          <Skeleton className="h-28 rounded-3xl" />
        </div>
        <Skeleton className="h-48 w-full rounded-3xl" />
      </div>
    )
  }

  if (variant === 'hero') {
    return (
      <div className={cn('space-y-4', className)} role="status" aria-label="Loading bill">
        <Skeleton className="h-6 w-32 rounded-xl" />
        <Skeleton className="h-12 w-48 rounded-xl" />
        <Skeleton className="h-72 w-full rounded-3xl" />
      </div>
    )
  }

  if (variant === 'chart') {
    return (
      <div className={cn('space-y-4', className)} role="status" aria-label="Loading chart">
        <Skeleton className="h-6 w-40 rounded-xl" />
        <Skeleton className="h-72 w-full rounded-3xl" />
      </div>
    )
  }

  if (variant === 'list') {
    return (
      <div className={cn('space-y-4', className)} role="status" aria-label="Loading list">
        {Array.from({ length: count }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full rounded-3xl" />
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn('grid grid-cols-2 gap-4 sm:grid-cols-4', className)}
      role="status"
      aria-label="Loading stats"
    >
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className="h-28 w-full rounded-3xl" />
      ))}
    </div>
  )
}
