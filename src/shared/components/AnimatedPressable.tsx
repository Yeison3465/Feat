import React from 'react'
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  useReducedMotion,
} from 'react-native-reanimated'
import { DURATION, EASE_OUT, PRESS_SCALE } from '../motion'
import { haptic, HapticKind } from '../haptics'

interface AnimatedPressableProps extends PressableProps {
  readonly children: React.ReactNode
  readonly className?: string
  readonly containerClassName?: string
  readonly style?: StyleProp<ViewStyle>
  readonly scaleTo?: number
  // Háptico opcional al confirmar la pulsación (no al presionar)
  readonly haptic?: HapticKind
}

export const AnimatedPressable: React.FC<AnimatedPressableProps> = ({
  children,
  className,
  containerClassName,
  style,
  scaleTo = PRESS_SCALE,
  haptic: hapticKind,
  onPressIn,
  onPressOut,
  onPress,
  disabled,
  ...rest
}) => {
  const reducedMotion = useReducedMotion()
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  // La respuesta visual ocurre al presionar (no al soltar) y es instantánea
  const handlePressIn: PressableProps['onPressIn'] = (e) => {
    if (!reducedMotion && !disabled) {
      scale.value = withTiming(scaleTo, { duration: DURATION.press, easing: EASE_OUT })
    }
    onPressIn?.(e)
  }

  const handlePressOut: PressableProps['onPressOut'] = (e) => {
    if (!reducedMotion) {
      scale.value = withTiming(1, { duration: DURATION.press, easing: EASE_OUT })
    }
    onPressOut?.(e)
  }

  const handlePress: PressableProps['onPress'] = (e) => {
    if (hapticKind) haptic(hapticKind)
    onPress?.(e)
  }

  return (
    <Animated.View style={animatedStyle} className={containerClassName}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled}
        style={style}
        className={className}
        {...rest}
      >
        {children}
      </Pressable>
    </Animated.View>
  )
}
