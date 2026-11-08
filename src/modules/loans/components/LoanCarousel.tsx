import React, { useEffect, useState } from 'react'
import { View, Text } from 'react-native'
import Animated, {
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
  SharedValue,
} from 'react-native-reanimated'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { scheduleOnRN } from 'react-native-worklets'
import { useRouter } from 'expo-router'
import { ChevronLeft, ChevronRight } from 'lucide-react-native'
import { LoanWithDetails } from '../types'
import { LoanCard } from './LoanCard'
import { AnimatedPressable } from '../../../shared/components/AnimatedPressable'
import { SPRING, EASE_OUT, DURATION } from '../../../shared/motion'
import { haptic } from '../../../shared/haptics'
import { colors, fonts } from '../../../shared/theme/tokens'

interface LoanCarouselProps {
  readonly loans: LoanWithDetails[]
}

const CARD_W = 262
const CARD_H = 458
const STEP = 188

// Distancia con signo (circular) entre la tarjeta i y la posición actual: -n/2 .. n/2
function wrapDiff(i: number, pos: number, n: number) {
  'worklet'
  let d = (((i - pos) % n) + n) % n
  if (d > n / 2) d -= n
  return d
}

const Item: React.FC<{
  readonly loan: LoanWithDetails
  readonly index: number
  readonly count: number
  readonly pos: SharedValue<number>
  readonly onPress: (i: number) => void
}> = ({ loan, index, count, pos, onPress }) => {
  const d = useDerivedValue(() => wrapDiff(index, pos.value, count))

  const style = useAnimatedStyle(() => {
    const a = Math.abs(d.value)
    return {
      opacity: interpolate(a, [0, 1, 1.6], [1, 0.82, 0]),
      zIndex: Math.round(10 - a * 2),
      transform: [
        { perspective: 900 },
        { translateX: d.value * STEP },
        { scale: 1 - Math.min(a, 2) * 0.13 },
        { rotateY: `${-d.value * 22}deg` },
      ],
    }
  })
  // La foto va a menor velocidad que la tarjeta: se corre en sentido contrario
  const imageOffset = useDerivedValue(() => Math.max(-1, Math.min(1, d.value)) * -30)

  return (
    <Animated.View
      style={[{ position: 'absolute', top: 12, left: '50%', marginLeft: -CARD_W / 2, width: CARD_W, height: CARD_H }, style]}
    >
      <AnimatedPressable
        onPress={() => onPress(index)}
        scaleTo={1}
        accessibilityRole="button"
        accessibilityLabel={`Préstamo de ${loan.persona?.nombre ?? 'prestatario'}`}
        style={{ width: CARD_W, height: CARD_H }}
      >
        <LoanCard loan={loan} variant="carousel" imageOffset={imageOffset} />
      </AnimatedPressable>
    </Animated.View>
  )
}

// Carrusel circular: tarjetas en abanico que giran con el dedo (siguen al dedo 1:1, conservan su velocidad al soltar
// y encajan en la más cercana). Se puede dar vueltas sin fin: tras la última vuelve la primera.
export const LoanCarousel: React.FC<LoanCarouselProps> = ({ loans }) => {
  const router = useRouter()
  const reduced = useReducedMotion()
  const n = loans.length
  const pos = useSharedValue(0)
  const startPos = useSharedValue(0)
  const [idx, setIdx] = useState(0)

  // Si cambia la lista (filtros, búsqueda) se vuelve a la primera tarjeta
  useEffect(() => {
    cancelAnimation(pos)
    pos.value = 0
    setIdx(0)
  }, [n, pos])

  const mod = (v: number) => ((Math.round(v) % n) + n) % n

  const settleTo = (target: number) => {
    pos.value = reduced
      ? target
      : withSpring(target, SPRING.settle)
    setIdx(mod(target))
    haptic('selection')
  }

  // Ir a una tarjeta por el camino más corto
  const goTo = (i: number) => {
    const current = pos.value
    const diff = wrapDiff(i, current, n)
    settleTo(Math.round(current) + Math.round(diff))
  }

  const step = (k: number) => settleTo(Math.round(pos.value) + k)

  const onCardPress = (i: number) => {
    const d = wrapDiff(i, pos.value, n)
    if (Math.abs(d) < 0.5) router.push(`/prestamos/${loans[i].id}`)
    else goTo(i)
  }

  const pan = Gesture.Pan()
    .activeOffsetX([-8, 8])
    .failOffsetY([-14, 14])
    .onBegin(() => {
      cancelAnimation(pos)
      startPos.value = pos.value
    })
    .onUpdate((e) => {
      pos.value = startPos.value - e.translationX / STEP
    })
    .onEnd((e) => {
      // Se proyecta hacia dónde iba el dedo y se encaja en la tarjeta más cercana a ese punto
      const projected = pos.value - e.velocityX / STEP * 0.12
      const target = Math.round(projected)
      pos.value = withSpring(target, { ...SPRING.snapBack, velocity: -e.velocityX / STEP })
      scheduleOnRN(setIdx, ((target % n) + n) % n)
      scheduleOnRN(haptic, 'selection')
    })

  if (n === 0) return null

  return (
    <View style={{ gap: 12 }}>
      <GestureDetector gesture={pan}>
        <View
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel="Carrusel de préstamos"
          accessibilityValue={{ text: `${idx + 1} de ${n}` }}
          accessibilityActions={[
            { name: 'increment', label: 'Siguiente préstamo' },
            { name: 'decrement', label: 'Préstamo anterior' },
          ]}
          onAccessibilityAction={(e) => step(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
          style={{ height: 486, marginHorizontal: -16, overflow: 'hidden' }}
        >
          {loans.map((loan, i) => (
            <Item key={loan.id} loan={loan} index={i} count={n} pos={pos} onPress={onCardPress} />
          ))}
        </View>
      </GestureDetector>

      {/* Controles para quien prefiere botones: anterior / posición / siguiente */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 }}>
        <AnimatedPressable
          onPress={() => step(-1)}
          accessibilityRole="button"
          accessibilityLabel="Préstamo anterior"
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card2, alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronLeft size={16} color={colors.warm} />
        </AnimatedPressable>
        <Text accessibilityLiveRegion="polite" style={{ color: colors.muted, fontFamily: fonts.regular, fontSize: 12 }}>
          {idx + 1} de {n}
        </Text>
        <AnimatedPressable
          onPress={() => step(1)}
          accessibilityRole="button"
          accessibilityLabel="Préstamo siguiente"
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card2, alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronRight size={16} color={colors.warm} />
        </AnimatedPressable>
      </View>
    </View>
  )
}
