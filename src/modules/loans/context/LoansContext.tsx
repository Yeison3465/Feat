import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { loansService } from '../services/loans.service'
import { paymentsService } from '../../payments/services/payments.service'
import {
  ActiveBorrowerSummary,
  ChartPoint,
  CreateLoanDTO,
  DashboardPeriod,
  LoanConditionsSnapshot,
  LoanStatus,
  LoanSummaryMetrics,
  LoanWithDetails,
  ObligationItem,
} from '../types'
import { useAuth } from '../../auth/hooks/useAuth'

interface LoansContextType {
  loans: LoanWithDetails[]
  allLoans: LoanWithDetails[]
  overdueObligations: ObligationItem[]
  upcomingObligations: ObligationItem[]
  activeBorrowers: ActiveBorrowerSummary[]
  loading: boolean
  refreshing: boolean
  error: string | null
  searchQuery: string
  estadoFilter: LoanStatus | 'todos'
  dashboardPeriod: DashboardPeriod
  chartData: ChartPoint[]
  metrics: LoanSummaryMetrics
  setSearchQuery: (query: string) => void
  setEstadoFilter: (estado: LoanStatus | 'todos') => void
  setDashboardPeriod: (period: DashboardPeriod) => void
  reload: () => Promise<void>
  createLoan: (dto: CreateLoanDTO) => Promise<LoanWithDetails>
  updateLoan: (id: string, dto: CreateLoanDTO) => Promise<LoanWithDetails>
  deleteLoan: (id: string) => Promise<void>
  getLoanById: (id: string) => LoanWithDetails | undefined
}

const LoansContext = createContext<LoansContextType | undefined>(undefined)

