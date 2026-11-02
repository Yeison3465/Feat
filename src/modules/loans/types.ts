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

export interface LoanSummaryMetrics {
  totalCapitalPrestado: number
  totalCapitalPendiente: number
  totalInteresEsperado: number
  totalInteresCobrado: number
  totalMoraCobrada: number
  cuotasVencidasCount: number
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


