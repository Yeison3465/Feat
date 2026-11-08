// Hápticos: uno por acción del usuario, en el mismo instante que el cambio visual.
// Nunca es el único aviso (muchos Android no vibran) y nunca se dispara por cuadro ni por entrada de pantalla.
import * as Haptics from 'expo-haptics'

export type HapticKind = 'selection' | 'light' | 'medium' | 'success' | 'warning' | 'error'

export function haptic(kind: HapticKind): void {
  try {
    switch (kind) {
      case 'selection':
        void Haptics.selectionAsync()
        break
      case 'light':
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        break
      case 'medium':
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        break
      case 'success':
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        break
      case 'warning':
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
        break
      case 'error':
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        break
    }
  } catch {
    // Sin soporte de hápticos (web, emulador): se ignora
  }
}
