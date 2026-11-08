import React, { useState } from 'react'
import { View, Text, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ArrowLeft, AlertCircle } from 'lucide-react-native'
import { useLoans } from '../../modules/loans/hooks/useLoans'
import { paymentsService } from '../../modules/payments/services/payments.service'
import { PaymentForm } from '../../modules/payments/components/PaymentForm'
import { CreatePaymentDTO } from '../../modules/payments/types'
import { Button } from '../../shared/ui/Button'
import { colors, fonts } from '../../shared/theme/tokens'

export default function RegistrarPagoScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ prestamo_id?: string }>()
  const prestamoId = params.prestamo_id

  const { allLoans, loading: loansLoading, reload } = useLoans()
  const [submitting, setSubmitting] = useState(false)

  const loan = allLoans.find((l) => l.id === prestamoId)

  const handleSubmit = async (dto: CreatePaymentDTO) => {
    setSubmitting(true)
    try {
      const createdPayment = await paymentsService.createPayment(dto)
      await reload()
      // Redirigir al comprobante SCR-14 (Confirmación de pago); el origen hace que
      // "Volver" lleve al préstamo y nunca regrese a este formulario
      router.replace(`/pagos/${createdPayment.id}?origen=registro`)
    } finally {
      setSubmitting(false)
    }
  }

  if (loansLoading) {
    return (
      <View className="flex-1 bg-[#0A0A0B] items-center justify-center">
        <ActivityIndicator size="small" color="#F5F5F3" />
        <Text style={{ color: colors.muted2, fontFamily: fonts.regular, fontSize: 12, marginTop: 12 }}>Cargando datos del préstamo...</Text>
      </View>
    )
  }

  if (!loan) {
    return (
      <SafeAreaView className="flex-1 bg-[#0A0A0B] px-6 justify-center items-center">
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,107,94,0.14)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <AlertCircle size={28} color={colors.dangerSoft} />
        </View>
        <Text style={{ color: colors.warm, fontFamily: fonts.semibold, fontSize: 20, textAlign: 'center', marginBottom: 4 }}>
          Préstamo no encontrado
        </Text>
        <Text style={{ color: colors.muted2, fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, textAlign: 'center', maxWidth: 280, marginBottom: 24 }}>
          No se encontró el préstamo asociado para registrar este pago o no tienes permisos de acceso.
        </Text>
        <Button label="Volver" variant="ghost" size="sm" onPress={() => router.back()} icon={<ArrowLeft size={16} color={colors.warm} />} />
      </SafeAreaView>
    )
  }

  return (
    <PaymentForm
      loan={loan}
      onSubmit={handleSubmit}
      loading={submitting}
    />
  )
}
