import { motion } from 'framer-motion'
import { propertyIcon } from '@/lib/propertyDetection'
import { formatBillStatus } from '@/lib/payments'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { BillStatus, Property } from '@/types'
import { formatDateTime, formatMonthLabel } from '@/utils/format'

interface UploadSuccessCardProps {
  property: Property
  billingMonth: string
  consumerNumber: string | null
  status: BillStatus
  uploadedAt: string
}

export function UploadSuccessCard({
  property,
  billingMonth,
  consumerNumber,
  status,
  uploadedAt,
}: UploadSuccessCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-emerald-500/20 bg-emerald-500/5 shadow-soft">
        <CardContent className="flex items-start gap-4 p-4 sm:p-5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-2xl">
            {propertyIcon(property.slug)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{property.label}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Consumer No {consumerNumber ?? '—'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatMonthLabel(billingMonth)} · Uploaded {formatDateTime(uploadedAt)}
            </p>
            <div className="mt-2">
              <Badge variant="outline" className="capitalize">
                {formatBillStatus(status)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
