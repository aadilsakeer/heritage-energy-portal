import { memo } from 'react'
import { Link } from 'react-router-dom'
import { APP_NAME, BRAND, ROUTES } from '@/constants'
import { cn } from '@/lib/utils'

interface BrandLogoProps {
  className?: string
  imageClassName?: string
  variant?: 'full' | 'wide' | 'icon'
  subtitle?: string
  asLink?: boolean
}

export const BrandLogo = memo(function BrandLogo({
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
      <div className="flex min-w-0 items-center gap-3.5 py-0.5">
        <BrandMark
          className={cn(
            'h-12 w-12 shrink-0 p-1.5 sm:h-14 sm:w-14',
            imageClassName,
          )}
        />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[1.05rem] font-semibold tracking-tight sm:text-xl">
            {APP_NAME}
          </p>
          {subtitle ? (
            <p className="text-caption mt-1 truncate font-medium">{subtitle}</p>
          ) : null}
        </div>
      </div>
    ) : (
      <div className="flex min-w-0 flex-col items-start gap-1.5 py-0.5">
        <img
          src={BRAND.logo}
          alt={APP_NAME}
          className={cn(
            'h-auto w-auto max-h-12 max-w-[12rem] object-contain object-left sm:max-h-14 sm:max-w-[14rem]',
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
        'inline-flex rounded-2xl transition-opacity duration-200 hover:opacity-90 focus-visible:outline-none',
        className,
      )}
      aria-label={`${APP_NAME} home`}
    >
      {inner}
    </Link>
  )
})

export const BrandMark = memo(function BrandMark({
  className,
}: {
  className?: string
}) {
  return (
    <img
      src={BRAND.icon192}
      alt=""
      aria-hidden="true"
      className={cn(
        'h-12 w-12 shrink-0 rounded-2xl object-contain p-1.5 ring-1 ring-border/60',
        className,
      )}
    />
  )
})
