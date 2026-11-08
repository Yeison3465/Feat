import React, { useEffect, useRef, useState } from 'react'
import { View, TextInput, FlatList, RefreshControl, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated'
import {
  Search,
  Plus,
  CreditCard,
  X,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CalendarDays,
  ArrowUpRight,
} from 'lucide-react-native'
import { useLoans } from '../../modules/loans/hooks/useLoans'
import { LoanCard } from '../../modules/loans/components/LoanCard'
import { LoanCarousel } from '../../modules/loans/components/LoanCarousel'
import { LoanStatus } from '../../modules/loans/types'
import { ErrorMessage } from '../../shared/components/ErrorMessage'
import { SkeletonBox, SkeletonCardList } from '../../shared/components/SkeletonBox'
import { AnimatedPressable } from '../../shared/components/AnimatedPressable'
import { AppText } from '../../shared/ui/AppText'
import { Button } from '../../shared/ui/Button'
import { Card } from '../../shared/ui/Card'
import { EmptyState } from '../../shared/ui/EmptyState'
import { SearchField } from '../../shared/ui/SearchField'
import { Segmented } from '../../shared/ui/Segmented'
import { TopBar } from '../../shared/ui/TopBar'
import { screenEnter, DURATION, EASE_OUT } from '../../shared/motion'
import { colors, fonts } from '../../shared/theme/tokens'

const VIEW_OPTIONS = [
  { id: 'lista', label: 'Lista' },
  { id: 'carrusel', label: 'Carrusel' },
] as const

// Esqueleto con la forma del carrusel: tarjeta central y los bordes de las vecinas
const CarouselSkeleton: React.FC = () => (
  <View
    accessibilityLabel="Cargando"
    accessibilityRole="progressbar"
    style={{ height: 486, marginHorizontal: -16, overflow: 'hidden', alignItems: 'center' }}
  >
    <View style={{ position: 'absolute', top: 12, left: '50%', marginLeft: -131 - 188, opacity: 0.5, transform: [{ scale: 0.87 }] }}>
      <SkeletonBox width={262} height={458} className="rounded-[32px]" />
    </View>
    <View style={{ position: 'absolute', top: 12, left: '50%', marginLeft: -131 + 188, opacity: 0.5, transform: [{ scale: 0.87 }] }}>
      <SkeletonBox width={262} height={458} className="rounded-[32px]" />
    </View>
    <View style={{ position: 'absolute', top: 12 }}>
      <SkeletonBox width={262} height={458} className="rounded-[32px]" />
    </View>
  </View>
)

// Cuánto dura la animación de carga al cambiar de vista (ms)
const VIEW_SWITCH_MS = 800

export default function PrestamosScreen() {
  const router = useRouter()
  const reduced = useReducedMotion()
  const {
    loans,
    allLoans,
    overdueObligations,
    upcomingObligations,
    loading,
    refreshing,
    error,
    searchQuery,
    estadoFilter,
    setSearchQuery,
    setEstadoFilter,
    reload,
  } = useLoans()

  const [view, setView] = useState<'lista' | 'carrusel'>('lista')
  // Al cambiar entre Lista y Carrusel se muestra una animación de carga y después el contenido entra
  const [switching, setSwitching] = useState(false)
  const [animateIn, setAnimateIn] = useState(true)
  const switchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const changeView = (next: 'lista' | 'carrusel') => {
    if (next === view) return
    setView(next)
    setSwitching(true)
    setAnimateIn(true)
    if (switchTimer.current) clearTimeout(switchTimer.current)
    if (settleTimer.current) clearTimeout(settleTimer.current)
    switchTimer.current = setTimeout(() => setSwitching(false), VIEW_SWITCH_MS)
    // Las entradas solo se animan justo después de cambiar de vista (no al buscar ni al filtrar)
    settleTimer.current = setTimeout(() => setAnimateIn(false), VIEW_SWITCH_MS + 2000)
  }

  useEffect(() => {
    settleTimer.current = setTimeout(() => setAnimateIn(false), 2500)
    return () => {
      if (switchTimer.current) clearTimeout(switchTimer.current)
      if (settleTimer.current) clearTimeout(settleTimer.current)
    }
  }, [])

  const filterOptions: { id: LoanStatus | 'todos'; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'activo', label: 'Activos' },
    { id: 'en_mora', label: 'En mora' },
    { id: 'completado', label: 'Completados' },
  ]

  const hasOverdue = overdueObligations.length > 0
  const showCarousel = view === 'carrusel' && !loading && !error && !switching && loans.length > 0

  const header = (
    <View style={{ gap: 20 }}>
      <Animated.View entering={screenEnter(0, reduced)}>
        <TopBar />
      </Animated.View>

      {/* Título y botón crear */}
      <Animated.View
        entering={screenEnter(1, reduced)}
        style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, paddingTop: 12, paddingHorizontal: 4 }}
      >
        <View style={{ gap: 10, flex: 1 }}>
          <AppText variant="title" accessibilityRole="header">
            Préstamos
          </AppText>
          <AppText variant="body" style={{ fontSize: 15, lineHeight: 22 }}>
            Administración de créditos y obligaciones
          </AppText>
        </View>
        <Button
          label="Crear"
          onPress={() => router.push('/prestamos/crear')}
          icon={<Plus size={16} color="#000000" />}
          style={{ paddingLeft: 14, paddingRight: 18 }}
        />
      </Animated.View>

      {/* Accesos a SCR-17 (Atrasados) y SCR-18 (Próximos vencimientos) */}
      <Animated.View entering={screenEnter(2, reduced)} style={{ flexDirection: 'row', gap: 12, paddingTop: 6 }}>
        {[
          {
            key: 'atrasados',
            tab: 'atrasados',
            title: 'Atrasados',
            count: overdueObligations.length,
            sub: `${overdueObligations.length} ${overdueObligations.length === 1 ? 'cuota' : 'cuotas'}`,
            red: hasOverdue,
            icon: <AlertTriangle size={16} color={hasOverdue ? '#FF7A6E' : colors.warm} />,
          },
          {
            key: 'proximos',
            tab: 'proximos',
            title: 'Próximos',
            count: upcomingObligations.length,
            sub: `${upcomingObligations.length} ${upcomingObligations.length === 1 ? 'pendiente' : 'pendientes'}`,
            red: false,
            icon: <CalendarDays size={16} color={colors.warm} />,
          },
        ].map((c) => (
          <View key={c.key} style={{ flex: 1 }}>
            <AnimatedPressable
              onPress={() => router.push({ pathname: '/vencimientos', params: { tab: c.tab } })}
              accessibilityRole="button"
              accessibilityLabel={`${c.title}: ${c.sub}`}
            >
              <Card variant={c.red ? 'inkRed' : 'ink'} style={{ minHeight: 168, padding: 16, gap: 12 }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: c.red ? 'rgba(255,107,94,0.16)' : colors.card2,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {c.icon}
                </View>
                <View style={{ flex: 1 }} />
                <AppText style={{ fontFamily: fonts.semibold, fontSize: 52, lineHeight: 52, letterSpacing: -2.6 }}>{c.count}</AppText>
                <View style={{ gap: 2 }}>
                  <AppText variant="h" style={{ fontSize: 15 }}>
                    {c.title}
                  </AppText>
                  <AppText variant="lbl" style={{ color: c.red ? '#FF7A6E' : colors.muted }}>
                    {c.sub}
                  </AppText>
                </View>
              </Card>
              {/* Flecha en la esquina */}
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: colors.warm,
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 0 6px #0A0A0B',
                }}
              >
                <ArrowUpRight size={16} color={colors.onLight} />
              </View>
            </AnimatedPressable>
          </View>
        ))}
      </Animated.View>

      {/* Búsqueda */}
      <Animated.View entering={screenEnter(3, reduced)}>
        <SearchField
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar por prestatario o código #PR..."
          accessibilityLabel="Buscar préstamos"
        />
      </Animated.View>

      {/* Filtros por estado */}
      <Animated.View entering={screenEnter(4, reduced)}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {filterOptions.map((opt) => {
            const on = estadoFilter === opt.id
            return (
              <AnimatedPressable
                key={opt.id}
                onPress={() => setEstadoFilter(opt.id)}
                haptic="selection"
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={{
                  height: 40,
                  paddingHorizontal: 16,
                  borderRadius: 999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: on ? colors.warm : colors.card,
                  borderWidth: 1,
                  borderColor: on ? colors.warm : colors.line,
                }}
              >
                <AppText variant="amt" style={{ fontSize: 13, fontFamily: fonts.medium, color: on ? colors.onLight : colors.muted }}>
                  {opt.label}
                </AppText>
              </AnimatedPressable>
            )
          })}
        </ScrollView>
      </Animated.View>

      {/* Contador informativo y tipo de vista */}
      {!loading && !error && (
        <Animated.View
          entering={screenEnter(5, reduced)}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingHorizontal: 4, marginTop: -4 }}
        >
          <View style={{ gap: 2, flex: 1 }}>
            <AppText variant="lbl" tone="muted2">
              {loans.length} {loans.length === 1 ? 'préstamo registrado' : 'préstamos registrados'}
            </AppText>
            {searchQuery.length > 0 && (
              <AppText variant="lbl" tone="warm">
                Filtrado por: “{searchQuery}”
              </AppText>
            )}
          </View>
          <Segmented compact options={VIEW_OPTIONS} value={view} onChange={changeView} />
        </Animated.View>
      )}
    </View>
  )

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.app }} edges={['top']}>
      <FlatList
        data={showCarousel || loading || error || switching ? [] : loans}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) =>
          animateIn && index < 6 && !reduced ? (
            <Animated.View entering={screenEnter(index, reduced)}>
              <LoanCard loan={item} />
            </Animated.View>
          ) : (
            <LoanCard loan={item} />
          )
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, flexGrow: 1 }}
        ListHeaderComponent={header}
        ListHeaderComponentStyle={{ marginBottom: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={colors.warm} colors={[colors.warm]} progressBackgroundColor={colors.card2} />
        }
        ListEmptyComponent={
          (loading && !refreshing) || (switching && !error) ? (
            <View key="loading">
              {view === 'carrusel' && !loading ? <CarouselSkeleton /> : <SkeletonCardList count={3} />}
            </View>
          ) : error ? (
            <View key="error" style={{ alignItems: 'center', gap: 14, paddingTop: 24 }}>
              <ErrorMessage message={error} onRetry={reload} />
              <Button
                label="Reintentar"
                variant="ghost"
                onPress={reload}
                icon={<RefreshCw size={16} color={colors.warm} />}
              />
            </View>
          ) : showCarousel ? (
            <Animated.View entering={FadeIn.duration(DURATION.screenIn).easing(EASE_OUT)}>
              <LoanCarousel loans={loans} />
            </Animated.View>
          ) : searchQuery.trim().length > 0 ? (
            /* Caso 1: búsqueda activa sin coincidencias */
            <EmptyState
              key="empty-search"
              icon={<Search size={28} color={colors.warm} />}
              title="Sin resultados de búsqueda"
              text={`No se encontraron préstamos que coincidan con "${searchQuery}".`}
              action={{ label: 'Limpiar búsqueda', variant: 'ghost', onPress: () => setSearchQuery('') }}
            />
          ) : estadoFilter === 'en_mora' ? (
            /* Caso 2: pestaña En mora limpia (excelente salud de cartera) */
            <EmptyState
              key="empty-mora"
              icon={<ShieldCheck size={28} color={colors.ok} />}
              title="Sin préstamos en mora"
              text="¡Excelente! Toda tu cartera se encuentra al día. No tienes obligaciones en mora actualmente."
            />
          ) : estadoFilter === 'completado' ? (
            /* Caso 3: pestaña Completados sin préstamos liquidados */
            <EmptyState
              key="empty-completado"
              icon={<CheckCircle2 size={28} color={colors.ok} />}
              title="Sin préstamos completados"
              text="Aún no tienes préstamos totalmente liquidados y saldados en tu historial."
            />
          ) : estadoFilter === 'activo' && allLoans.length > 0 ? (
            /* Caso 4: pestaña Activos vacía pero hay historial */
            <EmptyState
              key="empty-activo"
              icon={<Clock size={28} color={colors.warn} />}
              title="Sin préstamos activos"
              text="Todos los préstamos registrados en tu cartera han sido saldados o no están activos."
              action={{ label: '+ Crear nuevo préstamo', onPress: () => router.push('/prestamos/crear') }}
            />
          ) : (
            /* Caso 5: cartera total completamente vacía */
            <EmptyState
              key="empty-all"
              icon={<CreditCard size={28} color={colors.warm} />}
              title="Aún no hay préstamos"
              text="Crea tu primer préstamo seleccionando una persona de tu directorio, el capital en pesos colombianos y la tasa aplicable."
              action={{ label: '+ Crear primer préstamo', onPress: () => router.push('/prestamos/crear') }}
            />
          )
        }
      />
    </SafeAreaView>
  )
}
