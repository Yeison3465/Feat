import React from 'react'
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { useReducedMotion } from 'react-native-reanimated'
import { Plus, Users, CalendarDays, CreditCard, ArrowRight, AlertTriangle } from 'lucide-react-native'
import { useLoans } from '../../modules/loans/hooks/useLoans'
import { LoanCard } from '../../modules/loans/components/LoanCard'
import { DashboardPeriodSelector } from '../../modules/loans/components/DashboardPeriodSelector'
import { AreaChartCard } from '../../modules/loans/components/AreaChartCard'
import { OverdueAlertBanner } from '../../modules/loans/components/OverdueAlertBanner'
import { DashboardMetricsGrid } from '../../modules/loans/components/DashboardMetricsGrid'
import { UpcomingDueSection } from '../../modules/loans/components/UpcomingDueSection'
import { QuickBorrowersSection } from '../../modules/loans/components/QuickBorrowersSection'
import { formatCOP } from '../../shared/utils/currency'
import { SkeletonBox, SkeletonCardList } from '../../shared/components/SkeletonBox'
import { AnimatedPressable } from '../../shared/components/AnimatedPressable'
import { AppText } from '../../shared/ui/AppText'
import { TopBar } from '../../shared/ui/TopBar'
import { Button } from '../../shared/ui/Button'
import { Card } from '../../shared/ui/Card'
import { CoverImage } from '../../shared/ui/CoverImage'
import { CountUpText } from '../../shared/ui/CountUpText'
import { images } from '../../shared/images'
import { screenEnter } from '../../shared/motion'
import { colors, fonts } from '../../shared/theme/tokens'

// Esqueleto del Dashboard mientras llegan los datos: mismos contornos que los bloques reales
const DashboardSkeleton: React.FC = () => (
  <View accessibilityLabel="Cargando" accessibilityRole="progressbar" style={{ gap: 20 }}>
    <SkeletonBox height={52} className="rounded-full" />
    <Card variant="ink" style={{ padding: 20, gap: 14 }}>
      <SkeletonBox width="40%" height={12} className="rounded-md" />
      <SkeletonBox width="70%" height={44} className="rounded-xl" />
      <SkeletonBox width={150} height={48} className="rounded-full" />
      <SkeletonBox height={96} className="rounded-[22px]" />
    </Card>
    <SkeletonCardList count={1} />
  </View>
)

