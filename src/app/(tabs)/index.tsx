import React from 'react'
import { View, Text, Pressable, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Wallet, Plus, Users, CreditCard, AlertTriangle, TrendingUp } from 'lucide-react-native'
import { useLoans } from '../../modules/loans/hooks/useLoans'
import { LoanCard } from '../../modules/loans/components/LoanCard'
import { formatCOP } from '../../shared/utils/currency'
import Animated, { FadeInDown, FadeInUp, useReducedMotion } from 'react-native-reanimated'
import { SkeletonCardList } from '../../shared/components/SkeletonBox'
import { AnimatedPressable } from '../../shared/components/AnimatedPressable'

export default function DashboardScreen() {
  const router = useRouter()
  const reducedMotion = useReducedMotion()
  const { allLoans, metrics, loading } = useLoans()

  const activeLoans = allLoans.filter((l) => l.estado === 'activo' || l.estado === 'en_mora')
  const recentLoans = allLoans.slice(0, 3)

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-[#060709]">
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabecera de Inicio */}
        <View className="flex-row items-center justify-between mb-5">
          <View>
            <Text className="text-white text-3xl font-bold tracking-tight">
              Dashboard
            </Text>
            <Text className="text-zinc-400 text-xs mt-0.5">
              Estado general de tu cartera privada
            </Text>
          </View>

          <View className="w-10 h-10 rounded-xl bg-[#191316] border border-[#2F191D] items-center justify-center">
            <Wallet size={20} color="#FF7854" />
          </View>
        </View>

        {/* Tarjeta Hero: Cartera Pendiente en Vivo */}
        <Animated.View
          entering={reducedMotion ? undefined : FadeInDown.duration(260).springify()}
          className="bg-[#12131A] border border-[#1E2030] rounded-3xl p-5 mb-5 shadow-2xl shadow-black"
        >
          <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
            Capital total pendiente
          </Text>

          <View className="flex-row items-baseline gap-2 mb-4">
            <Text className="text-white text-3xl font-extrabold font-mono tracking-tight">
              {formatCOP(metrics.totalCapitalPendiente)}
            </Text>
            <Text className="text-zinc-500 text-sm font-mono font-semibold">COP</Text>
          </View>

          {/* Desglose de Métricas del Dashboard */}
          <View className="grid grid-cols-2 gap-2.5 pt-3 border-t border-[#1C1E2B]">
            <View className="bg-[#0A0B10] rounded-2xl p-3 border border-[#161722]">
              <Text className="text-zinc-500 text-[11px] mb-1">Total prestado</Text>
              <Text className="text-white text-sm font-bold font-mono">
                {formatCOP(metrics.totalCapitalPrestado)}
              </Text>
              <Text className="text-zinc-500 text-[10px] mt-0.5">
                {activeLoans.length} créditos activos
              </Text>
            </View>

            <View className="bg-[#0A0B10] rounded-2xl p-3 border border-[#161722]">
              <Text className="text-zinc-500 text-[11px] mb-1">Interés cobrado</Text>
              <Text className="text-emerald-400 text-sm font-bold font-mono">
                {formatCOP(metrics.totalInteresCobrado)}
              </Text>
              <Text className="text-zinc-500 text-[10px] mt-0.5">Ganancia real</Text>
            </View>
          </View>

          {metrics.cuotasVencidasCount > 0 && (
            <View className="mt-3 bg-rose-500/10 border border-rose-500/25 p-2.5 rounded-xl flex-row items-center">
              <AlertTriangle size={15} color="#FB3758" />
              <Text className="text-[#FB3758] text-xs font-semibold ml-2">
                {metrics.cuotasVencidasCount}{' '}
                {metrics.cuotasVencidasCount === 1
                  ? 'obligación en mora'
                  : 'obligaciones en mora'}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Botones de Acción Rápida (4 Circulares / Píldoras Figma) */}
        <Animated.View
          entering={reducedMotion ? undefined : FadeInUp.delay(60).duration(260).springify()}
          className="flex-row gap-3 mb-6"
        >
          <AnimatedPressable
            onPress={() => router.push('/prestamos/crear')}
            containerClassName="flex-1"
            className="bg-[#D34524] active:bg-[#E54F2C] py-3 rounded-2xl items-center justify-center flex-row shadow-lg shadow-[#D34524]/20"
          >
            <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
            <Text className="text-white text-xs font-bold ml-1.5">Nuevo préstamo</Text>
          </AnimatedPressable>

          <AnimatedPressable
            onPress={() => router.push('/personas/crear')}
            containerClassName="flex-1"
            className="bg-[#151622] border border-[#232433] active:bg-[#1E2030] py-3 rounded-2xl items-center justify-center flex-row"
          >
            <Users size={16} color="#FF7854" />
            <Text className="text-white text-xs font-bold ml-1.5">Nueva persona</Text>
          </AnimatedPressable>
        </Animated.View>

        {/* Sección: Préstamos Recientes */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-3 px-1">
            <Text className="text-white text-base font-bold tracking-tight">
              Actividad de préstamos
            </Text>
            <Pressable onPress={() => router.push('/(tabs)/prestamos')}>
              <Text className="text-[#FF7854] text-xs font-semibold">Ver todos</Text>
            </Pressable>
          </View>

          {loading ? (
            <SkeletonCardList count={2} />
          ) : recentLoans.length === 0 ? (
            <View className="bg-[#12131A] border border-[#1E2030] rounded-3xl p-6 items-center">
              <CreditCard size={28} color="#6B7280" />
              <Text className="text-white text-sm font-bold mt-2">
                Aún no hay préstamos activos
              </Text>
              <Text className="text-zinc-400 text-xs text-center max-w-[240px] mt-1 mb-4">
                Registra a una persona y crea tu primer préstamo para ver métricas aquí.
              </Text>
              <Pressable
                onPress={() => router.push('/prestamos/crear')}
                className="bg-[#D34524] px-4 py-2 rounded-xl"
              >
                <Text className="text-white text-xs font-bold">+ Crear préstamo</Text>
              </Pressable>
            </View>
          ) : (
            recentLoans.map((loan) => <LoanCard key={loan.id} loan={loan} />)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
