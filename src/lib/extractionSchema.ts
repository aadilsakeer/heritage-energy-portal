import { z } from 'zod'

const nullableNumber = z.preprocess((value) => {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const normalized = value.replace(/,/g, '').trim()
    if (normalized === '') return null
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : value
  }
  return value
}, z.number().nonnegative().nullable())

const nullableDate = z.preprocess((value) => {
  if (value === null || value === undefined || value === '') return null
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  const isoMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})/)
  if (isoMatch) return isoMatch[1]
  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return trimmed
  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const day = String(parsed.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}, z.string().nullable())

const nullableText = z.preprocess((value) => {
  if (value === null || value === undefined) return null
  const text = String(value).trim()
  return text === '' ? null : text
}, z.string().nullable())

export const extractionSchema = z.object({
  generation: nullableNumber,
  import_units: nullableNumber,
  export_units: nullableNumber,
  fixed_charge: nullableNumber,
  security_deposit: nullableNumber,
  arrears: nullableNumber,
  bill_date: nullableDate,
  due_date: nullableDate,
  consumer_number: nullableText,
})

export type ExtractionResult = z.infer<typeof extractionSchema>

export const reviewFormSchema = z.object({
  generation: z.coerce.number().nonnegative(),
  import_units: z.coerce.number().nonnegative(),
  export_units: z.coerce.number().nonnegative(),
  fixed_charge: z.coerce.number().nonnegative(),
  security_deposit: z.coerce.number().nonnegative(),
  arrears: z.coerce.number().nonnegative(),
  bill_date: z.string().min(1),
  due_date: z.string().min(1),
  consumer_number: z.string().min(1),
})

export type ReviewFormValues = z.infer<typeof reviewFormSchema>

export function toFormValues(
  source: ExtractionResult | ReviewFormValues | {
    generation: number | null
    import_units?: number | null
    export_units?: number | null
    importKwh?: number | null
    exportKwh?: number | null
    fixed_charge: number | null
    security_deposit?: number | null
    arrears?: number | null
    bill_date: string | null
    due_date: string | null
    consumer_number: string | null
  },
): ReviewFormValues {
  const record = source as Record<string, unknown>
  return {
    generation: Number(record.generation ?? 0),
    import_units: Number(record.import_units ?? record.importKwh ?? 0),
    export_units: Number(record.export_units ?? record.exportKwh ?? 0),
    fixed_charge: Number(record.fixed_charge ?? 0),
    security_deposit: Number(record.security_deposit ?? 0),
    arrears: Number(record.arrears ?? 0),
    bill_date: String(record.bill_date ?? ''),
    due_date: String(record.due_date ?? ''),
    consumer_number: String(record.consumer_number ?? ''),
  }
}

export function parseGeminiJson(raw: string): ExtractionResult {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error('Gemini returned invalid JSON')
  }

  const result = extractionSchema.safeParse(parsed)
  if (!result.success) {
    throw new Error('Gemini response failed validation')
  }

  return result.data
}
