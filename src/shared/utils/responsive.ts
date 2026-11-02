import { Platform } from 'react-native'

/**
 * Calcula el espacio inferior seguro garantizando que la barra de navegación del sistema
 * (especialmente la barra de 3 botones de Android: [< O ≡] que mide ~48px)
 * no se superponga sobre botones primarios ni sobre la barra de pestañas.
 */
export function getSafeBottomInset(insetsBottom: number, minPadding = 16): number {
  if (Platform.OS === 'android') {
    // Si insets.bottom es 0 (común en Xiaomi / MIUI / HyperOS o Android 14/15 con edge-to-edge),
    // reservamos como mínimo 44px para evitar que la barra de 3 botones tape los botones.
    return Math.max(insetsBottom, 44)
  }
  if (Platform.OS === 'ios') {
    // En iPhone con Home indicator (34px) o con botón físico (0px -> 16px)
    return Math.max(insetsBottom, minPadding)
  }
  return Math.max(insetsBottom, minPadding)
}

/**
 * Calcula dimensiones de la barra de pestañas (Tabs) asegurando ergonomía táctil
 * y separación clara de los botones del sistema en cualquier teléfono.
 */
export function getTabBarMetrics(insetsBottom: number) {
  const isAndroid = Platform.OS === 'android'
  const isIOS = Platform.OS === 'ios'

  let bottomInset: number
  if (isAndroid) {
    bottomInset = Math.max(insetsBottom, 44)
  } else if (isIOS) {
    bottomInset = Math.max(insetsBottom, 12)
  } else {
    bottomInset = 10
  }

  const tabHeight = 56 + bottomInset
  const paddingBottom = isAndroid ? Math.max(insetsBottom, 34) : bottomInset

  return {
    tabHeight,
    paddingBottom,
    bottomInset,
  }
}