export default function DashboardScreen() {
  const router = useRouter()
  const reduced = useReducedMotion()
  const {
    allLoans,
    metrics,
    loading,
    refreshing,
    reload,
    dashboardPeriod,
    setDashboardPeriod,
    chartData,
    periodSummary,
    upcomingObligations,
    activeBorrowers,
  } = useLoans()

  const recentLoans = allLoans.slice(0, 3)
  // Mientras llegan las consultas se muestra el esqueleto; los bloques entran cuando hay datos
  const ready = !(loading && !refreshing)

  // Cada bloque entra subiendo 14 px con fundido, escalonado de 40 ms en 40 ms (solo al abrir la pantalla)
  let blockIndex = 0
  const enter = () => screenEnter(blockIndex++, reduced)

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.app }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, gap: 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={colors.warm} colors={[colors.warm]} progressBackgroundColor={colors.card2} />
        }
      >
        {/* Barra superior en píldora */}
        <Animated.View entering={enter()}>
          <TopBar />
        </Animated.View>

        {/* Título */}
        <Animated.View entering={enter()} style={{ gap: 10, paddingTop: 12, paddingHorizontal: 4 }}>
          <AppText variant="title" accessibilityRole="header">
            Dashboard
          </AppText>
          <AppText variant="body" style={{ fontSize: 15, lineHeight: 22 }}>
            Estado general de tu cartera privada
          </AppText>
        </Animated.View>

        {!ready ? (
          <DashboardSkeleton />
        ) : (
          <>
        {/* Alerta urgente: personas en mora */}
        <Animated.View entering={enter()}>
          <OverdueAlertBanner
            personasAtrasadasCount={metrics.personasAtrasadasCount}
            cuotasVencidasCount={metrics.cuotasVencidasCount}
            saldoMoraVencido={metrics.saldoMoraVencido}
          />
        </Animated.View>

        {/* Cartera total pendiente (FL-08): tarjeta con fotografía */}
        <Animated.View entering={enter()}>
          <AnimatedPressable
            onPress={() => router.navigate('/prestamos')}
            accessibilityRole="button"
            accessibilityLabel={`Cartera total por cobrar ${formatCOP(metrics.carteraTotalPendiente)}. Ver créditos`}
            style={{ borderRadius: 32, overflow: 'hidden', borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card }}
          >
            <CoverImage source={images.roll} focusX={0.78} focusY={0.18} style={StyleSheet.absoluteFill} />
            <LinearGradient
              pointerEvents="none"
              colors={['rgba(10,10,11,0)', 'rgba(10,10,11,0.25)', 'rgba(10,10,11,0.86)', colors.app]}
              locations={[0, 0.26, 0.52, 0.78]}
              style={StyleSheet.absoluteFill}
            />
            <View style={{ padding: 20, paddingTop: 196, gap: 16 }}>
              <AppText variant="lbl" style={{ color: '#C9C9CD' }}>
                Cartera total por cobrar
              </AppText>
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <CountUpText
                  value={metrics.carteraTotalPendiente}
                  style={{ color: colors.warm, fontFamily: fonts.semibold, fontSize: 46, lineHeight: 50, letterSpacing: -2.07 }}
                />
                <AppText variant="lbl" tone="muted2" style={{ marginLeft: 6, fontSize: 13, fontFamily: fonts.medium }}>
                  COP
                </AppText>
              </View>
              <View style={{ flexDirection: 'row' }}>
                <Button
                  label="Ver créditos"
                  onPress={() => router.navigate('/prestamos')}
                  iconAfter={<ArrowRight size={16} color="#000000" />}
                />
              </View>

              {/* Desglose de la cartera */}
              <Card variant="ink" style={{ flexDirection: 'row', alignItems: 'stretch', paddingVertical: 18, paddingHorizontal: 16 }}>
                <View style={{ flex: 1, gap: 6 }}>
                  <AppText variant="lbl" style={{ color: '#B4B4B9' }}>
                    Capital pendiente
                  </AppText>
                  <AppText variant="h" style={{ fontFamily: fonts.semibold }}>
                    {formatCOP(metrics.totalCapitalPendiente)}
                  </AppText>
                  <AppText variant="lbl" tone="muted2">
                    de {formatCOP(metrics.totalCapitalPrestado)}
                  </AppText>
                </View>
                <View style={{ width: 1, backgroundColor: '#303035', marginHorizontal: 16 }} />
                <View style={{ flex: 1, gap: 6 }}>
                  <AppText variant="lbl" style={{ color: '#B4B4B9' }}>
                    Interés por cobrar
                  </AppText>
                  <AppText variant="h" style={{ fontFamily: fonts.semibold }}>
                    {formatCOP(metrics.totalInteresPendiente)}
                  </AppText>
                  <AppText variant="lbl" tone="muted2">
                    en cuotas vigentes
                  </AppText>
                </View>
              </Card>

              {metrics.saldoMoraVencido > 0 && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    backgroundColor: '#FFDAD4',
                    borderWidth: 1,
                    borderColor: 'rgba(255,107,94,0.6)',
                    borderRadius: 999,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
                    <AlertTriangle size={13} color="#A81F17" />
                    <Text style={{ color: '#8E1B14', fontFamily: fonts.medium, fontSize: 12, flexShrink: 1 }}>
                      Mora acumulada pendiente:
                    </Text>
                  </View>
                  <Text style={{ color: '#A81F17', fontFamily: fonts.semibold, fontSize: 14 }}>
                    {formatCOP(metrics.saldoMoraVencido)} COP
                  </Text>
                </View>
              )}
            </View>
          </AnimatedPressable>
        </Animated.View>

        {/* Acciones rápidas */}
        <Animated.View entering={enter()} style={{ flexDirection: 'row', gap: 8 }}>
          <Button
            label="Préstamo"
            onPress={() => router.push('/prestamos/crear')}
            icon={<Plus size={16} color="#000000" />}
            style={{ flex: 1, paddingHorizontal: 12 }}
          />
          <Button
            label="Personas"
            variant="ghost"
            onPress={() => router.navigate('/personas')}
            icon={<Users size={16} color={colors.warm} />}
            style={{ flex: 1, paddingHorizontal: 12 }}
          />
          <Button
            label="Agenda"
            variant="ghost"
            onPress={() => router.push('/vencimientos')}
            icon={<CalendarDays size={16} color={colors.warm} />}
            style={{ flex: 1, paddingHorizontal: 12 }}
          />
        </Animated.View>

        {/* Selector de periodo (RF-013): gobierna la gráfica y lo que va debajo */}
        <Animated.View entering={enter()} style={{ paddingTop: 8 }}>
          <DashboardPeriodSelector selectedPeriod={dashboardPeriod} onSelectPeriod={setDashboardPeriod} />
        </Animated.View>

        {/* Pagos del periodo */}
        <Animated.View entering={enter()}>
          <AreaChartCard chartData={chartData} totalRecaudado={metrics.recaudoPeriodo} period={dashboardPeriod} summary={periodSummary} />
        </Animated.View>

        {/* Métricas financieras (SCR-04 / FL-08) */}
        <Animated.View entering={enter()}>
          <DashboardMetricsGrid metrics={metrics} />
        </Animated.View>

        {/* Prestatarios activos (acceso rápido) */}
        <Animated.View entering={enter()} style={{ paddingTop: 8 }}>
          <QuickBorrowersSection borrowers={activeBorrowers} />
        </Animated.View>

        {/* Próximos vencimientos */}
        <Animated.View entering={enter()}>
          <UpcomingDueSection obligations={upcomingObligations} />
        </Animated.View>

        {/* Actividad reciente de préstamos */}
        <Animated.View entering={enter()} style={{ gap: 12, paddingTop: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <AppText variant="sec">Actividad reciente</AppText>
            <AnimatedPressable
              onPress={() => router.navigate('/prestamos')}
              accessibilityRole="link"
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44 }}
            >
              <AppText variant="amt" style={{ fontSize: 13 }}>
                Ver todos ({allLoans.length})
              </AppText>
              <ArrowRight size={16} color={colors.warm} />
            </AnimatedPressable>
          </View>

          {loading && !refreshing ? (
            <View key="recent-loading">
              <SkeletonCardList count={2} />
            </View>
          ) : allLoans.length === 0 ? (
            /* Estado vacío completo (Caso T-012 / RF-014) */
            <Card key="recent-empty" variant="dark" style={{ padding: 24, alignItems: 'center', gap: 12 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.card2, alignItems: 'center', justifyContent: 'center' }}>
                <CreditCard size={28} color={colors.warm} />
              </View>
              <AppText variant="h" style={{ textAlign: 'center' }}>
                Tu cartera está lista para comenzar
              </AppText>
              <AppText variant="lbl" style={{ textAlign: 'center', lineHeight: 18, maxWidth: 280 }}>
                Registra primero a una persona y crea tu primer préstamo en pesos colombianos para ver métricas en vivo, vencimientos y flujo de caja aquí.
              </AppText>
              <View style={{ flexDirection: 'row', gap: 10, width: '100%', marginTop: 8 }}>
                <Button label="+ Crear persona" variant="ghost" onPress={() => router.push('/personas/crear')} style={{ flex: 1 }} />
                <Button label="+ Crear préstamo" onPress={() => router.push('/prestamos/crear')} style={{ flex: 1 }} />
              </View>
            </Card>
          ) : (
            <View key="recent-list">
              {recentLoans.map((loan) => (
                <LoanCard key={loan.id} loan={loan} />
              ))}
            </View>
          )}
        </Animated.View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
