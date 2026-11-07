import React, { useState, useCallback } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useFocusEffect, useRouter } from 'expo-router'
import { useLoans } from '../../modules/loans/hooks/useLoans'
import { loansService } from '../../modules/loans/services/loans.service'
import { paymentsService } from '../../modules/payments/services/payments.service'
import { LoanWithDetails } from '../../modules/loans/types'
import { LoanMovementItem, PaymentWithDetails } from '../../modules/payments/types'
import { LoanDetailView } from '../../modules/loans/components/LoanDetailView'
import { ErrorMessage } from '../../shared/components/ErrorMessage'
import { ConfirmModal } from '../../shared/components/ConfirmModal'

type PendingAction = 'delete' | 'edit-blocked' | null

export default function DetallePrestamoScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { getLoanById, deleteLoan } = useLoans()
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

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

  const handleEdit = () => {
    // Un préstamo con pagos no se edita: los pagos confirmados son inmutables
    if (payments.length > 0) {
      setPendingAction('edit-blocked')
      return
    }
    router.push(`/prestamos/editar/${loan.id}`)
  }

  const handleConfirmDelete = async () => {
    try {
      setDeleting(true)
      setDeleteError(null)
      await deleteLoan(loan.id)
      setPendingAction(null)
      router.back()
    } catch (err: any) {
      setDeleteError(err.message || 'Error al eliminar el préstamo.')
    } finally {
      setDeleting(false)
    }
  }

  const closeModal = () => {
    setPendingAction(null)
    setDeleteError(null)
  }

  const deleteMessage =
    payments.length > 0
      ? `Este préstamo tiene ${payments.length} ${payments.length === 1 ? 'pago registrado' : 'pagos registrados'}. Se eliminarán también sus cuotas, pagos y movimientos. Esta acción no se puede deshacer.`
      : 'Se eliminarán el préstamo, sus cuotas y su registro de desembolso. Esta acción no se puede deshacer.'

  return (
    <>
      <LoanDetailView
        loan={loan}
        payments={payments}
        movements={movements}
        historyLoading={historyLoading}
        onEdit={historyLoading ? undefined : handleEdit}
        onDelete={historyLoading ? undefined : () => setPendingAction('delete')}
      />

      <ConfirmModal
        visible={pendingAction === 'delete'}
        title="¿Eliminar préstamo?"
        message={deleteMessage}
        confirmLabel="Eliminar"
        destructive
        loading={deleting}
        error={deleteError}
        onCancel={closeModal}
        onConfirm={handleConfirmDelete}
      />

      <ConfirmModal
        visible={pendingAction === 'edit-blocked'}
        title="No se puede editar"
        message="Este préstamo ya tiene pagos registrados. Para corregirlo, reversa primero los pagos o elimina el préstamo y créalo de nuevo."
        onCancel={closeModal}
      />
    </>
  )
}
