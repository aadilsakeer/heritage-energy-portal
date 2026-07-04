import { GoogleGenerativeAI } from '@google/generative-ai'
import {
  parseGeminiJson,
  type ExtractionResult,
} from '@/lib/extractionSchema'

const MODEL = 'gemini-2.5-flash'

const EXTRACTION_PROMPT = `Extract electricity bill fields from this document.
Return ONLY strict JSON with these keys:
generation, import_units, export_units, fixed_charge, security_deposit, arrears, bill_date, due_date, consumer_number.
Use numbers for numeric fields and ISO dates (YYYY-MM-DD) for dates.
Use null when a value is missing.
No markdown. No explanation.`

function getApiKey(): string {
  const key = import.meta.env.VITE_GEMINI_API_KEY
  if (!key) {
    throw new Error(
      'Gemini API key is not configured. Set VITE_GEMINI_API_KEY in your environment.',
    )
  }
  return key
}

function fileToGenerativePart(base64: string, mimeType: string) {
  return {
    inlineData: {
      data: base64,
      mimeType,
    },
  }
}

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

export async function extractBillFields(
  file: File,
): Promise<ExtractionResult> {
  const allowed = ['application/pdf', 'image/png', 'image/jpeg']
  if (!allowed.includes(file.type)) {
    throw new Error('Only PDF, PNG, and JPEG files are supported')
  }

  const apiKey = getApiKey()
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      temperature: 0,
      responseMimeType: 'application/json',
    },
  })

  const base64 = await fileToBase64(file)
  const result = await model.generateContent([
    EXTRACTION_PROMPT,
    fileToGenerativePart(base64, file.type),
  ])

  const text = result.response.text()
  if (!text) {
    throw new Error('Gemini returned an empty response')
  }

  return parseGeminiJson(text)
}
