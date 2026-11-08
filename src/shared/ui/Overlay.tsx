import React, { useEffect, useState } from 'react'
import { Modal, Pressable, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '../theme/tokens'
import { DURATION, EASE_OUT, EASE_SHEET } from '../motion'
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
export const Sheet: React.FC<OverlayProps> = ({ visible, onClose, children }) => {
  const reduced = useReducedMotion()
  const insets = useSafeAreaInsets()
  const mounted = useExit(visible, DURATION.sheetOut)
  const progress = useProgress(visible, DURATION.sheetIn, DURATION.sheetOut, EASE_SHEET)
  const [height, setHeight] = useState(0)

  const scrimStyle = useAnimatedStyle(() => ({ opacity: progress.value }))
  const sheetStyle = useAnimatedStyle(() => ({
    opacity: reduced ? progress.value : 1,
    transform: [{ translateY: reduced ? 0 : (1 - progress.value) * (height || 700) }],
  }))

  return (
    <Modal visible={mounted} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
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
              paddingTop: 12,
              paddingHorizontal: 16,
              paddingBottom: Math.max(insets.bottom, 16) + 8,
            },
            sheetStyle,
          ]}
        >
          <View style={{ alignSelf: 'center', width: 36, height: 4, borderRadius: 999, backgroundColor: '#3A3A3F', marginBottom: 12 }} />
          {children}
        </Animated.View>
      </View>
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
