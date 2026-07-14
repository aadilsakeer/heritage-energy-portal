/** Lightweight CSV / Excel-friendly / JSON download helpers (no extra deps). */

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function escapeCsvCell(value: unknown): string {
  const text = value == null ? '' : String(value)
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(',')),
  ]
  return lines.join('\r\n')
}

/** UTF-8 BOM so Excel opens Indian locale CSV correctly. */
export function downloadCsv(
  filename: string,
  headers: string[],
  rows: unknown[][],
): void {
  const csv = `\uFEFF${toCsv(headers, rows)}`
  triggerDownload(new Blob([csv], { type: 'text/csv;charset=utf-8' }), filename)
}

/** Excel-compatible CSV (.xls extension triggers Excel on many systems). */
export function downloadExcel(
  filename: string,
  headers: string[],
  rows: unknown[][],
): void {
  const base = filename.replace(/\.(csv|xlsx|xls)$/i, '')
  downloadCsv(`${base}.xls`, headers, rows)
}

export function downloadJson(filename: string, data: unknown): void {
  const json = JSON.stringify(data, null, 2)
  triggerDownload(
    new Blob([json], { type: 'application/json;charset=utf-8' }),
    filename,
  )
}
