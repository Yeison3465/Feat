import React from 'react'
import { StyleProp, StyleSheet, View, ViewProps, ViewStyle } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { colors, inkGradient, inkRedGradient, radii } from '../theme/tokens'

export type CardVariant = 'dark' | 'ink' | 'inkRed' | 'white'

interface CardProps extends ViewProps {
  readonly variant?: CardVariant
  readonly radius?: number
  readonly style?: StyleProp<ViewStyle>
  readonly children?: React.ReactNode
}

const base: Record<CardVariant, ViewStyle> = {
  // Tarjeta oscura simple
  dark: { backgroundColor: colors.card, borderColor: colors.line },
  // Negro laca: bloque destacado oscuro con reflejo arriba
  ink: { backgroundColor: colors.ink, borderColor: colors.line2 },
  // Negro laca rojizo: solo para atraso y riesgo
  inkRed: { backgroundColor: '#1A0807', borderColor: 'rgba(255,107,94,0.5)' },
  // Tarjeta blanca de métricas (texto oscuro encima)
  white: { backgroundColor: colors.white, borderColor: 'transparent' },
}

export const Card: React.FC<CardProps> = ({
  variant = 'dark',
  radius = radii.card,
  style,
  children,
  ...rest
}) => {
  const glossy = variant === 'ink' || variant === 'inkRed'
  const gradient = variant === 'inkRed' ? inkRedGradient : inkGradient
  return (
    <View
      {...rest}
      style={[
        { borderWidth: variant === 'white' ? 0 : 1, borderRadius: radius, overflow: 'hidden' },
        base[variant],
        style,
      ]}
    >
      {glossy && (
        <>
          <LinearGradient
            pointerEvents="none"
            colors={gradient.colors}
            locations={gradient.locations}
            style={StyleSheet.absoluteFill}
          />
          {/* Reflejo fino en el borde superior */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              left: radius / 2,
              right: radius / 2,
              height: 1,
              backgroundColor:
                variant === 'inkRed' ? 'rgba(255,160,150,0.34)' : 'rgba(255,255,255,0.24)',
            }}
          />
        </>
      )}
      {children}
    </View>
  )
}