export const LoansProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session } = useAuth()
  const [allLoans, setAllLoans] = useState<LoanWithDetails[]>([])
  const [allPayments, setAllPayments] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [estadoFilter, setEstadoFilter] = useState<LoanStatus | 'todos'>('todos')
  const [dashboardPeriod, setDashboardPeriod] = useState<DashboardPeriod>('mes_actual')

  const loadLoans = useCallback(async (isRefresh = false) => {
    if (!session) {
      setAllLoans([])
      setAllPayments([])
      setLoading(false)
      return
    }

    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)
      const [loansData, paymentsData] = await Promise.all([
        loansService.getLoans(),
        paymentsService.getAllConfirmedPayments().catch(() => []),
      ])
      setAllLoans(loansData)
      setAllPayments(paymentsData)
    } catch (err: any) {
      setError(err.message || 'Error al cargar los préstamos de la cartera.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [session])

  useEffect(() => {
    if (session) {
      loadLoans()
    } else {
      setAllLoans([])
      setAllPayments([])
      setLoading(false)
    }
  }, [session, loadLoans])

  // Filtrado reactivo en memoria con 0 ms de latencia y coherencia con cuotas vencidas
  const filteredLoans = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    let result = allLoans

    if (estadoFilter !== 'todos') {
      result = result.filter((l) => {
        const hasOverdueInstallment = (l.cuotas ?? []).some(
          (c) => !c.esta_liquidada && c.fecha_vencimiento < today
        )

        if (estadoFilter === 'en_mora') {
          return (
            l.estado === 'en_mora' ||
            (l.estado === 'activo' && hasOverdueInstallment)
          )
        }

        if (estadoFilter === 'activo') {
          return l.estado === 'activo' && !hasOverdueInstallment
        }

        return l.estado === estadoFilter
      })
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      result = result.filter(
        (l) =>
          l.persona?.nombre?.toLowerCase().includes(q) ||
          l.id.toLowerCase().includes(q)
      )
    }

    return result
  }, [allLoans, estadoFilter, searchQuery])

  // Crear préstamo e insertar instantáneamente en memoria
  const createLoan = async (dto: CreateLoanDTO): Promise<LoanWithDetails> => {
    const created = await loansService.createLoan(dto)
    setAllLoans((prev) => [created, ...prev])
    return created
  }

  // Editar préstamo y reemplazarlo en memoria
  const updateLoan = async (id: string, dto: CreateLoanDTO): Promise<LoanWithDetails> => {
    const updated = await loansService.updateLoan(id, dto)
    setAllLoans((prev) => prev.map((l) => (l.id === id ? updated : l)))
    return updated
  }

  // Eliminar préstamo y retirarlo de memoria (los pagos asociados también desaparecen)
  const deleteLoan = async (id: string): Promise<void> => {
    await loansService.deleteLoan(id)
    setAllLoans((prev) => prev.filter((l) => l.id !== id))
    setAllPayments((prev) => prev.filter((p) => p.prestamo_id !== id))
  }

  const getLoanById = useCallback(
    (id: string) => allLoans.find((l) => l.id === id),
    [allLoans]
  )

  // Listas operativas de Atrasados (SCR-17) y Próximos Vencimientos (SCR-18)
  const { overdueObligations, upcomingObligations } = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0]
    const todayMs = new Date(`${todayStr}T00:00:00`).getTime()
    const overdue: ObligationItem[] = []
    const upcoming: ObligationItem[] = []

    for (const loan of allLoans) {
      if (loan.estado === 'completado' || loan.estado === 'cancelado') continue

      const snapshot = (loan.resumen_condiciones as unknown as LoanConditionsSnapshot) || null
      const diasGracia = snapshot?.dias_gracia ?? 3

      const totalCapPagado = (loan.cuotas ?? []).reduce(
        (sum, c) => sum + (c.capital_pagado || 0),
        0
      )
      const capitalPendientePrestamo = Math.max(0, loan.capital_original - totalCapPagado)

      const sortedCuotas = [...(loan.cuotas ?? [])].sort(
        (a, b) => a.numero_cuota - b.numero_cuota
      )

      for (const cuota of sortedCuotas) {
        if (cuota.esta_liquidada) continue

        const dueMs = new Date(`${cuota.fecha_vencimiento}T00:00:00`).getTime()
        const daysDiff = Math.round((dueMs - todayMs) / (1000 * 60 * 60 * 24))

        const moraPendiente = Math.max(0, (cuota.mora_acumulada || 0) - (cuota.mora_pagada || 0))
        const interesPendiente = Math.max(
          0,
          (cuota.interes_esperado || 0) - (cuota.interes_pagado || 0)
        )
        const capCuotaPendiente = Math.max(
          0,
          (cuota.capital_esperado || 0) - (cuota.capital_pagado || 0)
        )
        const saldoExigible = moraPendiente + interesPendiente + capCuotaPendiente

        const item: ObligationItem = {
          installment: cuota,
          loan,
          borrowerName: loan.persona?.nombre ?? snapshot?.persona_nombre ?? 'Prestatario',
          borrowerPhone: loan.persona?.telefono ?? null,
          daysDiff,
          inGracePeriod: daysDiff < 0 && Math.abs(daysDiff) <= diasGracia,
          diasGracia,
          saldoExigible,
          moraPendiente,
          interesPendiente,
          capitalPendientePrestamo,
        }

        if (daysDiff < 0) {
          overdue.push(item)
        } else {
          upcoming.push(item)
        }
      }
    }

    // Atrasados: ordenar desde el más antiguo (mayor atraso primero)
    overdue.sort((a, b) => a.daysDiff - b.daysDiff)
    // Próximos vencimientos: ordenar desde el que vence más pronto (hoy primero)
    upcoming.sort((a, b) => a.daysDiff - b.daysDiff)

    return { overdueObligations: overdue, upcomingObligations: upcoming }
  }, [allLoans])

  // Métricas financieras calculadas con estricto apego a las 9 definiciones del PDF
  const metrics = useMemo<LoanSummaryMetrics>(() => {
    const today = new Date().toISOString().split('T')[0]
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    let totalCapitalPrestado = 0
    let totalCapitalPendiente = 0
    let totalInteresEsperado = 0
    let totalInteresCobrado = 0
    let totalMoraCobrada = 0
    let totalInteresPendiente = 0
    let saldoMoraVencido = 0

    const personasPendientesSet = new Set<string>()

    for (const loan of allLoans) {
      if (loan.estado === 'cancelado') continue

      totalCapitalPrestado += loan.capital_original
      let loanCapitalPagado = 0

      if (loan.cuotas && loan.cuotas.length > 0) {
        for (const cuota of loan.cuotas) {
          totalInteresEsperado += cuota.interes_esperado || 0
          totalInteresCobrado += cuota.interes_pagado || 0
          totalMoraCobrada += cuota.mora_pagada || 0
          loanCapitalPagado += cuota.capital_pagado || 0

          if (!cuota.esta_liquidada) {
            const intPend = Math.max(0, (cuota.interes_esperado || 0) - (cuota.interes_pagado || 0))
            totalInteresPendiente += intPend

            if (cuota.fecha_vencimiento < today) {
              const moraPend = Math.max(0, (cuota.mora_acumulada || 0) - (cuota.mora_pagada || 0))
              saldoMoraVencido += moraPend
            }
          }
        }
      }

      if (loan.estado !== 'completado') {
        const capPendiente = Math.max(0, loan.capital_original - loanCapitalPagado)
        totalCapitalPendiente += capPendiente
        if (capPendiente > 0 || (loan.cuotas && loan.cuotas.some((c) => !c.esta_liquidada))) {
          personasPendientesSet.add(loan.persona_id)
        }
      }
    }

    // Regla de oro contable (pág. 12): Ganancia real = Intereses recibidos + Mora recibida (el capital recuperado NO es ganancia)
    const gananciasTotalesCobradas = totalInteresCobrado + totalMoraCobrada
    const carteraTotalPendiente = totalCapitalPendiente + totalInteresPendiente + saldoMoraVencido

    // Personas atrasadas desduplicadas por persona_id (pág. 12)
    const personasAtrasadasSet = new Set<string>(overdueObligations.map((o) => o.loan.persona_id))
    const personasAtrasadasCount = personasAtrasadasSet.size
    const cuotasVencidasCount = overdueObligations.length
    const personasPendientesCount = personasPendientesSet.size
    const proximosVencimientosCount = upcomingObligations.length

    // Recaudo del periodo filtrado (mes actual, últimos 30 días, o histórico)
    let recaudoPeriodo = 0
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    for (const p of allPayments) {
      const pDate = new Date(p.fecha_recepcion || p.creado_en)
      const pMonto = Number(p.monto) || 0

      if (dashboardPeriod === 'historico') {
        recaudoPeriodo += pMonto
      } else if (dashboardPeriod === 'ultimos_30d') {
        if (pDate >= thirtyDaysAgo && pDate <= now) {
          recaudoPeriodo += pMonto
        }
      } else {
        // mes_actual
        if (pDate.getFullYear() === currentYear && pDate.getMonth() === currentMonth) {
          recaudoPeriodo += pMonto
        }
      }
    }

    // Métricas Detalladas / Avanzadas
    const totalCapitalPagado = Math.max(0, totalCapitalPrestado - totalCapitalPendiente)
    const tasaRecuperacionPct = totalCapitalPrestado > 0 ? (totalCapitalPagado / totalCapitalPrestado) * 100 : 0
    const rendimientoRoiPct = totalCapitalPrestado > 0 ? (gananciasTotalesCobradas / totalCapitalPrestado) * 100 : 0
    const indiceMorosidadPct = carteraTotalPendiente > 0 ? (saldoMoraVencido / carteraTotalPendiente) * 100 : 0

    const carteraPorModalidad = {
      soloInteres: 0,
      cuotasFijas: 0,
      pagoUnico: 0,
    }

    let activeLoansCount = 0
    let totalCuotasVencidasHistoricas = 0
    let totalCuotasPagadasHistoricas = 0

    for (const loan of allLoans) {
      if (loan.estado === 'cancelado') continue
      if (loan.estado !== 'completado') {
        activeLoansCount++
        const capPag = (loan.cuotas ?? []).reduce((sum, c) => sum + (c.capital_pagado || 0), 0)
        const capPend = Math.max(0, loan.capital_original - capPag)
        if (loan.tipo_amortizacion === 'solo_interes') {
          carteraPorModalidad.soloInteres += capPend
        } else if (loan.tipo_amortizacion === 'cuotas_fijas') {
          carteraPorModalidad.cuotasFijas += capPend
        } else if (loan.tipo_amortizacion === 'pago_unico') {
          carteraPorModalidad.pagoUnico += capPend
        }
      }

      if (loan.cuotas) {
        for (const c of loan.cuotas) {
          if (c.fecha_vencimiento <= today) {
            totalCuotasVencidasHistoricas++
            if (c.esta_liquidada) {
              totalCuotasPagadasHistoricas++
            }
          }
        }
      }
    }

    const ticketPromedio = activeLoansCount > 0 ? totalCapitalPendiente / activeLoansCount : 0
    const tasaEfectividadCobroPct =
      totalCuotasVencidasHistoricas > 0
        ? (totalCuotasPagadasHistoricas / totalCuotasVencidasHistoricas) * 100
        : 100

    return {
      totalCapitalPrestado,
      totalCapitalPendiente,
      totalInteresEsperado,
      totalInteresCobrado,
      totalMoraCobrada,
      gananciasTotalesCobradas,
      totalInteresPendiente,
      carteraTotalPendiente,
      personasAtrasadasCount,
      cuotasVencidasCount,
      saldoMoraVencido,
      personasPendientesCount,
      recaudoPeriodo,
      proximosVencimientosCount,
      totalCapitalPagado,
      tasaRecuperacionPct,
      rendimientoRoiPct,
      indiceMorosidadPct,
      ticketPromedio,
      carteraPorModalidad,
      tasaEfectividadCobroPct,
    }
  }, [allLoans, allPayments, overdueObligations, upcomingObligations, dashboardPeriod])

  // Prestatarios activos consolidados para acceso rápido en Inicio
  const activeBorrowers = useMemo<ActiveBorrowerSummary[]>(() => {
    const today = new Date().toISOString().split('T')[0]
    const map = new Map<string, ActiveBorrowerSummary>()

    for (const loan of allLoans) {
      if (loan.estado === 'completado' || loan.estado === 'cancelado') continue

      const capPagado = (loan.cuotas ?? []).reduce((sum, c) => sum + (c.capital_pagado || 0), 0)
      const capPend = Math.max(0, loan.capital_original - capPagado)
      const intPend = (loan.cuotas ?? []).reduce(
        (sum, c) => sum + Math.max(0, (c.interes_esperado || 0) - (c.interes_pagado || 0)),
        0
      )
      const moraPend = (loan.cuotas ?? []).reduce(
        (sum, c) => sum + Math.max(0, (c.mora_acumulada || 0) - (c.mora_pagada || 0)),
        0
      )
      const totalLoanDebt = capPend + intPend + moraPend

      const hasOverdue = (loan.cuotas ?? []).some(
        (c) => !c.esta_liquidada && c.fecha_vencimiento < today
      )

      const personaId = loan.persona_id
      const nombre =
        loan.persona?.nombre || (loan.resumen_condiciones as any)?.persona_nombre || 'Prestatario'
      const telefono = loan.persona?.telefono || null

      if (!map.has(personaId)) {
        map.set(personaId, {
          personaId,
          nombre,
          telefono,
          totalSaldoPendiente: totalLoanDebt,
          activeLoansCount: 1,
          hasOverdue,
        })
      } else {
        const existing = map.get(personaId)!
        existing.totalSaldoPendiente += totalLoanDebt
        existing.activeLoansCount += 1
        if (hasOverdue) existing.hasOverdue = true
      }
    }

    return Array.from(map.values()).sort((a, b) => b.totalSaldoPendiente - a.totalSaldoPendiente)
  }, [allLoans])

  // Puntos del gráfico de área (AreaChartCard Figma: Sem 1 a 4 o meses)
  const chartData = useMemo<ChartPoint[]>(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    if (dashboardPeriod === 'historico') {
      // Últimos 6 meses
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
      const points: ChartPoint[] = []

      for (let i = 5; i >= 0; i--) {
        const d = new Date(currentYear, currentMonth - i, 1)
        const y = d.getFullYear()
        const m = d.getMonth()
        const label = monthNames[m]

        const sumMonth = allPayments
          .filter((p) => {
            const pDate = new Date(p.fecha_recepcion || p.creado_en)
            return pDate.getFullYear() === y && pDate.getMonth() === m
          })
          .reduce((sum, p) => sum + (Number(p.monto) || 0), 0)

        points.push({ label, amount: sumMonth })
      }
      return points
    }

    // Mes actual o últimos 30 días: 4 semanas (Figma: Sem 1 - 4)
    const points: ChartPoint[] = [
      { label: 'Sem 1', amount: 0 },
      { label: 'Sem 2', amount: 0 },
      { label: 'Sem 3', amount: 0 },
      { label: 'Sem 4', amount: 0 },
    ]

    for (const p of allPayments) {
      const pDate = new Date(p.fecha_recepcion || p.creado_en)
      const pMonto = Number(p.monto) || 0

      if (dashboardPeriod === 'mes_actual') {
        if (pDate.getFullYear() === currentYear && pDate.getMonth() === currentMonth) {
          const day = pDate.getDate()
          const weekIndex = Math.min(3, Math.floor((day - 1) / 7))
          points[weekIndex].amount += pMonto
        }
      } else {
        // ultimos_30d
        const diffDays = Math.floor((now.getTime() - pDate.getTime()) / (1000 * 60 * 60 * 24))
        if (diffDays >= 0 && diffDays <= 30) {
          const bucketIndex = Math.min(3, Math.floor(diffDays / 7.5))
          // Orden cronológico: 3 semanas atrás (Sem 1) hasta esta semana (Sem 4)
          const chronIndex = 3 - bucketIndex
          points[chronIndex].amount += pMonto
        }
      }
    }

    return points
  }, [allPayments, dashboardPeriod])

  const value = useMemo(
    () => ({
      loans: filteredLoans,
      allLoans,
      overdueObligations,
      upcomingObligations,
      activeBorrowers,
      loading,
      refreshing,
      error,
      searchQuery,
      estadoFilter,
      dashboardPeriod,
      chartData,
      metrics,
      setSearchQuery,
      setEstadoFilter,
      setDashboardPeriod,
      reload: () => loadLoans(true),
      createLoan,
      updateLoan,
      deleteLoan,
      getLoanById,
    }),
    [
      filteredLoans,
      allLoans,
      overdueObligations,
      upcomingObligations,
      activeBorrowers,
      loading,
      refreshing,
      error,
      searchQuery,
      estadoFilter,
      dashboardPeriod,
      chartData,
      metrics,
      loadLoans,
      getLoanById,
    ]
  )

  return <LoansContext.Provider value={value}>{children}</LoansContext.Provider>
}

export function useLoansContext() {
  const context = useContext(LoansContext)
  if (!context) {
    throw new Error('useLoansContext debe ser utilizado dentro de un LoansProvider')
  }
  return context
}
