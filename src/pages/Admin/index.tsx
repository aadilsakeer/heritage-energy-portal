import { lazy, Suspense, useCallback, useMemo, useState } from 'react'
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
import { AccountMetricsGrid } from '@/components/cards/AccountMetricsGrid'
import { ChartCard } from '@/components/cards/ChartCard'
import { OutstandingBillsTable } from '@/components/account/OutstandingBillsTable'
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
  fetchBillHistory,
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
import {
  fetchCustomerLedger,
  fetchPropertyAccount,
  fetchAllPropertyAccounts,
} from '@/services/accountService'
import { buildAdminTrendCharts } from '@/services/analyticsService'
import { closeBillingMonth, reopenBill } from '@/services/closingService'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/constants'
import { formatCurrency, formatPercent } from '@/utils/format'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { fetchPendingPaymentRequests } from '@/services/paymentRequestService'
import { toUploadItem } from '@/utils/mappers'

const MonthlyBarChart = lazy(() =>
  import('@/components/charts/MonthlyBarChart').then((module) => ({
    default: module.MonthlyBarChart,
  })),
)

const MonthlyLineChart = lazy(() =>
  import('@/components/charts/MonthlyLineChart').then((module) => ({
    default: module.MonthlyLineChart,
  })),
)

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
    data: propertyAccount,
    reload: reloadPropertyAccount,
  } = useAsync(
    async () => (propertyId ? fetchPropertyAccount(propertyId) : null),
    [propertyId],
    Boolean(propertyId),
  )

  const {
    data: propertyOverview,
    reload: reloadPropertyOverview,
  } = useAsync(async () => fetchAllPropertyAccounts(properties), [properties])

  const {
    data: adminTrends,
    reload: reloadAdminTrends,
  } = useAsync(
    async () => {
      if (!propertyId) return null
      const [bills, ledger] = await Promise.all([
        fetchBillHistory(propertyId),
        fetchCustomerLedger(propertyId),
      ])
      return buildAdminTrendCharts(bills, ledger.entries)
    },
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
      reloadPropertyAccount(),
      reloadPropertyOverview(),
      reloadAdminTrends(),
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
    reloadPropertyAccount,
    reloadPropertyOverview,
    reloadAdminTrends,
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
      <div className="page-stack">
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

        {propertyAccount ? (
          <AccountMetricsGrid
            account={propertyAccount}
            title="Collection Dashboard"
            description={`Outstanding and collections for ${property?.label ?? 'property'}`}
            variant="admin"
          />
        ) : null}

        {adminTrends &&
        (adminTrends.paymentTrend.length > 0 ||
          adminTrends.collectionTrend.length > 0) ? (
          <section className="section-stack" aria-label="Enterprise trends">
            <SectionHeader
              title="Trends"
              description="Collection, outstanding, payments, and solar savings"
            />
            <div className="grid gap-4 lg:grid-cols-2">
              <ChartCard title="Collection %" description="Cumulative collected vs billed">
                <Suspense fallback={<LoadingSkeleton variant="chart" />}>
                  <MonthlyLineChart
                    data={adminTrends.collectionTrend}
                    color="var(--color-primary)"
                    unit="%"
                  />
                </Suspense>
              </ChartCard>
              <ChartCard
                title="Outstanding Trend"
                description="Cumulative billed less payments"
              >
                <Suspense fallback={<LoadingSkeleton variant="chart" />}>
                  <MonthlyLineChart
                    data={adminTrends.outstandingTrend}
                    color="var(--color-accent)"
                    unit="₹"
                  />
                </Suspense>
              </ChartCard>
              <ChartCard title="Payment Trend" description="Payments received by month">
                <Suspense fallback={<LoadingSkeleton variant="chart" />}>
                  <MonthlyBarChart
                    data={adminTrends.paymentTrend}
                    color="var(--color-chart-3)"
                    unit="₹"
                  />
                </Suspense>
              </ChartCard>
              <ChartCard title="Solar Savings" description="Discount applied by month">
                <Suspense fallback={<LoadingSkeleton variant="chart" />}>
                  <MonthlyBarChart
                    data={adminTrends.solarSavings}
                    unit="₹"
                  />
                </Suspense>
              </ChartCard>
            </div>
          </section>
        ) : null}

        {propertyOverview && propertyOverview.length > 0 ? (
          <section className="space-y-3">
            <SectionHeader
              title="Property Overview"
              description="All properties at a glance"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {propertyOverview.map(({ property: item, account }) => (
                    <Card key={item.id} className="surface-card transition-shadow duration-200 hover:shadow-elevated">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-heading">{item.label}</p>
                        <p className="text-caption mt-1">
                          {item.consumerNumber ?? item.slug}
                        </p>
                      </div>
                      <Badge
                        className={
                          account.collectionStatus === 'Critical'
                            ? 'border-0 bg-red-600/15 text-red-800 dark:text-red-200'
                            : account.collectionStatus === 'Overdue'
                              ? 'border-0 bg-red-500/12 text-red-700 dark:text-red-300'
                              : account.collectionStatus === 'Clear'
                                ? 'border-0 bg-emerald-500/12 text-emerald-800 dark:text-emerald-300'
                                : 'border-0 bg-amber-500/12 text-amber-800 dark:text-amber-300'
                        }
                      >
                        {account.collectionStatus}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-muted/30 px-3 py-2.5">
                        <p className="text-caption">Current Bill</p>
                        <p className="mt-1 font-semibold tabular-nums">
                          {formatCurrency(account.currentBillAmount)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-muted/30 px-3 py-2.5">
                        <p className="text-caption">Outstanding</p>
                        <p className="mt-1 font-semibold tabular-nums">
                          {formatCurrency(account.outstanding)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-muted/30 px-3 py-2.5">
                        <p className="text-caption">Last Payment</p>
                        <p className="mt-1 font-semibold tabular-nums">
                          {account.lastPayment
                            ? formatCurrency(account.lastPayment.amount)
                            : '—'}
                        </p>
                      </div>
                      <div className="rounded-xl bg-muted/30 px-3 py-2.5">
                        <p className="text-caption">Credits</p>
                        <p className="mt-1 font-semibold tabular-nums">
                          {formatCurrency(account.credits)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-muted/30 px-3 py-2.5">
                        <p className="text-caption">Collection %</p>
                        <p className="mt-1 font-semibold tabular-nums">
                          {formatPercent(account.collectionPercent)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button asChild variant="outline" size="sm" className="flex-1">
                        <Link
                          to={ROUTES.account}
                          onClick={() => setPropertyId(item.id)}
                        >
                          Account
                        </Link>
                      </Button>
                      <Button asChild variant="secondary" size="sm" className="flex-1">
                        <Link
                          to={ROUTES.bill}
                          onClick={() => setPropertyId(item.id)}
                        >
                          View Bill
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ) : null}

        {propertyAccount && propertyAccount.unpaidBills.length > 0 ? (
          <section className="space-y-3">
            <SectionHeader title="Outstanding Bills" />
            <OutstandingBillsTable rows={propertyAccount.unpaidBills} />
          </section>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to={ROUTES.settings}>Settings</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to={ROUTES.account}>Property Account</Link>
          </Button>
          {activeBill?.isLocked ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                void reopenBill(activeBill.id)
                  .then(() => {
                    notify.success('Bill reopened')
                    void refreshAll()
                  })
                  .catch((err: unknown) =>
                    notify.error(
                      err instanceof Error ? err.message : 'Reopen failed',
                    ),
                  )
              }}
            >
              Reopen Locked Bill
            </Button>
          ) : activeBill ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                void closeBillingMonth(
                  activeBill.propertyId,
                  activeBill.billingMonth,
                )
                  .then(() => {
                    notify.success('Month closed')
                    void refreshAll()
                  })
                  .catch((err: unknown) =>
                    notify.error(
                      err instanceof Error ? err.message : 'Close failed',
                    ),
                  )
              }}
            >
              Close Bill Month
            </Button>
          ) : null}
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
