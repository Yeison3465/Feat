import React, { useState, useMemo, useRef } from 'react'
import {
  View,
  Text,
  LayoutChangeEvent,
  PanResponder,
  GestureResponderEvent,
  Pressable,
} from 'react-native'
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Path,
  Circle,
  Line,
  Text as SvgText,
  Rect,
} from 'react-native-svg'
import { TrendingUp, Sparkles, BarChart3, LineChart as LineChartIcon } from 'lucide-react-native'
import { ChartPoint, DashboardPeriod } from '../types'
import { formatCOP } from '../../../shared/utils/currency'
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated'

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

export const AreaChartCard: React.FC<AreaChartCardProps> = ({
  chartData,
  totalRecaudado,
  period,
}) => {
  const reducedMotion = useReducedMotion()
  const [containerWidth, setContainerWidth] = useState(330)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [displayMode, setDisplayMode] = useState<'area' | 'barras'>('area')

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width
    if (w > 0 && Math.abs(w - containerWidth) > 4) {
      setContainerWidth(w)
    }
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

  const maxVal = Math.max(...activePoints.map((p) => p.amount), 1)

  // Geometría del Canvas SVG
  const chartHeight = 135
  const paddingTop = 22
  const paddingBottom = 26
  const paddingLeft = 32
  const paddingRight = 32
  const usableWidth = Math.max(containerWidth - paddingLeft - paddingRight, 180)
  const baselineY = chartHeight - paddingBottom

  // Puntos calculados con precisión
  const points = useMemo(() => {
    const count = activePoints.length
    return activePoints.map((p, i) => {
      const x = paddingLeft + (i / Math.max(1, count - 1)) * usableWidth
      const ratio = p.amount / maxVal
      // Invertir eje Y: baselineY es cero, paddingTop es el máximo
      const y = baselineY - ratio * (baselineY - paddingTop)
      return { x, y, ...p }
    })
  }, [activePoints, maxVal, usableWidth, baselineY, paddingTop, paddingLeft])

  // Path de la curva monótona y del área cerrada
  const curvePath = useMemo(() => buildMonotoneCubicPath(points), [points])
  const areaPath = useMemo(() => {
    if (points.length < 2) return ''
    const first = points[0]
    const last = points[points.length - 1]
    return `${curvePath} L ${last.x.toFixed(2)} ${baselineY.toFixed(2)} L ${first.x.toFixed(2)} ${baselineY.toFixed(2)} Z`
  }, [curvePath, points, baselineY])

  // Scrubber Interactivo mediante PanResponder
  const findClosestIndex = (locationX: number) => {
    let closestIdx = 0
    let minDistance = Infinity
    points.forEach((pt, idx) => {
      const dist = Math.abs(pt.x - locationX)
      if (dist < minDistance) {
        minDistance = dist
        closestIdx = idx
      }
    })
    return closestIdx
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        const idx = findClosestIndex(evt.nativeEvent.locationX)
        setSelectedIndex(idx)
      },
      onPanResponderMove: (evt: GestureResponderEvent) => {
        const idx = findClosestIndex(evt.nativeEvent.locationX)
        setSelectedIndex(idx)
      },
      onPanResponderRelease: () => {
        // Mantiene seleccionado por 2.5s y luego vuelve al estado general
        setTimeout(() => setSelectedIndex(null), 2500)
      },
    })
  ).current

  const activeSelectedPoint =
    selectedIndex !== null && points[selectedIndex]
      ? points[selectedIndex]
      : null

  const periodSubheading =
    period === 'mes_actual'
      ? 'Flujo recibido este mes'
      : period === 'ultimos_30d'
      ? 'Flujo recibido últimos 30 días'
      : 'Histórico semestral de recaudos'

  return (
    <Animated.View
      entering={
        reducedMotion
          ? undefined
          : FadeInDown.delay(90).duration(420).springify().damping(18).stiffness(160)
      }
      onLayout={handleLayout}
      className="bg-[#12131A] border border-[#1E2030] rounded-3xl p-5 mb-5 shadow-2xl shadow-black overflow-hidden"
    >
      {/* Cabecera */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center">
          <View className="w-8 h-8 rounded-xl bg-[#191316] border border-[#2F191D] items-center justify-center mr-2.5">
            <TrendingUp size={16} color="#FF7854" />
          </View>
          <View>
            <Text className="text-white text-sm font-bold tracking-tight">
              Pagos del periodo
            </Text>
            <Text className="text-zinc-500 text-[10px] font-mono mt-0.5">
              {periodSubheading}
            </Text>
          </View>
        </View>

        {/* Conmutador Curva vs Barras */}
        <View className="flex-row bg-[#181A26] border border-[#26293D] rounded-xl p-0.5">
          <Pressable
            onPress={() => setDisplayMode('area')}
            style={{ backgroundColor: displayMode === 'area' ? '#FF7854' : 'transparent' }}
            className="p-1.5 rounded-lg"
          >
            <LineChartIcon size={12} color={displayMode === 'area' ? '#FFFFFF' : '#9CA3AF'} />
          </Pressable>
          <Pressable
            onPress={() => setDisplayMode('barras')}
            style={{ backgroundColor: displayMode === 'barras' ? '#FF7854' : 'transparent' }}
            className="p-1.5 rounded-lg"
          >
            <BarChart3 size={12} color={displayMode === 'barras' ? '#FFFFFF' : '#9CA3AF'} />
          </Pressable>
        </View>
      </View>

      {/* Monto Hero o Tooltip Interactivo */}
      <View className="h-14 justify-center mt-1 mb-2">
        {activeSelectedPoint ? (
          <View
            key="tooltip-selected"
            className="bg-[#181A26] border border-[#FF7854]/60 rounded-2xl px-3.5 py-1.5 flex-row items-center justify-between shadow-lg shadow-black"
          >
            <View>
              <Text className="text-[#FF7854] text-[10px] font-mono font-bold uppercase">
                {activeSelectedPoint.label}
              </Text>
              <Text className="text-white text-xl font-black font-mono">
                {formatCOP(activeSelectedPoint.amount)}
              </Text>
            </View>
            <View className="bg-[#FF7854]/15 px-2.5 py-1 rounded-full">
              <Text className="text-[#FF7854] text-[10px] font-mono font-bold">
                {maxVal > 0 ? `${((activeSelectedPoint.amount / maxVal) * 100).toFixed(0)}% del pico` : '0%'}
              </Text>
            </View>
          </View>
        ) : (
          <View key="tooltip-total" className="flex-row items-baseline gap-1.5">
            <Text className="text-white text-3xl font-extrabold font-mono tracking-tight">
              {formatCOP(totalRecaudado)}
            </Text>
            <Text className="text-zinc-500 text-xs font-mono font-semibold">COP</Text>
          </View>
        )}
      </View>

      {/* Canvas SVG con Spline Monótono y Scrubber Continuo */}
      <View {...panResponder.panHandlers} className="w-full items-center justify-center">
        <Svg width={containerWidth - 40} height={chartHeight}>
          <Defs>
            <LinearGradient id="smoothAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#FF7854" stopOpacity="0.45" />
              <Stop offset="60%" stopColor="#D34524" stopOpacity="0.12" />
              <Stop offset="100%" stopColor="#12131A" stopOpacity="0.0" />
            </LinearGradient>
            <LinearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#FF7854" stopOpacity="0.9" />
              <Stop offset="100%" stopColor="#D34524" stopOpacity="0.4" />
            </LinearGradient>
          </Defs>

          {/* Línea Base X (Nivel 0) */}
          <Line
            x1={paddingLeft - 10}
            y1={baselineY}
            x2={containerWidth - 40 - paddingRight + 10}
            y2={baselineY}
            stroke="#1E2030"
            strokeWidth={1}
          />

          {/* MODO BARRAS */}
          {displayMode === 'barras' && (
            <>
              {points.map((pt, i) => {
                const isSelected = selectedIndex === i
                const barWidth = Math.min(32, usableWidth / (points.length * 1.8))
                const barHeight = Math.max(4, baselineY - pt.y)
                const barX = pt.x - barWidth / 2
                const barY = baselineY - barHeight

                return (
                  <Rect
                    key={`bar-${i}`}
                    x={barX}
                    y={barY}
                    width={barWidth}
                    height={barHeight}
                    rx={6}
                    fill={pt.amount > 0 ? (isSelected ? '#FF9270' : 'url(#barGrad)') : '#1C1E2B'}
                    stroke={isSelected ? '#FF7854' : 'transparent'}
                    strokeWidth={1.5}
                  />
                )
              })}
            </>
          )}

          {/* MODO ÁREA (Curva Monótona Cúbica) */}
          {displayMode === 'area' && (
            <>
              {/* Relleno de Área */}
              <Path d={areaPath} fill="url(#smoothAreaGrad)" />

              {/* Trazado Superior */}
              <Path
                d={curvePath}
                fill="none"
                stroke="#FF7854"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Puntos de Datos */}
              {points.map((pt, i) => {
                const isSelected = selectedIndex === i
                const hasValue = pt.amount > 0

                return (
                  <Circle
                    key={`dot-${i}`}
                    cx={pt.x}
                    cy={pt.y}
                    r={isSelected ? 6 : hasValue ? 4.5 : 3}
                    fill={isSelected ? '#FFFFFF' : '#FF7854'}
                    stroke={isSelected ? '#FF7854' : '#12131A'}
                    strokeWidth={isSelected ? 3 : 2}
                  />
                )
              })}
            </>
          )}

          {/* Línea Guía Vertical del Scrubber Táctil */}
          {activeSelectedPoint && (
            <Line
              x1={activeSelectedPoint.x}
              y1={paddingTop - 6}
              x2={activeSelectedPoint.x}
              y2={baselineY}
              stroke="#FF7854"
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />
          )}

          {/* Etiquetas del Eje X centradas con precisión matemática */}
          {points.map((pt, i) => {
            const isSelected = selectedIndex === i
            return (
              <SvgText
                key={`lbl-${i}`}
                x={pt.x}
                y={baselineY + 18}
                fill={isSelected ? '#FF7854' : '#71717A'}
                fontSize={10}
                fontWeight={isSelected ? 'bold' : 'normal'}
                fontFamily="monospace"
                textAnchor="middle"
              >
                {pt.label}
              </SvgText>
            )
          })}
        </Svg>
      </View>

      {/* Indicador de ayuda */}
      <Text className="text-zinc-500 text-[10px] text-center mt-1">
        Toca o arrastra sobre la gráfica para explorar cada periodo
      </Text>
    </Animated.View>
  )
}
