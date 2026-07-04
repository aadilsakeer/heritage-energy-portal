import { Link } from 'react-router-dom'
import { APP_NAME, BRAND, ROUTES } from '@/constants'
import { cn } from '@/lib/utils'

interface BrandLogoProps {
  className?: string
  imageClassName?: string
  /** full: icon + Heritage Solar stacked; wide: full logo image; icon: mark only */
  variant?: 'full' | 'wide' | 'icon'
  subtitle?: string
  asLink?: boolean
}

export function BrandLogo({
  className,
  imageClassName,
  variant = 'wide',
  subtitle,
  asLink = true,
}: BrandLogoProps) {
  const inner =
    variant === 'icon' ? (
      <BrandMark className={imageClassName} />
    ) : variant === 'full' ? (
      <div className="flex min-w-0 flex-col items-start gap-2 py-0.5">
        <BrandMark className={cn('h-11 w-11 p-1.5', imageClassName)} />
        <div className="min-w-0">
          <p className="text-subtitle leading-none">{APP_NAME}</p>
          {subtitle ? (
            <p className="text-caption mt-1.5 truncate">{subtitle}</p>
          ) : null}
        </div>
      </div>
    ) : (
      <div className="flex min-w-0 flex-col items-start gap-1.5 py-0.5">
        <img
          src={BRAND.logo}
          alt={APP_NAME}
          className={cn(
            'h-auto w-auto max-h-12 max-w-[11rem] object-contain object-left sm:max-h-14 sm:max-w-[13rem]',
            imageClassName,
          )}
        />
        {subtitle ? (
          <p className="text-caption truncate">{subtitle}</p>
        ) : null}
      </div>
    )

  if (!asLink) {
    return <div className={className}>{inner}</div>
  }

  return (
    <Link
      to={ROUTES.home}
      className={cn(
        'inline-flex rounded-2xl transition-opacity hover:opacity-85 focus-visible:outline-none',
        className,
      )}
      aria-label={`${APP_NAME} home`}
    >
      {inner}
    </Link>
  )
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <img
      src={BRAND.icon192}
      alt=""
      aria-hidden="true"
      className={cn(
        'h-11 w-11 shrink-0 rounded-2xl object-contain p-1.5 shadow-soft',
        className,
      )}
    />
  )
}
