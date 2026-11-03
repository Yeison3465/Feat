import React, { useEffect } from 'react'
import { View, Text, ActivityIndicator } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { Wallet } from 'lucide-react-native'

export const SplashScreen: React.FC = () => {
  const pulse = useSharedValue(1)

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1.08, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    )
  }, [pulse])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }))

  return (
    <View
      style={{ flex: 1, backgroundColor: '#060709' }}
      className="flex-1 bg-[#060709] items-center justify-between py-16 px-6"
    >
      <View />

      <View className="items-center">
        <Animated.View
          style={animatedStyle}
          className="w-20 h-20 rounded-2xl bg-[#14141B] border border-[#262630] items-center justify-center mb-6 shadow-2xl"
        >
          <View className="w-14 h-14 rounded-xl bg-[#C94422]/20 items-center justify-center">
            <Wallet size={32} color="#FF7854" />
          </View>
        </Animated.View>

        <Text className="text-white text-2xl font-bold tracking-tight mb-2">
          Cartera Privada
        </Text>
        <Text className="text-stone-400 text-sm mb-6">
          Verificando sesión cifrada...
        </Text>

        <ActivityIndicator size="small" color="#FF7854" />
      </View>

      <View className="items-center">
        <Text className="text-stone-500 text-xs tracking-wider">
          Sistema seguro · Moneda COP · v2.4
        </Text>
      </View>
    </View>
  )
}

