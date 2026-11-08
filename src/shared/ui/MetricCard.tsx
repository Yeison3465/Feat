import React from 'react'
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { AnimatedPressable } from '../components/AnimatedPressable'
import { Card } from './Card'
import { CoverImage } from './CoverImage'
import { images } from '../images'
import { colors, fonts } from '../theme/tokens'

export type MetricTone = 'light' | 'photo' | 'alert'
export type MetricChipTone = 'neutral' | 'ok' | 'danger' | 'on'

interface MetricCardProps {
  readonly label: string
  // Ícono dentro del círculo de la esquina (se pinta con el color del tono)
  readonly icon?: (color: string) => React.ReactNode
  // Reemplaza el círculo de la esquina (por ejemplo un chip)
  readonly topRight?: React.ReactNode
  readonly value?: string
  readonly valueColor?: string
  // Cifra o contenido propio en lugar de `value`
  readonly valueNode?: React.ReactNode
  readonly chip?: string
  readonly chipTone?: MetricChipTone
  // Contenido bajo la cifra en lugar del chip
  readonly footer?: React.ReactNode
  readonly tone?: MetricTone
  readonly onPress?: () => void
  readonly minHeight?: number
  readonly style?: StyleProp<ViewStyle>
  readonly accessibilityLabel?: string
}

const CHIP: Record<MetricChipTone, { bg: string; fg: string }> = {
  neutral: { bg: '#F2F2EF', fg: '#2B2B2F' },
  ok: { bg: 'rgba(31,122,77,0.14)', fg: '#1F7A4D' },
  danger: { bg: 'rgba(192,57,43,0.14)', fg: '#C0392B' },
  on: { bg: 'rgba(255,255,255,0.2)', fg: '#FFFFFF' },
}

// Tarjeta blanca de métricas del diseño: etiqueta y círculo arriba, cifra grande abajo y chip explicativo.
// Variantes: «photo» (sobre foto con tinte verde) y «alert» (con brillo rojo, para atención requerida).
export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  icon,
  topRight,
  value,
  valueColor,
  valueNode,
  chip,
  chipTone,
  footer,
  tone = 'light',
  onPress,
  minHeight = 172,
  style,
  accessibilityLabel,
}) => {
  const photo = tone === 'photo'
  const alert = tone === 'alert'
  const ink = photo ? '#FFFFFF' : alert ? '#C8372A' : colors.onLight
  const labelColor = photo ? 'rgba(255,255,255,0.88)' : alert ? '#B3261E' : colors.onLightMuted
  const circleBg = photo ? 'rgba(255,255,255,0.2)' : alert ? '#FFE9E5' : '#F2F2EF'
  const circleFg = photo ? '#FFFFFF' : alert ? '#D2392B' : colors.onLight
  const resolvedChipTone: MetricChipTone = chipTone ?? (photo ? 'on' : 'neutral')
  const chipColors = alert && !chipTone ? { bg: '#FFECE8', fg: '#B3261E' } : CHIP[resolvedChipTone]

  const body = (
    <Card
      variant="white"
      style={[
        { padding: 16, gap: 12, minHeight },
        alert
          ? { boxShadow: '0 0 0 1px rgba(255,107,94,0.45), 0 4px 14px rgba(255,107,94,0.3), 0 20px 48px -8px rgba(255,107,94,0.5)' }
          : null,
        style,
      ]}
    >
      {photo && (
        <>
          <CoverImage source={images.bills} focusY={0.4} style={StyleSheet.absoluteFill} />
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(24,128,78,0.78)', 'rgba(10,70,42,0.9)']}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </>
      )}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <Text style={{ flex: 1, color: labelColor, fontFamily: fonts.medium, fontSize: 12, lineHeight: 16 }}>{label}</Text>
        {topRight ??
          (icon ? (
            <View
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: circleBg, alignItems: 'center', justifyContent: 'center' }}
            >
              {icon(circleFg)}
            </View>
          ) : null)}
      </View>

      <View style={{ flex: 1 }} />

      {valueNode ??
        (value !== undefined ? (
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
            style={{ color: valueColor ?? ink, fontFamily: fonts.semibold, fontSize: 21, lineHeight: 26, letterSpacing: -0.63 }}
          >
            {value}
          </Text>
        ) : null)}

      {footer ??
        (chip ? (
          <View
            style={{
              alignSelf: 'flex-start',
              minHeight: 24,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 12,
              backgroundColor: chipColors.bg,
            }}
          >
            <Text style={{ color: chipColors.fg, fontFamily: fonts.medium, fontSize: 11, lineHeight: 14 }}>{chip}</Text>
          </View>
        ) : null)}
    </Card>
  )

  if (!onPress) return body
  return (
    <AnimatedPressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label}>
      {body}
    </AnimatedPressable>
  )
}
