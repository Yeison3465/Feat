import React from 'react'
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useReducedMotion,
} from 'react-native-reanimated'

interface AnimatedPressableProps extends PressableProps {
  readonly children: React.ReactNode
  readonly className?: string
  readonly containerClassName?: string
  readonly style?: StyleProp<ViewStyle>
  readonly scaleTo?: number
}

export const AnimatedPressable: React.FC<AnimatedPressableProps> = ({
  children,
  className,
  containerClassName,
  style,
  scaleTo = 0.97,
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}) => {
  const reducedMotion = useReducedMotion()
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePressIn: PressableProps['onPressIn'] = (e) => {
    if (!reducedMotion && !disabled) {
      scale.value = withSpring(scaleTo, { damping: 16, stiffness: 300 })
    }
    onPressIn?.(e)
  }

  const handlePressOut: PressableProps['onPressOut'] = (e) => {
    if (!reducedMotion) {
      scale.value = withSpring(1, { damping: 16, stiffness: 300 })
    }
    onPressOut?.(e)
  }

  return (
    <Animated.View style={animatedStyle} className={containerClassName}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
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
