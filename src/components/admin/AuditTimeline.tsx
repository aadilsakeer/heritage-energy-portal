import { motion } from 'framer-motion'
import type { BillEvent } from '@/types'
import { formatDateTime } from '@/utils/format'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/cards/EmptyState'

const labels: Record<string, string> = {
  pdf_uploaded: 'PDF Uploaded',
  ai_completed: 'AI Completed',
  edited: 'Edited',
  published: 'Published',
  republished: 'Republished',
  archived: 'Archived',
  duplicated: 'Duplicated',
  deleted: 'Deleted',
  payment_added: 'Payment Added',
  payment_updated: 'Payment Updated',
  payment_deleted: 'Payment Deleted',
  credit_created: 'Credit Created',
  credit_applied: 'Credit Applied',
  credit_cancelled: 'Credit Cancelled',
  manual_credit_added: 'Manual Credit Added',
}

interface AuditTimelineProps {
  events: BillEvent[]
}

export function AuditTimeline({ events }: AuditTimelineProps) {
  if (events.length === 0) {
    return (
      <EmptyState
        title="No activity yet"
        description="Upload and review actions will appear in this timeline."
      />
    )
  }

  return (
    <div className="space-y-3" role="list" aria-label="Audit timeline">
      {events.map((event, index) => (
        <motion.div
          key={event.id}
          role="listitem"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.04 }}
        >
          <Card className="border-border/50 bg-card/80 shadow-soft backdrop-blur-xl">
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium text-foreground">
                  {labels[event.eventType] ?? event.eventType}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDateTime(event.createdAt)}
                </p>
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true" />
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
