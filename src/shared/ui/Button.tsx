import React from 'react'
import { ActivityIndicator, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native'
import { AnimatedPressable } from '../components/AnimatedPressable'
import type { HapticKind } from '../haptics'
import { colors, fonts } from '../theme/tokens'

export type ButtonVariant = 'solid' | 'ghost' | 'danger' | 'success'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps {
  readonly label: string
  readonly onPress?: () => void
  readonly variant?: ButtonVariant
  readonly size?: ButtonSize
  readonly icon?: React.ReactNode
  // Icono después de la etiqueta (por ejemplo la flecha de «Iniciar sesión»)
  readonly iconAfter?: React.ReactNode
  readonly loading?: boolean
  readonly disabled?: boolean
  readonly haptic?: HapticKind
  readonly style?: StyleProp<ViewStyle>
  readonly accessibilityLabel?: string
}

const HEIGHT: Record<ButtonSize, number> = { sm: 44, md: 48, lg: 56 }
const FONT: Record<ButtonSize, number> = { sm: 13, md: 14, lg: 15 }

// Botón en píldora: sólido (blanco cálido), fantasma (superficie oscura) o peligro (rojo sólido, texto negro)
export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'solid',
  size = 'md',
  icon,
  iconAfter,
  loading = false,
  disabled = false,
  haptic,
  style,
  accessibilityLabel,
}) => {
  const bg =
    variant === 'solid' ? colors.warm : variant === 'danger' ? colors.danger : variant === 'success' ? colors.okSoft : colors.card2
  const fg = variant === 'ghost' ? colors.warm : variant === 'success' ? '#06220F' : '#000000'
  const inactive = disabled || loading

  // Las propiedades de layout (flex, ancho, márgenes) van al contenedor animado que es el hijo real del padre;
  // si se aplicaran al botón interno, un `flex: 1` colapsaría su alto (el contenedor no tiene tamaño propio).
  const {
    flex,
    flexGrow,
    flexShrink,
    flexBasis,
    width,
    minWidth,
    maxWidth,
    alignSelf,
    margin,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    marginHorizontal,
    marginVertical,
    ...innerStyle
  } = (StyleSheet.flatten(style) ?? {}) as ViewStyle
  const containerStyle: ViewStyle = {
    flex,
    flexGrow,
    flexShrink,
    flexBasis,
    width,
    minWidth,
    maxWidth,
    alignSelf,
    margin,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    marginHorizontal,
    marginVertical,
  }

  return (
    <AnimatedPressable
      containerStyle={containerStyle}
      onPress={onPress}
      disabled={inactive}
      haptic={haptic}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={[
        {
          height: HEIGHT[size],
          paddingHorizontal: size === 'sm' ? 16 : 20,
          borderRadius: 999,
          backgroundColor: bg,
          borderWidth: variant === 'ghost' ? 1 : 0,
          borderColor: colors.line,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          opacity: disabled ? 0.4 : 1,
        },
        innerStyle,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {icon}
          <Text
            style={{
              color: fg,
              fontFamily: variant === 'danger' ? fonts.semibold : fonts.medium,
              fontSize: FONT[size],
            }}
          >
            {label}
          </Text>
          {iconAfter}
        </View>
      )}
    </AnimatedPressable>
  )
}
