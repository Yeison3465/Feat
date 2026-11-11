import { Database, Tables } from '../../shared/types/database.types'

export type Loan = Tables<'prestamos'>
export type LoanInstallment = Tables<'cuotas'>
export type LoanMovement = Tables<'movimientos_prestamo'>

export type LoanStatus = Database['public']['Enums']['estado_prestamo']
export type AmortizationType = Database['public']['Enums']['tipo_amortizacion_prestamo']

export interface BorrowerSnapshot {
  id: string
  nombre: string
  telefono?: string | null
  direccion?: string | null
  exento_interes_ordinario: boolean
}

export interface LoanConditionsSnapshot {
  persona_nombre: string
  persona_id: string
  capital_original: number
  tasa_mensual_pactada: number
  tasa_mora_pactada: number
  dias_gracia: number
  exento_interes: boolean
  tipo_amortizacion: AmortizationType
  numero_cuotas: number
  fecha_desembolso: string
  fecha_primer_vencimiento: string
  fecha_creacion: string
}

export interface LoanWithDetails extends Loan {
  persona: BorrowerSnapshot
  cuotas: LoanInstallment[]
}

export interface CreateLoanDTO {
  persona_id: string
  capital_original: number
  tasa_mensual?: number
  tasa_mora?: number
  tipo_amortizacion?: AmortizationType
  fecha_desembolso?: string
  fecha_primer_vencimiento: string
  numero_cuotas?: number
  notas?: string | null
}

export interface LoanFilter {
  searchQuery?: string
  estado?: LoanStatus | 'todos'
}

export type DashboardPeriod = 'mes_actual' | 'ultimos_30d' | 'historico'

export interface ChartPoint {
  label: string
  amount: number
  // Lo que tocaba cobrar en esta ranura (cuotas que vencen): interés + capital esperados
  expected?: number
  date?: string
}

// Cumplimiento del periodo: cuotas que vencen en él frente a lo ya cobrado de esas cuotas
export interface PeriodSummary {
  esperado: number
  cobrado: number
  pendiente: number
  cumplimientoPct: number
}

export interface LoanSummaryMetrics {
  // 1. Capital prestado histórico (sin restar amortizaciones)
  totalCapitalPrestado: number
  // 2. Capital pendiente (desembolsado menos recuperado)
  totalCapitalPendiente: number
  // 3. Ganancias cobradas (intereses cobrados + mora cobrada)
  totalInteresEsperado: number
  totalInteresCobrado: number
  totalMoraCobrada: number
  gananciasTotalesCobradas: number
  // 4. Intereses pendientes
  totalInteresPendiente: number
  // 5. Cartera total pendiente (capital + intereses + mora)
  carteraTotalPendiente: number
  // 6. Personas atrasadas (desduplicadas por persona_id)
  personasAtrasadasCount: number
  cuotasVencidasCount: number
  saldoMoraVencido: number
  // 7. Personas activas / pendientes
  personasPendientesCount: number
  // 8. Recaudo del periodo seleccionado
  recaudoPeriodo: number
  // 9. Próximos vencimientos
  proximosVencimientosCount: number
  // --- Métricas Específicas / Detalladas ---
  totalCapitalPagado: number
  tasaRecuperacionPct: number
  rendimientoRoiPct: number
  indiceMorosidadPct: number
  ticketPromedio: number
  carteraPorModalidad: {
    soloInteres: number
    cuotasFijas: number
    pagoUnico: number
  }
  tasaEfectividadCobroPct: number
}

export interface ActiveBorrowerSummary {
  personaId: string
  nombre: string
  telefono?: string | null
  totalSaldoPendiente: number
  activeLoansCount: number
  hasOverdue: boolean
}

export type DueHorizonFilter = 'hoy' | '7d' | '15d' | '30d' | 'todos'

export interface ObligationItem {
  installment: LoanInstallment
  loan: LoanWithDetails
  borrowerName: string
  borrowerPhone?: string | null
  daysDiff: number
  inGracePeriod: boolean
  diasGracia: number
  saldoExigible: number
  moraPendiente: number
  interesPendiente: number
  capitalPendientePrestamo: number
}


