import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface LoadingSkeletonProps {
  variant?: 'hero' | 'stat' | 'list' | 'chart'
  count?: number
  className?: string
}

export function LoadingSkeleton({
  variant = 'stat',
  count = 1,
  className,
}: LoadingSkeletonProps) {
  if (variant === 'hero') {
    return <Skeleton className={cn('h-64 w-full rounded-3xl', className)} />
  }

  if (variant === 'chart') {
    return <Skeleton className={cn('h-72 w-full rounded-3xl', className)} />
  }

  if (variant === 'list') {
    return (
      <div className={cn('space-y-3', className)}>
        {Array.from({ length: count }).map((_, index) => (
          <Skeleton key={index} className="h-20 w-full rounded-3xl" />
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4',
        className,
      )}
    >
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className="h-28 w-full rounded-3xl" />
      ))}
    </div>
  )
}
