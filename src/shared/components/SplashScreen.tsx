import React, { useEffect } from 'react'
import { View, Text, ActivityIndicator, Platform } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  FadeIn,
  useReducedMotion,
} from 'react-native-reanimated'
import { Wallet, Shield } from 'lucide-react-native'

export const SplashScreen: React.FC = () => {
  const reducedMotion = useReducedMotion()
  const pulse = useSharedValue(1)

  useEffect(() => {
    if (!reducedMotion) {
      pulse.value = withRepeat(
        withTiming(1.06, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    }
  }, [pulse, reducedMotion])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }))

  return (
    <View
      style={{ flex: 1, backgroundColor: '#060709' }}
      className="flex-1 bg-[#060709] items-center justify-between py-16 px-6 overflow-hidden"
    >
      {/* Resplandor difuso ambiental superior (Figma halo) */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -110,
          left: '50%',
          transform: [{ translateX: -175 }],
          width: 350,
          height: 350,
          borderRadius: 175,
          backgroundColor: '#C94422',
          opacity: 0.18,
          ...(Platform.OS === 'web' ? { filter: 'blur(80px)' } : {}),
        }}
      />

      <View />

      {/* Centro: Isotipo, Marca FEAT y Estado */}
      <Animated.View
        entering={reducedMotion ? undefined : FadeIn.duration(400)}
        className="items-center"
      >
        {/* Isotipo con caja redondeada oscura y resplandor coral */}
        <Animated.View
          style={[
            animatedStyle,
            {
              shadowColor: '#C94422',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.35,
              shadowRadius: 18,
              elevation: 10,
            },
          ]}
          className="w-16 h-16 rounded-2xl bg-[#191316] border border-[#2F191D] items-center justify-center mb-4"
        >
          <Wallet size={30} color="#FF7854" strokeWidth={2.2} />
        </Animated.View>

        {/* Badge FEAT con punto coral vibrante */}
        <View className="flex-row items-center justify-center gap-1.5 mb-2">
          <View className="w-1.5 h-1.5 rounded-full bg-[#E05335]" />
          <Text className="text-zinc-400 text-xs font-mono font-bold tracking-[0.22em] uppercase">
            FEAT
          </Text>
        </View>

        {/* Título de Producto */}
        <Text className="text-white text-2xl font-bold tracking-tight text-center mb-1">
          Cartera Privada
        </Text>
        <Text className="text-zinc-400 text-xs font-mono text-center mb-6">
          Verificando sesión cifrada...
        </Text>

        <ActivityIndicator size="small" color="#FF7854" />
      </Animated.View>

      {/* Pie de Seguridad Bancaria */}
      <View className="items-center flex-row gap-1.5">
        <Shield size={12} color="#10B981" />
        <Text className="text-zinc-500 text-[11px] font-mono tracking-wider">
          FEAT · Sistema privado de gestión crediticia · COP
        </Text>
      </View>
    </View>
  )
}

