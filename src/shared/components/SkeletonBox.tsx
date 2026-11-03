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

interface SkeletonBoxProps {
  readonly width?: number | string
  readonly height?: number
  readonly className?: string
}

export const SkeletonBox: React.FC<SkeletonBoxProps> = ({
  width = '100%',
  height = 20,
  className = 'rounded-xl',
}) => {
  const reducedMotion = useReducedMotion()
  const opacity = useSharedValue(0.35)

  useEffect(() => {
    if (reducedMotion) {
      opacity.value = 0.5
      return
    }

    opacity.value = withRepeat(
      withTiming(0.75, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
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
      style={[{ width: width as any, height }, animatedStyle]}
      className={`bg-[#1E2030] ${className}`}
    />
  )
}

export const SkeletonCardList: React.FC<{ readonly count?: number }> = ({ count = 3 }) => {
  return (
    <View className="w-full">
      {Array.from({ length: count }).map((_, idx) => (
        <View
          key={idx}
          className="bg-[#12131A] border border-[#1E2030] rounded-3xl p-5 mb-3.5"
        >
          <View className="flex-row items-center justify-between mb-3.5">
            <View className="flex-row items-center flex-1 mr-3">
              <SkeletonBox width={44} height={44} className="rounded-xl mr-3" />
              <View className="flex-1 gap-2">
                <SkeletonBox width="45%" height={12} className="rounded-md" />
                <SkeletonBox width="75%" height={16} className="rounded-md" />
              </View>
            </View>
            <SkeletonBox width={68} height={24} className="rounded-full" />
          </View>
          <SkeletonBox width="100%" height={64} className="rounded-2xl mb-3" />
          <SkeletonBox width="100%" height={8} className="rounded-full" />
        </View>
      ))}
    </View>
  )
}

