import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  Pressable,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  ArrowLeft,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Phone,
  HandCoins,
  ChevronRight,
  Clock,
  ShieldCheck,
} from 'lucide-react-native'
import { useLoans } from '../modules/loans/hooks/useLoans'
import { DueHorizonFilter, ObligationItem } from '../modules/loans/types'
import { formatCOP, formatDateFriendly } from '../shared/utils/currency'
import Animated, { FadeInDown, FadeInUp, useReducedMotion } from 'react-native-reanimated'
import { SkeletonCardList } from '../shared/components/SkeletonBox'
import { AnimatedPressable } from '../shared/components/AnimatedPressable'

export default function VencimientosScreen() {
  const router = useRouter()
  const reducedMotion = useReducedMotion()
  const params = useLocalSearchParams<{ tab?: string }>()
  const {
    overdueObligations,
    upcomingObligations,
    loading,
    refreshing,
    reload,
  } = useLoans()

  const [activeTab, setActiveTab] = useState<'atrasados' | 'proximos'>(
    params.tab === 'proximos' ? 'proximos' : 'atrasados'
  )
  const [horizon, setHorizon] = useState<DueHorizonFilter>('30d')

  const horizonOptions: { id: DueHorizonFilter; label: string }[] = [
    { id: 'hoy', label: 'Hoy' },
    { id: '7d', label: '7 días' },
    { id: '15d', label: '15 días' },
    { id: '30d', label: '30 días' },
    { id: 'todos', label: 'Todos' },
  ]

  const filteredUpcoming = useMemo(() => {
    return upcomingObligations.filter((item) => {
      if (horizon === 'hoy') return item.daysDiff === 0
      if (horizon === '7d') return item.daysDiff <= 7
      if (horizon === '15d') return item.daysDiff <= 15
      if (horizon === '30d') return item.daysDiff <= 30
      return true
    })
  }, [upcomingObligations, horizon])

  const displayedItems = activeTab === 'atrasados' ? overdueObligations : filteredUpcoming

  const totalExigibleDisplayed = useMemo(
    () => displayedItems.reduce((sum, item) => sum + item.saldoExigible, 0),
    [displayedItems]
  )

  const handleCall = (phone?: string | null) => {
    if (!phone) return
    const cleaned = phone.replace(/\s+/g, '')
    Linking.openURL(`tel:${cleaned}`).catch(() => {})
  }

  const renderObligationCard = ({ item, index }: { item: ObligationItem; index: number }) => {
    const isOverdue = item.daysDiff < 0
    const absDays = Math.abs(item.daysDiff)
    const shortLoanCode = `#PR-${item.loan.id.substring(0, 4).toUpperCase()}`

    return (
      <Animated.View
        entering={
          reducedMotion
            ? undefined
            : FadeInDown.delay(Math.min(index * 60, 300)).duration(400).springify().damping(18).stiffness(160)
        }
        className={`bg-[#12131A] border rounded-2xl p-4 mb-3 ${
          isOverdue
            ? item.inGracePeriod
              ? 'border-amber-500/40'
              : 'border-[#FB3758]/40'
            : item.daysDiff === 0
            ? 'border-amber-500/40'
            : 'border-[#1E2030]'
        }`}
      >
        {/* Cabecera: Prestatario + Badge de días */}
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-1 mr-2">
            <View className="flex-row items-center gap-2 mb-0.5">
              <Text className="text-white text-base font-bold" numberOfLines={1}>
                {item.borrowerName}
              </Text>
              <Text className="text-zinc-500 text-[11px] font-mono">
                {shortLoanCode}
              </Text>
            </View>
            <Text className="text-zinc-400 text-xs">
              Cuota #{item.installment.numero_cuota} · Vence {formatDateFriendly(item.installment.fecha_vencimiento)}
            </Text>
          </View>

          {isOverdue ? (
            <View
              className={`px-2.5 py-1 rounded-full border ${
                item.inGracePeriod
                  ? 'bg-amber-500/15 border-amber-500/40'
                  : 'bg-[#FB3758]/15 border-[#FB3758]/40'
              }`}
            >
              <Text
                className={`text-[10px] font-bold uppercase ${
                  item.inGracePeriod ? 'text-amber-400' : 'text-[#FB3758]'
                }`}
              >
                {item.inGracePeriod
                  ? `En gracia (${absDays}/${item.diasGracia}d)`
                  : `${absDays} ${absDays === 1 ? 'día' : 'días'} atraso`}
              </Text>
            </View>
          ) : (
            <View
              className={`px-2.5 py-1 rounded-full border ${
                item.daysDiff === 0
                  ? 'bg-amber-500/15 border-amber-500/40'
                  : 'bg-[#1A1C29] border-[#2A2D42]'
              }`}
            >
              <Text
                className={`text-[10px] font-bold uppercase ${
                  item.daysDiff === 0 ? 'text-amber-400' : 'text-zinc-300'
                }`}
              >
                {item.daysDiff === 0
                  ? 'Vence hoy'
                  : `En ${item.daysDiff} ${item.daysDiff === 1 ? 'día' : 'días'}`}
              </Text>
            </View>
          )}
        </View>

        {/* Desglose Financiero */}
        <View className="bg-[#090A0F] border border-[#1B1D2B] rounded-xl p-3 mb-3 flex-row justify-between">
          <View>
            <Text className="text-zinc-500 text-[10px] uppercase tracking-wider">
              Exigible en cuota
            </Text>
            <Text
              className={`text-sm font-bold font-mono mt-0.5 ${
                isOverdue && !item.inGracePeriod ? 'text-[#FB3758]' : 'text-white'
              }`}
            >
              {formatCOP(item.saldoExigible)}
            </Text>
          </View>

          {item.moraPendiente > 0 && (
            <View className="items-center">
              <Text className="text-zinc-500 text-[10px] uppercase tracking-wider">
                Mora incluida
              </Text>
              <Text className="text-[#FB3758] text-xs font-bold font-mono mt-0.5">
                {formatCOP(item.moraPendiente)}
              </Text>
            </View>
          )}

          <View className="items-end">
            <Text className="text-zinc-500 text-[10px] uppercase tracking-wider">
              Capital crédito
            </Text>
            <Text className="text-zinc-300 text-xs font-mono font-semibold mt-0.5">
              {formatCOP(item.capitalPendientePrestamo)}
            </Text>
          </View>
        </View>

        {/* Botones de Acción Rápida */}
        <View className="flex-row items-center gap-2">
          {item.borrowerPhone ? (
            <Pressable
              onPress={() => handleCall(item.borrowerPhone)}
              className="flex-row items-center justify-center bg-[#181A26] border border-[#26293D] active:bg-[#232638] px-3 py-2.5 rounded-xl"
            >
              <Phone size={14} color="#9CA3AF" />
              <Text className="text-zinc-300 text-xs font-semibold ml-1.5">
                Llamar
              </Text>
            </Pressable>
          ) : null}

          <Pressable
            onPress={() => router.push(`/prestamos/${item.loan.id}`)}
            className="flex-1 flex-row items-center justify-center bg-[#181A26] border border-[#26293D] active:bg-[#232638] py-2.5 rounded-xl"
          >
            <Text className="text-zinc-200 text-xs font-semibold mr-1">
              Ver crédito
            </Text>
            <ChevronRight size={14} color="#9CA3AF" />
          </Pressable>

          <AnimatedPressable
            onPress={() =>
              router.push({
                pathname: '/pagos/registrar',
                params: { prestamoId: item.loan.id },
              })
            }
            containerClassName="flex-1"
            className="flex-row items-center justify-center bg-[#D34524] active:bg-[#E54F2C] py-2.5 rounded-xl"
          >
            <HandCoins size={14} color="#FFFFFF" />
            <Text className="text-white text-xs font-bold ml-1.5">
              Cobrar
            </Text>
          </AnimatedPressable>
        </View>
      </Animated.View>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#060709' }} edges={['top']} className="flex-1 bg-[#060709]">
      {/* Header */}
      <View className="px-6 pt-3 pb-2">
        <View className="flex-row items-center justify-between mb-3">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-xl bg-[#12131A] border border-[#1E2030] items-center justify-center"
          >
            <ArrowLeft size={18} color="#FFFFFF" />
          </Pressable>
          <View className="items-center">
            <Text className="text-white text-base font-bold">
              Centro de Vencimientos
            </Text>
            <Text className="text-zinc-500 text-[10px] font-mono">
              {activeTab === 'atrasados' ? 'SCR-17 · ATRASADOS' : 'SCR-18 · PRÓXIMOS'}
            </Text>
          </View>
          <View className="w-10" />
        </View>

        {/* Segmented Control: SCR-17 Atrasados vs SCR-18 Próximos */}
        <View className="flex-row bg-[#11121A] border border-[#1E2030] rounded-2xl p-1 mb-3">
          <Pressable
            onPress={() => setActiveTab('atrasados')}
            className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl ${
              activeTab === 'atrasados' ? 'bg-[#FB3758]' : 'bg-transparent'
            }`}
          >
            <AlertTriangle
              size={14}
              color={activeTab === 'atrasados' ? '#FFFFFF' : '#FB3758'}
            />
            <Text
              className={`text-xs font-bold ml-1.5 ${
                activeTab === 'atrasados' ? 'text-white' : 'text-zinc-400'
              }`}
            >
              Atrasados ({overdueObligations.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('proximos')}
            className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl ${
              activeTab === 'proximos' ? 'bg-[#D34524]' : 'bg-transparent'
            }`}
          >
            <CalendarClock
              size={14}
              color={activeTab === 'proximos' ? '#FFFFFF' : '#FF7854'}
            />
            <Text
              className={`text-xs font-bold ml-1.5 ${
                activeTab === 'proximos' ? 'text-white' : 'text-zinc-400'
              }`}
            >
              Próximos ({upcomingObligations.length})
            </Text>
          </Pressable>
        </View>

        {/* Filtros de Horizonte Temporal (solo en SCR-18 Próximos) */}
        {activeTab === 'proximos' && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-2"
          >
            <View className="flex-row gap-2">
              {horizonOptions.map((opt) => {
                const isSelected = horizon === opt.id
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => setHorizon(opt.id)}
                    className={`px-3.5 py-1.5 rounded-full border ${
                      isSelected
                        ? 'bg-[#D34524]/20 border-[#FF7854]'
                        : 'bg-[#12131A] border-[#1E2030]'
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        isSelected ? 'text-[#FF7854]' : 'text-zinc-400'
                      }`}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </ScrollView>
        )}

        {/* Resumen Rápido de la Vista Actual */}
        <View className="bg-[#11121A] border border-[#1E2030] rounded-xl px-3.5 py-2.5 flex-row items-center justify-between mb-1">
          <Text className="text-zinc-400 text-xs">
            {displayedItems.length}{' '}
            {displayedItems.length === 1 ? 'obligación listada' : 'obligaciones listadas'}
          </Text>
          <View className="flex-row items-center">
            <Text className="text-zinc-500 text-xs mr-1.5">Total exigible:</Text>
            <Text className="text-white text-xs font-bold font-mono">
              {formatCOP(totalExigibleDisplayed)}
            </Text>
          </View>
        </View>
      </View>

      {/* Lista de Obligaciones */}
      {loading && !refreshing ? (
        <View className="flex-1 px-6 pt-3">
          <SkeletonCardList count={3} />
        </View>
      ) : (
        <FlatList
          data={displayedItems}
          keyExtractor={(item) => item.installment.id}
          renderItem={renderObligationCard}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 8,
            paddingBottom: 32,
            flexGrow: 1,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={reload}
              tintColor="#FF7854"
              colors={['#FF7854']}
            />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-16 px-4">
              {activeTab === 'atrasados' ? (
                <>
                  <View className="w-16 h-16 rounded-2xl bg-[#064E3B]/20 border border-[#065F46]/40 items-center justify-center mb-4">
                    <ShieldCheck size={30} color="#10B981" />
                  </View>
                  <Text className="text-white text-base font-bold mb-1 text-center">
                    Sin cuotas atrasadas
                  </Text>
                  <Text className="text-zinc-400 text-xs text-center max-w-[260px] leading-4">
                    No tienes ningún prestatario con cuotas vencidas pendientes de pago hoy.
                  </Text>
                </>
              ) : (
                <>
                  <View className="w-16 h-16 rounded-2xl bg-[#12131A] border border-[#1E2030] items-center justify-center mb-4">
                    <Clock size={28} color="#FF7854" />
                  </View>
                  <Text className="text-white text-base font-bold mb-1 text-center">
                    Sin vencimientos en este horizonte
                  </Text>
                  <Text className="text-zinc-400 text-xs text-center max-w-[260px] leading-4 mb-4">
                    No hay cuotas programadas para vencer en el rango seleccionado.
                  </Text>
                  {horizon !== 'todos' && (
                    <Pressable
                      onPress={() => setHorizon('todos')}
                      className="bg-[#181A26] border border-[#26293D] px-4 py-2 rounded-xl"
                    >
                      <Text className="text-[#FF7854] text-xs font-bold">
                        Ver todos los próximos vencimientos
                      </Text>
                    </Pressable>
                  )}
                </>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}
