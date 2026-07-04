import { GoogleGenerativeAI } from '@google/generative-ai'
import { env } from '@/lib/env'
import {
  parseGeminiJson,
  type ExtractionResult,
} from '@/lib/extractionSchema'

const MODEL = 'gemini-2.5-flash'
const MAX_ATTEMPTS = 3
const TIMEOUT_MS = 45_000

const EXTRACTION_PROMPT = `Extract electricity bill fields from this document.
Return ONLY strict JSON with these keys:
generation, import_units, export_units, fixed_charge, security_deposit, arrears, bill_date, due_date, consumer_number.
Use numbers for numeric fields and ISO dates (YYYY-MM-DD) for dates.
Use null when a value is missing.
No markdown. No explanation.`

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

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(`Gemini request timed out after ${ms / 1000}s`))
    }, ms)

    promise
      .then((value) => {
        window.clearTimeout(timer)
        resolve(value)
      })
      .catch((error: unknown) => {
        window.clearTimeout(timer)
        reject(error)
      })
  })
}

async function requestExtraction(
  file: File,
): Promise<ExtractionResult> {
  const genAI = new GoogleGenerativeAI(env.geminiApiKey)
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      temperature: 0,
      responseMimeType: 'application/json',
    },
  })

  const base64 = await fileToBase64(file)
  const result = await withTimeout(
    model.generateContent([
      EXTRACTION_PROMPT,
      fileToGenerativePart(base64, file.type),
    ]),
    TIMEOUT_MS,
  )

  const text = result.response.text()
  if (!text) {
    throw new Error('Gemini returned an empty response')
  }

  return parseGeminiJson(text)
}

export async function extractBillFields(
  file: File,
): Promise<ExtractionResult> {
  const allowed = ['application/pdf', 'image/png', 'image/jpeg']
  if (!allowed.includes(file.type)) {
    throw new Error('Only PDF, PNG, and JPEG files are supported')
  }

  let lastError: unknown

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      return await requestExtraction(file)
    } catch (error) {
      lastError = error
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((resolve) => {
          window.setTimeout(resolve, attempt * 500)
        })
      }
    }
  }

  if (lastError instanceof Error) throw lastError
  throw new Error('Gemini extraction failed')
}
