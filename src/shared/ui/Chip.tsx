import React from 'react'
import { StyleProp, Text, View, ViewStyle } from 'react-native'
import { colors, fonts } from '../theme/tokens'

export type ChipTone = 'neutral' | 'ok' | 'warn' | 'danger'

interface ChipProps {
  readonly label: string
  readonly tone?: ChipTone
  // Sobre fotos: fondo translúcido con borde claro
  readonly glass?: boolean
  readonly icon?: React.ReactNode
  readonly style?: StyleProp<ViewStyle>
}

const SOLID: Record<ChipTone, { bg: string; fg: string }> = {
  neutral: { bg: colors.card2, fg: colors.muted },
  ok: { bg: 'rgba(127,214,164,0.14)', fg: colors.okSoft },
  warn: { bg: 'rgba(242,196,109,0.14)', fg: colors.warn },
  danger: { bg: 'rgba(255,107,94,0.14)', fg: '#FF7A6E' },
}

const GLASS: Record<ChipTone, { bg: string; fg: string; border: string }> = {
  neutral: { bg: 'rgba(10,10,11,0.5)', fg: colors.warm, border: 'rgba(255,255,255,0.16)' },
  ok: { bg: 'rgba(127,214,164,0.22)', fg: '#A6E8C3', border: 'rgba(127,214,164,0.4)' },
  warn: { bg: 'rgba(242,196,109,0.22)', fg: '#F8D58E', border: 'rgba(242,196,109,0.4)' },
  danger: { bg: 'rgba(255,107,94,0.28)', fg: '#FFB8B0', border: 'rgba(255,107,94,0.45)' },
}

export const Chip: React.FC<ChipProps> = ({ label, tone = 'neutral', glass = false, icon, style }) => {
  const g = glass ? GLASS[tone] : null
  const c = g ?? SOLID[tone]
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'flex-start',
          gap: 4,
          height: glass ? 28 : 24,
          paddingHorizontal: glass ? 12 : 10,
          borderRadius: 999,
          backgroundColor: c.bg,
          borderWidth: glass ? 1 : 0,
          borderColor: g ? g.border : undefined,
        },
        style,
      ]}
    >
      {icon}
      <Text style={{ color: c.fg, fontFamily: fonts.medium, fontSize: 11, lineHeight: 14 }}>{label}</Text>
    </View>
  )
}
