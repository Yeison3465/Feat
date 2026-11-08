import React, { useEffect, useState } from 'react'
import { View, Text, ActivityIndicator, Image, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  FadeIn,
  useReducedMotion,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { ShieldCheck } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { images } from '../images'
import { colors, fonts } from '../theme/tokens'
import { EASE_IN_OUT } from '../motion'

export const SplashScreen: React.FC = () => {
  const reducedMotion = useReducedMotion()
  const insets = useSafeAreaInsets()
  const pulse = useSharedValue(1)
  // Tamaño real del contenedor: la foto se dibuja con medidas explícitas para que cubra toda la pantalla
  const [size, setSize] = useState({ w: 0, h: 0 })

  // Pulso del logo: escala 1 → 1,05 → 1 en 2,4 s, en bucle. Sin pulso con movimiento reducido.
  useEffect(() => {
    if (!reducedMotion) {
      pulse.value = withRepeat(withTiming(1.05, { duration: 1200, easing: EASE_IN_OUT }), -1, true)
    }
  }, [pulse, reducedMotion])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }))

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.app, overflow: 'hidden' }}
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      {/* Foto de billetes a pantalla completa con velo que se oscurece hacia abajo */}
      {size.h > 0 && (
        <Image
          source={images.bills}
          style={{ position: 'absolute', top: 0, left: 0, width: size.w, height: size.h }}
          resizeMode="cover"
        />
      )}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(10,10,11,0.72)', 'rgba(10,10,11,0.86)', colors.app]}
        locations={[0, 0.52, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: insets.top + 16,
          paddingBottom: Math.max(insets.bottom, 16) + 24,
          paddingHorizontal: 24,
        }}
      >
        <View />

        {/* Centro: logo, marca y estado */}
        <Animated.View
          entering={reducedMotion ? undefined : FadeIn.duration(400)}
          style={{ alignItems: 'center', gap: 24, alignSelf: 'stretch' }}
        >
          <View
            style={{
              width: 132,
              height: 132,
              borderRadius: 66,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.16)',
              backgroundColor: 'rgba(255,255,255,0.04)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Animated.View
              accessibilityElementsHidden
              style={[
                {
                  width: 92,
                  height: 92,
                  borderRadius: 46,
                  backgroundColor: colors.warm,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                animatedStyle,
              ]}
            >
              <Text
                style={{
                  color: colors.onLight,
                  fontFamily: fonts.semibold,
                  fontSize: 42,
                  letterSpacing: -2,
                  includeFontPadding: false,
                }}
              >
                P
              </Text>
            </Animated.View>
          </View>

          <View style={{ alignItems: 'center', gap: 14, alignSelf: 'stretch' }}>
            <Text
              style={{
                color: colors.warm,
                fontFamily: fonts.light,
                fontSize: 38,
                lineHeight: 42,
                letterSpacing: 13,
                // El espaciado agrega un hueco al final: se compensa para centrar la palabra
                marginRight: -13,
              }}
            >
              FEAT
            </Text>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
              style={{
                color: colors.warm,
                fontFamily: fonts.semibold,
                fontSize: 44,
                lineHeight: 50,
                letterSpacing: -2,
                textAlign: 'center',
              }}
            >
              Cartera Privada
            </Text>
          </View>

          <View
            accessibilityRole="progressbar"
            accessibilityLiveRegion="polite"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
          >
            <ActivityIndicator size="small" color={colors.warm} />
            <Text style={{ color: '#C4C4C8', fontFamily: fonts.regular, fontSize: 13 }}>
              Verificando sesión cifrada...
            </Text>
          </View>
        </Animated.View>

        {/* Pie de seguridad */}
        <View style={{ alignItems: 'center', gap: 10, paddingHorizontal: 8 }}>
          <ShieldCheck size={20} color={colors.ok} />
          <Text
            style={{
              color: colors.muted,
              fontFamily: fonts.regular,
              fontSize: 12,
              lineHeight: 16,
              textAlign: 'center',
            }}
          >
            FEAT · Sistema privado de gestión crediticia · COP
          </Text>
        </View>
      </View>
    </View>
  )
}
