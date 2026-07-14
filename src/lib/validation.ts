/** Shared money / upload guards. Does not change accounting formulas. */

export function assertPositiveAmount(
  amount: number,
  label = 'Amount',
): number {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`${label} must be a valid number greater than zero`)
  }
  return amount
}

export function assertNonZeroAmount(
  amount: number,
  label = 'Amount',
): number {
  if (!Number.isFinite(amount) || amount === 0) {
    throw new Error(`${label} must be a valid non-zero number`)
  }
  return amount
}

export const ALLOWED_UPLOAD_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
] as const

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

export function assertAllowedUpload(file: File): void {
  const type = file.type || ''
  if (
    !ALLOWED_UPLOAD_MIME_TYPES.includes(
      type as (typeof ALLOWED_UPLOAD_MIME_TYPES)[number],
    )
  ) {
    throw new Error('Only PDF, PNG, or JPEG files are allowed')
  }
  if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) {
    throw new Error('File must be between 1 byte and 10 MB')
  }
}
