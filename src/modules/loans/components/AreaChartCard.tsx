import React, { useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, LayoutChangeEvent } from 'react-native'
import Svg, { Defs, LinearGradient, Stop, Path, Circle, Line, Rect } from 'react-native-svg'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  FadeIn,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { LineChart as LineChartIcon, BarChart3 } from 'lucide-react-native'
import { ChartPoint, DashboardPeriod } from '../types'
import { formatCOP } from '../../../shared/utils/currency'
import { AnimatedPressable } from '../../../shared/components/AnimatedPressable'
import { AppText } from '../../../shared/ui/AppText'
import { Card } from '../../../shared/ui/Card'
import { colors, fonts } from '../../../shared/theme/tokens'
import { EASE_OUT } from '../../../shared/motion'
import { haptic } from '../../../shared/haptics'

interface AreaChartCardProps {
  readonly chartData: ChartPoint[]
  readonly totalRecaudado: number
  readonly period: DashboardPeriod
}

/**
 * Algoritmo Fritsch-Carlson para Spline Cúbico Monótono.
 * Garantiza matemáticamente que la curva sea monótona en cada intervalo,
 * eliminando por completo cualquier sobreimpulso (overshoot) o hundimiento
 * por debajo del eje cero en datos financieros.
 */
function buildMonotoneCubicPath(points: { x: number; y: number }[]): string {
  const n = points.length
  if (n === 0) return ''
  if (n === 1) return `M ${points[0].x} ${points[0].y}`
  if (n === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`
  }

  // 1. Pendientes secantes
  const d: number[] = []
  for (let k = 0; k < n - 1; k++) {
    const dx = points[k + 1].x - points[k].x
    const dy = points[k + 1].y - points[k].y
    d.push(dx === 0 ? 0 : dy / dx)
  }

  // 2. Tangentes iniciales
  const m: number[] = [d[0]]
  for (let k = 1; k < n - 1; k++) {
    if (d[k - 1] * d[k] <= 0) {
      m.push(0)
    } else {
      m.push((d[k - 1] + d[k]) / 2)
    }
  }
  m.push(d[n - 2])

  // 3. Restricción de monotonía Fritsch-Carlson
  for (let k = 0; k < n - 1; k++) {
    if (d[k] === 0) {
      m[k] = 0
      m[k + 1] = 0
    } else {
      const alpha = m[k] / d[k]
      const beta = m[k + 1] / d[k]
      const s = alpha * alpha + beta * beta
      if (s > 9) {
        const tau = 3 / Math.sqrt(s)
        m[k] = tau * alpha * d[k]
        m[k + 1] = tau * beta * d[k]
      }
    }
  }

  // 4. Construcción del path SVG cúbico
  let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`
  for (let k = 0; k < n - 1; k++) {
    const dx = points[k + 1].x - points[k].x
    const cp1x = points[k].x + dx / 3
    let cp1y = points[k].y + (m[k] * dx) / 3
    const cp2x = points[k + 1].x - dx / 3
    let cp2y = points[k + 1].y - (m[k + 1] * dx) / 3

    // Acotar estrictamente dentro del rango de los dos puntos
    const minY = Math.min(points[k].y, points[k + 1].y)
    const maxY = Math.max(points[k].y, points[k + 1].y)
    cp1y = Math.max(minY, Math.min(maxY, cp1y))
    cp2y = Math.max(minY, Math.min(maxY, cp2y))

    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${points[k + 1].x.toFixed(2)} ${points[k + 1].y.toFixed(2)}`
  }

  return path
}

const AnimatedRect = Animated.createAnimatedComponent(Rect)

// Barra que crece desde la base (560 ms, ease-out) con 50 ms entre barras
const GrowingBar: React.FC<{
  readonly x: number
  readonly width: number
  readonly height: number
  readonly baseline: number
  readonly fill: string
  readonly index: number
  readonly replayKey: string
}> = ({ x, width, height, baseline, fill, index, replayKey }) => {
  const reduced = useReducedMotion()
  const grow = useSharedValue(reduced ? 1 : 0)

  useEffect(() => {
    if (reduced) {
      grow.value = 1
      return
    }
    grow.value = 0
    grow.value = withDelay(120 + index * 50, withTiming(1, { duration: 560, easing: EASE_OUT }))
  }, [replayKey, index, reduced, grow])

  const animatedProps = useAnimatedProps(() => {
    const h = height * grow.value
    return { y: baseline - h, height: h }
  })

  return <AnimatedRect x={x} width={width} rx={14} fill={fill} animatedProps={animatedProps} />
}

export const AreaChartCard: React.FC<AreaChartCardProps> = ({ chartData, totalRecaudado, period }) => {
  const [innerWidth, setInnerWidth] = useState(318)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [displayMode, setDisplayMode] = useState<'area' | 'barras'>('area')
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width
    if (w > 0 && Math.abs(w - innerWidth) > 2) setInnerWidth(w)
  }

  const activePoints = useMemo(() => {
    if (chartData && chartData.length > 0) return chartData
    return [
      { label: 'Sem 1', amount: 0 },
      { label: 'Sem 2', amount: 0 },
      { label: 'Sem 3', amount: 0 },
      { label: 'Sem 4', amount: 0 },
    ]
  }, [chartData])

  const n = activePoints.length
  const maxVal = Math.max(...activePoints.map((p) => p.amount), 1)

  // Geometría: cada punto vive en el centro de su ranura
  const chartHeight = 132
  const baselineY = 124
  const topPadding = 14
  const slot = innerWidth / n

  const points = useMemo(
    () =>
      activePoints.map((p, i) => {
        const ratio = p.amount / maxVal
        return { x: (i + 0.5) * slot, y: baselineY - ratio * (baselineY - topPadding), ...p }
      }),
    [activePoints, maxVal, slot]
  )

  const curvePath = useMemo(() => buildMonotoneCubicPath(points), [points])
  const areaPath = useMemo(() => {
    if (points.length < 2) return ''
    const first = points[0]
    const last = points[points.length - 1]
    return `${curvePath} L ${last.x.toFixed(2)} ${baselineY} L ${first.x.toFixed(2)} ${baselineY} Z`
  }, [curvePath, points])

  // Selección: se mantiene 2,5 s tras soltar y luego vuelve al total
  const lastSelected = useRef<number | null>(null)
  const select = (idx: number) => {
    if (clearTimer.current) clearTimeout(clearTimer.current)
    if (lastSelected.current !== idx) {
      lastSelected.current = idx
      haptic('selection')
    }
    setSelectedIndex(idx)
  }
  const releaseSelect = () => {
    if (clearTimer.current) clearTimeout(clearTimer.current)
    clearTimer.current = setTimeout(() => {
      lastSelected.current = null
      setSelectedIndex(null)
    }, 2500)
  }
  useEffect(
    () => () => {
      if (clearTimer.current) clearTimeout(clearTimer.current)
    },
    []
  )

  // Gestos en el hilo de UI: solo se avisa a React cuando cambia la ranura tocada
  const lastIdx = useSharedValue(-1)
  const pan = Gesture.Pan()
    .minDistance(0)
    .activeOffsetX([-6, 6])
    .failOffsetY([-12, 12])
    .onUpdate((e) => {
      const idx = Math.max(0, Math.min(n - 1, Math.floor(e.x / slot)))
      if (idx !== lastIdx.value) {
        lastIdx.value = idx
        scheduleOnRN(select, idx)
      }
    })
    .onFinalize(() => {
      lastIdx.value = -1
      scheduleOnRN(releaseSelect)
    })
  const tap = Gesture.Tap().onEnd((e) => {
    const idx = Math.max(0, Math.min(n - 1, Math.floor(e.x / slot)))
    scheduleOnRN(select, idx)
    scheduleOnRN(releaseSelect)
  })
  const gesture = Gesture.Exclusive(pan, tap)

  const active = selectedIndex !== null && points[selectedIndex] ? points[selectedIndex] : null
  const replayKey = `${displayMode}-${period}-${activePoints.map((p) => p.amount).join(',')}`

  const periodSubheading =
    period === 'mes_actual'
      ? 'Flujo recibido este mes'
      : period === 'ultimos_30d'
      ? 'Flujo recibido últimos 30 días'
      : 'Histórico semestral de recaudos'

  return (
    <Card variant="dark" style={{ padding: 20, gap: 16 }}>
      {/* Cabecera y conmutador Curva / Barras */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ gap: 4, flex: 1 }}>
          <AppText variant="h">Pagos del periodo</AppText>
          <AppText variant="lbl" tone="muted2">
            {periodSubheading}
          </AppText>
        </View>

        <View
          accessibilityRole="tablist"
          style={{ flexDirection: 'row', gap: 2, padding: 3, backgroundColor: colors.card2, borderRadius: 999 }}
        >
          {(
            [
              { id: 'area', label: 'Curva', Icon: LineChartIcon },
              { id: 'barras', label: 'Barras', Icon: BarChart3 },
            ] as const
          ).map(({ id, label, Icon }) => {
            const on = displayMode === id
            return (
              <AnimatedPressable
                key={id}
                onPress={() => setDisplayMode(id)}
                haptic="selection"
                accessibilityRole="tab"
                accessibilityLabel={label}
                accessibilityState={{ selected: on }}
                style={{
                  width: 44,
                  height: 38,
                  borderRadius: 999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: on ? colors.warm : 'transparent',
                }}
              >
                <Icon size={16} color={on ? colors.onLight : colors.muted} />
              </AnimatedPressable>
            )
          })}
        </View>
      </View>

      {/* Total del periodo o valor de la ranura seleccionada */}
      <View style={{ minHeight: 56, justifyContent: 'center' }} accessibilityLiveRegion="polite">
        {active ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 10,
              paddingHorizontal: 14,
              backgroundColor: colors.card2,
              borderWidth: 1,
              borderColor: '#3A3A3F',
              borderRadius: 20,
            }}
          >
            <View style={{ gap: 2 }}>
              <AppText variant="lbl">{active.label}</AppText>
              <AppText variant="metric" style={{ fontSize: 22, lineHeight: 26 }}>
                {formatCOP(active.amount)}
              </AppText>
            </View>
            <View style={{ height: 24, paddingHorizontal: 10, borderRadius: 999, backgroundColor: colors.card, justifyContent: 'center' }}>
              <Text style={{ color: colors.warm, fontFamily: fonts.medium, fontSize: 11 }}>
                {maxVal > 0 ? `${((active.amount / maxVal) * 100).toFixed(0)}% del pico` : '0%'}
              </Text>
            </View>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'baseline', paddingTop: 10 }}>
            <AppText variant="metric">{formatCOP(totalRecaudado)}</AppText>
            <AppText variant="lbl" tone="muted2" style={{ marginLeft: 6, fontSize: 13, fontFamily: fonts.medium }}>
              COP
            </AppText>
          </View>
        )}
      </View>

      {/* Gráfica: toca o arrastra para explorar cada periodo */}
      <GestureDetector gesture={gesture}>
        <Animated.View key={displayMode} entering={FadeIn.duration(200)} onLayout={handleLayout} style={{ height: chartHeight }}>
          <Svg width={innerWidth} height={chartHeight}>
            <Defs>
              <LinearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={colors.warm} stopOpacity={0.22} />
                <Stop offset="1" stopColor={colors.warm} stopOpacity={0} />
              </LinearGradient>
            </Defs>

            <Line x1={0} y1={baselineY} x2={innerWidth} y2={baselineY} stroke={colors.line} strokeWidth={1} />

            {displayMode === 'barras' &&
              points.map((pt, i) => {
                const barWidth = Math.min(40, slot * 0.6)
                const h = Math.max(4, baselineY - pt.y)
                const isSel = selectedIndex === i
                return (
                  <GrowingBar
                    key={`bar-${i}`}
                    x={pt.x - barWidth / 2}
                    width={barWidth}
                    height={h}
                    baseline={baselineY}
                    index={i}
                    replayKey={replayKey}
                    fill={isSel ? colors.warm : pt.amount > 0 ? '#3A3A3F' : colors.line}
                  />
                )
              })}

            {displayMode === 'area' && (
              <>
                <Path d={areaPath} fill="url(#areaFill)" />
                <Path d={curvePath} fill="none" stroke={colors.warm} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                {points.map((pt, i) => {
                  const isSel = selectedIndex === i
                  return (
                    <React.Fragment key={`dot-${i}`}>
                      {isSel && <Circle cx={pt.x} cy={pt.y} r={12} fill="rgba(245,245,243,0.12)" />}
                      <Circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isSel ? 7 : 5}
                        fill={colors.warm}
                        stroke={colors.card}
                        strokeWidth={3}
                      />
                    </React.Fragment>
                  )
                })}
              </>
            )}
          </Svg>
        </Animated.View>
      </GestureDetector>

      {/* Etiquetas del eje X (también seleccionan la ranura) */}
      <View style={{ flexDirection: 'row', marginTop: -8 }}>
        {points.map((pt, i) => {
          const isSel = selectedIndex === i
          return (
            <AnimatedPressable
              key={`lbl-${i}`}
              containerClassName="flex-1"
              onPress={() => {
                select(i)
                releaseSelect()
              }}
              accessibilityRole="button"
              accessibilityLabel={`${pt.label}: ${formatCOP(pt.amount)}`}
              accessibilityState={{ selected: isSel }}
              style={{ height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12 }}
            >
              <Text style={{ color: isSel ? colors.warm : colors.muted2, fontFamily: fonts.medium, fontSize: 11 }}>
                {pt.label}
              </Text>
            </AnimatedPressable>
          )
        })}
      </View>

      <AppText variant="lbl" tone="muted2" style={{ textAlign: 'center', marginTop: -8 }}>
        Toca o arrastra sobre la gráfica para explorar cada periodo
      </AppText>
    </Card>
  )
}
