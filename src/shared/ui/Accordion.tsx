import React, { useEffect } from 'react'
import { View } from 'react-native'
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated'
import { ChevronDown } from 'lucide-react-native'
import { DURATION, EASE_OUT } from '../motion'
import { colors } from '../theme/tokens'

interface AccordionProps {
  readonly open: boolean
  readonly children: React.ReactNode
}

// Contenido desplegable: el alto se mide con onLayout (nunca un valor fijo: el texto escala) y se anima junto con la
// opacidad (340 ms, ease-out). Es la excepción permitida a «solo transform y opacity».
export const Accordion: React.FC<AccordionProps> = ({ open, children }) => {
  const reduced = useReducedMotion()
  const measured = useSharedValue(0)
  const progress = useSharedValue(open ? 1 : 0)

  useEffect(() => {
    progress.value = reduced ? (open ? 1 : 0) : withTiming(open ? 1 : 0, { duration: DURATION.accordion, easing: EASE_OUT })
  }, [open, reduced, progress])

  const style = useAnimatedStyle(() => ({
    height: measured.value * progress.value,
    opacity: progress.value,
  }))

  return (
    <Animated.View style={[{ overflow: 'hidden' }, style]} accessibilityElementsHidden={!open} importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}>
      <View
        style={{ position: 'absolute', left: 0, right: 0, top: 0 }}
        onLayout={(e) => {
          measured.value = e.nativeEvent.layout.height
        }}
      >
        {children}
      </View>
    </Animated.View>
  )
}

// Chevron que gira 180° al abrir (misma curva que el contenido)
export const AccordionChevron: React.FC<{ readonly open: boolean; readonly color?: string }> = ({ open, color = colors.muted2 }) => {
  const reduced = useReducedMotion()
  const progress = useSharedValue(open ? 1 : 0)

  useEffect(() => {
    progress.value = reduced ? (open ? 1 : 0) : withTiming(open ? 1 : 0, { duration: DURATION.accordion, easing: EASE_OUT })
  }, [open, reduced, progress])

  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${progress.value * 180}deg` }] }))
  return (
    <Animated.View style={style}>
      <ChevronDown size={18} color={color} />
    </Animated.View>
  )
}
