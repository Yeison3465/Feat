export type PaymentMethod = 'efectivo' | 'transferencia' | 'otro'
export type PaymentComponent = 'capital' | 'interes' | 'mora'
export type MovementType = 'desembolso' | 'pago' | 'cargo_mora' | 'reverso' | 'ajuste'

export interface CreatePaymentDTO {
  prestamo_id: string
  monto: number
  fecha_recepcion: string // YYYY-MM-DD
  metodo_pago: PaymentMethod
  notas?: string | null
  clave_idempotencia?: string
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
  pago_reversado_id?: string | null
  creado_en: string
  distribucion_pagos?: PaymentDistribution[]
  distribuciones?: PaymentDistribution[]
  esta_reversado?: boolean
}

export interface LoanMovementItem {
  id: string
  prestamo_id: string
  propietario_id: string
  tipo_movimiento: MovementType
  monto: number
  fecha_efectiva: string
  pago_origen_id: string | null
  movimiento_reversado_id: string | null
  notas: string | null
  metadatos: Record<string, any> | null
  creado_en: string
}

export interface PaymentAllocationPreview {
  montoTotal: number
  abonoMora: number
  abonoInteres: number
  abonoCapital: number
  nuevoCapitalPendiente: number
  nuevoInteresPendiente: number
  proximoInteresMensualEstimado: number
  liquidaCreditoCompleto: boolean
  excedeSaldoTotal: boolean
  saldoExigibleTotal: number
}

export interface InstallmentPaymentItem {
  id: string
  pago_id: string
  cuota_id: string | null
  componente: PaymentComponent
  monto: number
  creado_en: string
  pago?: {
    id: string
    monto: number
    fecha_recepcion: string
    metodo_pago: string
    notas: string | null
    es_reverso: boolean
    pago_reversado_id?: string | null
  }
}
