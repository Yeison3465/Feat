import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { Calendar, CheckCircle2, Clock, AlertTriangle, ChevronRight } from 'lucide-react-native'
import { LoanInstallment } from '../types'
import { formatCOP, formatDateFriendly } from '../../../shared/utils/currency'
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useReducedMotion,
} from 'react-native-reanimated'

interface InstallmentCardProps {
  readonly installment: LoanInstallment
  readonly onPress?: () => void
}

export const InstallmentCard: React.FC<InstallmentCardProps> = ({ installment, onPress }) => {
  const reducedMotion = useReducedMotion()
  const scale = useSharedValue(1)
  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))
  const today = new Date().toISOString().split('T')[0]
  const isOverdue = !installment.esta_liquidada && installment.fecha_vencimiento < today

  const totalEsperado = installment.capital_esperado + installment.interes_esperado
  const totalPagado =
    installment.capital_pagado + installment.interes_pagado + installment.mora_pagada
  const interesRestante = Math.max(0, installment.interes_esperado - installment.interes_pagado)
  const capitalRestante = Math.max(0, installment.capital_esperado - installment.capital_pagado)
  const moraRestante = Math.max(0, installment.mora_acumulada - installment.mora_pagada)
  const saldoRestante = interesRestante + capitalRestante + moraRestante

  const getStatusBadge = () => {
    if (installment.esta_liquidada) {
      return (
        <View className="bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex-row items-center">
          <CheckCircle2 size={11} color="#10B981" />
          <Text className="text-emerald-400 text-[10px] font-semibold ml-1">Pagada</Text>
        </View>
      )
    }
    if (isOverdue) {
      return (
        <View className="bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 rounded-full flex-row items-center">
          <AlertTriangle size={11} color="#FB3758" />
          <Text className="text-[#FB3758] text-[10px] font-semibold ml-1">Atrasada</Text>
        </View>
      )
    }
    return (
      <View className="bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full flex-row items-center">
        <Clock size={11} color="#F59E0B" />
        <Text className="text-amber-400 text-[10px] font-semibold ml-1">Pendiente</Text>
      </View>
    )
  }

  return (
    <Animated.View
      entering={reducedMotion ? undefined : FadeInDown.duration(380).springify().damping(18).stiffness(160)}
      style={scaleStyle}
    >
      <Pressable
        onPressIn={() => {
          if (!reducedMotion && onPress) scale.value = withSpring(0.98, { damping: 16, stiffness: 300 })
        }}
        onPressOut={() => {
          if (!reducedMotion) scale.value = withSpring(1, { damping: 16, stiffness: 300 })
        }}
        onPress={onPress}
        className="bg-[#101119] border border-[#1C1E2B] active:border-[#2C2F45] rounded-2xl p-4 mb-3"
      >
      {/* Cabecera de Cuota */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center">
          <View className="w-6 h-6 rounded-md bg-[#1C1E2B] items-center justify-center mr-2">
            <Text className="text-white text-xs font-bold font-mono">
              #{installment.numero_cuota}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Calendar size={13} color="#9CA3AF" />
            <Text className="text-zinc-400 text-xs font-medium ml-1.5">
              {formatDateFriendly(installment.fecha_vencimiento)}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-1.5">
          {getStatusBadge()}
          {onPress && <ChevronRight size={15} color="#6B7280" />}
        </View>
      </View>

      {/* Montos Desglosados */}
      <View className="bg-[#0A0B10] rounded-xl p-3 border border-[#161722] mb-2">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-zinc-500 text-xs">Obligación del periodo:</Text>
          <Text className="text-white text-sm font-bold font-mono">
            {formatCOP(totalEsperado)}
          </Text>
        </View>

        <View className="flex-row justify-between items-center text-[11px] pt-1 border-t border-[#161722]">
          <Text className="text-zinc-400 text-[11px]">
            Capital:{' '}
            {installment.capital_pagado > installment.capital_esperado
              ? `${formatCOP(installment.capital_pagado)} abonado`
              : formatCOP(installment.capital_esperado)}
          </Text>
          <Text className="text-[#FF7854] text-[11px]">
            Interés: {formatCOP(installment.interes_esperado)}
          </Text>
        </View>

        {installment.mora_acumulada > 0 && (
          <View className="flex-row justify-between items-center pt-1 border-t border-[#161722]">
            <Text className="text-rose-400 text-[11px]">Mora acumulada:</Text>
            <Text className="text-rose-400 text-[11px] font-mono">
              {formatCOP(installment.mora_acumulada)}
            </Text>
          </View>
        )}
      </View>

      {/* Estado del Pago */}
      <View className="flex-row justify-between items-center px-1">
        <Text className="text-zinc-500 text-[11px]">
          Recaudado:{' '}
          <Text className="text-emerald-400 font-medium font-mono">
            {formatCOP(totalPagado)}
          </Text>
        </Text>
        {saldoRestante > 0 ? (
          <Text className="text-zinc-400 text-[11px]">
            Resta:{' '}
            <Text className="text-white font-semibold font-mono">
              {formatCOP(saldoRestante)}
            </Text>
          </Text>
        ) : (
          <Text className="text-emerald-400 text-[11px] font-semibold">
            Periodo liquidado
          </Text>
        )}
      </View>
    </Pressable>
    </Animated.View>
  )
}
