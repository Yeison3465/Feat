import React, { useState, useMemo } from 'react'
import { View, Text, FlatList, RefreshControl, ScrollView, Linking } from 'react-native'
import Animated, { useReducedMotion } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft, HandCoins, ChevronRight, Clock, Phone, ShieldCheck } from 'lucide-react-native'
import { useLoans } from '../modules/loans/hooks/useLoans'
import { DueHorizonFilter, ObligationItem } from '../modules/loans/types'
import { formatCOP, formatDateFriendly } from '../shared/utils/currency'
import { SkeletonCardList } from '../shared/components/SkeletonBox'
import { AnimatedPressable } from '../shared/components/AnimatedPressable'
import { AppText } from '../shared/ui/AppText'
import { Avatar } from '../shared/ui/Avatar'
import { Button } from '../shared/ui/Button'
import { Card } from '../shared/ui/Card'
import { Chip } from '../shared/ui/Chip'
import { EmptyState } from '../shared/ui/EmptyState'
import { Segmented } from '../shared/ui/Segmented'
import { screenEnter } from '../shared/motion'
import { colors, fonts } from '../shared/theme/tokens'

type VencTab = 'atrasados' | 'proximos'

export default function VencimientosScreen() {
  const router = useRouter()
  const reduced = useReducedMotion()
  const params = useLocalSearchParams<{ tab?: string }>()
  const {
    overdueObligations,
    upcomingObligations,
    loading,
    refreshing,
    reload,
  } = useLoans()

  const initialTab: VencTab =
    params.tab === 'proximos'
      ? 'proximos'
      : params.tab === 'atrasados'
      ? 'atrasados'
      : overdueObligations.length > 0
      ? 'atrasados'
      : 'proximos'

  const [activeTab, setActiveTab] = useState<VencTab>(initialTab)
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

  const projectedThisWeek = useMemo(() => {
    return upcomingObligations
      .filter((o) => o.daysDiff >= 0 && o.daysDiff <= 7)
      .reduce((sum, o) => sum + o.saldoExigible, 0)
  }, [upcomingObligations])

  const projectedThisMonth = useMemo(() => {
    return upcomingObligations
      .filter((o) => o.daysDiff >= 0 && o.daysDiff <= 30)
      .reduce((sum, o) => sum + o.saldoExigible, 0)
  }, [upcomingObligations])

  const handleCall = (phone?: string | null) => {
    if (!phone) return
    const cleaned = phone.replace(/\s+/g, '')
    Linking.openURL(`tel:${cleaned}`).catch(() => {})
  }

  const renderObligationCard = ({ item, index }: { item: ObligationItem; index: number }) => {
    const isOverdue = item.daysDiff < 0
    const absDays = Math.abs(item.daysDiff)
    const shortLoanCode = `#PR-${item.loan.id.substring(0, 4).toUpperCase()}`
    const isHot = isOverdue && !item.inGracePeriod
    const isWarm = (isOverdue && item.inGracePeriod) || (!isOverdue && item.daysDiff === 0)
    const borderColor = isHot ? 'rgba(255,107,94,0.45)' : isWarm ? 'rgba(242,196,109,0.4)' : colors.line

    return (
      <Animated.View
        entering={reduced ? undefined : screenEnter(Math.min(index + 1, 6), false)}
        style={{ marginBottom: 14 }}
      >
        <Card variant="ink" style={{ padding: 16, gap: 14, borderColor }}>
          {/* Prestatario y distintivo de días */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
              <Avatar name={item.borrowerName} size={44} />
              <View style={{ flex: 1, gap: 3 }}>
                <Text numberOfLines={1} style={{ color: colors.warm, fontFamily: fonts.medium, fontSize: 17 }}>
                  {item.borrowerName}
                </Text>
                <Text numberOfLines={1} style={{ color: colors.muted2, fontFamily: fonts.regular, fontSize: 12 }}>
                  {shortLoanCode}
                </Text>
              </View>
            </View>

            {isOverdue ? (
              <Chip
                tone={item.inGracePeriod ? 'warn' : 'danger'}
                style={{ height: 28 }}
                label={
                  item.inGracePeriod
                    ? `En gracia (${absDays}/${item.diasGracia}d)`
                    : `${absDays} ${absDays === 1 ? 'día' : 'días'} atraso`
                }
              />
            ) : (
              <Chip
                tone={item.daysDiff === 0 ? 'warn' : 'neutral'}
                style={{ height: 28 }}
                label={item.daysDiff === 0 ? 'Vence hoy' : `En ${item.daysDiff} ${item.daysDiff === 1 ? 'día' : 'días'}`}
              />
            )}
          </View>

          <Text style={{ color: colors.muted, fontFamily: fonts.regular, fontSize: 12, marginTop: -4 }}>
            Cuota #{item.installment.numero_cuota} · Vence {formatDateFriendly(item.installment.fecha_vencimiento)}
          </Text>

          {/* Desglose financiero */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, padding: 14, borderRadius: 20, backgroundColor: colors.card2 }}>
            <View style={{ gap: 4, flexShrink: 1 }}>
              <Text style={{ color: colors.muted, fontFamily: fonts.regular, fontSize: 12 }}>Exigible en cuota</Text>
              <Text style={{ color: isHot ? colors.dangerSoft : colors.warm, fontFamily: fonts.semibold, fontSize: 20, letterSpacing: -0.6 }}>
                {formatCOP(item.saldoExigible)}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 16, alignItems: 'flex-end' }}>
              {item.moraPendiente > 0 && (
                <View style={{ gap: 4, alignItems: 'flex-end' }}>
                  <Text style={{ color: colors.muted, fontFamily: fonts.regular, fontSize: 12 }}>Mora incluida</Text>
                  <Text style={{ color: colors.dangerSoft, fontFamily: fonts.semibold, fontSize: 13 }}>{formatCOP(item.moraPendiente)}</Text>
                </View>
              )}
              <View style={{ gap: 4, alignItems: 'flex-end' }}>
                <Text style={{ color: colors.muted, fontFamily: fonts.regular, fontSize: 12 }}>Capital crédito</Text>
                <Text style={{ color: '#E4E4E8', fontFamily: fonts.semibold, fontSize: 13 }}>{formatCOP(item.capitalPendientePrestamo)}</Text>
              </View>
            </View>
          </View>

          {/* Acciones rápidas */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {item.borrowerPhone ? (
              <Button
                label="Llamar"
                variant="ghost"
                size="sm"
                onPress={() => handleCall(item.borrowerPhone)}
                icon={<Phone size={14} color={colors.warm} />}
              />
            ) : null}
            <Button
              label="Ver crédito"
              variant="ghost"
              size="sm"
              onPress={() => router.push(`/prestamos/${item.loan.id}`)}
              iconAfter={<ChevronRight size={14} color={colors.warm} />}
              style={{ flex: 1 }}
            />
            <Button
              label="Cobrar"
              size="sm"
              onPress={() =>
                router.push({
                  pathname: '/pagos/registrar',
                  params: { prestamoId: item.loan.id },
                })
              }
              icon={<HandCoins size={14} color="#000000" />}
              style={{ flex: 1 }}
            />
          </View>
        </Card>
      </Animated.View>
    )
  }

  const tabs = [
    { id: 'atrasados' as const, label: `Atrasados (${overdueObligations.length})` },
    { id: 'proximos' as const, label: `Próximos (${upcomingObligations.length})` },
  ]

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.app }} edges={['top']}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, gap: 16 }}>
        {/* Cabecera */}
        <Animated.View entering={screenEnter(0, reduced)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <AnimatedPressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Volver"
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card2, alignItems: 'center', justifyContent: 'center' }}
          >
            <ArrowLeft size={18} color={colors.warm} />
          </AnimatedPressable>
          <View style={{ alignItems: 'center', gap: 2 }}>
            <AppText variant="h" accessibilityRole="header" style={{ fontSize: 17, fontFamily: fonts.semibold }}>
              Centro de Vencimientos
            </AppText>
            <Text style={{ color: colors.muted2, fontFamily: fonts.regular, fontSize: 10, letterSpacing: 0.6 }}>
              {activeTab === 'atrasados' ? 'SCR-17 · ATRASADOS' : 'SCR-18 · PRÓXIMOS'}
            </Text>
          </View>
          <View style={{ width: 44, height: 44 }} />
        </Animated.View>

        {/* Proyección de cobranza (semana y mes) */}
        <Animated.View entering={screenEnter(1, reduced)}>
          <Card variant="white" style={{ flexDirection: 'row', paddingVertical: 18, paddingHorizontal: 20 }}>
            <View style={{ flex: 1, gap: 6, paddingRight: 16, borderRightWidth: 1, borderRightColor: '#E4E3DE' }}>
              <Text style={{ color: colors.onLightMuted, fontFamily: fonts.medium, fontSize: 12 }}>Cobros en 7 días</Text>
              <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: '#1F7A4D', fontFamily: fonts.semibold, fontSize: 25, letterSpacing: -0.9 }}>
                {formatCOP(projectedThisWeek)}
              </Text>
            </View>
            <View style={{ flex: 1, gap: 6, paddingLeft: 20 }}>
              <Text style={{ color: colors.onLightMuted, fontFamily: fonts.medium, fontSize: 12 }}>Cobros en 30 días</Text>
              <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: colors.onLight, fontFamily: fonts.semibold, fontSize: 25, letterSpacing: -0.9 }}>
                {formatCOP(projectedThisMonth)}
              </Text>
            </View>
          </Card>
        </Animated.View>

        {/* Pestañas: Atrasados | Próximos */}
        <Animated.View entering={screenEnter(2, reduced)} style={{ gap: 12 }}>
          <Segmented options={tabs} value={activeTab} onChange={setActiveTab} />

          {/* Horizonte temporal (solo en Próximos) */}
          {activeTab === 'proximos' && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
              {horizonOptions.map((opt) => {
                const isSelected = horizon === opt.id
                return (
                  <AnimatedPressable
                    key={opt.id}
                    onPress={() => setHorizon(opt.id)}
                    haptic="selection"
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    style={{
                      height: 44,
                      paddingHorizontal: 18,
                      borderRadius: 999,
                      justifyContent: 'center',
                      backgroundColor: isSelected ? colors.warm : colors.card,
                      borderWidth: 1,
                      borderColor: isSelected ? colors.warm : colors.line,
                    }}
                  >
                    <Text style={{ color: isSelected ? colors.onLight : colors.muted, fontFamily: fonts.medium, fontSize: 13 }}>{opt.label}</Text>
                  </AnimatedPressable>
                )
              })}
            </ScrollView>
          )}

          {/* Resumen de la vista actual */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              paddingVertical: 14,
              paddingHorizontal: 18,
              borderRadius: 22,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.line,
            }}
          >
            <Text style={{ color: colors.muted, fontFamily: fonts.regular, fontSize: 12 }}>
              {displayedItems.length} {displayedItems.length === 1 ? 'obligación listada' : 'obligaciones listadas'}
            </Text>
            <Text style={{ color: colors.muted, fontFamily: fonts.regular, fontSize: 12 }}>
              Total exigible: <Text style={{ color: colors.warm, fontFamily: fonts.semibold }}>{formatCOP(totalExigibleDisplayed)}</Text>
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* Lista de obligaciones */}
      {loading && !refreshing ? (
        <View key="vencimientos-loading" style={{ flex: 1, paddingHorizontal: 16, paddingTop: 14 }}>
          <SkeletonCardList count={3} />
        </View>
      ) : (
        <FlatList
          key="vencimientos-list"
          data={displayedItems}
          keyExtractor={(item) => item.installment.id}
          renderItem={renderObligationCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32, flexGrow: 1 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={colors.warm} colors={[colors.warm]} progressBackgroundColor={colors.card} />
          }
          ListEmptyComponent={
            activeTab === 'atrasados' ? (
              <EmptyState
                key="empty-atrasados"
                icon={<ShieldCheck size={28} color={colors.okSoft} />}
                title="Sin cuotas atrasadas"
                text="No tienes ningún prestatario con cuotas vencidas pendientes de pago hoy."
              />
            ) : (
              <EmptyState
                key="empty-proximos"
                icon={<Clock size={28} color={colors.warm} />}
                title="Sin vencimientos en este horizonte"
                text="No hay cuotas programadas para vencer en el rango seleccionado."
                action={horizon !== 'todos' ? { label: 'Ver todos los próximos vencimientos', onPress: () => setHorizon('todos'), variant: 'ghost' } : undefined}
              />
            )
          }
        />
      )}
    </SafeAreaView>
  )
}
