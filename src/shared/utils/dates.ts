// Utilidades de fechas en formato ISO local (YYYY-MM-DD), sin sesgo de huso horario.

const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

export function toISODate(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${year}-${m}-${d}`
}

export function parseISODate(dateStr: string): { year: number; month: number; day: number } | null {
  const parts = (dateStr || '').split('T')[0].split('-').map((p) => parseInt(p, 10))
  if (parts.length !== 3 || parts.some((p) => isNaN(p))) return null
  return { year: parts[0], month: parts[1] - 1, day: parts[2] }
}

export function todayISO(): string {
  const now = new Date()
  return toISODate(now.getFullYear(), now.getMonth(), now.getDate())
}

export function addDaysISO(dateStr: string, days: number): string {
  const p = parseISODate(dateStr)
  if (!p) return dateStr
  const d = new Date(p.year, p.month, p.day + days)
  return toISODate(d.getFullYear(), d.getMonth(), d.getDate())
}

/**
 * Suma meses conservando el día del mes. Si el mes destino es más corto,
 * se ajusta a su último día (31 ene + 1 mes = 28/29 feb, nunca 3 mar).
 */
export function addMonthsISO(dateStr: string, months: number): string {
  const p = parseISODate(dateStr)
  if (!p) return dateStr
  const target = new Date(p.year, p.month + months, 1)
  const daysInTarget = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  return toISODate(target.getFullYear(), target.getMonth(), Math.min(p.day, daysInTarget))
}

/** Ej. "3 dic 2026" */
export function formatDateLong(dateStr: string): string {
  const p = parseISODate(dateStr)
  if (!p) return ''
  return `${p.day} ${MONTHS_SHORT[p.month]} ${p.year}`
}
