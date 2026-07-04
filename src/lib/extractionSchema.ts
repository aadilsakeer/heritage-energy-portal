import { z } from 'zod'

export const extractionSchema = z.object({
  generation: z.number().nonnegative().nullable(),
  import_units: z.number().nonnegative().nullable(),
  export_units: z.number().nonnegative().nullable(),
  fixed_charge: z.number().nonnegative().nullable(),
  security_deposit: z.number().nonnegative().nullable(),
  arrears: z.number().nonnegative().nullable(),
  bill_date: z.string().nullable(),
  due_date: z.string().nullable(),
  consumer_number: z.string().nullable(),
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
