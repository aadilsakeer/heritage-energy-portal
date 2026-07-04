import { FileText } from 'lucide-react'
import { motion } from 'framer-motion'
import { UploadCard } from '@/components/cards/UploadCard'
import { PageContainer } from '@/components/layout/PageContainer'
import { SectionHeader } from '@/components/layout/SectionHeader'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { RECENT_UPLOADS } from '@/constants'
import { formatDateTime } from '@/utils/format'

const statusVariant = {
  processed: 'success',
  pending: 'warning',
  failed: 'outline',
} as const

export function AdminPage() {
  return (
    <PageContainer>
      <div className="space-y-6 sm:space-y-8">
        <div>
          <p className="text-sm font-medium text-primary">Admin</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Meter Uploads
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload readings, analyze bills, and publish invoices
          </p>
        </div>

        <UploadCard />

        <section>
          <SectionHeader
            title="Recent Uploads"
            description="Latest meter reading files"
          />
          <div className="space-y-3">
            {RECENT_UPLOADS.map((upload, index) => (
              <motion.div
                key={upload.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="border-border/50 bg-card/80 shadow-soft backdrop-blur-xl">
                  <CardContent className="flex items-center gap-4 p-4 sm:p-5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                      <FileText className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">
                        {upload.fileName}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatDateTime(upload.uploadedAt)}
                      </p>
                    </div>
                    <Badge
                      variant={statusVariant[upload.status]}
                      className="capitalize"
                    >
                      {upload.status}
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </PageContainer>
  )
}

export default AdminPage
