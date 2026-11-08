import React, { useEffect } from 'react'
import { View } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
  Easing,
  useReducedMotion,
} from 'react-native-reanimated'
import { Card } from '../ui/Card'

interface SkeletonBoxProps {
  readonly width?: number | string
  readonly height?: number
  readonly className?: string
}

// Bloque de carga: pulso suave entre .5 y .7 de opacidad en 1,6 s (fijo en .5 con movimiento reducido)
export const SkeletonBox: React.FC<SkeletonBoxProps> = ({
  width = '100%',
  height = 20,
  className = 'rounded-xl',
}) => {
  const reducedMotion = useReducedMotion()
  const opacity = useSharedValue(0.5)

  useEffect(() => {
    if (reducedMotion) {
      opacity.value = 0.5
      return
    }

    opacity.value = withRepeat(
      withTiming(0.7, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    )

    return () => {
      cancelAnimation(opacity)
    }
  }, [opacity, reducedMotion])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ width: width as any, height }, animatedStyle]}
      className={`bg-[#26262A] ${className}`}
    />
  )
}

// Esqueleto de tarjeta: mismo contorno que las tarjetas reales (negro laca)
export const SkeletonCardList: React.FC<{ readonly count?: number }> = ({ count = 3 }) => {
  return (
    <View className="w-full" accessibilityLabel="Cargando" accessibilityRole="progressbar">
      {Array.from({ length: count }).map((_, idx) => (
        <Card key={idx} variant="ink" style={{ padding: 18, marginBottom: 14 }}>
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center flex-1 mr-3">
              <SkeletonBox width={48} height={48} className="rounded-full mr-3" />
              <View className="flex-1 gap-2">
                <SkeletonBox width="45%" height={12} className="rounded-md" />
                <SkeletonBox width="75%" height={16} className="rounded-md" />
              </View>
            </View>
            <SkeletonBox width={68} height={28} className="rounded-full" />
          </View>
          <SkeletonBox width="100%" height={64} className="rounded-[20px] mb-4" />
          <SkeletonBox width="100%" height={8} className="rounded-full" />
        </Card>
      ))}
    </View>
  )
}
