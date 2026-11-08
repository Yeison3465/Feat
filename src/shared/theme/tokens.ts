// Tokens de diseño "Evora Dark" para usar fuera de className
// (LinearGradient, SVG, StyleSheet). Mantener en sincronía con tailwind.config.js.

export const colors = {
  app: '#0A0A0B',
  card: '#141416',
  card2: '#1D1D20',
  ink: '#0C0C0E',
  line: '#2A2A2E',
  line2: '#303036',
  warm: '#F5F5F3',
  white: '#FFFFFF',
  muted: '#A3A3A8',
  muted2: '#8E8E94',
  danger: '#FF6B5E',
  dangerSoft: '#FF8A7E',
  ok: '#7FD6A4',
  okSoft: '#86DDAB',
  warn: '#F2C46D',
  gold: '#A6824A',
  // Texto sobre superficies claras (tarjetas blancas)
  onLight: '#0A0A0B',
  onLightMuted: '#55555B',
} as const

export const fonts = {
  light: 'Geist_300Light',
  regular: 'Geist_400Regular',
  medium: 'Geist_500Medium',
  semibold: 'Geist_600SemiBold',
} as const

export const radii = {
  pill: 999,
  card: 28,
  hero: 32,
  field: 20,
  chip: 999,
} as const

// Degradado del "negro laca": reflejo arriba que se apaga hacia abajo
export const inkGradient = {
  colors: ['rgba(255,255,255,0.13)', 'rgba(255,255,255,0.04)', 'rgba(255,255,255,0)'] as const,
  locations: [0, 0.34, 0.58] as const,
}
export const inkRedGradient = {
  colors: ['rgba(255,140,128,0.2)', 'rgba(255,107,94,0.07)', 'rgba(255,107,94,0)'] as const,
  locations: [0, 0.36, 0.6] as const,
}
