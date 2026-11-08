import React, { useState } from 'react'
import { View, Text } from 'react-native'
import Animated, { FadeIn } from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import { TrendingUp, Clock, Banknote, Users } from 'lucide-react-native'
import { LoanSummaryMetrics } from '../types'
import { formatCOP } from '../../../shared/utils/currency'
import { AppText } from '../../../shared/ui/AppText'
import { Card } from '../../../shared/ui/Card'
import { MetricCard } from '../../../shared/ui/MetricCard'
import { ProgressBar } from '../../../shared/ui/ProgressBar'
import { Segmented } from '../../../shared/ui/Segmented'
import { colors, fonts } from '../../../shared/theme/tokens'

interface DashboardMetricsGridProps {
  readonly metrics: LoanSummaryMetrics
}

const VIEW_OPTIONS = [
  { id: 'general', label: 'General' },
  { id: 'detallado', label: 'Detallado' },
] as const

const GREEN = '#1F7A4D'

// Barra partida (para desgloses): cada tramo ocupa su proporción
const SplitBar: React.FC<{ readonly parts: { flex: number; color: string }[] }> = ({ parts }) => (
  <View style={{ flexDirection: 'row', gap: 3, height: 10, borderRadius: 999, overflow: 'hidden' }} accessibilityElementsHidden>
    {parts.map((p, i) => (
      <View key={i} style={{ flex: Math.max(p.flex, 0.0001), backgroundColor: p.color, borderRadius: 999 }} />
    ))}
  </View>
)

const Legend: React.FC<{ readonly color: string; readonly label: string; readonly value: string }> = ({ color, label, value }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
    <Text style={{ color: colors.onLightMuted, fontFamily: fonts.regular, fontSize: 12 }}>{label}</Text>
    <Text style={{ color: colors.onLight, fontFamily: fonts.semibold, fontSize: 14 }}>{value}</Text>
  </View>
)

const Cell: React.FC<{ readonly children: React.ReactNode }> = ({ children }) => (
  <View style={{ flexBasis: '45%', flexGrow: 1 }}>{children}</View>
)

