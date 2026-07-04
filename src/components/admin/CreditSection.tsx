import { useState } from 'react'
import { Ban, Plus, Wallet } from 'lucide-react'
import { motion } from 'framer-motion'
import { EmptyState } from '@/components/cards/EmptyState'
import { SectionHeader } from '@/components/layout/SectionHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCreditStatus, getActiveCreditBalance } from '@/lib/credits'
import type { CustomerCredit } from '@/types'
import {
  cancelCredit,
  createManualCredit,
} from '@/services/creditService'
import { notify } from '@/lib/toast'
import { formatCurrency, formatDateTime } from '@/utils/format'

interface CreditSectionProps {
  propertyId: string
  auditBillId: string | null
  credits: CustomerCredit[]
  onChange: () => Promise<void>
}

export function CreditSection({
  propertyId,
  auditBillId,
  credits,
  onChange,
}: CreditSectionProps) {
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('Manual Credit')
  const [isSaving, setIsSaving] = useState(false)

  const activeBalance = getActiveCreditBalance(credits)
  const activeCredits = credits.filter((credit) => credit.status === 'active')
  const usedCredits = credits.filter((credit) => credit.status === 'used')
  const ledgerCredits = credits

  const handleAddManual = async () => {
    if (!auditBillId) {
      notify.error('Select a bill before adding manual credit')
      return
    }
    const value = Number(amount)
    if (value <= 0) {
      notify.error('Enter a credit amount greater than zero')
      return
    }

    setIsSaving(true)
    try {
      await createManualCredit({
        propertyId,
        amount: value,
        reason,
        auditBillId,
      })
      setAmount('')
      notify.success('Manual credit added')
      await onChange()
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Failed to add credit')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = async (creditId: string) => {
    if (!auditBillId) return
    setIsSaving(true)
    try {
      await cancelCredit(creditId, auditBillId)
      notify.success('Credit cancelled')
      await onChange()
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Cancel failed')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="space-y-4">
      <SectionHeader
        title="Customer Credit"
        description="Accounting credits from overpayments and manual adjustments"
      />

      <Card className="border-emerald-500/20 bg-emerald-500/10 shadow-soft">
        <CardContent className="p-5">
          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            Current Credit Balance
          </p>
          <p className="mt-1 text-3xl font-semibold text-emerald-900 dark:text-emerald-100">
            {formatCurrency(activeBalance)}
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/80 shadow-soft">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" aria-hidden="true" />
            <p className="font-medium">Add Manual Credit</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="manual-credit-amount">Amount (₹)</Label>
              <Input
                id="manual-credit-amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manual-credit-reason">Reason</Label>
              <Input
                id="manual-credit-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
            </div>
          </div>
          <Button type="button" disabled={isSaving} onClick={() => void handleAddManual()}>
            Add Manual Credit
          </Button>
        </CardContent>
      </Card>

      <SectionHeader title="Remaining Credits" />
      {activeCredits.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No active credits"
          description="Overpayments and manual credits will appear here."
        />
      ) : (
        <CreditList credits={activeCredits} onCancel={handleCancel} isSaving={isSaving} />
      )}

      <SectionHeader title="Applied Credits" />
      {usedCredits.length === 0 ? (
        <EmptyState title="No applied credits yet" description="Used credits appear after publish." />
      ) : (
        <CreditList credits={usedCredits} />
      )}

      <SectionHeader title="Credit Ledger" />
      {ledgerCredits.length === 0 ? (
        <EmptyState title="No ledger entries" description="All credit activity is tracked here." />
      ) : (
        <CreditList credits={ledgerCredits} onCancel={handleCancel} isSaving={isSaving} showLedger />
      )}
    </section>
  )
}

function CreditList({
  credits,
  onCancel,
  isSaving,
  showLedger,
}: {
  credits: CustomerCredit[]
  onCancel?: (creditId: string) => Promise<void>
  isSaving?: boolean
  showLedger?: boolean
}) {
  return (
    <div className="space-y-3">
      {credits.map((credit, index) => (
        <motion.div
          key={credit.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.04 }}
        >
          <Card
            className={
              credit.status === 'active'
                ? 'border-emerald-500/20 bg-emerald-500/5 shadow-soft'
                : credit.status === 'used'
                  ? 'border-accent/20 bg-accent/5 shadow-soft'
                  : 'border-border/50 bg-muted/20 shadow-soft'
            }
          >
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{formatCurrency(credit.amount)}</p>
                  <Badge variant="outline" className="capitalize">
                    {formatCreditStatus(credit.status)}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{credit.reason}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Remaining {formatCurrency(credit.remainingAmount)} ·{' '}
                  {formatDateTime(credit.createdAt)}
                </p>
                {showLedger && credit.appliedAt ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Applied {formatDateTime(credit.appliedAt)}
                  </p>
                ) : null}
              </div>
              {credit.status === 'active' && onCancel ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isSaving}
                  onClick={() => void onCancel(credit.id)}
                >
                  <Ban className="h-4 w-4" />
                  Cancel
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
