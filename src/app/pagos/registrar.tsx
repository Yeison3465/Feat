import React, { useState } from 'react'
import { View, Text, ActivityIndicator, Pressable } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ArrowLeft, AlertCircle } from 'lucide-react-native'
import { useLoans } from '../../modules/loans/hooks/useLoans'
import { paymentsService } from '../../modules/payments/services/payments.service'
import { PaymentForm } from '../../modules/payments/components/PaymentForm'
import { CreatePaymentDTO } from '../../modules/payments/types'

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
      <View className="flex-1 bg-[#060709] items-center justify-center">
        <ActivityIndicator size="small" color="#FF7854" />
        <Text className="text-zinc-400 text-xs mt-3">Cargando datos del préstamo...</Text>
      </View>
    )
  }

  if (!loan) {
    return (
      <SafeAreaView className="flex-1 bg-[#060709] px-6 justify-center items-center">
        <View className="w-16 h-16 rounded-2xl bg-[#160E12] border border-[#2F191D] items-center justify-center mb-4">
          <AlertCircle size={28} color="#FB3758" />
        </View>
        <Text className="text-white text-lg font-bold text-center mb-1">
          Préstamo no encontrado
        </Text>
        <Text className="text-zinc-400 text-xs text-center max-w-[260px] mb-6">
          No se encontró el préstamo asociado para registrar este pago o no tienes permisos de acceso.
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="bg-[#151622] border border-[#232433] px-5 py-2.5 rounded-xl flex-row items-center"
        >
          <ArrowLeft size={16} color="#FF7854" />
          <Text className="text-[#FF7854] text-xs font-semibold ml-2">Volver</Text>
        </Pressable>
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
