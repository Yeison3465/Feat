import React, { useEffect } from 'react'
import { StyleProp, View, ViewStyle } from 'react-native'
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated'
import { colors } from '../theme/tokens'
import { EASE_OUT } from '../motion'

interface ProgressBarProps {
  // 0 a 100
  readonly percent: number
  readonly fill?: string
  readonly track?: string
  readonly height?: number
  readonly style?: StyleProp<ViewStyle>
}

// Barra de progreso: el relleno crece de izquierda a derecha al cargar (1,2 s, retardo 300 ms).
export const ProgressBar: React.FC<ProgressBarProps> = ({
  percent,
  fill = colors.warm,
  track = colors.line,
  height = 6,
  style,
}) => {
  const reduced = useReducedMotion()
  const progress = useSharedValue(reduced ? 1 : 0)
  const clamped = Math.min(100, Math.max(0, percent))

  useEffect(() => {
    if (reduced) {
      progress.value = 1
      return
    }
    progress.value = withDelay(300, withTiming(1, { duration: 1200, easing: EASE_OUT }))
  }, [reduced, progress])

  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: progress.value }],
  }))

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped) }}
      style={[{ height, borderRadius: 999, backgroundColor: track, overflow: 'hidden', width: '100%' }, style]}
    >
      <Animated.View
        style={[
          { width: `${clamped}%`, height: '100%', borderRadius: 999, backgroundColor: fill, transformOrigin: 'left' },
          fillStyle,
        ]}
      />
    </View>
  )
}
