import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { EmptyState } from '@/components/cards/EmptyState'
import { ErrorState } from '@/components/cards/ErrorState'
import { LoadingSkeleton } from '@/components/cards/LoadingSkeleton'
import { PageContainer } from '@/components/layout/PageContainer'
import { SectionHeader } from '@/components/layout/SectionHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useProperty } from '@/context/PropertyContext'
import { useRefresh } from '@/context/RefreshContext'
import { useAsync } from '@/hooks/useAsync'
import { pagePanel } from '@/lib/motion'
import { notify } from '@/lib/toast'
import { exportPropertyBackup } from '@/services/backupService'
import {
  closeBillingMonth,
  lockBill,
  reopenBill,
} from '@/services/closingService'
import {
  fetchBillingConfiguration,
  updateBillingConfiguration,
  updatePropertyConsumerNumber,
} from '@/services/propertyService'
import {
  DEFAULT_PORTAL_SETTINGS,
  fetchPortalSettings,
  savePortalSettings,
  type PortalSettings,
} from '@/services/settingsService'
import { fetchLatestPublishedBill } from '@/services/billService'
import { useTheme } from 'next-themes'
import { Settings as SettingsIcon } from 'lucide-react'

export function SettingsPage() {
  const {
    property,
    propertyId,
    properties,
    isLoading: propertiesLoading,
    error: propertiesError,
    refreshProperties,
  } = useProperty()
  const { triggerRefresh } = useRefresh()
  const { setTheme } = useTheme()
  const [draftSettings, setDraftSettings] = useState<PortalSettings | null>(null)
  const [draftRate, setDraftRate] = useState<number | null>(null)
  const [draftDiscount, setDraftDiscount] = useState<number | null>(null)
  const [draftFixed, setDraftFixed] = useState<number | null>(null)
  const [draftConsumer, setDraftConsumer] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const settingsQuery = useAsync(async () => fetchPortalSettings(), [])
  const configQuery = useAsync(
    async () =>
      propertyId ? fetchBillingConfiguration(propertyId) : null,
    [propertyId],
    Boolean(propertyId),
  )
  const latestBillQuery = useAsync(
    async () =>
      propertyId ? fetchLatestPublishedBill(propertyId) : null,
    [propertyId],
    Boolean(propertyId),
  )

  const settings = draftSettings ?? settingsQuery.data ?? DEFAULT_PORTAL_SETTINGS
  const rate = draftRate ?? configQuery.data?.rate ?? 6.25
  const discount = draftDiscount ?? configQuery.data?.discountPercent ?? 5
  const fixedCharge = draftFixed ?? configQuery.data?.fixedCharge ?? 0
  const consumerNumber =
    draftConsumer ?? property?.consumerNumber ?? ''

  const isLoading =
    propertiesLoading ||
    (settingsQuery.isLoading && !settingsQuery.isRefreshing)

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingSkeleton variant="page" />
      </PageContainer>
    )
  }

  if (propertiesError ?? settingsQuery.error) {
    return (
      <PageContainer>
        <ErrorState
          message={propertiesError ?? settingsQuery.error ?? 'Failed to load'}
          onRetry={() => {
            void refreshProperties()
            void settingsQuery.reload()
          }}
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <AnimatePresence mode="wait">
        <motion.div {...pagePanel} className="page-stack">
          <header>
            <p className="text-sm font-medium text-primary">Settings</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              Portal Configuration
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Company, billing, reminders, theme, and backup
            </p>
          </header>

          <section className="space-y-3">
            <SectionHeader
              title="Company"
              description="Appears on invoices, statements, and downloads"
            />
            <Card className="surface-card">
              <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={settings.companyName}
                    onChange={(e) =>
                      setDraftSettings({
                        ...settings,
                        companyName: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logoPath">Logo Path</Label>
                  <Input
                    id="logoPath"
                    value={settings.logoPath}
                    onChange={(e) =>
                      setDraftSettings({
                        ...settings,
                        logoPath: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="companyAddress">Address</Label>
                  <Input
                    id="companyAddress"
                    value={settings.companyAddress}
                    onChange={(e) =>
                      setDraftSettings({
                        ...settings,
                        companyAddress: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyPhone">Phone</Label>
                  <Input
                    id="companyPhone"
                    type="tel"
                    value={settings.companyPhone}
                    onChange={(e) =>
                      setDraftSettings({
                        ...settings,
                        companyPhone: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyEmail">Email</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    value={settings.companyEmail}
                    onChange={(e) =>
                      setDraftSettings({
                        ...settings,
                        companyEmail: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="paymentInstructions">
                    Payment Instructions
                  </Label>
                  <Input
                    id="paymentInstructions"
                    value={settings.paymentInstructions}
                    onChange={(e) =>
                      setDraftSettings({
                        ...settings,
                        paymentInstructions: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="termsAndConditions">
                    Terms &amp; Conditions
                  </Label>
                  <Input
                    id="termsAndConditions"
                    value={settings.termsAndConditions}
                    onChange={(e) =>
                      setDraftSettings({
                        ...settings,
                        termsAndConditions: e.target.value,
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-3">
            <SectionHeader
              title="Billing"
              description={property?.label ?? 'Select a property'}
            />
            {!property ? (
              <EmptyState
                icon={SettingsIcon}
                title="No property selected"
                description="Switch property from the header to edit rates."
              />
            ) : (
              <Card className="surface-card">
                <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="consumer">Consumer Number</Label>
                    <Input
                      id="consumer"
                      value={consumerNumber}
                      onChange={(e) => setDraftConsumer(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rate">Billing Rate</Label>
                    <Input
                      id="rate"
                      type="number"
                      step="0.01"
                      value={rate}
                      onChange={(e) => setDraftRate(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discount">Discount %</Label>
                    <Input
                      id="discount"
                      type="number"
                      step="0.1"
                      value={discount}
                      onChange={(e) => setDraftDiscount(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fixed">Fixed Charge</Label>
                    <Input
                      id="fixed"
                      type="number"
                      step="0.01"
                      value={fixedCharge}
                      onChange={(e) => setDraftFixed(Number(e.target.value))}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </section>

          <section className="space-y-3">
            <SectionHeader title="Due & Reminders" />
            <Card className="surface-card">
              <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dueDays">Due Days</Label>
                  <Input
                    id="dueDays"
                    type="number"
                    value={settings.dueDays}
                    onChange={(e) =>
                      setDraftSettings({
                        ...settings,
                        dueDays: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="criticalDays">Critical Overdue Days</Label>
                  <Input
                    id="criticalDays"
                    type="number"
                    value={settings.criticalOverdueDays}
                    onChange={(e) =>
                      setDraftSettings({
                        ...settings,
                        criticalOverdueDays: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="beforeDue">Reminder Days Before</Label>
                  <Input
                    id="beforeDue"
                    type="number"
                    value={settings.reminderDaysBefore}
                    onChange={(e) =>
                      setDraftSettings({
                        ...settings,
                        reminderDaysBefore: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retention">Retention Period (days)</Label>
                  <Input
                    id="retention"
                    type="number"
                    value={settings.retentionDays}
                    onChange={(e) =>
                      setDraftSettings({
                        ...settings,
                        retentionDays: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-3">
            <SectionHeader title="Theme" />
            <div className="flex flex-wrap gap-2">
              {(['system', 'light', 'dark'] as const).map((theme) => (
                <Button
                  key={theme}
                  type="button"
                  variant={
                    settings.themeDefault === theme ? 'default' : 'outline'
                  }
                  onClick={() => {
                    setDraftSettings({ ...settings, themeDefault: theme })
                    setTheme(theme)
                  }}
                >
                  {theme}
                </Button>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <SectionHeader
              title="Monthly Closing"
              description="Lock published bills for the current bill month"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={!latestBillQuery.data}
                onClick={() => {
                  if (!propertyId || !latestBillQuery.data) return
                  void closeBillingMonth(
                    propertyId,
                    latestBillQuery.data.billingMonth,
                  )
                    .then(() => {
                      notify.success('Month closed / bills locked')
                      triggerRefresh()
                      void latestBillQuery.reload()
                    })
                    .catch((err: unknown) =>
                      notify.error(
                        err instanceof Error ? err.message : 'Close failed',
                      ),
                    )
                }}
              >
                Close Current Month
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!latestBillQuery.data}
                onClick={() => {
                  if (!latestBillQuery.data) return
                  void lockBill(latestBillQuery.data.id)
                    .then(() => {
                      notify.success('Bill locked')
                      triggerRefresh()
                      void latestBillQuery.reload()
                    })
                    .catch((err: unknown) =>
                      notify.error(
                        err instanceof Error ? err.message : 'Lock failed',
                      ),
                    )
                }}
              >
                Lock Current Bill
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={!latestBillQuery.data?.isLocked}
                onClick={() => {
                  if (!latestBillQuery.data) return
                  void reopenBill(latestBillQuery.data.id)
                    .then(() => {
                      notify.success('Bill reopened')
                      triggerRefresh()
                      void latestBillQuery.reload()
                    })
                    .catch((err: unknown) =>
                      notify.error(
                        err instanceof Error ? err.message : 'Reopen failed',
                      ),
                    )
                }}
              >
                Reopen Current Bill
              </Button>
            </div>
          </section>

          <section className="space-y-3">
            <SectionHeader title="Backup" />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={!property}
                onClick={() => {
                  if (!property) return
                  void exportPropertyBackup(property, 'json')
                    .then(() => notify.success('JSON backup downloaded'))
                    .catch((err: unknown) =>
                      notify.error(
                        err instanceof Error ? err.message : 'Backup failed',
                      ),
                    )
                }}
              >
                Export JSON
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!property}
                onClick={() => {
                  if (!property) return
                  void exportPropertyBackup(property, 'csv')
                    .then(() => notify.success('CSV backup downloaded'))
                    .catch((err: unknown) =>
                      notify.error(
                        err instanceof Error ? err.message : 'Backup failed',
                      ),
                    )
                }}
              >
                Export CSV
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Includes bills, payments, credits, ledger, adjustments, reminders,
              and audit events for {property?.label ?? 'the selected property'}.
            </p>
          </section>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              loading={saving}
              onClick={async () => {
                setSaving(true)
                try {
                  await savePortalSettings(settings)
                  if (propertyId) {
                    await updateBillingConfiguration(propertyId, {
                      rate,
                      discountPercent: discount,
                      fixedCharge,
                    })
                    await updatePropertyConsumerNumber(
                      propertyId,
                      consumerNumber,
                    )
                    await refreshProperties()
                    void configQuery.reload()
                  }
                  setDraftSettings(null)
                  setDraftRate(null)
                  setDraftDiscount(null)
                  setDraftFixed(null)
                  setDraftConsumer(null)
                  notify.success('Settings saved')
                  triggerRefresh()
                } catch (err) {
                  notify.error(
                    err instanceof Error ? err.message : 'Save failed',
                  )
                } finally {
                  setSaving(false)
                }
              }}
            >
              Save Settings
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Properties configured: {properties.length}
          </p>
        </motion.div>
      </AnimatePresence>
    </PageContainer>
  )
}

export default SettingsPage
