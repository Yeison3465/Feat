import { supabase } from '../../../lib/supabase'
import { settingsService } from '../../settings/services/settings.service'
import {
  CreateLoanDTO,
  LoanConditionsSnapshot,
  LoanFilter,
  LoanWithDetails,
} from '../types'

export const loansService = {
  /**
   * Sincroniza estados ('activo' <-> 'en_mora') y liquida mora idempotente
   * según los días de gracia pactados y la configuración del titular.
   */
  async syncOverdueAndLateFees(): Promise<void> {
    try {
      const { error } = await supabase.rpc('sincronizar_estados_y_mora')
      if (error) {
        console.warn('Advertencia al sincronizar estados y mora:', error.message)
      }
    } catch (err) {
      console.warn('Error no bloqueante en syncOverdueAndLateFees:', err)
    }
  },

  async getLoans(filter?: LoanFilter): Promise<LoanWithDetails[]> {
    await this.syncOverdueAndLateFees()

    let query = supabase
      .from('prestamos')
      .select('*, persona:personas(id, nombre, telefono, direccion, exento_interes_ordinario), cuotas(*)')
      .order('creado_en', { ascending: false })

    if (filter?.estado && filter.estado !== 'todos') {
      query = query.eq('estado', filter.estado)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Error al consultar préstamos: ${error.message}`)
    }

    let loans = (data ?? []) as unknown as LoanWithDetails[]

    if (filter?.searchQuery?.trim()) {
      const q = filter.searchQuery.trim().toLowerCase()
      loans = loans.filter(
        (l) =>
          l.persona?.nombre?.toLowerCase().includes(q) ||
          l.id.toLowerCase().includes(q)
      )
    }

    return loans
  },

  /**
   * Evalúa y genera automáticamente la siguiente cuota mensual (rollover) para
   * préstamos de 'solo_interes' o 'pago_unico' cuando todas las obligaciones previas
   * han sido liquidadas pero aún resta capital pendiente por recuperar.
   * El interés de la nueva cuota se liquida exclusivamente sobre el nuevo saldo de capital.
   */
  async ensureNextInstallment(prestamoId: string, userId: string): Promise<boolean> {
    const { data: prestamo, error: pErr } = await supabase
      .from('prestamos')
      .select('id, capital_original, estado, tasa_mensual, tipo_amortizacion, persona_id, personas(exento_interes_ordinario)')
      .eq('id', prestamoId)
      .eq('propietario_id', userId)
      .single()

    if (pErr || !prestamo || prestamo.estado === 'completado') return false

    // Aplica a modalidades con renovación periódica sobre capital pendiente
    if (prestamo.tipo_amortizacion !== 'solo_interes' && prestamo.tipo_amortizacion !== 'pago_unico') {
      return false
    }

    const { data: cuotas, error: cErr } = await supabase
      .from('cuotas')
      .select('*')
      .eq('prestamo_id', prestamoId)
      .eq('propietario_id', userId)
      .order('numero_cuota', { ascending: true })

    if (cErr || !cuotas || cuotas.length === 0) return false

    const totalCapitalPagado = cuotas.reduce((sum, c) => sum + (c.capital_pagado || 0), 0)
    const capitalPendiente = Math.max(0, prestamo.capital_original - totalCapitalPagado)

    // Si ya no existe capital pendiente, el crédito queda completado
    if (capitalPendiente <= 0) {
      await supabase
        .from('prestamos')
        .update({ estado: 'completado' })
        .eq('id', prestamoId)
        .eq('propietario_id', userId)
      return false
    }

    // Verificar si todas las cuotas previas están liquidadas
    const todasLiquidadas = cuotas.every((c) => c.esta_liquidada)
    if (!todasLiquidadas) return false

    // Generar la siguiente cuota mensual
    const ultimaCuota = cuotas[cuotas.length - 1]
    const nuevoNumero = (ultimaCuota?.numero_cuota || 0) + 1

    const baseDate = new Date((ultimaCuota?.fecha_vencimiento || new Date().toISOString().split('T')[0]) + 'T00:00:00')
    baseDate.setMonth(baseDate.getMonth() + 1)
    const yyyy = baseDate.getFullYear()
    const mm = String(baseDate.getMonth() + 1).padStart(2, '0')
    const dd = String(baseDate.getDate()).padStart(2, '0')
    const proximaFecha = `${yyyy}-${mm}-${dd}`

    const exento = (prestamo.personas as any)?.exento_interes_ordinario ?? false
    const tasa = exento ? 0 : prestamo.tasa_mensual
    const nuevoInteres = Math.round(capitalPendiente * (tasa / 100))
    const nuevoCapital = prestamo.tipo_amortizacion === 'pago_unico' ? capitalPendiente : 0

    const { error: insErr } = await supabase.from('cuotas').insert({
      prestamo_id: prestamoId,
      propietario_id: userId,
      numero_cuota: nuevoNumero,
      fecha_vencimiento: proximaFecha,
      capital_esperado: nuevoCapital,
      interes_esperado: nuevoInteres,
      capital_pagado: 0,
      interes_pagado: 0,
      mora_acumulada: 0,
      mora_pagada: 0,
      esta_liquidada: false,
    })

    if (insErr) {
      console.warn('Error al auto-generar siguiente cuota:', insErr.message)
      return false
    }

    await supabase
      .from('prestamos')
      .update({ fecha_vencimiento_final: proximaFecha })
      .eq('id', prestamoId)
      .eq('propietario_id', userId)

    return true
  },

  async getLoanById(id: string): Promise<LoanWithDetails> {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      await this.ensureNextInstallment(id, user.id)
    }

    const { data, error } = await supabase
      .from('prestamos')
      .select('*, persona:personas(id, nombre, telefono, direccion, exento_interes_ordinario), cuotas(*)')
      .eq('id', id)
      .single()

    if (error) {
      throw new Error(`Error al consultar detalle del préstamo: ${error.message}`)
    }

    // Ordenar cuotas cronológicamente por número de cuota
    const loan = data as unknown as LoanWithDetails
    if (loan.cuotas) {
      loan.cuotas.sort((a, b) => a.numero_cuota - b.numero_cuota)
    }

    return loan
  },

  async createLoan(dto: CreateLoanDTO): Promise<LoanWithDetails> {
    if (!dto.persona_id) {
      throw new Error('Debes seleccionar un prestatario válido.')
    }

    if (!dto.capital_original || dto.capital_original <= 0) {
      throw new Error('El capital original debe ser mayor a cero pesos.')
    }

    if (!dto.fecha_primer_vencimiento) {
      throw new Error('La fecha del primer vencimiento es requerida.')
    }

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser()

    if (authErr || !user) {
      throw new Error('Debes tener una sesión activa para registrar préstamos.')
    }

    // 1. Obtener la persona para comprobar exención y datos actuales
    const { data: persona, error: personError } = await supabase
      .from('personas')
      .select('id, nombre, telefono, direccion, exento_interes_ordinario')
      .eq('id', dto.persona_id)
      .single()

    if (personError || !persona) {
      throw new Error('No se encontró el prestatario seleccionado.')
    }

    // 2. Obtener configuración predeterminada
    const settings = await settingsService.getSettings()

    // 3. Determinar tasa mensual: si la persona está exenta y no se forzó otra tasa, es 0%
    let tasaMensual = settings.tasa_mensual_defecto
    if (persona.exento_interes_ordinario) {
      tasaMensual = dto.tasa_mensual ?? 0
    } else if (dto.tasa_mensual !== undefined) {
      tasaMensual = dto.tasa_mensual
    }

    const tasaMora = dto.tasa_mora ?? settings.tasa_mora_defecto
    const tipoAmortizacion = dto.tipo_amortizacion ?? 'solo_interes'
    const numeroCuotas = Math.max(1, dto.numero_cuotas ?? 1)
    const fechaDesembolso = dto.fecha_desembolso ?? new Date().toISOString().split('T')[0]

    // 4. Construir el snapshot inmutable de condiciones pactadas
    const snapshot: LoanConditionsSnapshot = {
      persona_nombre: persona.nombre,
      persona_id: persona.id,
      capital_original: dto.capital_original,
      tasa_mensual_pactada: tasaMensual,
      tasa_mora_pactada: tasaMora,
      dias_gracia: settings.dias_gracia_defecto ?? 3,
      exento_interes: persona.exento_interes_ordinario && tasaMensual === 0,
      tipo_amortizacion: tipoAmortizacion,
      numero_cuotas: numeroCuotas,
      fecha_desembolso: fechaDesembolso,
      fecha_primer_vencimiento: dto.fecha_primer_vencimiento,
      fecha_creacion: new Date().toISOString(),
    }

    // 5. Insertar préstamo en Supabase
    const { data: loan, error: loanErr } = await supabase
      .from('prestamos')
      .insert({
        propietario_id: user.id,
        persona_id: persona.id,
        capital_original: dto.capital_original,
        tasa_mensual: tasaMensual,
        tasa_mora: tasaMora,
        tipo_amortizacion: tipoAmortizacion,
        fecha_desembolso: fechaDesembolso,
        fecha_primer_vencimiento: dto.fecha_primer_vencimiento,
        fecha_vencimiento_final: dto.fecha_primer_vencimiento,
        resumen_condiciones: snapshot as any,
        estado: 'activo',
      })
      .select()
      .single()

    if (loanErr || !loan) {
      throw new Error(`Error al registrar el préstamo: ${loanErr?.message}`)
    }

    // 6. Generar cuotas iniciales según la modalidad
    const cuotasPayload = []
    const totalInteres = Math.round(dto.capital_original * (tasaMensual / 100))

    if (tipoAmortizacion === 'solo_interes') {
      // 1 obligación periódica con el interés devengado
      cuotasPayload.push({
        propietario_id: user.id,
        prestamo_id: loan.id,
        numero_cuota: 1,
        fecha_vencimiento: dto.fecha_primer_vencimiento,
        capital_esperado: 0,
        interes_esperado: totalInteres,
        capital_pagado: 0,
        interes_pagado: 0,
        mora_acumulada: 0,
        mora_pagada: 0,
        esta_liquidada: false,
      })
    } else if (tipoAmortizacion === 'pago_unico') {
      // Capital + interés en una sola cuota
      cuotasPayload.push({
        propietario_id: user.id,
        prestamo_id: loan.id,
        numero_cuota: 1,
        fecha_vencimiento: dto.fecha_primer_vencimiento,
        capital_esperado: dto.capital_original,
        interes_esperado: totalInteres,
        capital_pagado: 0,
        interes_pagado: 0,
        mora_acumulada: 0,
        mora_pagada: 0,
        esta_liquidada: false,
      })
    } else if (tipoAmortizacion === 'cuotas_fijas') {
      const capitalPorCuota = Math.floor(dto.capital_original / numeroCuotas)
      const interesPorCuota = Math.floor(totalInteres / numeroCuotas)
      let capitalAcumulado = 0
      let interesAcumulado = 0

      for (let i = 1; i <= numeroCuotas; i++) {
        // Calcular fecha de vencimiento incremental mensual
        const baseDate = new Date(dto.fecha_primer_vencimiento)
        baseDate.setMonth(baseDate.getMonth() + (i - 1))
        const fechaCuota = baseDate.toISOString().split('T')[0]

        // Ajustar centavos/redondeo en la última cuota para exactitud de suma
        const cap = i === numeroCuotas ? dto.capital_original - capitalAcumulado : capitalPorCuota
        const inte = i === numeroCuotas ? totalInteres - interesAcumulado : interesPorCuota
        capitalAcumulado += cap
        interesAcumulado += inte

        cuotasPayload.push({
          propietario_id: user.id,
          prestamo_id: loan.id,
          numero_cuota: i,
          fecha_vencimiento: fechaCuota,
          capital_esperado: cap,
          interes_esperado: inte,
          capital_pagado: 0,
          interes_pagado: 0,
          mora_acumulada: 0,
          mora_pagada: 0,
          esta_liquidada: false,
        })
      }
    }

    if (cuotasPayload.length > 0) {
      const { error: cuotasErr } = await supabase.from('cuotas').insert(cuotasPayload)
      if (cuotasErr) {
        throw new Error(`Error al generar calendario de cuotas: ${cuotasErr.message}`)
      }
    }

    // 7. Registrar asiento en movimientos_prestamo (tipo desembolso)
    const { error: movErr } = await supabase.from('movimientos_prestamo').insert({
      propietario_id: user.id,
      prestamo_id: loan.id,
      monto: dto.capital_original,
      tipo_movimiento: 'desembolso',
      fecha_efectiva: fechaDesembolso,
      notas: dto.notas?.trim() || 'Desembolso inicial de cartera',
      metadatos: {
        persona_id: persona.id,
        persona_nombre: persona.nombre,
      },
    })

    if (movErr) {
      console.warn('Advertencia al registrar movimiento de desembolso:', movErr.message)
    }

    // 8. Retornar préstamo con relaciones completas
    return this.getLoanById(loan.id)
  },
}
