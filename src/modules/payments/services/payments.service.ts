import { supabase } from '../../../lib/supabase'
import { CreatePaymentDTO, PaymentComponent, PaymentWithDetails } from '../types'
import { generateUUID } from '../../../shared/utils/uuid'
import { loansService } from '../../loans/services/loans.service'

export const paymentsService = {
  /**
   * Registra un pago/recaudo en el préstamo, distribuye el saldo entre las cuotas
   * pendientes (interés y capital), asienta el movimiento contable y evalúa
   * si el crédito queda completamente liquidado.
   */
  async createPayment(dto: CreatePaymentDTO): Promise<PaymentWithDetails> {
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) {
      throw new Error('Debes iniciar sesión para registrar un pago.')
    }
    const userId = authData.user.id

    if (!dto.monto || dto.monto <= 0) {
      throw new Error('El monto a pagar debe ser mayor a 0.')
    }

    const idempotencyKey = generateUUID()

    // 1. Intentar registrar vía RPC transaccional en Supabase si está disponible
    try {
      const { data: rpcData, error: rpcError } = await (supabase.rpc as any)(
        'registrar_pago_transaccional',
        {
          p_prestamo_id: dto.prestamo_id,
          p_monto: dto.monto,
          p_clave_idempotencia: idempotencyKey,
          p_fecha_recepcion: dto.fecha_recepcion,
          p_metodo_pago: dto.metodo_pago,
          p_notas: dto.notas || undefined,
        }
      )

      if (!rpcError && rpcData) {
        // RPC exitoso
        return (typeof rpcData === 'string' ? JSON.parse(rpcData) : rpcData) as PaymentWithDetails
      }
    } catch {
      // Si la función RPC no existe en la BD remota, continuar con el flujo directo
    }

    // 2. Flujo directo en base de datos con verificación de propiedad
    const { data: prestamo, error: prestamoError } = await supabase
      .from('prestamos')
      .select('id, capital_original, estado, tasa_mensual, tipo_amortizacion')
      .eq('id', dto.prestamo_id)
      .eq('propietario_id', userId)
      .single()

    if (prestamoError || !prestamo) {
      throw new Error('El préstamo seleccionado no existe o no tienes acceso.')
    }

    // Insertar el registro principal en `pagos`
    const { data: nuevoPago, error: pagoError } = await supabase
      .from('pagos')
      .insert({
        prestamo_id: dto.prestamo_id,
        propietario_id: userId,
        monto: dto.monto,
        fecha_recepcion: dto.fecha_recepcion,
        metodo_pago: dto.metodo_pago,
        notas: dto.notas?.trim() || null,
        clave_idempotencia: idempotencyKey,
        es_reverso: false,
      })
      .select()
      .single()

    if (pagoError || !nuevoPago) {
      throw new Error(`Error al registrar el pago: ${pagoError?.message}`)
    }

    // Obtener las cuotas del préstamo ordenadas cronológicamente
    const { data: cuotas, error: cuotasError } = await supabase
      .from('cuotas')
      .select('*')
      .eq('prestamo_id', dto.prestamo_id)
      .eq('propietario_id', userId)
      .order('numero_cuota', { ascending: true })

    if (cuotasError) {
      throw new Error(`Error al consultar cuotas: ${cuotasError.message}`)
    }

    let montoRestante = dto.monto
    const distribucionesParaInsertar: Array<{
      pago_id: string
      cuota_id: string | null
      propietario_id: string
      componente: PaymentComponent
      monto: number
    }> = []

    // Distribuir el pago cuota por cuota
    if (cuotas && cuotas.length > 0) {
      for (const cuota of cuotas) {
        if (montoRestante <= 0) break

        const interesEsperado = cuota.interes_esperado || 0
        const interesPagado = cuota.interes_pagado || 0
        const interesPendiente = Math.max(0, interesEsperado - interesPagado)

        const capitalEsperado = cuota.capital_esperado || 0
        const capitalPagado = cuota.capital_pagado || 0
        const capitalPendiente = Math.max(0, capitalEsperado - capitalPagado)

        let nuevoInteresPagado = interesPagado
        let nuevoCapitalPagado = capitalPagado

        // A. Imputar a Interés Ordinario de la cuota primero
        if (interesPendiente > 0 && montoRestante > 0) {
          const abonoInteres = Math.min(montoRestante, interesPendiente)
          nuevoInteresPagado += abonoInteres
          montoRestante -= abonoInteres

          distribucionesParaInsertar.push({
            pago_id: nuevoPago.id,
            cuota_id: cuota.id,
            propietario_id: userId,
            componente: 'interes',
            monto: abonoInteres,
          })
        }

        // B. Imputar a Capital de la cuota
        if (capitalPendiente > 0 && montoRestante > 0) {
          const abonoCapital = Math.min(montoRestante, capitalPendiente)
          nuevoCapitalPagado += abonoCapital
          montoRestante -= abonoCapital

          distribucionesParaInsertar.push({
            pago_id: nuevoPago.id,
            cuota_id: cuota.id,
            propietario_id: userId,
            componente: 'capital',
            monto: abonoCapital,
          })
        }

        // Evaluar si la cuota queda liquidada
        let finalCapitalEsperado = capitalEsperado
        let estaLiquidada =
          nuevoInteresPagado >= interesEsperado && nuevoCapitalPagado >= capitalEsperado

        // En modalidad 'pago_unico', si el prestatario cubre el interés devengado del periodo
        // pero amortiza solo parte (o nada) del capital, se cierra este ciclo con lo abonado
        // para dar paso a la siguiente cuota mensual calculada sobre el saldo pendiente
        if (
          prestamo.tipo_amortizacion === 'pago_unico' &&
          nuevoInteresPagado >= interesEsperado &&
          nuevoCapitalPagado < capitalEsperado
        ) {
          finalCapitalEsperado = nuevoCapitalPagado
          estaLiquidada = true
        }

        // Actualizar cuota si cambió
        if (
          nuevoInteresPagado !== interesPagado ||
          nuevoCapitalPagado !== capitalPagado ||
          finalCapitalEsperado !== capitalEsperado ||
          estaLiquidada !== cuota.esta_liquidada
        ) {
          await supabase
            .from('cuotas')
            .update({
              interes_pagado: nuevoInteresPagado,
              capital_pagado: nuevoCapitalPagado,
              capital_esperado: finalCapitalEsperado,
              esta_liquidada: estaLiquidada,
            })
            .eq('id', cuota.id)
            .eq('propietario_id', userId)
        }
      }

      // Si aún resta monto (abono libre a capital en préstamos de "solo interés" o excedente)
      if (montoRestante > 0) {
        const ultimaCuota = cuotas[cuotas.length - 1]
        distribucionesParaInsertar.push({
          pago_id: nuevoPago.id,
          cuota_id: ultimaCuota?.id || null,
          propietario_id: userId,
          componente: 'capital',
          monto: montoRestante,
        })

        if (ultimaCuota) {
          const capitalActual = ultimaCuota.capital_pagado || 0
          await supabase
            .from('cuotas')
            .update({
              capital_pagado: capitalActual + montoRestante,
            })
            .eq('id', ultimaCuota.id)
            .eq('propietario_id', userId)
        }
        montoRestante = 0
      }
    } else {
      // Sin cuotas registradas, distribuir directo a capital
      distribucionesParaInsertar.push({
        pago_id: nuevoPago.id,
        cuota_id: null,
        propietario_id: userId,
        componente: 'capital',
        monto: dto.monto,
      })
    }

    // Insertar registros en `distribucion_pagos`
    if (distribucionesParaInsertar.length > 0) {
      await supabase.from('distribucion_pagos').insert(distribucionesParaInsertar)
    }

    // Asentar movimiento en `movimientos_prestamo` para auditoría
    await supabase.from('movimientos_prestamo').insert({
      prestamo_id: dto.prestamo_id,
      propietario_id: userId,
      tipo_movimiento: 'pago',
      monto: dto.monto,
      fecha_efectiva: dto.fecha_recepcion,
      pago_origen_id: nuevoPago.id,
      notas: dto.notas?.trim() || `Pago recibido por ${dto.metodo_pago}`,
    })

    // Evaluar si la deuda total de capital ha sido saldada para marcar el préstamo como completado
    const { data: cuotasActualizadas } = await supabase
      .from('cuotas')
      .select('capital_pagado')
      .eq('prestamo_id', dto.prestamo_id)
      .eq('propietario_id', userId)

    const totalCapitalRecuperado = (cuotasActualizadas || []).reduce(
      (sum, c) => sum + (c.capital_pagado || 0),
      0
    )

    if (totalCapitalRecuperado >= prestamo.capital_original && prestamo.estado !== 'completado') {
      await supabase
        .from('prestamos')
        .update({ estado: 'completado' })
        .eq('id', dto.prestamo_id)
        .eq('propietario_id', userId)
    } else {
      // Si aún resta capital por recuperar, asegurar automáticamente la siguiente cuota mensual (rollover)
      // calculada exclusivamente sobre el saldo pendiente de capital
      await loansService.ensureNextInstallment(dto.prestamo_id, userId)
    }

    return nuevoPago as PaymentWithDetails
  },

  /**
   * Obtiene los pagos realizados sobre un préstamo específico
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
      .order('fecha_recepcion', { ascending: false })

    if (error) {
      throw new Error(`Error al consultar pagos: ${error.message}`)
    }

    return (data || []) as PaymentWithDetails[]
  },
}
