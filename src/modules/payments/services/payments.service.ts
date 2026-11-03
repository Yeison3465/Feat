import { supabase } from '../../../lib/supabase'
import {
  CreatePaymentDTO,
  InstallmentPaymentItem,
  LoanMovementItem,
  PaymentAllocationPreview,
  PaymentWithDetails,
} from '../types'
import { LoanWithDetails } from '../../loans/types'
import { generateUUID } from '../../../shared/utils/uuid'

export const paymentsService = {
  /**
   * Calcula en memoria la previsualización exacta de cómo se distribuirá un monto de pago
   * siguiendo la prelación aprobada (1° Mora -> 2° Interés -> 3° Capital) antes de confirmar (FL-04 paso 6).
   */
  previewAllocation(loan: LoanWithDetails, monto: number): PaymentAllocationPreview {
    const cuotas = loan.cuotas || []
    const totalCapitalPagado = cuotas.reduce((acc, c) => acc + (c.capital_pagado || 0), 0)
    const capitalPendienteActual = Math.max(0, loan.capital_original - totalCapitalPagado)

    const cuotasPendientes = cuotas.filter((c) => !c.esta_liquidada)
    const moraPendienteActual = cuotasPendientes.reduce(
      (acc, c) => acc + Math.max(0, (c.mora_acumulada || 0) - (c.mora_pagada || 0)),
      0
    )
    const interesPendienteActual = cuotasPendientes.reduce(
      (acc, c) => acc + Math.max(0, (c.interes_esperado || 0) - (c.interes_pagado || 0)),
      0
    )

    const saldoExigibleTotal =
      capitalPendienteActual + interesPendienteActual + moraPendienteActual

    const montoLimpio = Math.max(0, Math.round(monto || 0))
    let restante = montoLimpio
    let abonoMora = 0
    let abonoInteres = 0
    let abonoCapital = 0

    for (const cuota of cuotasPendientes) {
      if (restante <= 0) break

      const moraCuota = Math.max(0, (cuota.mora_acumulada || 0) - (cuota.mora_pagada || 0))
      if (moraCuota > 0 && restante > 0) {
        const pagoMora = Math.min(restante, moraCuota)
        abonoMora += pagoMora
        restante -= pagoMora
      }

      const intCuota = Math.max(0, (cuota.interes_esperado || 0) - (cuota.interes_pagado || 0))
      if (intCuota > 0 && restante > 0) {
        const pagoInt = Math.min(restante, intCuota)
        abonoInteres += pagoInt
        restante -= pagoInt
      }

      const capCuota = Math.max(0, (cuota.capital_esperado || 0) - (cuota.capital_pagado || 0))
      if (capCuota > 0 && restante > 0) {
        const pagoCap = Math.min(restante, capCuota)
        abonoCapital += pagoCap
        restante -= pagoCap
      }
    }

    if (restante > 0) {
      abonoCapital += restante
      restante = 0
    }

    const nuevoCapitalPendiente = Math.max(0, capitalPendienteActual - abonoCapital)
    const nuevoInteresPendiente = Math.max(0, interesPendienteActual - abonoInteres)
    const exento = loan.persona?.exento_interes_ordinario ?? false
    const tasa = exento ? 0 : loan.tasa_mensual
    const proximoInteresMensualEstimado = Math.round(nuevoCapitalPendiente * (tasa / 100))

    return {
      montoTotal: montoLimpio,
      abonoMora,
      abonoInteres,
      abonoCapital,
      nuevoCapitalPendiente,
      nuevoInteresPendiente,
      proximoInteresMensualEstimado,
      liquidaCreditoCompleto:
        montoLimpio > 0 &&
        nuevoCapitalPendiente === 0 &&
        nuevoInteresPendiente === 0 &&
        moraPendienteActual - abonoMora <= 0,
      excedeSaldoTotal: saldoExigibleTotal > 0 && montoLimpio > saldoExigibleTotal,
      saldoExigibleTotal,
    }
  },

  /**
   * Registra un pago o abono de forma 100% transaccional en PostgreSQL mediante RPC (FL-04, FL-05, FL-06, FL-11).
   * Garantiza idempotencia, bloqueo contra concurrencia, distribución contable y rollover automático.
   */
  async createPayment(dto: CreatePaymentDTO): Promise<PaymentWithDetails> {
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) {
      throw new Error('Debes iniciar sesión para registrar un pago.')
    }

    if (!dto.monto || dto.monto <= 0) {
      throw new Error('El monto a pagar debe ser mayor a 0.')
    }

    const idempotencyKey = dto.clave_idempotencia || generateUUID()

    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'registrar_pago_transaccional',
      {
        p_prestamo_id: dto.prestamo_id,
        p_monto: Math.round(dto.monto),
        p_clave_idempotencia: idempotencyKey,
        p_fecha_recepcion: dto.fecha_recepcion,
        p_metodo_pago: dto.metodo_pago,
        p_notas: dto.notas?.trim() || undefined,
      }
    )

    if (rpcError) {
      throw new Error(rpcError.message || 'Error al procesar el pago en el servidor.')
    }

    const parsed = (typeof rpcData === 'string' ? JSON.parse(rpcData) : rpcData) as Record<
      string,
      any
    >

    const paymentId = parsed?.id || parsed?.pago_id
    if (!paymentId) {
      throw new Error('No se recibió confirmación válida del comprobante de pago.')
    }

    return {
      id: paymentId,
      prestamo_id: parsed.prestamo_id || dto.prestamo_id,
      propietario_id: parsed.propietario_id || authData.user.id,
      monto: Number(parsed.monto ?? dto.monto),
      fecha_recepcion: parsed.fecha_recepcion || dto.fecha_recepcion,
      metodo_pago: parsed.metodo_pago || dto.metodo_pago,
      notas: parsed.notas ?? dto.notas ?? null,
      es_reverso: Boolean(parsed.es_reverso),
      creado_en: parsed.creado_en || new Date().toISOString(),
    }
  },

  /**
   * Ejecuta un reverso contable transaccional de un pago confirmado (FL-10 / T-010).
   * Conserva el pago original, inserta el movimiento compensatorio y restaura los saldos de cuotas y préstamo.
   */
  async reversePayment(pagoId: string, motivo: string): Promise<{ reverso_id: string }> {
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) {
      throw new Error('Debes iniciar sesión para reversar una operación.')
    }

    const cleanReason = motivo.trim()
    if (!cleanReason) {
      throw new Error('Debes indicar el motivo de la corrección o reverso.')
    }

    const { data, error } = await supabase.rpc('reversar_pago_transaccional', {
      p_pago_id: pagoId,
      p_motivo: cleanReason,
    })

    if (error) {
      throw new Error(error.message || 'No fue posible reversar el pago.')
    }

    const parsed = (typeof data === 'string' ? JSON.parse(data) : data) as Record<string, any>
    return {
      reverso_id: parsed?.reverso_id || pagoId,
    }
  },

  /**
   * Obtiene el detalle completo de un pago específico para el comprobante SCR-14
   */
  async getPaymentById(pagoId: string): Promise<any> {
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) {
      throw new Error('Debes iniciar sesión para consultar el comprobante.')
    }

    const { data: pago, error } = await supabase
      .from('pagos')
      .select(
        '*, distribucion_pagos(*), prestamos(id, capital_original, tasa_mensual, tipo_amortizacion, estado, personas(id, nombre))'
      )
      .eq('id', pagoId)
      .eq('propietario_id', authData.user.id)
      .single()

    if (error || !pago) {
      throw new Error(error?.message || 'Comprobante de pago no encontrado.')
    }

    // Verificar si este pago fue reversado por otro registro posterior
    const { data: reversoRow } = await supabase
      .from('pagos')
      .select('id, creado_en, notas')
      .eq('pago_reversado_id', pagoId)
      .eq('propietario_id', authData.user.id)
      .maybeSingle()

    return {
      ...pago,
      esta_reversado: Boolean(reversoRow),
      reverso_info: reversoRow || null,
    }
  },

  /**
   * Obtiene todos los pagos realizados sobre un préstamo (SCR-15 Historial de pagos)
   */
  async getPaymentsByLoan(prestamoId: string): Promise<PaymentWithDetails[]> {
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) {
      throw new Error('Debes iniciar sesión para consultar pagos.')
    }

    const { data, error } = await supabase
      .from('pagos')
      .select('*, distribucion_pagos(*)')
      .eq('prestamo_id', prestamoId)
      .eq('propietario_id', authData.user.id)
      .order('creado_en', { ascending: false })

    if (error) {
      throw new Error(`Error al consultar pagos: ${error.message}`)
    }

    const rows = (data || []) as PaymentWithDetails[]
    const reversedIds = new Set(
      rows.filter((r) => r.es_reverso && r.pago_reversado_id).map((r) => r.pago_reversado_id!)
    )

    return rows.map((row) => ({
      ...row,
      distribuciones: row.distribucion_pagos || [],
      esta_reversado: reversedIds.has(row.id),
    }))
  },

  /**
   * Obtiene el libro mayor de movimientos financieros de un préstamo (SCR-16 Movimientos financieros)
   */
  async getMovementsByLoan(prestamoId: string): Promise<LoanMovementItem[]> {
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) {
      throw new Error('Debes iniciar sesión para consultar movimientos financieros.')
    }

    const { data, error } = await supabase
      .from('movimientos_prestamo')
      .select('*')
      .eq('prestamo_id', prestamoId)
      .eq('propietario_id', authData.user.id)
      .order('creado_en', { ascending: false })

    if (error) {
      throw new Error(`Error al consultar movimientos: ${error.message}`)
    }

    return (data || []) as unknown as LoanMovementItem[]
  },

  /**
   * Obtiene las imputaciones de pagos asociadas a una cuota específica (SCR-12 Detalle de cuota)
   */
  async getAllocationsByInstallment(cuotaId: string): Promise<InstallmentPaymentItem[]> {
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) {
      throw new Error('Debes iniciar sesión para consultar el detalle de la cuota.')
    }

    const { data, error } = await supabase
      .from('distribucion_pagos')
      .select(
        'id, pago_id, cuota_id, componente, monto, creado_en, pago:pagos(id, monto, fecha_recepcion, metodo_pago, notas, es_reverso, pago_reversado_id)'
      )
      .eq('cuota_id', cuotaId)
      .eq('propietario_id', authData.user.id)
      .order('creado_en', { ascending: false })

    if (error) {
      throw new Error(`Error al consultar abonos de la cuota: ${error.message}`)
    }

    return (data || []) as unknown as InstallmentPaymentItem[]
  },

  /**
   * Obtiene todos los pagos confirmados del usuario para métricas globales del Dashboard (FL-08)
   */
  async getAllConfirmedPayments(): Promise<any[]> {
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) return []

    const { data, error } = await supabase
      .from('pagos')
      .select('id, prestamo_id, monto, fecha_recepcion, metodo_pago, es_reverso, pago_reversado_id, distribucion_pagos(*)')
      .eq('propietario_id', authData.user.id)
      .order('fecha_recepcion', { ascending: true })

    if (error || !data) return []

    const reversedIds = new Set(
      data.filter((p) => p.es_reverso && p.pago_reversado_id).map((p) => p.pago_reversado_id)
    )
    return data.filter((p) => !p.es_reverso && !reversedIds.has(p.id))
  },
}
