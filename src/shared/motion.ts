// Sistema de movimiento (hoja "Animaciones" del prototipo).
// Reglas: solo transform y opacity; entradas con ease-out; salidas más rápidas que las entradas;
// si hay dedo, resorte; movimiento reducido siempre soportado.
import { Easing, FadeIn, FadeInDown } from 'react-native-reanimated'

// Curvas
export const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1)
export const EASE_IN_OUT = Easing.bezier(0.77, 0, 0.175, 1)
export const EASE_SHEET = Easing.bezier(0.32, 0.72, 0, 1)

// Duraciones (ms)
export const DURATION = {
  press: 120,
  control: 200,
  accordion: 280,
  dialogIn: 240,
  dialogOut: 160,
  sheetIn: 420,
  sheetOut: 280,
  snackIn: 340,
  snackOut: 200,
  screenIn: 460,
  stagger: 40,
  staggerMax: 320,
  countUp: 700,
  fade: 200,
} as const

// Resortes (solo cuando hay gesto con dedo)
export const SPRING = {
  settle: { duration: 400, dampingRatio: 1 },
  snapBack: { duration: 400, dampingRatio: 0.8 },
  sheet: { duration: 300, dampingRatio: 0.8 },
} as const

// Escala de presión
export const PRESS_SCALE = 0.97

// Retardo escalonado de entrada de pantalla: 40 ms por bloque, tope 320 ms
export const staggerDelay = (index: number) =>
  Math.min(index * DURATION.stagger, DURATION.staggerMax)

// Entrada de bloque de pantalla: sube 14 px con fundido (460 ms, ease-out), escalonada de 40 ms en 40 ms.
// Con movimiento reducido solo hay un fundido corto de 200 ms, sin desplazamiento.
export const screenEnter = (index: number, reduced: boolean) =>
  reduced
    ? FadeIn.duration(DURATION.fade)
    : FadeInDown.withInitialValues({ opacity: 0, transform: [{ translateY: 14 }] })
        .delay(staggerDelay(index))
        .duration(DURATION.screenIn)
        .easing(EASE_OUT)
