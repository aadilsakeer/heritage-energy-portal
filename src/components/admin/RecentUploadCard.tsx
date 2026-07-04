import { motion } from 'framer-motion'
import { propertyIcon } from '@/lib/propertyDetection'
import { formatBillStatus } from '@/lib/payments'
import { billStatusVariant } from '@/lib/billStatus'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { UploadItem } from '@/types'
import { formatDateTime, formatMonthLabel } from '@/utils/format'

interface RecentUploadCardProps {
  upload: UploadItem
  onSelect: () => void
  index?: number
}

export function RecentUploadCard({
  upload,
  onSelect,
  index = 0,
}: RecentUploadCardProps) {
  const icon = propertyIcon(upload.propertySlug ?? 'unknown')
  const propertyName = upload.propertyLabel ?? 'Unknown Property'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
    >
      <button type="button" className="w-full text-left" onClick={onSelect}>
        <Card className="border-border/50 bg-card/80 shadow-soft backdrop-blur-xl transition-shadow hover:shadow-md">
          <CardContent className="flex items-start gap-4 p-4 sm:p-5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-2xl">
              {icon}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-foreground">{propertyName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatMonthLabel(upload.billingMonth)}
                  </p>
                </div>
                <Badge
                  variant={billStatusVariant[upload.status]}
                  className="capitalize"
                >
                  {formatBillStatus(upload.status)}
                </Badge>
              </div>
              <div className="mt-3 grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
                <p>
                  Consumer{' '}
                  <span className="font-medium text-foreground">
                    {upload.consumerNumber ?? '—'}
                  </span>
                </p>
                <p>{formatDateTime(upload.uploadedAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </button>
    </motion.div>
  )
}
