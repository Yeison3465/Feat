import React from 'react'
import { Text, View } from 'react-native'
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated'
import { AlertCircle, RefreshCw } from 'lucide-react-native'
import { AnimatedPressable } from './AnimatedPressable'
import { colors, fonts } from '../theme/tokens'
import { DURATION, EASE_OUT } from '../motion'

interface ErrorMessageProps {
  readonly message: string
  readonly onRetry?: () => void
}

// Mensaje de error: banda roja suave con el texto literal y, si hay reintento, botón circular de 44 px.
// Aparece subiendo 14 px con fundido (240 ms); con movimiento reducido solo hay fundido.
export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  const reduced = useReducedMotion()
  return (
    <Animated.View
      entering={reduced ? undefined : FadeInDown.duration(DURATION.dialogIn).easing(EASE_OUT)}
      accessibilityRole="alert"
      style={{
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginVertical: 8,
        paddingVertical: 12,
        paddingLeft: 16,
        paddingRight: onRetry ? 12 : 16,
        borderRadius: 20,
        backgroundColor: 'rgba(255,107,94,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255,107,94,0.4)',
      }}
    >
      <AlertCircle size={16} color={colors.dangerSoft} />
      <Text
        style={{
          flex: 1,
          color: colors.dangerSoft,
          fontFamily: fonts.regular,
          fontSize: 13,
          lineHeight: 18,
        }}
      >
        {message}
      </Text>
      {onRetry && (
        <AnimatedPressable
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Reintentar"
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: 'rgba(255,107,94,0.18)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <RefreshCw size={16} color={colors.dangerSoft} />
        </AnimatedPressable>
      )}
    </Animated.View>
  )
}
