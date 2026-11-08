import React, { useEffect, useState } from 'react'
import { Modal, Pressable, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler'
import { scheduleOnRN } from 'react-native-worklets'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '../theme/tokens'
import { DURATION, EASE_OUT, EASE_SHEET, SPRING } from '../motion'
import { haptic } from '../haptics'
import { useExit } from './useExit'

interface OverlayProps {
  readonly visible: boolean
  readonly onClose: () => void
  readonly children: React.ReactNode
}

const SCRIM = 'rgba(0,0,0,0.72)'

// Progreso 0 → 1 al abrir (lento) y 1 → 0 al cerrar (más rápido)
function useProgress(visible: boolean, inMs: number, outMs: number, easing: typeof EASE_OUT) {
  const progress = useSharedValue(0)
  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, { duration: visible ? inMs : outMs, easing })
  }, [visible, inMs, outMs, easing, progress])
  return progress
}

// Hoja inferior: sube con la curva de iOS y baja por el mismo camino, más rápido.
// El fondo oscuro se aclara a la vez (no en cola). Con movimiento reducido solo hay fundido.
// Se arrastra desde el asa de arriba: sigue al dedo 1:1 hacia abajo (con resistencia hacia arriba) y se cierra
// por distancia o por un empujón rápido; si no, vuelve a su sitio con resorte conservando la velocidad.
export const Sheet: React.FC<OverlayProps> = ({ visible, onClose, children }) => {
  const reduced = useReducedMotion()
  const insets = useSafeAreaInsets()
  const mounted = useExit(visible, DURATION.sheetOut)
  const progress = useProgress(visible, DURATION.sheetIn, DURATION.sheetOut, EASE_SHEET)
  const [height, setHeight] = useState(0)
  const drag = useSharedValue(0)
  const sheetH = useSharedValue(700)

  useEffect(() => {
    if (visible) drag.value = 0
  }, [visible, drag])

  useEffect(() => {
    sheetH.value = height || 700
  }, [height, sheetH])

  const pan = Gesture.Pan()
    .enabled(!reduced)
    .activeOffsetY([-6, 6])
    .onUpdate((e) => {
      drag.value = e.translationY > 0 ? e.translationY : e.translationY * 0.12
    })
    .onEnd((e) => {
      const dismiss = e.translationY > 110 || e.velocityY > 900
      if (dismiss) {
        drag.value = withTiming(sheetH.value, { duration: DURATION.sheetOut, easing: EASE_SHEET })
        scheduleOnRN(haptic, 'selection')
        scheduleOnRN(onClose)
      } else {
        drag.value = withSpring(0, { ...SPRING.snapBack, velocity: e.velocityY })
      }
    })

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: progress.value * (1 - Math.min(Math.max(drag.value, 0) / sheetH.value, 1) * 0.8),
  }))
  const sheetStyle = useAnimatedStyle(() => ({
    opacity: reduced ? progress.value : 1,
    transform: [{ translateY: (reduced ? 0 : (1 - progress.value) * (height || 700)) + drag.value }],
  }))

  return (
    <Modal visible={mounted} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: SCRIM }, scrimStyle]}>
          <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Cerrar" />
        </Animated.View>
        <Animated.View
          onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
          style={[
            {
              maxHeight: '82%',
              backgroundColor: colors.card,
              borderWidth: 1,
              borderBottomWidth: 0,
              borderColor: colors.line,
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              paddingTop: 0,
              paddingHorizontal: 16,
              paddingBottom: Math.max(insets.bottom, 16) + 8,
            },
            sheetStyle,
          ]}
        >
          {/* Asa de arrastre: zona de 44 px de alto, la barrita visible mide 36×4 */}
          <GestureDetector gesture={pan}>
            <View style={{ height: 44, alignItems: 'center', justifyContent: 'center', marginHorizontal: -16 }}>
              <View style={{ width: 36, height: 4, borderRadius: 999, backgroundColor: '#3A3A3F' }} />
            </View>
          </GestureDetector>
          {children}
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  )
}

// Diálogo centrado: aparece con fundido y escala .95 → 1 (nunca desde 0), sale más rápido.
export const Dialog: React.FC<OverlayProps> = ({ visible, onClose, children }) => {
  const reduced = useReducedMotion()
  const mounted = useExit(visible, DURATION.dialogOut)
  const progress = useProgress(visible, DURATION.dialogIn, DURATION.dialogOut, EASE_OUT)

  const scrimStyle = useAnimatedStyle(() => ({ opacity: progress.value }))
  const dialogStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: reduced ? 1 : 0.95 + 0.05 * progress.value }],
  }))

  return (
    <Modal visible={mounted} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: SCRIM }, scrimStyle]}>
          <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Cerrar" />
        </Animated.View>
        <Animated.View
          accessibilityViewIsModal
          style={[
            {
              width: '100%',
              maxWidth: 342,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: 28,
              padding: 20,
              gap: 14,
            },
            dialogStyle,
          ]}
        >
          {children}
        </Animated.View>
      </View>
    </Modal>
  )
}
