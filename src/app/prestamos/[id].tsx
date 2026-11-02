import React, { useState, useEffect, useCallback } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useLoans } from '../../modules/loans/hooks/useLoans'
import { loansService } from '../../modules/loans/services/loans.service'
import { LoanWithDetails } from '../../modules/loans/types'
import { LoanDetailView } from '../../modules/loans/components/LoanDetailView'
import { ErrorMessage } from '../../shared/components/ErrorMessage'

export default function DetallePrestamoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { getLoanById } = useLoans()

  const cachedLoan = id ? getLoanById(id) : undefined
  const [loan, setLoan] = useState<LoanWithDetails | null>(cachedLoan ?? null)
  const [loading, setLoading] = useState(!cachedLoan)
  const [error, setError] = useState<string | null>(null)

  const loadLoan = useCallback(async () => {
    if (!id) return
    try {
      if (!cachedLoan) setLoading(true)
      setError(null)
      const data = await loansService.getLoanById(id)
      setLoan(data)
    } catch (err: any) {
      if (!cachedLoan) {
        setError(err.message || 'Error al cargar los detalles del préstamo.')
      }
    } finally {
      setLoading(false)
    }
  }, [id, cachedLoan])

  useEffect(() => {
    if (!cachedLoan) {
      loadLoan()
    } else {
      setLoan(cachedLoan)
    }
  }, [cachedLoan, loadLoan])

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
          onRetry={loadLoan}
        />
      </View>
    )
  }

  return <LoanDetailView loan={loan} />
}
