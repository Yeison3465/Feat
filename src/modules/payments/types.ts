export type PaymentMethod = 'efectivo' | 'transferencia' | 'otro'
export type PaymentComponent = 'capital' | 'interes' | 'mora'

export interface CreatePaymentDTO {
  prestamo_id: string
  monto: number
  fecha_recepcion: string // YYYY-MM-DD
  metodo_pago: PaymentMethod
  notas?: string | null
}

export interface PaymentDistribution {
  id: string
  pago_id: string
  cuota_id?: string | null
  componente: PaymentComponent
  monto: number
}

export interface PaymentWithDetails {
  id: string
  prestamo_id: string
  propietario_id: string
  monto: number
  fecha_recepcion: string
  metodo_pago: string
  notas: string | null
  es_reverso: boolean
  creado_en: string
  distribuciones?: PaymentDistribution[]
}
