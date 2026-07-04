import { useEffect, useState } from 'react'
import { Check, ExternalLink, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/cards/EmptyState'
import { SectionHeader } from '@/components/layout/SectionHeader'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ROUTES } from '@/constants'
import { formatPaymentMethod } from '@/lib/payments'
import {
  approvePaymentRequest,
  getPaymentProofUrl,
  rejectPaymentRequest,
} from '@/services/paymentRequestService'
import { fetchBillById } from '@/services/billService'
import { useProperty } from '@/context/PropertyContext'
import { useNotifications } from '@/context/NotificationContext'
import { notify } from '@/lib/toast'
import type { PaymentRequest } from '@/types'
import { formatCurrency, formatDateTime, formatMonthLabel } from '@/utils/format'

interface PaymentRequestsSectionProps {
  requests: PaymentRequest[]
  onChange: () => Promise<void>
}

export function PaymentRequestsSection({
  requests,
  onChange,
}: PaymentRequestsSectionProps) {
  const { properties } = useProperty()
  const { refresh: refreshNotifications } = useNotifications()
  const [rejectRequest, setRejectRequest] = useState<PaymentRequest | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [isBusy, setIsBusy] = useState(false)

  const handleApprove = async (requestId: string) => {
    setIsBusy(true)
    try {
      await approvePaymentRequest(requestId)
      notify.success('Payment approved and recorded')
      await onChange()
      await refreshNotifications()
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Approval failed')
    } finally {
      setIsBusy(false)
    }
  }

  const handleReject = async () => {
    if (!rejectRequest) return
    setIsBusy(true)
    try {
      await rejectPaymentRequest(rejectRequest.id, rejectReason)
      notify.success('Payment request rejected')
      setRejectRequest(null)
      setRejectReason('')
      await onChange()
      await refreshNotifications()
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Rejection failed')
    } finally {
      setIsBusy(false)
    }
  }

  const openProof = async (proofPath: string) => {
    try {
      const url = await getPaymentProofUrl(proofPath)
      if (url) window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Could not open proof')
    }
  }

  return (
    <section className="space-y-4">
      <SectionHeader
        title="Payment Requests"
        description={`${requests.length} pending verification`}
      />

      {requests.length === 0 ? (
        <EmptyState
          title="No pending requests"
          description="Tenant payment verification requests will appear here."
        />
      ) : (
        <div className="space-y-3">
          {requests.map((request, index) => {
            const property = properties.find((item) => item.id === request.propertyId)
            return (
              <RequestCard
                key={request.id}
                request={request}
                propertyLabel={property?.label ?? 'Property'}
                index={index}
                isBusy={isBusy}
                onApprove={() => void handleApprove(request.id)}
                onReject={() => setRejectRequest(request)}
                onOpenProof={() => void openProof(request.proofUrl!)}
              />
            )
          })}
        </div>
      )}

      <BottomSheet
        open={Boolean(rejectRequest)}
        title="Reject payment request"
        description="The tenant will see this reason."
        onClose={() => {
          setRejectRequest(null)
          setRejectReason('')
        }}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Rejection reason</Label>
            <Input
              id="reject-reason"
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              placeholder="Explain why this payment could not be verified"
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            className="w-full"
            disabled={isBusy || !rejectReason.trim()}
            onClick={() => void handleReject()}
          >
            Confirm Rejection
          </Button>
        </div>
      </BottomSheet>
    </section>
  )
}

function RequestCard({
  request,
  propertyLabel,
  index,
  isBusy,
  onApprove,
  onReject,
  onOpenProof,
}: {
  request: PaymentRequest
  propertyLabel: string
  index: number
  isBusy: boolean
  onApprove: () => void
  onReject: () => void
  onOpenProof: () => void
}) {
  const [billMonth, setBillMonth] = useState('…')

  useEffect(() => {
    void fetchBillById(request.billId).then((bill) => {
      if (bill) setBillMonth(formatMonthLabel(bill.billingMonth))
    })
  }, [request.billId])

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Card className="border-orange-500/20 bg-card/80 shadow-soft backdrop-blur-xl">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold">{propertyLabel}</p>
              <p className="text-sm text-muted-foreground">{billMonth}</p>
            </div>
            <Badge variant="warning">Pending</Badge>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Info label="Amount" value={formatCurrency(request.amount)} />
            <Info
              label="Method"
              value={formatPaymentMethod(request.paymentMethod)}
            />
            <Info
              label="Reference"
              value={request.transactionReference ?? '—'}
            />
            <Info label="Requested" value={formatDateTime(request.requestedAt)} />
          </div>

          {request.notes ? (
            <p className="text-sm text-muted-foreground">{request.notes}</p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={isBusy} onClick={onApprove}>
              <Check className="h-4 w-4" />
              Approve
            </Button>
            <Button type="button" variant="outline" disabled={isBusy} onClick={onReject}>
              <X className="h-4 w-4" />
              Reject
            </Button>
            {request.proofUrl ? (
              <Button type="button" variant="ghost" onClick={onOpenProof}>
                View Screenshot
              </Button>
            ) : null}
            <Button asChild type="button" variant="ghost">
              <Link to={`${ROUTES.bill}/${request.billId}`}>
                <ExternalLink className="h-4 w-4" />
                View Bill
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/30 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  )
}
