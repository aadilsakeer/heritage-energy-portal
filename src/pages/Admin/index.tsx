import { useCallback, useMemo, useState } from 'react'
import { flushSync } from 'react-dom'
import {
  Archive,
  Copy,
  FileText,
  Trash2,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { AuditTimeline } from '@/components/admin/AuditTimeline'
import { BillReviewForm } from '@/components/admin/BillReviewForm'
import { PaymentSection } from '@/components/admin/PaymentSection'
import { toFormValues } from '@/lib/extractionSchema'

import { EmptyState } from '@/components/cards/EmptyState'
import { ErrorState } from '@/components/cards/ErrorState'
import { LoadingSkeleton } from '@/components/cards/LoadingSkeleton'
import { UploadCard } from '@/components/cards/UploadCard'
import { PageContainer } from '@/components/layout/PageContainer'
import { SectionHeader } from '@/components/layout/SectionHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useProperty } from '@/context/PropertyContext'
import { useAsync } from '@/hooks/useAsync'
import { notify } from '@/lib/toast'
import { billStatusVariant } from '@/lib/billStatus'
import { canRecordPayments, formatBillStatus } from '@/lib/payments'
import type { ReviewFormValues } from '@/lib/extractionSchema'
import {
  archiveBill,
  deleteDraftBill,
  duplicateBill,
  fetchBillById,
  fetchRecentUploads,
  publishBill,
  saveAiExtraction,
  saveReviewedBill,
  uploadMeterReading,
} from '@/services/billService'
import { fetchBillEvents } from '@/services/eventService'
import { fetchBillingConfiguration } from '@/services/propertyService'
import { fetchPayments } from '@/services/paymentService'

import { formatDateTime } from '@/utils/format'
import { toUploadItem } from '@/utils/mappers'

export function AdminPage() {
  const {
    property,
    propertyId,
    isLoading: propertiesLoading,
    error: propertiesError,
    refreshProperties,
  } = useProperty()

  const [activeBillId, setActiveBillId] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)

  const {
    data: uploadRows,
    isLoading: uploadsLoading,
    error: uploadsError,
    reload: reloadUploads,
  } = useAsync(async () => fetchRecentUploads(), [])
  const {
    data: activeBill,
    isLoading: billLoading,
    reload: reloadBill,
  } = useAsync(
    async () => (activeBillId ? fetchBillById(activeBillId) : null),
    [activeBillId],
    Boolean(activeBillId),
  )
  const { data: events, reload: reloadEvents } = useAsync(
    async () => (activeBillId ? fetchBillEvents(activeBillId) : []),
    [activeBillId],
    Boolean(activeBillId),
  )
  const {
    data: config,
    isLoading: configLoading,
    error: configError,
    reload: reloadConfig,
  } = useAsync(
    async () =>
      propertyId ? fetchBillingConfiguration(propertyId) : null,
    [propertyId],
    Boolean(propertyId),
  )
  const {
    data: payments,
    isLoading: paymentsLoading,
    reload: reloadPayments,
  } = useAsync(
    async () => (activeBillId ? fetchPayments(activeBillId) : []),
    [activeBillId],
    Boolean(activeBillId),
  )

  const refreshAll = useCallback(async () => {
    await Promise.all([
      reloadUploads(),
      reloadConfig(),
      reloadBill(),
      reloadEvents(),
      reloadPayments(),
    ])
  }, [reloadUploads, reloadConfig, reloadBill, reloadEvents, reloadPayments])

  const handleUpload = useCallback(
    async (file: File) => {
      if (!propertyId) {
        setUploadError('Select a property before uploading.')
        return
      }

      setIsBusy(true)
      setUploadError(null)
      setProgress(10)
      setProgressLabel('Uploading PDF…')

      try {
        const draft = await uploadMeterReading({ propertyId, file })
        setProgress(45)
        setProgressLabel('Running AI extraction…')

        const { extractBillFields } = await import('@/services/geminiService')
        const extraction = await extractBillFields(file)

        setProgress(75)
        setProgressLabel('Saving draft…')
        const savedBill = await saveAiExtraction(draft.id, extraction)

        flushSync(() => {
          setActiveBillId(savedBill.id)
        })

        setProgress(90)
        setProgressLabel('Loading review…')
        await refreshAll()

        setProgress(100)
        setProgressLabel('Complete')
        notify.success('Bill extracted and saved as draft')
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Upload or AI extraction failed'
        setUploadError(message)
        notify.error(message)
      } finally {
        setIsBusy(false)
      }
    },
    [propertyId, refreshAll],
  )

  const initialValues = useMemo(() => {
    if (!activeBill) return null
    if (activeBill.validatedJson) return toFormValues(activeBill.validatedJson)
    if (activeBill.aiJson) return toFormValues(activeBill.aiJson)
    return toFormValues({
      generation: activeBill.generation,
      import_units: activeBill.importKwh,
      export_units: activeBill.exportKwh,
      fixed_charge: activeBill.fixedCharge,
      security_deposit: activeBill.securityDeposit,
      arrears: activeBill.arrears,
      bill_date: activeBill.billDate,
      due_date: activeBill.dueDate,
      consumer_number: activeBill.consumerNumber,
    })
  }, [activeBill])

  const handleSave = async (values: ReviewFormValues) => {
    if (!activeBillId) return
    setIsSaving(true)
    try {
      await saveReviewedBill(activeBillId, values)
      notify.success('Draft saved')
      await refreshAll()
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async (values: ReviewFormValues) => {
    if (!activeBillId) return
    setIsPublishing(true)
    try {
      await saveReviewedBill(activeBillId, values)
      await publishBill(activeBillId)
      notify.success('Bill published')
      await refreshAll()
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Publish failed')
    } finally {
      setIsPublishing(false)
    }
  }

  const runAction = async (
    action: () => Promise<unknown>,
    successMessage: string,
  ) => {
    try {
      await action()
      notify.success(successMessage)
      await refreshAll()
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Action failed')
    }
  }

  const isPageLoading = propertiesLoading || uploadsLoading || configLoading
  const isReviewLoading =
    Boolean(activeBillId) && (billLoading || configLoading)
  const error = propertiesError ?? uploadsError ?? configError
  const uploads = (uploadRows ?? []).map(toUploadItem)
  const showReview = Boolean(activeBill && initialValues && config)
  const showPayments = Boolean(
    activeBill && (canRecordPayments(activeBill.status) || (payments?.length ?? 0) > 0),
  )

  if (isPageLoading && !activeBillId) {
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
            void reloadConfig()
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
            Upload, extract, review, and publish bills for{' '}
            {property?.label ?? 'a property'}.
          </p>
        </div>

        <UploadCard
          propertyLabel={property?.label}
          isBusy={isBusy}
          progress={progress}
          progressLabel={progressLabel}
          error={uploadError}
          onUpload={handleUpload}
        />

        {activeBillId && isReviewLoading ? (
          <LoadingSkeleton variant="page" />
        ) : null}

        {showReview && activeBill && initialValues && config ? (
          <section className="space-y-4">
            <SectionHeader
              title="Review & Publish"
              description={`${activeBill.pdfFileName ?? 'Draft bill'} · ${formatBillStatus(activeBill.status)}`}
            />
            <BillReviewForm
              key={activeBill.id}
              initial={initialValues}
              original={activeBill.aiJson}
              config={config}
              isSaving={isSaving}
              isPublishing={isPublishing}
              onSave={handleSave}
              onPublish={handlePublish}
            />

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  void runAction(
                    () => archiveBill(activeBill.id),
                    'Bill archived',
                  )
                }
              >
                <Archive className="h-4 w-4" />
                Archive
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  void runAction(async () => {
                    const copy = await duplicateBill(activeBill.id)
                    flushSync(() => {
                      setActiveBillId(copy.id)
                    })
                    await refreshAll()
                  }, 'Bill duplicated')
                }
              >
                <Copy className="h-4 w-4" />
                Duplicate
              </Button>
              {activeBill.status === 'draft' ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    void runAction(async () => {
                      await deleteDraftBill(activeBill.id)
                      setActiveBillId(null)
                      await refreshAll()
                    }, 'Draft deleted')
                  }
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Draft
                </Button>
              ) : null}
            </div>
            <SectionHeader title="Audit Timeline" />
            <AuditTimeline events={events ?? []} />
          </section>
        ) : null}

        {showPayments && activeBill ? (
          <PaymentSection
            bill={activeBill}
            payments={payments ?? []}
            isLoading={paymentsLoading}
            onChange={refreshAll}
          />
        ) : null}

        <section>
          <SectionHeader
            title="Recent Uploads"
            description="Select a bill to review"
          />
          {uploads.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No uploads yet."
              description="Upload a bill to get started."
            />
          ) : (
            <div className="space-y-3">
              {uploads.map((upload, index) => (
                <motion.div
                  key={upload.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.04 }}
                >
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => {
                      flushSync(() => {
                        setActiveBillId(upload.id)
                      })
                      void refreshAll()
                    }}
                  >
                    <Card className="border-border/50 bg-card/80 shadow-soft backdrop-blur-xl transition-shadow hover:shadow-md">
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
                          variant={billStatusVariant[upload.status]}
                          className="capitalize"
                        >
                          {formatBillStatus(upload.status)}
                        </Badge>
                      </CardContent>
                    </Card>
                  </button>
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
