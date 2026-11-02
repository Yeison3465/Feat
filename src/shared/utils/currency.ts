export function formatCOP(amount: number): string {
  if (isNaN(amount)) return '$ 0'
  const rounded = Math.round(amount)
  const formatted = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rounded)
  return formatted
}

export function formatCOPFull(amount: number): string {
  return `${formatCOP(amount)} COP`
}

export function parseCOP(value: string): number {
  const clean = value.replace(/[^0-9]/g, '')
  return clean ? parseInt(clean, 10) : 0
}

export function formatDateFriendly(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)

  const diffTime = target.getTime() - today.getTime()
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  const formattedDate = `${target.getDate()} ${months[target.getMonth()]}`

  if (diffDays === 0) return `Hoy, ${formattedDate}`
  if (diffDays === 1) return `Mañana, ${formattedDate}`
  if (diffDays === -1) return `Ayer, ${formattedDate}`
  if (diffDays < -1) return `Atrasado (${Math.abs(diffDays)}d) · ${formattedDate}`
  return `${formattedDate}`
}

