import React, { useEffect } from 'react'
import { View } from 'react-native'
import Animated, { interpolateColor, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated'
import { colors } from '../theme/tokens'
import { DURATION, EASE_OUT } from '../motion'

interface ToggleProps {
  readonly value: boolean
}

// Interruptor visual de 52 x 32: la perilla se desliza (translateX) y el fondo pasa de gris a blanco cálido.
// No es tocable por sí mismo: se pone dentro de la fila que sí lo es (rol «switch»).
export const Toggle: React.FC<ToggleProps> = ({ value }) => {
  const reduced = useReducedMotion()
  const progress = useSharedValue(value ? 1 : 0)

  useEffect(() => {
    progress.value = reduced ? (value ? 1 : 0) : withTiming(value ? 1 : 0, { duration: DURATION.control, easing: EASE_OUT })
  }, [value, reduced, progress])

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [colors.line, colors.warm]),
  }))
  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * 20 }],
    backgroundColor: interpolateColor(progress.value, [0, 1], [colors.warm, colors.app]),
  }))

  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={[{ width: 52, height: 32, borderRadius: 16 }, trackStyle]}>
        <Animated.View style={[{ position: 'absolute', left: 4, top: 4, width: 24, height: 24, borderRadius: 12 }, knobStyle]} />
      </Animated.View>
    </View>
  )
}
