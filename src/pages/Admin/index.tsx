import { useCallback, useMemo, useState } from 'react'
import { flushSync } from 'react-dom'
import {
  Archive,
  Copy,
  FileText,
  Trash2,
} from 'lucide-react'
import { AuditTimeline } from '@/components/admin/AuditTimeline'
import { BillReviewForm } from '@/components/admin/BillReviewForm'
import { CreditSection } from '@/components/admin/CreditSection'
import { BrandLogo } from '@/components/layout/BrandLogo'
import { RecentUploadCard } from '@/components/admin/RecentUploadCard'
import { UploadSuccessCard } from '@/components/admin/UploadSuccessCard'
import { PaymentRequestsSection } from '@/components/admin/PaymentRequestsSection'
import { PaymentSection } from '@/components/admin/PaymentSection'
import { toFormValues } from '@/lib/extractionSchema'

import { EmptyState } from '@/components/cards/EmptyState'
import { ErrorState } from '@/components/cards/ErrorState'
import { LoadingSkeleton } from '@/components/cards/LoadingSkeleton'
import { UploadCard } from '@/components/cards/UploadCard'
import { PageContainer } from '@/components/layout/PageContainer'
import { SectionHeader } from '@/components/layout/SectionHeader'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useNotifications } from '@/context/NotificationContext'
import { useRefresh } from '@/context/RefreshContext'
import { useProperty } from '@/context/PropertyContext'
import { resolvePropertyFromConsumerNumber } from '@/lib/propertyDetection'
import { useAsync } from '@/hooks/useAsync'
import { notify } from '@/lib/toast'
import { canRecordPayments, formatBillStatus } from '@/lib/payments'
import type { ReviewFormValues } from '@/lib/extractionSchema'
import type { Bill, Property } from '@/types'
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
import { fetchCreditsForProperty } from '@/services/creditService'
import { fetchPendingPaymentRequests } from '@/services/paymentRequestService'
import { toUploadItem } from '@/utils/mappers'

export function AdminPage() {
  const {
    property,
    propertyId,
    properties,
    setPropertyId,
    isLoading: propertiesLoading,
    error: propertiesError,
    refreshProperties,
  } = useProperty()

  const [activeBillId, setActiveBillId] = useState<string | null>(null)
  const [lastUpload, setLastUpload] = useState<{
    property: Property
    bill: Bill
  } | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishValues, setPublishValues] = useState<ReviewFormValues | null>(null)
  const { refresh: refreshNotifications } = useNotifications()
  const { triggerRefresh } = useRefresh()

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

  const {
    data: credits,
    reload: reloadCredits,
  } = useAsync(
    async () => (propertyId ? fetchCreditsForProperty(propertyId) : []),
    [propertyId],
    Boolean(propertyId),
  )

  const {
    data: paymentRequests,
    reload: reloadPaymentRequests,
  } = useAsync(async () => fetchPendingPaymentRequests(), [])

  const refreshAll = useCallback(async () => {
    await Promise.all([
      reloadUploads(),
      reloadConfig(),
      reloadBill(),
      reloadEvents(),
      reloadPayments(),
      reloadCredits(),
      reloadPaymentRequests(),
      refreshNotifications(),
    ])
    triggerRefresh()
  }, [
    reloadUploads,
    reloadConfig,
    reloadBill,
    reloadEvents,
    reloadPayments,
    reloadCredits,
    reloadPaymentRequests,
    refreshNotifications,
    triggerRefresh,
  ])

  const handleUpload = useCallback(
    async (file: File) => {
      setIsBusy(true)
      setUploadError(null)
      setProgress(5)
      setProgressLabel('Running AI extraction…')

      try {
        const { extractBillFields } = await import('@/services/geminiService')
        const extraction = await extractBillFields(file)

        setProgress(25)
        setProgressLabel('Detecting property…')

        let resolvedProperty = resolvePropertyFromConsumerNumber(
          extraction.consumer_number,
          properties,
        )

        if (!resolvedProperty && propertyId) {
          resolvedProperty =
            properties.find((item) => item.id === propertyId) ?? null
        }

        if (!resolvedProperty) {
          throw new Error(
            'Unknown property — select Home or Heritage Building manually, then upload again.',
          )
        }

        flushSync(() => {
          setPropertyId(resolvedProperty.id)
        })

        setProgress(40)
        setProgressLabel(`Uploading for ${resolvedProperty.label}…`)

        const draft = await uploadMeterReading({
          propertyId: resolvedProperty.id,
          file,
        })

        setProgress(75)
        setProgressLabel('Saving draft…')
        const savedBill = await saveAiExtraction(draft.id, extraction)

        flushSync(() => {
          setActiveBillId(savedBill.id)
        })

        setLastUpload({ property: resolvedProperty, bill: savedBill })

        setProgress(90)
        setProgressLabel('Refreshing…')
        await refreshAll()

        setProgress(100)
        setProgressLabel('Complete')
        notify.success(`Bill uploaded for ${resolvedProperty.label}`)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Upload or AI extraction failed'
        setUploadError(message)
        notify.error(message)
      } finally {
        setIsBusy(false)
      }
    },
    [properties, propertyId, setPropertyId, refreshAll],
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
    setPublishValues(values)
  }

  const confirmPublish = async () => {
    if (!activeBillId || !publishValues) return
    setIsPublishing(true)
    try {
      await saveReviewedBill(activeBillId, publishValues)
      await publishBill(activeBillId)
      notify.success('Bill published')
      setPublishValues(null)
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
  const propertyMap = useMemo(
    () => new Map(properties.map((item) => [item.id, item])),
    [properties],
  )
  const uploads = (uploadRows ?? []).map((bill) =>
    toUploadItem(bill, propertyMap.get(bill.propertyId)),
  )
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
          <BrandLogo variant="wide" imageClassName="max-h-14 sm:max-h-16" />
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Meter Uploads
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload, extract, review, and publish bills for{' '}
            {property?.label ?? 'a property'}.
          </p>
        </div>

        <PaymentRequestsSection
          requests={paymentRequests ?? []}
          onChange={refreshAll}
        />

        <UploadCard
          propertyLabel={property?.label}
          isBusy={isBusy}
          progress={progress}
          progressLabel={progressLabel}
          error={uploadError}
          onUpload={handleUpload}
        />

        {lastUpload ? (
          <UploadSuccessCard
            property={lastUpload.property}
            billingMonth={lastUpload.bill.billingMonth}
            consumerNumber={lastUpload.bill.consumerNumber}
            status={lastUpload.bill.status}
            uploadedAt={lastUpload.bill.createdAt}
          />
        ) : null}

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

        {propertyId ? (
          <CreditSection
            propertyId={propertyId}
            auditBillId={activeBillId}
            credits={credits ?? []}
            onChange={refreshAll}
          />
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
              branded
              icon={FileText}
              title="No uploads yet"
              description="Upload a bill to get started."
            />
          ) : (
            <div className="space-y-3">
              {uploads.map((upload, index) => (
                <RecentUploadCard
                  key={upload.id}
                  upload={upload}
                  index={index}
                  onSelect={() => {
                    flushSync(() => {
                      setActiveBillId(upload.id)
                      setPropertyId(upload.propertyId)
                    })
                    void refreshAll()
                  }}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={Boolean(publishValues)}
        title="Publish bill?"
        description="Tenants will be notified and any active credits will be applied to this bill. Previous active bills for the same month will be archived."
        confirmLabel="Publish Bill"
        isLoading={isPublishing}
        onCancel={() => setPublishValues(null)}
        onConfirm={() => void confirmPublish()}
      />
    </PageContainer>
  )
}

export default AdminPage
