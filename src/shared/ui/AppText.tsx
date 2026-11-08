import React from 'react'
import { Text, TextProps, TextStyle } from 'react-native'
import { colors, fonts } from '../theme/tokens'

export type TextVariant = 'title' | 'display' | 'metric' | 'sec' | 'h' | 'body' | 'lbl' | 'amt'
export type TextTone = 'warm' | 'muted' | 'muted2' | 'dark' | 'darkMuted' | 'danger' | 'ok' | 'inherit'

// Escala tipográfica del diseño (Geist, tracking negativo en los tamaños grandes)
const VARIANTS: Record<TextVariant, TextStyle> = {
  title: { fontFamily: fonts.semibold, fontSize: 44, lineHeight: 44, letterSpacing: -2 },
  display: { fontFamily: fonts.semibold, fontSize: 46, lineHeight: 48, letterSpacing: -2.07 },
  metric: { fontFamily: fonts.semibold, fontSize: 28, lineHeight: 30, letterSpacing: -1 },
  sec: { fontFamily: fonts.semibold, fontSize: 22, lineHeight: 26, letterSpacing: -0.55 },
  h: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 22, letterSpacing: -0.16 },
  body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  lbl: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16 },
  amt: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20, letterSpacing: -0.14 },
}

const TONES: Record<Exclude<TextTone, 'inherit'>, string> = {
  warm: colors.warm,
  muted: colors.muted,
  muted2: colors.muted2,
  dark: colors.onLight,
  darkMuted: colors.onLightMuted,
  danger: colors.dangerSoft,
  ok: colors.okSoft,
}

interface AppTextProps extends TextProps {
  readonly variant?: TextVariant
  readonly tone?: TextTone
}

export const AppText: React.FC<AppTextProps> = ({ variant = 'body', tone, style, ...rest }) => {
  const defaultTone: TextTone = variant === 'lbl' || variant === 'body' ? 'muted' : 'warm'
  const t = tone ?? defaultTone
  return (
    <Text
      {...rest}
      style={[VARIANTS[variant], t === 'inherit' ? null : { color: TONES[t] }, style]}
    />
  )
}
