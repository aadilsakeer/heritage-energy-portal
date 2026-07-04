import { useMemo, useState } from 'react'
import { Calculator, Save, Send } from 'lucide-react'
import type { ExtractionResult, ReviewFormValues } from '@/lib/extractionSchema'
import { calculateBill } from '@/lib/calculations'
import type { BillingConfiguration } from '@/types'
import { formatCurrency, formatEnergy } from '@/utils/format'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface BillReviewFormProps {
  initial: ReviewFormValues
  original: ExtractionResult | null
  config: BillingConfiguration
  isSaving?: boolean
  isPublishing?: boolean
  onSave: (values: ReviewFormValues) => Promise<void>
  onPublish: (values: ReviewFormValues) => Promise<void>
}

const fields: Array<{
  key: keyof ReviewFormValues
  label: string
  type?: string
}> = [
  { key: 'generation', label: 'Generation (kWh)' },
  { key: 'import_units', label: 'Import (kWh)' },
  { key: 'export_units', label: 'Export (kWh)' },
  { key: 'fixed_charge', label: 'Fixed Charge (₹)' },
  { key: 'security_deposit', label: 'Security Deposit (₹)' },
  { key: 'arrears', label: 'Arrears (₹)' },
  { key: 'bill_date', label: 'Bill Date', type: 'date' },
  { key: 'due_date', label: 'Due Date', type: 'date' },
  { key: 'consumer_number', label: 'Consumer Number', type: 'text' },
]

export function BillReviewForm({
  initial,
  original,
  config,
  isSaving,
  isPublishing,
  onSave,
  onPublish,
}: BillReviewFormProps) {
  const [values, setValues] = useState<ReviewFormValues>(initial)

  const calculated = useMemo(
    () =>
      calculateBill({
        generation: values.generation,
        exportKwh: values.export_units,
        importKwh: values.import_units,
        rate: config.rate,
        discountPercent: config.discountPercent,
        fixedCharge: values.fixed_charge,
        securityDeposit: values.security_deposit,
        arrears: values.arrears,
      }),
    [values, config],
  )


  const updateField = (key: keyof ReviewFormValues, raw: string) => {
    setValues((current) => ({
      ...current,
      [key]:
        key === 'bill_date' || key === 'due_date' || key === 'consumer_number'
          ? raw
          : Number(raw),
    }))
  }

  const isMissing = (key: keyof ReviewFormValues) => {
    const value = values[key]
    return value === '' || value === null || value === undefined
  }

  const isChanged = (key: keyof ReviewFormValues) => {
    if (!original) return false
    return String(original[key] ?? '') !== String(values[key])
  }

  return (
    <div className="space-y-4">
      <Card className="border-border/50 bg-card/80 shadow-soft backdrop-blur-xl">
        <CardHeader>
          <CardTitle>Review Extracted Values</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={field.key}>{field.label}</Label>
              <Input
                id={field.key}
                type={field.type ?? 'number'}
                step="any"
                value={values[field.key]}
                onChange={(event) => updateField(field.key, event.target.value)}
                className={cn(
                  isMissing(field.key) && 'border-amber-500 ring-1 ring-amber-500/30',
                  isChanged(field.key) && 'border-accent ring-1 ring-accent/30',
                )}
                aria-invalid={isMissing(field.key)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/80 shadow-soft backdrop-blur-xl">
        <CardHeader>
          <CardTitle>Live Calculation</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <p className="text-sm text-muted-foreground">
            Consumption:{' '}
            <span className="font-semibold text-foreground">
              {formatEnergy(calculated.consumption)}
            </span>
          </p>
          <p className="text-sm text-muted-foreground">
            Energy:{' '}
            <span className="font-semibold text-foreground">
              {formatCurrency(calculated.energyCharge)}
            </span>
          </p>
          <p className="text-sm text-muted-foreground">
            Discount:{' '}
            <span className="font-semibold text-foreground">
              {formatCurrency(calculated.discountAmount)}
            </span>
          </p>
          <p className="text-sm text-muted-foreground">
            Tenant Total:{' '}
            <span className="font-semibold text-primary">
              {formatCurrency(calculated.tenantTotal)}
            </span>
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          onClick={() => setValues((current) => ({ ...current }))}
          aria-label="Recalculate bill"

        >
          <Calculator className="h-4 w-4" />
          Recalculate
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={isSaving || isPublishing}
          onClick={() => void onSave(values)}
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving…' : 'Save Draft'}
        </Button>
        <Button
          type="button"
          disabled={isSaving || isPublishing}
          onClick={() => void onPublish(values)}
        >
          <Send className="h-4 w-4" />
          {isPublishing ? 'Publishing…' : 'Publish'}
        </Button>
      </div>
    </div>
  )
}
