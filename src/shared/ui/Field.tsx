import React, { useState } from 'react'
import { StyleProp, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native'
import { AlertCircle } from 'lucide-react-native'
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withTiming } from 'react-native-reanimated'
import { colors, fonts } from '../theme/tokens'
import { EASE_OUT } from '../motion'
import { haptic } from '../haptics'

interface FieldProps extends Omit<TextInputProps, 'style'> {
  readonly label?: string
  // Texto pequeño a la derecha de la etiqueta (por ejemplo «Obligatorio»)
  readonly hint?: string
  readonly error?: string | null
  // Etiqueta pequeña (12 px gris) y separación de 8 px, como en el acceso
  readonly compact?: boolean
  readonly prefix?: React.ReactNode | ((state: { focused: boolean; error: boolean }) => React.ReactNode)
  // Elemento al final del campo (por ejemplo el ojo de la contraseña)
  readonly trailing?: React.ReactNode
  readonly suffix?: string
  readonly multiline?: boolean
  readonly containerStyle?: StyleProp<ViewStyle>
}

// Campo de texto: etiqueta arriba, contenedor de 56 px con borde que se aclara al enfocar,
// y error en rojo debajo (con sacudida corta y háptico en el momento en que aparece).
export const Field: React.FC<FieldProps> = ({
  label,
  hint,
  error,
  compact = false,
  prefix,
  trailing,
  suffix,
  multiline,
  containerStyle,
  onFocus,
  onBlur,
  ...input
}) => {
  const reduced = useReducedMotion()
  const [focused, setFocused] = useState(false)
  const shake = useSharedValue(0)
  const prevError = React.useRef<string | null | undefined>(null)

  React.useEffect(() => {
    if (error && !prevError.current) {
      haptic('error')
      if (!reduced) {
        shake.value = withSequence(
          withTiming(-5, { duration: 64, easing: EASE_OUT }),
          withTiming(4, { duration: 96, easing: EASE_OUT }),
          withTiming(-2, { duration: 96, easing: EASE_OUT }),
          withTiming(0, { duration: 64, easing: EASE_OUT })
        )
      }
    }
    prevError.current = error
  }, [error, reduced, shake])

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }))
  const borderColor = error ? colors.danger : focused ? colors.warm : colors.line

  return (
    <View style={[{ gap: compact ? 8 : 14 }, containerStyle]}>
      {(label || hint) && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          {label ? (
            <Text
              style={{
                color: compact ? colors.muted : colors.warm,
                fontFamily: fonts.medium,
                fontSize: compact ? 12 : 14,
              }}
            >
              {label}
            </Text>
          ) : (
            <View />
          )}
          {hint ? (
            <Text style={{ color: colors.muted2, fontFamily: fonts.regular, fontSize: 12 }}>{hint}</Text>
          ) : null}
        </View>
      )}
      <Animated.View
        style={[
          {
            flexDirection: 'row',
            alignItems: multiline ? 'flex-start' : 'center',
            gap: 10,
            minHeight: 56,
            paddingLeft: 18,
            paddingRight: trailing ? 8 : 18,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor,
            borderRadius: 20,
          },
          shakeStyle,
        ]}
      >
        {typeof prefix === 'function' ? prefix({ focused, error: !!error }) : prefix}
        <TextInput
          {...input}
          multiline={multiline}
          placeholderTextColor="#6C6C72"
          selectionColor={colors.warm}
          onFocus={(e) => {
            setFocused(true)
            onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocused(false)
            onBlur?.(e)
          }}
          style={{
            flex: 1,
            minWidth: 0,
            color: colors.warm,
            fontFamily: fonts.regular,
            fontSize: multiline ? 15 : 16,
            height: multiline ? undefined : 54,
            paddingVertical: multiline ? 16 : 0,
            textAlignVertical: multiline ? 'top' : 'center',
          }}
        />
        {suffix ? (
          <Text style={{ color: colors.muted2, fontFamily: fonts.medium, fontSize: 13 }}>{suffix}</Text>
        ) : null}
        {trailing}
      </Animated.View>
      {error ? (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
          <AlertCircle size={13} color={colors.dangerSoft} style={{ marginTop: 2 }} />
          <Text style={{ flex: 1, color: colors.dangerSoft, fontFamily: fonts.regular, fontSize: 12, lineHeight: 16 }}>
            {error}
          </Text>
        </View>
      ) : null}
    </View>
  )
}
