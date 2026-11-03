import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { AlertTriangle, ChevronRight, ShieldCheck } from 'lucide-react-native'
import { formatCOP } from '../../../shared/utils/currency'
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated'

interface OverdueAlertBannerProps {
  readonly personasAtrasadasCount: number
  readonly cuotasVencidasCount: number
  readonly saldoMoraVencido: number
}

export const OverdueAlertBanner: React.FC<OverdueAlertBannerProps> = ({
  personasAtrasadasCount,
  cuotasVencidasCount,
  saldoMoraVencido,
}) => {
  const router = useRouter()
  const reducedMotion = useReducedMotion()

  if (personasAtrasadasCount <= 0 && cuotasVencidasCount <= 0) {
    return (
      <Animated.View
        key="overdue-clean"
        entering={reducedMotion ? undefined : FadeInDown.delay(60).duration(380).springify()}
        className="bg-[#064E3B]/15 border border-[#065F46]/40 rounded-2xl p-3.5 mb-5 flex-row items-center justify-between"
      >
        <View className="flex-row items-center flex-1 mr-2">
          <View className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 items-center justify-center mr-2.5">
            <ShieldCheck size={16} color="#10B981" />
          </View>
          <View className="flex-1">
            <Text className="text-emerald-400 text-xs font-bold">
              Cartera 100% al día
            </Text>
            <Text className="text-zinc-400 text-[10px] mt-0.5">
              No tienes ningún prestatario con obligaciones vencidas hoy.
            </Text>
          </View>
        </View>
      </Animated.View>
    )
  }

  return (
    <Animated.View
      key="overdue-alert"
      entering={reducedMotion ? undefined : FadeInDown.delay(60).duration(380).springify().damping(18).stiffness(160)}
    >
      <Pressable
        onPress={() => router.push({ pathname: '/vencimientos', params: { tab: 'atrasados' } })}
        className="bg-rose-950/20 border border-[#FB3758]/50 active:bg-rose-950/35 rounded-2xl p-4 mb-5 shadow-lg shadow-rose-950/20"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 mr-2">
            <View className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 items-center justify-center mr-3">
              <AlertTriangle size={18} color="#FB3758" />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-white text-xs font-bold uppercase tracking-wider">
                  Atención requerida
                </Text>
                <View className="bg-[#FB3758] px-1.5 py-0.2 rounded-full">
                  <Text className="text-white text-[9px] font-bold">
                    {personasAtrasadasCount} {personasAtrasadasCount === 1 ? 'persona' : 'personas'}
                  </Text>
                </View>
              </View>
              <Text className="text-zinc-300 text-xs mt-0.5">
                {cuotasVencidasCount} {cuotasVencidasCount === 1 ? 'cuota vencida' : 'cuotas vencidas'} pendientes por cobrar
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-1">
            <Text className="text-[#FB3758] text-xs font-bold">
              Cobrar
            </Text>
            <ChevronRight size={15} color="#FB3758" />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  )
}

