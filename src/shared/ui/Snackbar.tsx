import React, { useEffect } from 'react'
import { Pressable, Text, View } from 'react-native'
import { CheckCircle2 } from 'lucide-react-native'
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated'
import { colors, fonts } from '../theme/tokens'
import { DURATION, EASE_OUT } from '../motion'
import { useExit } from './useExit'

interface SnackbarProps {
  readonly visible: boolean
  readonly message: string
  readonly actionLabel?: string
  readonly onAction?: () => void
  // Distancia al borde inferior (deja espacio a la barra flotante)
  readonly bottom?: number
}

// Confirmación breve: sube 16 px y aparece (340 ms), sale por el mismo camino (200 ms).
// El que la usa decide cuánto dura visible (3 s por convención) y dispara el háptico de éxito.
export const Snackbar: React.FC<SnackbarProps> = ({ visible, message, actionLabel, onAction, bottom = 24 }) => {
  const reduced = useReducedMotion()
  const mounted = useExit(visible, DURATION.snackOut)
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, {
      duration: visible ? DURATION.snackIn : DURATION.snackOut,
      easing: EASE_OUT,
    })
  }, [visible, progress])

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: reduced ? 0 : (1 - progress.value) * 16 }],
  }))

  if (!mounted) return null
  return (
    <Animated.View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      pointerEvents="box-none"
      style={[{ position: 'absolute', left: 16, right: 16, bottom, zIndex: 30 }, style]}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: 18,
          paddingVertical: 14,
          borderRadius: 20,
          backgroundColor: colors.warm,
        }}
      >
        <CheckCircle2 size={20} color={colors.onLight} />
        <Text style={{ flex: 1, color: colors.onLight, fontFamily: fonts.medium, fontSize: 14 }}>{message}</Text>
        {actionLabel && onAction ? (
          <Pressable onPress={onAction} hitSlop={12} accessibilityRole="button">
            <Text style={{ color: colors.onLight, fontFamily: fonts.semibold, fontSize: 14, textDecorationLine: 'underline' }}>
              {actionLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  )
}
