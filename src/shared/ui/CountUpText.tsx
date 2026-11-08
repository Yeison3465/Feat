import React, { useEffect, useRef } from 'react'
import { StyleProp, Text, TextInput, TextStyle } from 'react-native'
import Animated, {
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { formatCOP } from '../utils/currency'
import { DURATION, EASE_OUT } from '../motion'

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput)

interface CountUpTextProps {
  readonly value: number
  readonly style?: StyleProp<TextStyle>
}

// Prefijo de moneda tal como lo escribe formatCOP (por ejemplo «$ »), para que el número animado
// se vea igual que el resto de cifras de la app.
const CURRENCY_PREFIX = formatCOP(0).replace(/0$/, '')

// Cifra en pesos que «cuenta» hasta su valor la primera vez que aparece (700 ms, ease-out).
// Los cambios posteriores del valor se muestran al instante. Con movimiento reducido es un Text normal.
export const CountUpText: React.FC<CountUpTextProps> = ({ value, style }) => {
  const reduced = useReducedMotion()
  const progress = useSharedValue(reduced ? 1 : 0)
  const started = useRef(false)

  useEffect(() => {
    if (!started.current) {
      started.current = true
      progress.value = reduced ? 1 : withTiming(1, { duration: DURATION.countUp, easing: EASE_OUT })
    } else {
      progress.value = 1
    }
  }, [value, reduced, progress])

  const animatedProps = useAnimatedProps(() => {
    const rounded = Math.round(value * progress.value)
    const digits = String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    const text = CURRENCY_PREFIX + digits
    return { text, defaultValue: text } as Record<string, string>
  })

  const full = formatCOP(value)

  if (reduced) {
    return <Text style={style}>{full}</Text>
  }

  return (
    <AnimatedTextInput
      editable={false}
      pointerEvents="none"
      underlineColorAndroid="transparent"
      accessibilityLabel={full}
      defaultValue={full}
      animatedProps={animatedProps}
      style={[{ padding: 0, margin: 0, includeFontPadding: false }, style]}
    />
  )
}
