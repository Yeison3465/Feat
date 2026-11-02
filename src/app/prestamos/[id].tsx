import React, { useState, useCallback } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useFocusEffect } from 'expo-router'
import { useLoans } from '../../modules/loans/hooks/useLoans'
import { loansService } from '../../modules/loans/services/loans.service'
import { paymentsService } from '../../modules/payments/services/payments.service'
import { LoanWithDetails } from '../../modules/loans/types'
import { LoanMovementItem, PaymentWithDetails } from '../../modules/payments/types'
import { LoanDetailView } from '../../modules/loans/components/LoanDetailView'
import { ErrorMessage } from '../../shared/components/ErrorMessage'

export default function DetallePrestamoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { getLoanById } = useLoans()

  const cachedLoan = id ? getLoanById(id) : undefined
  const [loan, setLoan] = useState<LoanWithDetails | null>(cachedLoan ?? null)
  const [payments, setPayments] = useState<PaymentWithDetails[]>([])
  const [movements, setMovements] = useState<LoanMovementItem[]>([])
  const [loading, setLoading] = useState(!cachedLoan)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAll = useCallback(async () => {
    if (!id) return
    try {
      if (!loan) setLoading(true)
      setHistoryLoading(true)
      setError(null)

      const [freshLoan, loanPayments, loanMovements] = await Promise.all([
        loansService.getLoanById(id),
        paymentsService.getPaymentsByLoan(id),
        paymentsService.getMovementsByLoan(id),
      ])

      setLoan(freshLoan)
      setPayments(loanPayments)
      setMovements(loanMovements)
    } catch (err: any) {
      if (!loan) {
        setError(err.message || 'Error al cargar los detalles del préstamo.')
      }
    } finally {
      setLoading(false)
      setHistoryLoading(false)
    }
  }, [id])

  useFocusEffect(
    useCallback(() => {
      loadAll()
    }, [loadAll])
  )

  if (loading) {
    return (
      <View className="flex-1 bg-[#060709] items-center justify-center">
        <ActivityIndicator size="small" color="#FF7854" />
      </View>
    )
  }

  if (error || !loan) {
    return (
      <View className="flex-1 bg-[#060709] px-6 justify-center items-center">
        <ErrorMessage
          message={error || 'No se encontró la información del préstamo solicitado.'}
          onRetry={loadAll}
        />
      </View>
    )
  }

  return (
    <LoanDetailView
      loan={loan}
      payments={payments}
      movements={movements}
      historyLoading={historyLoading}
    />
  )
}
