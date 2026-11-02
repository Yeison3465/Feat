---
name: reanimated-animations
description: Patrones de animación fluida con React Native Reanimated para transiciones, skeleton loaders, retroalimentación táctil y modales, respetando la accesibilidad de reducción de movimiento.
---

# Reanimated Animations — Patrones de Animación Fluida

## 1. Objetivo y Contexto
Esta skill proporciona los estándares para implementar microinteracciones, transiciones de pantalla y animaciones de retroalimentación táctil utilizando **React Native Reanimated v3** en la aplicación móvil de préstamos. Su objetivo es aportar una experiencia moderna y pulida sin comprometer la usabilidad ni el rendimiento a 60 FPS.

## 2. Cuándo Utilizar Esta Skill
- Al crear componentes con estados de carga interactivos (skeleton loaders pulsantes).
- Al diseñar transiciones entre pantallas, apertura de hojas inferiores (bottom sheets) o modales de confirmación.
- Al animar indicadores visuales (como barras de progreso o insignias de estado de cuotas).
- Al añadir feedback visual suave en botones y tarjetas presionables.

## 3. Principios Fundamentales
1. **Ejecución en el Hilo de UI (UI Thread):**
   - Todas las animaciones deben ejecutarse directamente en el hilo nativo utilizando los `worklets` de Reanimated para evitar que el hilo de JavaScript (JS Thread) genere saltos o caídas de fotogramas (frame drops).
2. **Minimalismo y Sobriedad:**
   - La aplicación es una herramienta de gestión financiera privada; las animaciones deben ser sutiles, rápidas ($\le 300$ ms) y orientadas a dar certeza operativa, no meramente ornamentales.
3. **Respeto a la Reducción de Movimiento (Accesibilidad):**
   - Siempre verificar la preferencia del sistema operativo de reducción de movimiento (`AccessibilityInfo.isReduceMotionEnabled` o `useReducedMotion`). Si está activada, suprimir desplazamientos y optar por transiciones instantáneas o cambios directos de opacidad.

## 4. Patrones de Animación Recomendados

### 4.1 Transición Suave de Entrada (Fade In / Slide Up)
Ideal para tarjetas de resumen y formularios al cargar la pantalla:
```tsx
import React from 'react'
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated'

export const AnimatedCard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Animated.View 
      entering={FadeInUp.duration(250).springify()}
      exiting={FadeOutDown.duration(200)}
      className="p-4 bg-[#14141B] rounded-2xl border border-[#262630]"
    >
      {children}
    </Animated.View>
  )
}
```

### 4.2 Skeleton Loader Pulsante
Ideal para estados de carga en el Dashboard y listas de prestatarios:
```tsx
import React, { useEffect } from 'react'
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing 
} from 'react-native-reanimated'

export const SkeletonBox: React.FC<{ width?: number | string; height?: number }> = ({ 
  width = '100%', 
  height = 20 
}) => {
  const opacity = useSharedValue(0.3)

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    )
  }, [opacity])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  return (
    <Animated.View 
      style={[{ width: width as any, height }, animatedStyle]} 
      className="bg-[#262630] rounded-lg"
    />
  )
}
```

### 4.3 Retroalimentación Táctil en Botones (Scale Feedback)
Proporciona respuesta inmediata al presionar botones principales de acción:
```tsx
import React from 'react'
import { Pressable, Text } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'

interface ButtonProps {
  readonly title: string
  readonly onPress: () => void
}

export const AnimatedPrimaryButton: React.FC<ButtonProps> = ({ title, onPress }) => {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  return (
    <Pressable
      onPressIn={() => (scale.value = withSpring(0.97))}
      onPressOut={() => (scale.value = withSpring(1))}
      onPress={onPress}
    >
      <Animated.View 
        style={animatedStyle}
        className="h-12 bg-[#C94422] rounded-xl items-center justify-center px-6"
      >
        <Text className="text-white font-bold font-['PlusJakartaSans-Bold']">
          {title}
        </Text>
      </Animated.View>
    </Pressable>
  )
}
```

## 5. Buenas Prácticas
- No animar propiedades que obliguen a recalcular el diseño nativo (`width`, `height`, `margin`) si se puede lograr el mismo efecto animando `transform` (scale, translate) y `opacity`.
- Desmontar o cancelar animaciones cíclicas infinitas al desmontar el componente para evitar fugas de memoria o uso innecesario de batería.
