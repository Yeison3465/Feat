import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { Calendar, ChevronRight, AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react-native'
import { LoanWithDetails } from '../types'
import { getInitials } from '../../../shared/utils/initials'
import { formatCOP, formatDateFriendly } from '../../../shared/utils/currency'
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useReducedMotion,
} from 'react-native-reanimated'

interface LoanCardProps {
  readonly loan: LoanWithDetails
}

export const LoanCard: React.FC<LoanCardProps> = ({ loan }) => {
  const router = useRouter()
  const reducedMotion = useReducedMotion()
  const scale = useSharedValue(1)
  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))
  const borrowerName = loan.persona?.nombre || 'Prestatario'
  const initials = getInitials(borrowerName)
  const isExempt = loan.persona?.exento_interes_ordinario || loan.tasa_mensual === 0
  const shortCode = `PR-${loan.id.slice(0, 4).toUpperCase()}`

  // Calcular saldos y cuota próxima
  const cuotas = loan.cuotas || []
  const proximaCuota = cuotas.find((c) => !c.esta_liquidada) || cuotas[0]
  const today = new Date().toISOString().split('T')[0]
  const isOverdue = proximaCuota && !proximaCuota.esta_liquidada && proximaCuota.fecha_vencimiento < today

  // Capital pendiente
  const totalCapitalPagado = cuotas.reduce((acc, c) => acc + (c.capital_pagado || 0), 0)
  const capitalPendiente = Math.max(0, loan.capital_original - totalCapitalPagado)
  const capitalRatio = loan.capital_original > 0 ? (totalCapitalPagado / loan.capital_original) * 100 : 0

  // Saldo exigible de la próxima obligación
  const saldoExigible = proximaCuota
    ? Math.max(0, proximaCuota.capital_esperado - proximaCuota.capital_pagado) +
      Math.max(0, proximaCuota.interes_esperado - proximaCuota.interes_pagado) +
      Math.max(0, proximaCuota.mora_acumulada - proximaCuota.mora_pagada)
    : capitalPendiente

  const getStatusBadge = () => {
    if (loan.estado === 'completado') {
      return (
        <View className="bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-full flex-row items-center">
          <CheckCircle2 size={12} color="#10B981" />
          <Text className="text-emerald-400 text-[11px] font-semibold ml-1">Completado</Text>
        </View>
      )
    }
    if (isOverdue || loan.estado === 'en_mora') {
      return (
        <View className="bg-rose-500/15 border border-rose-500/30 px-2.5 py-1 rounded-full flex-row items-center">
          <AlertTriangle size={12} color="#FB3758" />
          <Text className="text-[#FB3758] text-[11px] font-semibold ml-1">En mora</Text>
        </View>
      )
    }
    return (
      <View className="bg-[#D34524]/15 border border-[#D34524]/30 px-2.5 py-1 rounded-full flex-row items-center">
        <Text className="text-[#FF7854] text-[11px] font-semibold">Activo</Text>
      </View>
    )
  }

  return (
    <Animated.View
      entering={reducedMotion ? undefined : FadeInDown.duration(240).springify()}
      style={scaleStyle}
    >
      <Pressable
        onPressIn={() => {
          if (!reducedMotion) scale.value = withSpring(0.98, { damping: 16, stiffness: 300 })
        }}
        onPressOut={() => {
          if (!reducedMotion) scale.value = withSpring(1, { damping: 16, stiffness: 300 })
        }}
        onPress={() => router.push(`/prestamos/${loan.id}`)}
        className="bg-[#12131A] border border-[#1E2030] rounded-3xl p-5 mb-4 shadow-xl shadow-black active:border-[#D34524]/50"
      >
      {/* Cabecera de la Tarjeta */}
      <View className="flex-row items-center justify-between mb-3.5">
        <View className="flex-row items-center flex-1 mr-2">
          {/* Avatar Iniciales */}
          <View className="w-11 h-11 rounded-xl bg-[#191316] border border-[#2F191D] items-center justify-center mr-3">
            <Text className="text-[#FF7854] text-sm font-bold font-mono">
              {initials}
            </Text>
          </View>

          <View className="flex-1">
            <View className="flex-row items-center gap-1.5">
              <Text className="text-zinc-500 text-[11px] font-mono font-semibold">
                #{shortCode}
              </Text>
              {isExempt && (
                <View className="bg-amber-500/15 px-1.5 py-0.5 rounded">
                  <Text className="text-amber-400 text-[9px] font-bold uppercase">Exento</Text>
                </View>
              )}
            </View>
            <Text className="text-white text-[15px] font-bold tracking-tight" numberOfLines={1}>
              {borrowerName}
            </Text>
          </View>
        </View>

        {getStatusBadge()}
      </View>

      {/* Saldo Exigible Destacado */}
      <View className="bg-[#0A0B10] border border-[#1C1E2B] rounded-2xl p-3.5 mb-3.5">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-zinc-400 text-xs">
            {proximaCuota ? 'Saldo próxima obligación' : 'Capital total adeudado'}
          </Text>
          {proximaCuota && (
            <View className="flex-row items-center">
              <Calendar size={12} color={isOverdue ? '#FB3758' : '#9CA3AF'} />
              <Text
                className={`text-[11px] font-medium ml-1 ${
                  isOverdue ? 'text-[#FB3758] font-bold' : 'text-zinc-400'
                }`}
              >
                {formatDateFriendly(proximaCuota.fecha_vencimiento)}
              </Text>
            </View>
          )}
        </View>

        <View className="flex-row items-baseline gap-1.5">
          <Text className="text-white text-2xl font-extrabold font-mono tracking-tight">
            {formatCOP(saldoExigible)}
          </Text>
          <Text className="text-zinc-500 text-xs font-mono font-semibold">
            COP
          </Text>
        </View>
      </View>

      {/* Barra de Recuperación de Capital y Tasa */}
      <View className="space-y-1.5">
        <View className="flex-row justify-between items-center text-xs">
          <Text className="text-zinc-400 text-[11px]">
            Capital pendiente: <Text className="text-white font-medium">{formatCOP(capitalPendiente)}</Text>
          </Text>
          <Text className="text-zinc-500 text-[11px]">
            de {formatCOP(loan.capital_original)}
          </Text>
        </View>

        {/* Barra de progreso */}
        <View className="h-1.5 bg-[#1C1E2B] rounded-full overflow-hidden my-1">
          <View
            style={{ width: `${Math.min(100, Math.max(0, capitalRatio))}%` }}
            className="h-full bg-emerald-500 rounded-full"
          />
        </View>

        {/* Pie con tasa pactada y chevron */}
        <View className="flex-row items-center justify-between pt-1">
          <Text className="text-zinc-500 text-[11px]">
            {isExempt
              ? 'Tasa 0% pactada (Exento)'
              : `Tasa ordinaria: ${loan.tasa_mensual}% mensual`}
          </Text>
          <View className="flex-row items-center">
            <Text className="text-[#FF7854] text-xs font-semibold mr-0.5">
              Ver detalle
            </Text>
            <ChevronRight size={14} color="#FF7854" />
          </View>
        </View>
      </View>
    </Pressable>
  </Animated.View>
  )
}

