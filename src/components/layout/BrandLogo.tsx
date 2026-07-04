import { Link } from 'react-router-dom'
import { APP_NAME, BRAND, ROUTES } from '@/constants'
import { cn } from '@/lib/utils'

interface BrandLogoProps {
  className?: string
  imageClassName?: string
  showText?: boolean
}

export function BrandLogo({
  className,
  imageClassName,
  showText = false,
}: BrandLogoProps) {
  return (
    <Link
      to={ROUTES.home}
      className={cn(
        'flex items-center gap-2.5 rounded-2xl transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className,
      )}
      aria-label={`${APP_NAME} home`}
    >
      <img
        src={BRAND.logo}
        alt={APP_NAME}
        className={cn('h-10 w-auto max-w-[9.5rem] object-contain sm:max-w-[11rem]', imageClassName)}
      />
      {showText ? (
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight text-foreground">
            {APP_NAME}
          </p>
          <p className="hidden text-[11px] text-muted-foreground sm:block">
            Energy Portal
          </p>
        </div>
      ) : null}
    </Link>
  )
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <img
      src={BRAND.icon192}
      alt=""
      aria-hidden="true"
      className={cn('h-9 w-9 rounded-2xl object-cover shadow-soft', className)}
    />
  )
}
