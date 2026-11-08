import React, { useEffect, useState, useCallback } from 'react'
import { View, BackHandler } from 'react-native'
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { paymentsService } from '../../modules/payments/services/payments.service'
import { useLoans } from '../../modules/loans/hooks/useLoans'
import { ErrorMessage } from '../../shared/components/ErrorMessage'
import { PaymentReceipt } from '../../modules/payments/components/PaymentReceipt'
import { Button } from '../../shared/ui/Button'
import { SkeletonCardList } from '../../shared/components/SkeletonBox'

export default function DetallePagoScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { id, origen } = useLocalSearchParams<{ id: string; origen?: string }>()
  const { reload: reloadLoans } = useLoans()
  // Recién registrado: volver debe llevar al préstamo, nunca al formulario de pago
  const fromRegistration = origen === 'registro'

  const [pago, setPago] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal de Reverso (FL-10)
  const [showReverseModal, setShowReverseModal] = useState(false)
  const [motivoReverso, setMotivoReverso] = useState('')
  const [reverseError, setReverseError] = useState<string | null>(null)
  const [reversing, setReversing] = useState(false)

  const loadPago = useCallback(async () => {
    if (!id) return
    try {
      setLoading(true)
      setError(null)
      const data = await paymentsService.getPaymentById(id)
      setPago(data)
    } catch (e: any) {
      setError(e.message || 'Error al consultar el comprobante de pago.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadPago()
  }, [loadPago])

  const prestamoId: string | undefined = pago?.prestamo_id

  const goToLoan = useCallback(() => {
    if (prestamoId) {
      router.dismissTo(`/prestamos/${prestamoId}`)
    } else {
      router.back()
    }
  }, [prestamoId, router])

  const handleBack = fromRegistration ? goToLoan : () => router.back()

  // Botón atrás físico de Android: tras registrar, también vuelve al préstamo
  useFocusEffect(
    useCallback(() => {
      if (!fromRegistration) return
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        goToLoan()
        return true
      })
      return () => sub.remove()
    }, [fromRegistration, goToLoan])
  )

  const handleConfirmReverse = async () => {
    if (!pago) return
    if (!motivoReverso.trim()) {
      setReverseError('Debes especificar el motivo de la corrección.')
      return
    }

    try {
      setReversing(true)
      setReverseError(null)
      await paymentsService.reversePayment(pago.id, motivoReverso.trim())
      setShowReverseModal(false)
      setMotivoReverso('')
      await Promise.all([loadPago(), reloadLoans()])
    } catch (e: any) {
      setReverseError(e.message || 'No se pudo reversar el pago.')
    } finally {
      setReversing(false)
    }
  }

  if (loading) {
    return (
      <View
        style={{ paddingTop: Math.max(insets.top, 20) }}
        className="flex-1 bg-[#0A0A0B] px-6 max-w-md mx-auto w-full"
      >
        <SkeletonCardList count={2} />
      </View>
    )
  }

  if (error || !pago) {
    return (
      <View
        style={{ paddingTop: Math.max(insets.top, 16) }}
        className="flex-1 bg-[#0A0A0B] px-6 justify-center items-center"
      >
        <ErrorMessage message={error || 'Comprobante no encontrado'} onRetry={loadPago} />
        <Button label="Volver" variant="ghost" size="sm" onPress={handleBack} style={{ marginTop: 16 }} />
      </View>
    )
  }

  return (
    <PaymentReceipt
      pago={pago}
      fromRegistration={fromRegistration}
      onBack={handleBack}
      onGoToLoan={goToLoan}
      onOpenReverse={() => {
        setReverseError(null)
        setShowReverseModal(true)
      }}
      reverse={{
        visible: showReverseModal,
        motivo: motivoReverso,
        error: reverseError,
        reversing,
        onChangeMotivo: (t) => {
          setMotivoReverso(t)
          if (reverseError) setReverseError(null)
        },
        onCancel: () => setShowReverseModal(false),
        onConfirm: handleConfirmReverse,
      }}
    />
  )
}
