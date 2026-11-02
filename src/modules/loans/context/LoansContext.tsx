import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { loansService } from '../services/loans.service'
import {
  CreateLoanDTO,
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
  loading: boolean
  refreshing: boolean
  error: string | null
  searchQuery: string
  estadoFilter: LoanStatus | 'todos'
  setSearchQuery: (query: string) => void
  setEstadoFilter: (estado: LoanStatus | 'todos') => void
  reload: () => Promise<void>
  createLoan: (dto: CreateLoanDTO) => Promise<LoanWithDetails>
  getLoanById: (id: string) => LoanWithDetails | undefined
  metrics: LoanSummaryMetrics
}

const LoansContext = createContext<LoansContextType | undefined>(undefined)

export const LoansProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session } = useAuth()
  const [allLoans, setAllLoans] = useState<LoanWithDetails[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [estadoFilter, setEstadoFilter] = useState<LoanStatus | 'todos'>('todos')

  const loadLoans = useCallback(async (isRefresh = false) => {
    if (!session) {
      setAllLoans([])
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
      const data = await loansService.getLoans()
      setAllLoans(data)
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

  // Métricas financieras calculadas en memoria con precisión para solo_interes, pago_unico y cuotas_fijas
  const metrics = useMemo<LoanSummaryMetrics>(() => {
    const today = new Date().toISOString().split('T')[0]
    let totalCapitalPrestado = 0
    let totalCapitalPendiente = 0
    let totalInteresEsperado = 0
    let totalInteresCobrado = 0
    let totalMoraCobrada = 0
    let cuotasVencidasCount = 0

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

          if (!cuota.esta_liquidada && cuota.fecha_vencimiento < today) {
            cuotasVencidasCount++
          }
        }
      }

      if (loan.estado !== 'completado') {
        totalCapitalPendiente += Math.max(0, loan.capital_original - loanCapitalPagado)
      }
    }

    return {
      totalCapitalPrestado,
      totalCapitalPendiente,
      totalInteresEsperado,
      totalInteresCobrado,
      totalMoraCobrada,
      cuotasVencidasCount,
    }
  }, [allLoans])

  const value = useMemo(
    () => ({
      loans: filteredLoans,
      allLoans,
      overdueObligations,
      upcomingObligations,
      loading,
      refreshing,
      error,
      searchQuery,
      estadoFilter,
      setSearchQuery,
      setEstadoFilter,
      reload: () => loadLoans(true),
      createLoan,
      getLoanById,
      metrics,
    }),
    [
      filteredLoans,
      allLoans,
      overdueObligations,
      upcomingObligations,
      loading,
      refreshing,
      error,
      searchQuery,
      estadoFilter,
      loadLoans,
      getLoanById,
      metrics,
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
