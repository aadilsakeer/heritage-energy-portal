import { useCallback, useState } from 'react'
import { FileText } from 'lucide-react'
import { motion } from 'framer-motion'
import { EmptyState } from '@/components/cards/EmptyState'
import { ErrorState } from '@/components/cards/ErrorState'
import { LoadingSkeleton } from '@/components/cards/LoadingSkeleton'
import { UploadCard } from '@/components/cards/UploadCard'
import { PageContainer } from '@/components/layout/PageContainer'
import { SectionHeader } from '@/components/layout/SectionHeader'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useProperty } from '@/context/PropertyContext'
import { useAsync } from '@/hooks/useAsync'
import {
  fetchRecentUploads,
  uploadMeterReading,
} from '@/services/billService'
import type { BillStatus } from '@/types'
import { formatDateTime } from '@/utils/format'
import { toUploadItem } from '@/utils/mappers'

const statusVariant: Record<BillStatus, 'success' | 'warning' | 'outline'> = {
  published: 'success',
  draft: 'warning',
  archived: 'outline',
}

export function AdminPage() {
  const {
    property,
    propertyId,
    isLoading: propertiesLoading,
    error: propertiesError,
    refreshProperties,
  } = useProperty()

  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const {
    data: uploadRows,
    isLoading: uploadsLoading,
    error: uploadsError,
    reload: reloadUploads,
  } = useAsync(async () => fetchRecentUploads(), [])

  const handleUpload = useCallback(
    async (file: File) => {
      if (!propertyId) {
        setUploadError('Select a property before uploading.')
        return
      }

      setIsUploading(true)
      setUploadError(null)

      try {
        await uploadMeterReading({ propertyId, file })
        await reloadUploads()
      } catch (err) {
        setUploadError(
          err instanceof Error ? err.message : 'Upload failed. Please try again.',
        )
      } finally {
        setIsUploading(false)
      }
    },
    [propertyId, reloadUploads],
  )

  const isLoading = propertiesLoading || uploadsLoading
  const error = propertiesError ?? uploadsError
  const uploads = (uploadRows ?? []).map(toUploadItem)


  if (isLoading) {
    return (
      <PageContainer>
        <LoadingSkeleton variant="page" />
      </PageContainer>
    )
  }

  if (error) {
    return (
      <PageContainer>
        <ErrorState
          message={error}
          onRetry={() => {
            void refreshProperties()
            void reloadUploads()

          }}
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="space-y-6 sm:space-y-8">
        <div>
          <p className="text-sm font-medium text-primary">Admin</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Meter Uploads
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Select a property in the header, upload a PDF, and save draft metadata.
          </p>
        </div>

        <UploadCard
          propertyLabel={property?.label}
          isUploading={isUploading}
          error={uploadError}
          onUpload={handleUpload}
        />

        <section>
          <SectionHeader
            title="Recent Uploads"
            description="Latest meter reading files"
          />
          {uploads.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No uploads yet"
              description="Uploaded PDFs will appear here as draft bills."
            />
          ) : (
            <div className="space-y-3">
              {uploads.map((upload, index) => (
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
          )}
        </section>
      </div>
    </PageContainer>
  )
}

export default AdminPage
