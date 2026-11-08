import React, { useState, useEffect, useCallback } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { LoanForm } from '../../../modules/loans/components/LoanForm'
import { useLoans } from '../../../modules/loans/hooks/useLoans'
import { loansService } from '../../../modules/loans/services/loans.service'
import { CreateLoanDTO, LoanWithDetails } from '../../../modules/loans/types'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'

export default function EditarPrestamoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { getLoanById, updateLoan } = useLoans()

  const cachedLoan = id ? getLoanById(id) : undefined
  const [loan, setLoan] = useState<LoanWithDetails | null>(cachedLoan ?? null)
  const [loading, setLoading] = useState(!cachedLoan)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadLoan = useCallback(async () => {
    if (!id) return
    try {
      setLoading(true)
      setError(null)
      setLoan(await loansService.getLoanById(id))
    } catch (err: any) {
      setError(err.message || 'Error al cargar el préstamo.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (!cachedLoan) loadLoan()
  }, [cachedLoan, loadLoan])

  const handleUpdate = async (dto: CreateLoanDTO) => {
    if (!id) return
    try {
      setSaving(true)
      await updateLoan(id, dto)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <View className="flex-1 bg-[#0A0A0B] items-center justify-center">
        <ActivityIndicator size="small" color="#F5F5F3" />
      </View>
    )
  }

  if (error || !loan) {
    return (
      <View className="flex-1 bg-[#0A0A0B] px-6 justify-center items-center">
        <ErrorMessage
          message={error || 'No se encontró el préstamo a editar.'}
          onRetry={loadLoan}
        />
      </View>
    )
  }

  return <LoanForm initialData={loan} onSubmit={handleUpdate} loading={saving} />
}
