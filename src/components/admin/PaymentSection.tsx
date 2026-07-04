import { useMemo, useState } from 'react'
import { Pencil, Plus, Trash2, Wallet } from 'lucide-react'
import { motion } from 'framer-motion'
import { EmptyState } from '@/components/cards/EmptyState'
import { SectionHeader } from '@/components/layout/SectionHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  canRecordPayments,
  computePaymentSummary,
  formatBillStatus,
  formatPaymentMethod,
  PAYMENT_METHODS,
  type PaymentMethod,
} from '@/lib/payments'
import type { Bill, Payment } from '@/types'
import {
  createPayment,
  deletePayment,
  updatePayment,
  type PaymentInput,
} from '@/services/paymentService'
import { notify } from '@/lib/toast'
import { formatCurrency, formatDate } from '@/utils/format'
import { billStatusVariant } from '@/lib/billStatus'

interface PaymentSectionProps {
  bill: Bill
  payments: Payment[]
  isLoading?: boolean
  onChange: () => Promise<void>
}

const emptyForm = (): PaymentInput => ({
  amount: 0,
  paymentDate: new Date().toISOString().slice(0, 10),
  paymentMethod: 'bank_transfer',
  reference: '',
  notes: '',
})

export function PaymentSection({
  bill,
  payments,
  isLoading,
  onChange,
}: PaymentSectionProps) {
  const [form, setForm] = useState<PaymentInput>(emptyForm())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const summary = useMemo(
    () => computePaymentSummary(bill, payments),
    [bill, payments],
  )

  const canManage = canRecordPayments(bill.status)

  const resetForm = () => {
    setForm(emptyForm())
    setEditingId(null)
  }

  const handleSubmit = async () => {
    if (form.amount <= 0) {
      notify.error('Enter a payment amount greater than zero')
      return
    }

    setIsSaving(true)
    try {
      if (editingId) {
        await updatePayment(editingId, form)
        notify.success('Payment updated')
      } else {
        await createPayment(bill.id, form)
        notify.success('Payment recorded')
      }
      resetForm()
      await onChange()
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Payment save failed')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = (payment: Payment) => {
    setEditingId(payment.id)
    setForm({
      amount: payment.amount,
      paymentDate: payment.paymentDate,
      paymentMethod: payment.paymentMethod as PaymentMethod,
      reference: payment.reference ?? '',
      notes: payment.notes ?? '',
    })
  }

  const handleDelete = async (paymentId: string) => {
    setIsSaving(true)
    try {
      await deletePayment(paymentId)
      notify.success('Payment deleted')
      if (editingId === paymentId) resetForm()
      await onChange()
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="space-y-4">
      <SectionHeader
        title="Payments"
        description="Record partial or full payments against this bill"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card className="border-border/50 bg-card/80 shadow-soft">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Bill Amount</p>
            <p className="mt-1 text-xl font-semibold">
              {formatCurrency(summary.billAmount)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-accent/20 bg-accent/5 shadow-soft">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Credit Applied</p>
            <p className="mt-1 text-xl font-semibold text-accent">
              {formatCurrency(summary.creditApplied)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80 shadow-soft">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Final Amount</p>
            <p className="mt-1 text-xl font-semibold">
              {formatCurrency(summary.finalAmount)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80 shadow-soft">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Paid</p>
            <p className="mt-1 text-xl font-semibold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(summary.totalPaid)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80 shadow-soft">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Remaining</p>
            <p className="mt-1 text-xl font-semibold">
              {formatCurrency(summary.balance)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80 shadow-soft">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Status</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant={billStatusVariant[bill.status]} className="capitalize">
                {formatBillStatus(bill.status)}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {summary.paymentPercentage.toFixed(0)}% paid
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {canManage ? (
        <Card className="border-border/50 bg-card/80 shadow-soft">
          <CardContent className="space-y-4 p-4 sm:p-5">
            <div className="flex items-center gap-2">
              {editingId ? (
                <Pencil className="h-4 w-4 text-primary" aria-hidden="true" />
              ) : (
                <Plus className="h-4 w-4 text-primary" aria-hidden="true" />
              )}
              <p className="font-medium">
                {editingId ? 'Edit Payment' : 'Record Payment'}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="payment-amount">Amount (₹)</Label>
                <Input
                  id="payment-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount || ''}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      amount: Number(event.target.value),
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-date">Payment Date</Label>
                <Input
                  id="payment-date"
                  type="date"
                  value={form.paymentDate}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      paymentDate: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-method">Method</Label>
                <select
                  id="payment-method"
                  value={form.paymentMethod}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      paymentMethod: event.target.value as PaymentMethod,
                    }))
                  }
                  className="flex h-11 w-full rounded-2xl border border-input bg-background px-3 text-sm shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-reference">Reference</Label>
                <Input
                  id="payment-reference"
                  value={form.reference ?? ''}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      reference: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="payment-notes">Notes</Label>
                <Input
                  id="payment-notes"
                  value={form.notes ?? ''}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" disabled={isSaving} onClick={() => void handleSubmit()}>
                {editingId ? 'Update Payment' : 'Add Payment'}
              </Button>
              {editingId ? (
                <Button type="button" variant="ghost" onClick={resetForm}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading payments…</p>
      ) : payments.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No payments recorded"
          description="Partial payments will appear here once added."
        />
      ) : (
        <div className="space-y-3">
          {payments.map((payment, index) => (
            <motion.div
              key={payment.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <Card className="border-border/50 bg-card/80 shadow-soft">
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{formatCurrency(payment.amount)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatDate(payment.paymentDate)} ·{' '}
                      {formatPaymentMethod(payment.paymentMethod)}
                      {payment.reference ? ` · ${payment.reference}` : ''}
                    </p>
                    {payment.notes ? (
                      <p className="mt-1 text-sm text-muted-foreground">{payment.notes}</p>
                    ) : null}
                  </div>
                  {canManage ? (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(payment)}
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => void handleDelete(payment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  )
}