export const DashboardMetricsGrid: React.FC<DashboardMetricsGridProps> = ({ metrics }) => {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'general' | 'detallado'>('general')
  const risky = metrics.personasAtrasadasCount > 0

  return (
    <View style={{ gap: 16 }}>
      {/* Cabecera con conmutador General / Detallado */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ gap: 4, flex: 1 }}>
          <AppText variant="sec">Métricas financieras</AppText>
          <AppText variant="lbl" tone="muted2">
            {viewMode === 'general' ? 'Resumen general de cartera' : 'Indicadores avanzados de rendimiento'}
          </AppText>
        </View>
        <Segmented compact options={VIEW_OPTIONS} value={viewMode} onChange={setViewMode} />
      </View>

      {viewMode === 'general' ? (
        /* VISTA GENERAL: 4 tarjetas blancas */
        <Animated.View key="metrics-general" entering={FadeIn.duration(200)} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          <Cell>
            <MetricCard
              label="Ganancia cobrada"
              icon={(c) => <TrendingUp size={16} color={c} />}
              value={formatCOP(metrics.gananciasTotalesCobradas)}
              chip="Intereses + mora recaudada"
              onPress={() => router.navigate('/prestamos')}
            />
          </Cell>
          <Cell>
            <MetricCard
              label="Interés pendiente"
              icon={(c) => <Clock size={16} color={c} />}
              value={formatCOP(metrics.totalInteresPendiente)}
              chip="Por cobrar en el ciclo"
              onPress={() => router.navigate('/prestamos')}
            />
          </Cell>
          <Cell>
            <MetricCard
              label="Capital colocado"
              icon={(c) => <Banknote size={16} color={c} />}
              value={formatCOP(metrics.totalCapitalPrestado)}
              chip="Total histórico desembolsado"
              onPress={() => router.navigate('/prestamos')}
            />
          </Cell>
          <Cell>
            <MetricCard
              label="Prestatarios activos"
              icon={(c) => <Users size={16} color={c} />}
              valueNode={
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                  <Text style={{ color: colors.onLight, fontFamily: fonts.semibold, fontSize: 21, lineHeight: 26, letterSpacing: -0.63 }}>
                    {metrics.personasPendientesCount}
                  </Text>
                  <Text style={{ color: colors.onLightMuted, fontFamily: fonts.regular, fontSize: 12 }}>con saldo</Text>
                </View>
              }
              chip="Toca para ver directorio"
              onPress={() => router.navigate('/personas')}
            />
          </Cell>
        </Animated.View>
      ) : (
        /* VISTA DETALLADA: indicadores avanzados */
        <Animated.View key="metrics-detallado" entering={FadeIn.duration(200)} style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <Cell>
              <MetricCard
                label="Capital recuperado"
                topRight={
                  <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: '#F2F2EF' }}>
                    <Text style={{ color: '#2B2B2F', fontFamily: fonts.medium, fontSize: 11, lineHeight: 14 }}>Recuperación</Text>
                  </View>
                }
                value={`${metrics.tasaRecuperacionPct.toFixed(1)}%`}
                footer={
                  <View style={{ gap: 8 }}>
                    <ProgressBar percent={metrics.tasaRecuperacionPct} fill={GREEN} track="#DAD9D4" />
                    <Text style={{ color: '#6E6E74', fontFamily: fonts.regular, fontSize: 12 }}>
                      {formatCOP(metrics.totalCapitalPagado)} devueltos
                    </Text>
                  </View>
                }
              />
            </Cell>
            <Cell>
              <MetricCard
                label="Rendimiento neto"
                topRight={
                  <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: 'rgba(31,122,77,0.14)' }}>
                    <Text style={{ color: GREEN, fontFamily: fonts.medium, fontSize: 11, lineHeight: 14 }}>ROI</Text>
                  </View>
                }
                value={`+${metrics.rendimientoRoiPct.toFixed(1)}%`}
                valueColor={GREEN}
                footer={
                  <Text style={{ color: '#6E6E74', fontFamily: fonts.regular, fontSize: 12, lineHeight: 16 }}>
                    Ganancia neta sobre capital total invertido
                  </Text>
                }
              />
            </Cell>
            <Cell>
              <MetricCard
                label="Índice morosidad"
                topRight={
                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 12,
                      backgroundColor: risky ? 'rgba(192,57,43,0.14)' : 'rgba(31,122,77,0.14)',
                    }}
                  >
                    <Text style={{ color: risky ? '#C0392B' : GREEN, fontFamily: fonts.medium, fontSize: 11, lineHeight: 14 }}>Riesgo</Text>
                  </View>
                }
                value={`${metrics.indiceMorosidadPct.toFixed(1)}%`}
                valueColor={risky ? '#C0392B' : GREEN}
                footer={
                  <Text style={{ color: '#6E6E74', fontFamily: fonts.regular, fontSize: 12, lineHeight: 16 }}>
                    {risky ? `${metrics.personasAtrasadasCount} prestatario(s) con retraso` : 'Cartera 100% al día'}
                  </Text>
                }
              />
            </Cell>
            <Cell>
              <MetricCard
                label="Ticket promedio"
                topRight={
                  <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: '#F2F2EF' }}>
                    <Text style={{ color: '#2B2B2F', fontFamily: fonts.medium, fontSize: 11, lineHeight: 14 }}>Ticket</Text>
                  </View>
                }
                value={formatCOP(metrics.ticketPromedio)}
                footer={
                  <Text style={{ color: '#6E6E74', fontFamily: fonts.regular, fontSize: 12, lineHeight: 16 }}>
                    Saldo medio por crédito activo
                  </Text>
                }
              />
            </Cell>
          </View>

          {/* Desglose de ganancias: interés ordinario vs mora */}
          <Card variant="white" style={{ padding: 16, gap: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: colors.onLight, fontFamily: fonts.medium, fontSize: 15 }}>Desglose de ganancias recaudadas</Text>
              <Text style={{ color: GREEN, fontFamily: fonts.semibold, fontSize: 14 }}>{formatCOP(metrics.gananciasTotalesCobradas)}</Text>
            </View>
            <SplitBar
              parts={[
                { flex: metrics.totalInteresCobrado, color: colors.app },
                { flex: metrics.totalMoraCobrada, color: GREEN },
              ]}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <Legend color={colors.app} label="Interés ordinario" value={formatCOP(metrics.totalInteresCobrado)} />
              <Legend color={GREEN} label="Mora cobrada" value={formatCOP(metrics.totalMoraCobrada)} />
            </View>
          </Card>

          {/* Cartera por modalidad de amortización */}
          <Card variant="white" style={{ padding: 16, gap: 14 }}>
            <Text style={{ color: colors.onLight, fontFamily: fonts.medium, fontSize: 15 }}>Cartera por modalidad de amortización</Text>
            <SplitBar
              parts={[
                { flex: metrics.carteraPorModalidad.soloInteres, color: colors.app },
                { flex: metrics.carteraPorModalidad.cuotasFijas, color: GREEN },
                { flex: metrics.carteraPorModalidad.pagoUnico, color: '#9AA39D' },
              ]}
            />
            <View>
              {[
                { label: 'Solo interés', value: metrics.carteraPorModalidad.soloInteres, color: colors.app },
                { label: 'Cuotas fijas', value: metrics.carteraPorModalidad.cuotasFijas, color: GREEN },
                { label: 'Pago único', value: metrics.carteraPorModalidad.pagoUnico, color: '#9AA39D' },
              ].map((row, i, all) => (
                <View
                  key={row.label}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 10,
                    borderBottomWidth: i < all.length - 1 ? 1 : 0,
                    borderBottomColor: '#D8D8D3',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: row.color }} />
                    <Text style={{ color: colors.onLightMuted, fontFamily: fonts.regular, fontSize: 12 }}>{row.label}</Text>
                  </View>
                  <Text style={{ color: colors.onLight, fontFamily: fonts.semibold, fontSize: 14 }}>{formatCOP(row.value)}</Text>
                </View>
              ))}
            </View>
          </Card>
        </Animated.View>
      )}
    </View>
  )
}
