// Fotos del rediseño y su elección por estado (ver hoja "Imagen por estado" del prototipo)
import type { ImageSourcePropType } from 'react-native'

export const images = {
  bills: require('../../assets/images/bills.jpg'),
  roll: require('../../assets/images/roll.jpg'),
  jar: require('../../assets/images/jar.jpg'),
  clock: require('../../assets/images/clock.jpg'),
  handshake: require('../../assets/images/handshake.jpg'),
  cash: require('../../assets/images/cash.jpg'),
  stopwatch: require('../../assets/images/stopwatch.jpg'),
  hourglass: require('../../assets/images/hourglass.jpg'),
  highfive: require('../../assets/images/highfive.jpg'),
} as const satisfies Record<string, ImageSourcePropType>

export type LoanImageTone = 'neutral' | 'gold' | 'danger' | 'ok'

export interface StateImage {
  readonly source: ImageSourcePropType
  // Punto focal de la foto dentro de la tarjeta (0-1)
  readonly focusY: number
  readonly tone: LoanImageTone
}

// Prioridad: mora > completado > exento > activo
export function loanImage(estado: string, exento: boolean): StateImage {
  if (estado === 'en_mora') return { source: images.clock, focusY: 0.35, tone: 'danger' }
  if (estado === 'completado') return { source: images.cash, focusY: 0.45, tone: 'ok' }
  if (exento) return { source: images.handshake, focusY: 0.4, tone: 'gold' }
  return { source: images.jar, focusY: 0.35, tone: 'neutral' }
}

export type InstallmentState = 'pagada' | 'atrasada' | 'pendiente'

export function installmentImage(estado: InstallmentState): StateImage {
  if (estado === 'atrasada') return { source: images.stopwatch, focusY: 0.3, tone: 'danger' }
  if (estado === 'pagada') return { source: images.handshake, focusY: 0.4, tone: 'ok' }
  return { source: images.hourglass, focusY: 0.4, tone: 'gold' }
}

// Hero del detalle: al día vs. en mora
export function loanHeroImage(enMora: boolean): StateImage {
  return enMora
    ? { source: images.clock, focusY: 0.35, tone: 'danger' }
    : { source: images.highfive, focusY: 0.4, tone: 'ok' }
}

// Tintes de degradado sobre la foto (de arriba hacia abajo) por tono
export const tintByTone: Record<LoanImageTone, readonly [string, string, string, string]> = {
  neutral: ['rgba(10,10,11,0.1)', 'rgba(10,10,11,0.5)', 'rgba(10,10,11,0.9)', '#0A0A0B'],
  gold: ['rgba(124,92,36,0.58)', 'rgba(10,10,11,0.6)', 'rgba(10,10,11,0.92)', '#0A0A0B'],
  danger: ['rgba(150,24,18,0.5)', 'rgba(10,10,11,0.58)', 'rgba(10,10,11,0.92)', '#0A0A0B'],
  ok: ['rgba(12,80,48,0.58)', 'rgba(10,10,11,0.6)', 'rgba(10,10,11,0.92)', '#0A0A0B'],
}
export const tintLocations = [0, 0.34, 0.62, 1] as const
