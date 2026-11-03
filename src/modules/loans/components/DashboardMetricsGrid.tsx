import React, { useState } from 'react'
import { View, Text, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import {
  TrendingUp,
  Clock,
  Banknote,
  Users,
  ChevronRight,
  ShieldAlert,
  Percent,
  PieChart,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react-native'
import { LoanSummaryMetrics } from '../types'
import { formatCOP } from '../../../shared/utils/currency'
import { AnimatedPressable } from '../../../shared/components/AnimatedPressable'
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated'

interface DashboardMetricsGridProps {
  readonly metrics: LoanSummaryMetrics
}

export const DashboardMetricsGrid: React.FC<DashboardMetricsGridProps> = ({ metrics }) => {
  const router = useRouter()
  const reducedMotion = useReducedMotion()
  const [viewMode, setViewMode] = useState<'general' | 'detallado'>('general')

  return (
    <Animated.View
      entering={
        reducedMotion
          ? undefined
          : FadeInDown.delay(120).duration(420).springify().damping(18).stiffness(160)
      }
      className="mb-6"
    >
      {/* Cabecera con Conmutador General vs Detallado */}
      <View className="flex-row items-center justify-between mb-3 px-1">
        <View>
          <Text className="text-white text-base font-bold tracking-tight">
            Métricas Financieras
          </Text>
          <Text className="text-zinc-500 text-[10px] font-mono mt-0.5">
            {viewMode === 'general' ? 'Resumen general de cartera' : 'Indicadores avanzados de rendimiento'}
          </Text>
        </View>

        {/* Switcher Ergonómico */}
        <View className="flex-row bg-[#11121A] border border-[#1E2030] rounded-xl p-1">
          <Pressable
            onPress={() => setViewMode('general')}
            style={{ backgroundColor: viewMode === 'general' ? '#D34524' : 'transparent' }}
            className="px-3 py-1.5 rounded-lg"
          >
            <Text
              style={{ color: viewMode === 'general' ? '#FFFFFF' : '#A1A1AA' }}
              className="text-[11px] font-bold"
            >
              General
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setViewMode('detallado')}
            style={{ backgroundColor: viewMode === 'detallado' ? '#D34524' : 'transparent' }}
            className="px-3 py-1.5 rounded-lg"
          >
            <Text
              style={{ color: viewMode === 'detallado' ? '#FFFFFF' : '#A1A1AA' }}
              className="text-[11px] font-bold"
            >
              Detallado
            </Text>
          </Pressable>
        </View>
      </View>

      {/* VISTA GENERAL: 4 Tarjetas Clásicas */}
      {viewMode === 'general' ? (
        <View key="metrics-general" className="grid grid-cols-2 gap-3">
          {/* Tarjeta 1: Ganancias Cobradas */}
          <AnimatedPressable
            onPress={() => router.navigate('/prestamos')}
            className="bg-[#12131A] border border-[#1E2030] active:border-emerald-500/40 rounded-2xl p-3.5 shadow-xl shadow-black"
          >
            <View className="flex-row items-center justify-between mb-2">
              <View className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 items-center justify-center">
                <TrendingUp size={15} color="#10B981" />
              </View>
              <ChevronRight size={13} color="#6B7280" />
            </View>
            <Text className="text-zinc-400 text-[11px] font-medium mb-1">
              Ganancia cobrada
            </Text>
            <Text className="text-emerald-400 text-base font-bold font-mono" numberOfLines={1}>
              {formatCOP(metrics.gananciasTotalesCobradas)}
            </Text>
            <Text className="text-zinc-500 text-[9px] mt-0.5">
              Intereses + mora recaudada
            </Text>
          </AnimatedPressable>

          {/* Tarjeta 2: Intereses Pendientes */}
          <AnimatedPressable
            onPress={() => router.navigate('/prestamos')}
            className="bg-[#12131A] border border-[#1E2030] active:border-[#FF7854]/40 rounded-2xl p-3.5 shadow-xl shadow-black"
          >
            <View className="flex-row items-center justify-between mb-2">
              <View className="w-8 h-8 rounded-xl bg-[#191316] border border-[#2F191D] items-center justify-center">
                <Clock size={15} color="#FF7854" />
              </View>
              <ChevronRight size={13} color="#6B7280" />
            </View>
            <Text className="text-zinc-400 text-[11px] font-medium mb-1">
              Interés pendiente
            </Text>
            <Text className="text-white text-base font-bold font-mono" numberOfLines={1}>
              {formatCOP(metrics.totalInteresPendiente)}
            </Text>
            <Text className="text-zinc-500 text-[9px] mt-0.5">
              Por cobrar en el ciclo
            </Text>
          </AnimatedPressable>

          {/* Tarjeta 3: Capital Colocado */}
          <AnimatedPressable
            onPress={() => router.navigate('/prestamos')}
            className="bg-[#12131A] border border-[#1E2030] active:border-zinc-700 rounded-2xl p-3.5 shadow-xl shadow-black"
          >
            <View className="flex-row items-center justify-between mb-2">
              <View className="w-8 h-8 rounded-xl bg-[#171926] border border-[#25283D] items-center justify-center">
                <Banknote size={15} color="#9CA3AF" />
              </View>
              <ChevronRight size={13} color="#6B7280" />
            </View>
            <Text className="text-zinc-400 text-[11px] font-medium mb-1">
              Capital colocado
            </Text>
            <Text className="text-zinc-200 text-base font-bold font-mono" numberOfLines={1}>
              {formatCOP(metrics.totalCapitalPrestado)}
            </Text>
            <Text className="text-zinc-500 text-[9px] mt-0.5">
              Total histórico desembolsado
            </Text>
          </AnimatedPressable>

          {/* Tarjeta 4: Prestatarios Activos */}
          <AnimatedPressable
            onPress={() => router.navigate('/personas')}
            className="bg-[#12131A] border border-[#1E2030] active:border-amber-500/40 rounded-2xl p-3.5 shadow-xl shadow-black"
          >
            <View className="flex-row items-center justify-between mb-2">
              <View className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 items-center justify-center">
                <Users size={15} color="#F59E0B" />
              </View>
              <ChevronRight size={13} color="#6B7280" />
            </View>
            <Text className="text-zinc-400 text-[11px] font-medium mb-1">
              Prestatarios activos
            </Text>
            <View className="flex-row items-baseline gap-1">
              <Text className="text-white text-base font-bold font-mono">
                {metrics.personasPendientesCount}
              </Text>
              <Text className="text-zinc-500 text-[10px]">con saldo</Text>
            </View>
            <Text className="text-zinc-500 text-[9px] mt-0.5">
              Toca para ver directorio
            </Text>
          </AnimatedPressable>
        </View>
      ) : (
        /* VISTA DETALLADA: Indicadores Avanzados y Específicos */
        <View key="metrics-detallado" className="gap-3">
          {/* Fila 1: Tasa de Recuperación y ROI */}
          <View className="flex-row gap-3">
            {/* Tasa de Recuperación de Capital */}
            <View className="flex-1 bg-[#12131A] border border-[#1E2030] rounded-2xl p-3.5">
              <View className="flex-row items-center justify-between mb-2">
                <View className="w-7 h-7 rounded-lg bg-[#181A26] border border-[#25283D] items-center justify-center">
                  <Percent size={13} color="#FF7854" />
                </View>
                <Text className="text-zinc-500 text-[10px] font-mono">RECUPERACIÓN</Text>
              </View>
              <Text className="text-zinc-400 text-[11px] font-medium mb-0.5">
                Capital recuperado
              </Text>
              <Text className="text-white text-xl font-black font-mono">
                {metrics.tasaRecuperacionPct.toFixed(1)}%
              </Text>

              {/* Barra de Progreso */}
              <View className="w-full h-1.5 bg-[#1C1E2B] rounded-full overflow-hidden mt-2 mb-1.5">
                <View
                  style={{ width: `${Math.min(100, Math.max(0, metrics.tasaRecuperacionPct))}%` }}
                  className="h-full bg-[#FF7854] rounded-full"
                />
              </View>
              <Text className="text-zinc-500 text-[9px] font-mono">
                {formatCOP(metrics.totalCapitalPagado)} devueltos
              </Text>
            </View>

            {/* Rendimiento Financiero ROI */}
            <View className="flex-1 bg-[#12131A] border border-[#1E2030] rounded-2xl p-3.5">
              <View className="flex-row items-center justify-between mb-2">
                <View className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 items-center justify-center">
                  <ArrowUpRight size={13} color="#10B981" />
                </View>
                <Text className="text-emerald-400 text-[10px] font-mono font-bold">ROI</Text>
              </View>
              <Text className="text-zinc-400 text-[11px] font-medium mb-0.5">
                Rendimiento neto
              </Text>
              <Text className="text-emerald-400 text-xl font-black font-mono">
                +{metrics.rendimientoRoiPct.toFixed(1)}%
              </Text>
              <View className="mt-3.5">
                <Text className="text-zinc-500 text-[9px]">
                  Ganancia neta sobre capital total invertido
                </Text>
              </View>
            </View>
          </View>

          {/* Fila 2: Índice de Morosidad y Ticket Promedio */}
          <View className="flex-row gap-3">
            {/* Índice de Morosidad */}
            <View className="flex-1 bg-[#12131A] border border-[#1E2030] rounded-2xl p-3.5">
              <View className="flex-row items-center justify-between mb-2">
                <View
                  key={metrics.personasAtrasadasCount > 0 ? 'risk-high' : 'risk-low'}
                  className={`w-7 h-7 rounded-lg items-center justify-center border ${
                    metrics.personasAtrasadasCount > 0
                      ? 'bg-rose-500/15 border-rose-500/30'
                      : 'bg-emerald-500/15 border-emerald-500/30'
                  }`}
                >
                  <ShieldAlert
                    size={13}
                    color={metrics.personasAtrasadasCount > 0 ? '#FB3758' : '#10B981'}
                  />
                </View>
                <Text className="text-zinc-500 text-[10px] font-mono">RIESGO</Text>
              </View>
              <Text className="text-zinc-400 text-[11px] font-medium mb-0.5">
                Índice morosidad
              </Text>
              <Text
                className={`text-xl font-black font-mono ${
                  metrics.personasAtrasadasCount > 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {metrics.indiceMorosidadPct.toFixed(1)}%
              </Text>
              <Text className="text-zinc-500 text-[9px] mt-1">
                {metrics.personasAtrasadasCount > 0
                  ? `${metrics.personasAtrasadasCount} prestatario(s) con retraso`
                  : 'Cartera 100% al día'}
              </Text>
            </View>

            {/* Ticket Promedio por Crédito */}
            <View className="flex-1 bg-[#12131A] border border-[#1E2030] rounded-2xl p-3.5">
              <View className="flex-row items-center justify-between mb-2">
                <View className="w-7 h-7 rounded-lg bg-[#181A26] border border-[#25283D] items-center justify-center">
                  <Banknote size={13} color="#9CA3AF" />
                </View>
                <Text className="text-zinc-500 text-[10px] font-mono">TICKET</Text>
              </View>
              <Text className="text-zinc-400 text-[11px] font-medium mb-0.5">
                Ticket promedio
              </Text>
              <Text className="text-white text-base font-bold font-mono mt-0.5" numberOfLines={1}>
                {formatCOP(metrics.ticketPromedio)}
              </Text>
              <Text className="text-zinc-500 text-[9px] mt-1.5">
                Saldo medio por crédito activo
              </Text>
            </View>
          </View>

          {/* Fila 3: Desglose de Ganancias (Interés vs Mora) */}
          <View className="bg-[#12131A] border border-[#1E2030] rounded-2xl p-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-zinc-300 text-xs font-semibold">
                Desglose de Ganancias Recaudadas
              </Text>
              <Text className="text-emerald-400 text-xs font-bold font-mono">
                {formatCOP(metrics.gananciasTotalesCobradas)}
              </Text>
            </View>
            <View className="flex-row gap-2 pt-2 border-t border-[#1C1E2B]">
              <View className="flex-1 bg-[#0A0B10] p-2.5 rounded-xl border border-[#161722]">
                <Text className="text-zinc-500 text-[10px]">Interés ordinario</Text>
                <Text className="text-emerald-400 text-xs font-bold font-mono mt-0.5">
                  {formatCOP(metrics.totalInteresCobrado)}
                </Text>
              </View>
              <View className="flex-1 bg-[#0A0B10] p-2.5 rounded-xl border border-[#161722]">
                <Text className="text-zinc-500 text-[10px]">Mora cobrada</Text>
                <Text className="text-[#FF7854] text-xs font-bold font-mono mt-0.5">
                  {formatCOP(metrics.totalMoraCobrada)}
                </Text>
              </View>
            </View>
          </View>

          {/* Fila 4: Distribución de Cartera por Modalidad */}
          <View className="bg-[#12131A] border border-[#1E2030] rounded-2xl p-4">
            <View className="flex-row items-center justify-between mb-2.5">
              <View className="flex-row items-center">
                <PieChart size={14} color="#FF7854" />
                <Text className="text-zinc-300 text-xs font-semibold ml-1.5">
                  Cartera por Modalidad de Amortización
                </Text>
              </View>
            </View>

            <View className="grid grid-cols-3 gap-2">
              <View className="bg-[#0A0B10] p-2 rounded-xl border border-[#161722]">
                <Text className="text-zinc-500 text-[9px]">Solo Interés</Text>
                <Text className="text-white text-[11px] font-bold font-mono mt-0.5" numberOfLines={1}>
                  {formatCOP(metrics.carteraPorModalidad.soloInteres)}
                </Text>
              </View>
              <View className="bg-[#0A0B10] p-2 rounded-xl border border-[#161722]">
                <Text className="text-zinc-500 text-[9px]">Cuotas Fijas</Text>
                <Text className="text-white text-[11px] font-bold font-mono mt-0.5" numberOfLines={1}>
                  {formatCOP(metrics.carteraPorModalidad.cuotasFijas)}
                </Text>
              </View>
              <View className="bg-[#0A0B10] p-2 rounded-xl border border-[#161722]">
                <Text className="text-zinc-500 text-[9px]">Pago Único</Text>
                <Text className="text-white text-[11px] font-bold font-mono mt-0.5" numberOfLines={1}>
                  {formatCOP(metrics.carteraPorModalidad.pagoUnico)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </Animated.View>
  )
}
