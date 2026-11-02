import React, { useState } from 'react'
import { View, Text, Pressable, ScrollView, Linking } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  ArrowLeft,
  Phone,
  Calendar,
  Lock,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from 'lucide-react-native'
import { LoanWithDetails, LoanConditionsSnapshot } from '../types'
import { InstallmentCard } from './InstallmentCard'
import { getInitials } from '../../../shared/utils/initials'
import { formatCOP, formatDateFriendly } from '../../../shared/utils/currency'
import { getSafeBottomInset } from '../../../shared/utils/responsive'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'

interface LoanDetailViewProps {
  readonly loan: LoanWithDetails
}

export const LoanDetailView: React.FC<LoanDetailViewProps> = ({ loan }) => {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [showSnapshot, setShowSnapshot] = useState(false)

  const borrowerName = loan.persona?.nombre || 'Prestatario'
  const initials = getInitials(borrowerName)
  const shortCode = `PR-${loan.id.slice(0, 4).toUpperCase()}`

  // Parse snapshot
  const snapshot = loan.resumen_condiciones as unknown as LoanConditionsSnapshot | null

  // Métricas financieras calculadas
  const cuotas = loan.cuotas || []
  const totalCapitalPagado = cuotas.reduce((acc, c) => acc + (c.capital_pagado || 0), 0)
  const capitalPendiente = Math.max(0, loan.capital_original - totalCapitalPagado)
  const totalInteresEsperado = cuotas.reduce((acc, c) => acc + (c.interes_esperado || 0), 0)
  const totalInteresPagado = cuotas.reduce((acc, c) => acc + (c.interes_pagado || 0), 0)
  const totalMoraAcumulada = cuotas.reduce((acc, c) => acc + (c.mora_acumulada || 0), 0)
  const totalMoraPagada = cuotas.reduce((acc, c) => acc + (c.mora_pagada || 0), 0)

  // Saldo exigible
  const proximaCuota = cuotas.find((c) => !c.esta_liquidada) || cuotas[0]
  const today = new Date().toISOString().split('T')[0]
  const isOverdue = proximaCuota && !proximaCuota.esta_liquidada && proximaCuota.fecha_vencimiento < today

  const saldoExigibleTotal =
    capitalPendiente +
    Math.max(0, totalInteresEsperado - totalInteresPagado) +
    Math.max(0, totalMoraAcumulada - totalMoraPagada)

  const handleCall = () => {
    if (loan.persona?.telefono) {
      Linking.openURL(`tel:${loan.persona.telefono}`)
    }
  }

  const getStatusBadge = () => {
    if (loan.estado === 'completado') {
      return (
        <View className="bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-full flex-row items-center">
          <CheckCircle2 size={13} color="#10B981" />
          <Text className="text-emerald-400 text-xs font-semibold ml-1.5">Completado</Text>
        </View>
      )
    }
    if (isOverdue || loan.estado === 'en_mora') {
      return (
        <View className="bg-rose-500/15 border border-rose-500/30 px-3 py-1 rounded-full flex-row items-center">
          <AlertTriangle size={13} color="#FB3758" />
          <Text className="text-[#FB3758] text-xs font-semibold ml-1.5">En mora</Text>
        </View>
      )
    }
    return (
      <View className="bg-[#D34524]/15 border border-[#D34524]/30 px-3 py-1 rounded-full flex-row items-center">
        <Text className="text-[#FF7854] text-xs font-semibold">Activo</Text>
      </View>
    )
  }

  return (
    <View style={{ paddingTop: Math.max(insets.top, 12) }} className="flex-1 bg-[#060709]">
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: getSafeBottomInset(insets.bottom, 20) + 72,
        }}
        keyboardShouldPersistTaps="handled"
        className="px-6 max-w-md mx-auto w-full"
      >
        {/* Cabecera superior con Volver y Código */}
        <Animated.View
          entering={FadeInDown.duration(260)}
          className="flex-row items-center justify-between mt-2 mb-5"
        >
          <Pressable
            onPress={() => router.back()}
            className="flex-row items-center py-2 pr-4"
            hitSlop={10}
          >
            <ArrowLeft size={20} color="#9CA3AF" />
            <Text className="text-zinc-400 text-sm font-medium ml-2">Volver</Text>
          </Pressable>

          <View className="flex-row items-center gap-2">
            <Text className="text-zinc-500 text-xs font-mono font-semibold">
              #{shortCode}
            </Text>
            {getStatusBadge()}
          </View>
        </Animated.View>

        {/* Ficha del Prestatario (Clickeable hacia Detalle de Persona) */}
        <Animated.View
          entering={FadeInDown.delay(70).duration(300).springify()}
          className="bg-[#12131A] border border-[#1E2030] rounded-3xl p-5 mb-5 shadow-2xl shadow-black"
        >
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={() => router.push(`/personas/${loan.persona_id}`)}
              className="flex-row items-center flex-1 mr-3 active:opacity-75"
            >
              <View className="w-13 h-13 rounded-2xl bg-[#191316] border border-[#2F191D] items-center justify-center mr-3.5 shadow-md shadow-black">
                <Text className="text-[#FF7854] text-lg font-bold font-mono">
                  {initials}
                </Text>
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-white text-lg font-bold tracking-tight" numberOfLines={1}>
                    {borrowerName}
                  </Text>
                  <ChevronRight size={17} color="#FF7854" />
                </View>
                <Text className="text-zinc-400 text-xs mt-0.5">
                  {loan.persona?.direccion || 'Toca para ver perfil completo'}
                </Text>
              </View>
            </Pressable>

            {loan.persona?.telefono && (
              <Pressable
                onPress={handleCall}
                className="w-10 h-10 rounded-xl bg-[#0A0B10] border border-[#232433] items-center justify-center active:bg-[#1E2030]"
              >
                <Phone size={18} color="#FF7854" />
              </Pressable>
            )}
          </View>

          {loan.persona?.exento_interes_ordinario && (
            <View className="mt-3.5 bg-amber-500/10 border border-amber-500/25 p-2.5 rounded-xl flex-row items-center">
              <ShieldCheck size={16} color="#F59E0B" />
              <Text className="text-amber-400 text-xs font-medium ml-2">
                Prestatario con exención de interés ordinario (Tasa pactada 0%).
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Panel Hero: Métricas Financieras del Préstamo */}
        <Animated.View
          entering={FadeInDown.delay(140).duration(300).springify()}
          className="bg-[#12131A] border border-[#1E2030] rounded-3xl p-5 mb-5 shadow-2xl shadow-black"
        >
          <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
            Saldo total adeudado
          </Text>

          <View className="flex-row items-baseline gap-2 mb-4">
            <Text className="text-white text-3xl font-extrabold font-mono tracking-tight">
              {formatCOP(saldoExigibleTotal)}
            </Text>
            <Text className="text-zinc-500 text-sm font-mono font-semibold">COP</Text>
          </View>

          {/* Grid de 2 Columnas para Desglose */}
          <View className="grid grid-cols-2 gap-2.5 pt-3 border-t border-[#1C1E2B]">
            {/* Capital Original vs Pendiente */}
            <View className="bg-[#0A0B10] rounded-2xl p-3 border border-[#161722]">
              <Text className="text-zinc-500 text-[11px] mb-1">Capital pendiente</Text>
              <Text className="text-white text-base font-bold font-mono">
                {formatCOP(capitalPendiente)}
              </Text>
              <Text className="text-zinc-500 text-[10px] mt-0.5">
                de {formatCOP(loan.capital_original)}
              </Text>
            </View>

            {/* Intereses Generados vs Cobrados */}
            <View className="bg-[#0A0B10] rounded-2xl p-3 border border-[#161722]">
              <Text className="text-zinc-500 text-[11px] mb-1">Interés cobrado</Text>
              <Text className="text-emerald-400 text-base font-bold font-mono">
                {formatCOP(totalInteresPagado)}
              </Text>
              <Text className="text-zinc-500 text-[10px] mt-0.5">
                esperado: {formatCOP(totalInteresEsperado)}
              </Text>
            </View>
          </View>

          {totalMoraAcumulada > 0 && (
            <View className="mt-2.5 bg-rose-500/10 border border-rose-500/25 p-3 rounded-2xl flex-row justify-between items-center">
              <Text className="text-rose-400 text-xs font-medium">Mora registrada:</Text>
              <Text className="text-rose-400 text-xs font-bold font-mono">
                {formatCOP(totalMoraAcumulada)} COP
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Snapshot Inmutable de Condiciones Pactadas */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(300).springify()}
          className="bg-[#12131A] border border-[#1E2030] rounded-3xl p-5 mb-5 shadow-xl shadow-black"
        >
          <Pressable
            onPress={() => setShowSnapshot(!showSnapshot)}
            className="flex-row items-center justify-between"
          >
            <View className="flex-row items-center">
              <Lock size={16} color="#FF7854" />
              <Text className="text-white text-sm font-bold ml-2">
                Términos contractuales congelados
              </Text>
            </View>
            {showSnapshot ? (
              <ChevronUp size={18} color="#9CA3AF" />
            ) : (
              <ChevronDown size={18} color="#9CA3AF" />
            )}
          </Pressable>

          {showSnapshot && (
            <View className="mt-4 pt-3 border-t border-[#1C1E2B] space-y-2">
              <View className="flex-row justify-between text-xs py-1">
                <Text className="text-zinc-400 text-xs">Tasa ordinaria mensual:</Text>
                <Text className="text-white text-xs font-mono font-bold">
                  {loan.tasa_mensual}% mensual
                </Text>
              </View>
              <View className="flex-row justify-between text-xs py-1">
                <Text className="text-zinc-400 text-xs">Modalidad:</Text>
                <Text className="text-white text-xs font-semibold capitalize">
                  {loan.tipo_amortizacion.replace('_', ' ')}
                </Text>
              </View>
              <View className="flex-row justify-between text-xs py-1">
                <Text className="text-zinc-400 text-xs">Fecha de desembolso:</Text>
                <Text className="text-white text-xs font-mono">
                  {loan.fecha_desembolso}
                </Text>
              </View>
              <View className="flex-row justify-between text-xs py-1">
                <Text className="text-zinc-400 text-xs">Días de gracia pactados:</Text>
                <Text className="text-white text-xs font-mono">
                  {snapshot?.dias_gracia ?? 3} días
                </Text>
              </View>
              <Text className="text-zinc-500 text-[10px] mt-2 italic leading-3.5">
                Snapshot congelado al momento del desembolso. Modificar la tasa en la configuración
                general no altera las condiciones de este préstamo.
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Sección: Calendario de Cuotas (SCR-11) */}
        <Animated.View
          entering={FadeInUp.delay(260).duration(300).springify()}
          className="mb-6"
        >
          <View className="flex-row items-center justify-between mb-3 px-1">
            <Text className="text-white text-base font-bold tracking-tight">
              Cuotas y obligaciones
            </Text>
            <Text className="text-zinc-500 text-xs font-mono">
              {cuotas.length} {cuotas.length === 1 ? 'cuota' : 'cuotas'}
            </Text>
          </View>

          {cuotas.length === 0 ? (
            <View className="bg-[#12131A] border border-[#1E2030] rounded-2xl p-6 items-center">
              <Clock size={24} color="#6B7280" />
              <Text className="text-zinc-400 text-xs mt-2 text-center">
                No hay obligaciones registradas para este préstamo.
              </Text>
            </View>
          ) : (
            cuotas.map((installment) => (
              <InstallmentCard key={installment.id} installment={installment} />
            ))
          )}
        </Animated.View>
      </ScrollView>

      {/* Footer Ergonómico Pinned con Botón Registrar Pago (Bloque 4) */}
      <Animated.View
        entering={FadeInUp.delay(300).duration(280)}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingBottom: getSafeBottomInset(insets.bottom, 20),
          paddingTop: 12,
          paddingHorizontal: 24,
        }}
        className="bg-[#060709] border-t border-[#161722]"
      >
        <View className="max-w-md mx-auto w-full">
          <Pressable
            onPress={() => router.push(`/pagos/registrar?prestamo_id=${loan.id}`)}
            style={{ height: 52 }}
            className="w-full rounded-2xl bg-[#D34524] active:bg-[#E54F2C] items-center justify-center flex-row shadow-lg shadow-[#D34524]/20"
          >
            <CreditCard size={18} color="#FFFFFF" />
            <Text className="text-white text-[15px] font-bold tracking-wide ml-2">
              Registrar pago
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  )
}

