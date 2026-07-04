import { useState } from 'react'
import { CheckCircle2, Upload } from 'lucide-react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  PAYMENT_METHODS,
  type PaymentMethod,
} from '@/lib/payments'
import { createPaymentRequest } from '@/services/paymentRequestService'
import { notify } from '@/lib/toast'
import { formatCurrency } from '@/utils/format'
import type { Bill } from '@/types'
import type { PaymentSummary } from '@/lib/payments'

interface PaymentRequestSheetProps {
  open: boolean
  bill: Bill
  summary: PaymentSummary
  onClose: () => void
  onSubmitted: () => Promise<void>
}

export function PaymentRequestSheet({
  open,
  bill,
  summary,
  onClose,
  onSubmitted,
}: PaymentRequestSheetProps) {
  const [amount, setAmount] = useState(summary.balance || summary.finalAmount)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async () => {
    if (amount <= 0) {
      notify.error('Enter a payment amount greater than zero')
      return
    }

    setIsSubmitting(true)
    try {
      await createPaymentRequest(bill.id, {
        amount,
        paymentMethod,
        transactionReference: reference || undefined,
        notes: notes || undefined,
        proofFile,
      })
      setSubmitted(true)
      notify.success('Payment verification requested')
      await onSubmitted()
      setTimeout(() => {
        setSubmitted(false)
        onClose()
      }, 1200)
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <BottomSheet
      open={open}
      title="I Have Paid"
      description={`Remaining balance: ${formatCurrency(summary.balance)}`}
      onClose={onClose}
    >
      {submitted ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-500" />
          <p className="font-medium">Request submitted</p>
          <p className="text-sm text-muted-foreground">
            Admin will verify your payment shortly.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="request-amount">Amount Paid (₹)</Label>
            <Input
              id="request-amount"
              type="number"
              min="0"
              step="0.01"
              value={amount || ''}
              onChange={(event) => setAmount(Number(event.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="request-method">Payment Method</Label>
            <select
              id="request-method"
              value={paymentMethod}
              onChange={(event) =>
                setPaymentMethod(event.target.value as PaymentMethod)
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
            <Label htmlFor="request-reference">Transaction Reference (optional)</Label>
            <Input
              id="request-reference"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder="UPI ref, cheque no., etc."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="request-notes">Notes (optional)</Label>
            <Input
              id="request-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="request-proof">Payment Screenshot (optional)</Label>
            <label
              htmlFor="request-proof"
              className="flex h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 text-sm text-muted-foreground transition-colors hover:bg-muted/40"
            >
              <Upload className="h-5 w-5" />
              {proofFile ? proofFile.name : 'Tap to upload image'}
            </label>
            <input
              id="request-proof"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(event) =>
                setProofFile(event.target.files?.[0] ?? null)
              }
            />
          </div>
          <Button
            type="button"
            className="h-12 w-full rounded-2xl text-base"
            disabled={isSubmitting}
            onClick={() => void handleSubmit()}
          >
            Submit for Verification
          </Button>
        </div>
      )}
    </BottomSheet>
  )
}
