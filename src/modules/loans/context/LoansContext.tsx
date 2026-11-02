import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { loansService } from '../services/loans.service'
import {
  CreateLoanDTO,
  LoanFilter,
  LoanStatus,
  LoanSummaryMetrics,
  LoanWithDetails,
} from '../types'
import { useAuth } from '../../auth/hooks/useAuth'

interface LoansContextType {
  loans: LoanWithDetails[]
  allLoans: LoanWithDetails[]
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

  // Filtrado reactivo en memoria con 0 ms de latencia
  const filteredLoans = useMemo(() => {
    let result = allLoans

    if (estadoFilter !== 'todos') {
      result = result.filter((l) => l.estado === estadoFilter)
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

  // Métricas financieras calculadas en memoria
  const metrics = useMemo<LoanSummaryMetrics>(() => {
    const today = new Date().toISOString().split('T')[0]
    let totalCapitalPrestado = 0
    let totalCapitalPendiente = 0
    let totalInteresEsperado = 0
    let totalInteresCobrado = 0
    let totalMoraCobrada = 0
    let cuotasVencidasCount = 0

    for (const loan of allLoans) {
      totalCapitalPrestado += loan.capital_original

      if (loan.cuotas && loan.cuotas.length > 0) {
        for (const cuota of loan.cuotas) {
          totalInteresEsperado += cuota.interes_esperado
          totalInteresCobrado += cuota.interes_pagado
          totalMoraCobrada += cuota.mora_pagada

          const capPendienteCuota = Math.max(0, cuota.capital_esperado - cuota.capital_pagado)
          totalCapitalPendiente += capPendienteCuota

          if (!cuota.esta_liquidada && cuota.fecha_vencimiento < today) {
            cuotasVencidasCount++
          }
        }
      } else {
        totalCapitalPendiente += loan.capital_original
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

