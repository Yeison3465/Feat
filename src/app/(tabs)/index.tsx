import React from 'react'
import { View, Text, Pressable, ScrollView, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import {
  Wallet,
  Plus,
  Users,
  CreditCard,
  ChevronRight,
  CalendarClock,
  Sparkles,
} from 'lucide-react-native'
import { useLoans } from '../../modules/loans/hooks/useLoans'
import { LoanCard } from '../../modules/loans/components/LoanCard'
import { DashboardPeriodSelector } from '../../modules/loans/components/DashboardPeriodSelector'
import { AreaChartCard } from '../../modules/loans/components/AreaChartCard'
import { OverdueAlertBanner } from '../../modules/loans/components/OverdueAlertBanner'
import { DashboardMetricsGrid } from '../../modules/loans/components/DashboardMetricsGrid'
import { UpcomingDueSection } from '../../modules/loans/components/UpcomingDueSection'
import { QuickBorrowersSection } from '../../modules/loans/components/QuickBorrowersSection'
import { formatCOP } from '../../shared/utils/currency'
import Animated, { FadeInDown, FadeInUp, useReducedMotion } from 'react-native-reanimated'
import { SkeletonCardList } from '../../shared/components/SkeletonBox'
import { AnimatedPressable } from '../../shared/components/AnimatedPressable'

export default function DashboardScreen() {
  const router = useRouter()
  const reducedMotion = useReducedMotion()
  const {
    allLoans,
    metrics,
    loading,
    refreshing,
    reload,
    dashboardPeriod,
    setDashboardPeriod,
    chartData,
    upcomingObligations,
    activeBorrowers,
  } = useLoans()

  const recentLoans = allLoans.slice(0, 3)

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: '#060709' }}
      edges={['top']}
      className="flex-1 bg-[#060709]"
    >
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={reload}
            tintColor="#FF7854"
            colors={['#FF7854']}
          />
        }
      >
        {/* Cabecera Principal */}
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <View className="flex-row items-center gap-1.5 mb-1">
              <View className="w-1.5 h-1.5 rounded-full bg-[#FF7854]" />
              <Text className="text-zinc-400 text-[11px] font-mono font-bold tracking-widest uppercase">
                FEAT
              </Text>
            </View>
            <Text className="text-white text-3xl font-bold tracking-tight">
              Dashboard
            </Text>
            <Text className="text-zinc-400 text-xs mt-0.5">
              Estado general de tu cartera privada
            </Text>
          </View>

          <View className="w-11 h-11 rounded-2xl bg-[#191316] border border-[#2F191D] items-center justify-center shadow-lg shadow-black">
            <Wallet size={20} color="#FF7854" />
          </View>
        </View>

        {/* Selector de Periodo (RF-013) */}
        <DashboardPeriodSelector
          selectedPeriod={dashboardPeriod}
          onSelectPeriod={setDashboardPeriod}
        />

        {/* Banner de Alerta Urgente: Personas en Mora */}
        <OverdueAlertBanner
          personasAtrasadasCount={metrics.personasAtrasadasCount}
          cuotasVencidasCount={metrics.cuotasVencidasCount}
          saldoMoraVencido={metrics.saldoMoraVencido}
        />

        {/* Tarjeta Hero: Cartera Total Pendiente (FL-08) */}
        <Animated.View
          entering={reducedMotion ? undefined : FadeInDown.duration(420).springify().damping(18).stiffness(160)}
        >
          <AnimatedPressable
            onPress={() => router.navigate('/prestamos')}
            className="bg-[#12131A] border border-[#1E2030] active:border-[#FF7854]/50 rounded-3xl p-5 mb-5 shadow-2xl shadow-black"
          >
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                Cartera total por cobrar
              </Text>
              <View className="flex-row items-center">
                <Text className="text-[#FF7854] text-[11px] font-semibold mr-1">
                  Ver créditos
                </Text>
                <ChevronRight size={13} color="#FF7854" />
              </View>
            </View>

            <View className="flex-row items-baseline gap-2 mb-4">
              <Text className="text-white text-3xl font-extrabold font-mono tracking-tight">
                {formatCOP(metrics.carteraTotalPendiente)}
              </Text>
              <Text className="text-zinc-500 text-sm font-mono font-semibold">COP</Text>
            </View>

            {/* Desglose de Componentes de la Cartera */}
            <View className="grid grid-cols-2 gap-2.5 pt-3 border-t border-[#1C1E2B]">
              <View className="bg-[#0A0B10] rounded-2xl p-3 border border-[#161722]">
                <Text className="text-zinc-500 text-[11px] mb-1">Capital pendiente</Text>
                <Text className="text-white text-sm font-bold font-mono">
                  {formatCOP(metrics.totalCapitalPendiente)}
                </Text>
                <Text className="text-zinc-500 text-[10px] mt-0.5">
                  de {formatCOP(metrics.totalCapitalPrestado)}
                </Text>
              </View>

              <View className="bg-[#0A0B10] rounded-2xl p-3 border border-[#161722]">
                <Text className="text-zinc-500 text-[11px] mb-1">Interés por cobrar</Text>
                <Text className="text-[#FF7854] text-sm font-bold font-mono">
                  {formatCOP(metrics.totalInteresPendiente)}
                </Text>
                <Text className="text-zinc-500 text-[10px] mt-0.5">
                  en cuotas vigentes
                </Text>
              </View>
            </View>

            {metrics.saldoMoraVencido > 0 && (
              <View className="mt-2.5 bg-rose-500/10 border border-rose-500/25 p-2.5 rounded-xl flex-row justify-between items-center">
                <Text className="text-rose-400 text-[11px] font-medium">
                  Mora acumulada pendiente:
                </Text>
                <Text className="text-rose-400 text-xs font-bold font-mono">
                  {formatCOP(metrics.saldoMoraVencido)} COP
                </Text>
              </View>
            )}
          </AnimatedPressable>
        </Animated.View>

        {/* Gráfico de Área: Pagos del Periodo (Figma AreaChartCard) */}
        <AreaChartCard
          chartData={chartData}
          totalRecaudado={metrics.recaudoPeriodo}
          period={dashboardPeriod}
        />

        {/* Botones de Acción Rápida (3 Píldoras Ergonómicas) */}
        <Animated.View
          entering={reducedMotion ? undefined : FadeInUp.delay(80).duration(420).springify().damping(18).stiffness(160)}
          className="flex-row gap-2.5 mb-6"
        >
          <Pressable
            onPress={() => router.push('/prestamos/crear')}
            style={{ flex: 1 }}
            className="bg-[#D34524] active:bg-[#E54F2C] py-3.5 rounded-2xl items-center justify-center flex-row shadow-lg shadow-[#D34524]/25"
          >
            <Plus size={15} color="#FFFFFF" strokeWidth={2.5} />
            <Text className="text-white text-xs font-bold ml-1.5">Préstamo</Text>
          </Pressable>

          <Pressable
            onPress={() => router.navigate('/personas')}
            style={{ flex: 1 }}
            className="bg-[#151622] border border-[#232433] active:bg-[#1E2030] py-3.5 rounded-2xl items-center justify-center flex-row"
          >
            <Users size={15} color="#FF7854" />
            <Text className="text-white text-xs font-bold ml-1.5">Personas</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/vencimientos')}
            style={{ flex: 1 }}
            className="bg-[#151622] border border-[#232433] active:bg-[#1E2030] py-3.5 rounded-2xl items-center justify-center flex-row"
          >
            <CalendarClock size={15} color="#9CA3AF" />
            <Text className="text-zinc-300 text-xs font-bold ml-1.5">Agenda</Text>
          </Pressable>
        </Animated.View>

        {/* Cuadrícula de Métricas Financieras (SCR-04 / FL-08) */}
        <DashboardMetricsGrid metrics={metrics} />

        {/* Sección: Prestatarios Activos (Acceso Rápido) */}
        <QuickBorrowersSection borrowers={activeBorrowers} />

        {/* Sección: Próximos Vencimientos Inmediatos */}
        <UpcomingDueSection obligations={upcomingObligations} />

        {/* Sección: Actividad Reciente de Préstamos */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-3 px-1">
            <Text className="text-white text-base font-bold tracking-tight">
              Actividad Reciente
            </Text>
            <Pressable onPress={() => router.navigate('/prestamos')}>
              <Text className="text-[#FF7854] text-xs font-semibold">
                Ver todos ({allLoans.length})
              </Text>
            </Pressable>
          </View>

          {loading && !refreshing ? (
            <View key="recent-loading">
              <SkeletonCardList count={2} />
            </View>
          ) : allLoans.length === 0 ? (
            /* Estado Vacío Completo (Caso T-012 / RF-014) */
            <View
              key="recent-empty"
              className="bg-[#12131A] border border-[#1E2030] rounded-3xl p-6 items-center shadow-xl shadow-black"
            >
              <View className="w-16 h-16 rounded-2xl bg-[#191316] border border-[#2F191D] items-center justify-center mb-3">
                <CreditCard size={28} color="#FF7854" />
              </View>
              <Text className="text-white text-base font-bold text-center">
                Tu cartera está lista para comenzar
              </Text>
              <Text className="text-zinc-400 text-xs text-center max-w-[270px] mt-1.5 leading-relaxed mb-5">
                Registra primero a una persona y crea tu primer préstamo en pesos colombianos para ver métricas en vivo, vencimientos y flujo de caja aquí.
              </Text>

              <View className="flex-row gap-3 w-full">
                <Pressable
                  onPress={() => router.push('/personas/crear')}
                  className="flex-1 bg-[#151622] border border-[#232433] py-2.5 rounded-xl items-center"
                >
                  <Text className="text-white text-xs font-semibold">+ Crear persona</Text>
                </Pressable>
                <Pressable
                  onPress={() => router.push('/prestamos/crear')}
                  className="flex-1 bg-[#D34524] py-2.5 rounded-xl items-center"
                >
                  <Text className="text-white text-xs font-bold">+ Crear préstamo</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View key="recent-list">
              {recentLoans.map((loan) => (
                <LoanCard key={loan.id} loan={loan} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
