import React, { useState } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { LoanForm } from '../../modules/loans/components/LoanForm'
import { useLoans } from '../../modules/loans/hooks/useLoans'
import { CreateLoanDTO } from '../../modules/loans/types'

export default function CrearPrestamoScreen() {
  const { persona_id } = useLocalSearchParams<{ persona_id?: string }>()
  const [loading, setLoading] = useState(false)
  const { createLoan } = useLoans()

  const handleCreate = async (dto: CreateLoanDTO) => {
    try {
      setLoading(true)
      await createLoan(dto)
    } finally {
      setLoading(false)
    }
  }

  return (
    <LoanForm
      onSubmit={handleCreate}
      loading={loading}
      preselectedPersonId={persona_id}
    />
  )
}
