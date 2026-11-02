---
name: expo-mobile-development
description: Buenas prácticas y patrones para desarrollo en Expo SDK 52, Expo Router v4, React Native con TypeScript, ergonomía móvil, formularios y gestión de estados.
---

# Expo Mobile Development — Desarrollo Móvil con Expo y React Native

## 1. Objetivo y Contexto
Esta skill proporciona los estándares, convenciones técnicas y patrones de implementación para el desarrollo móvil con **Expo SDK 52**, **Expo Router v4**, **React Native 0.76+** y **TypeScript**.

## 2. Cuándo Utilizar Esta Skill
- Al crear o modificar pantallas y layouts en `src/app/`.
- Al construir componentes reutilizables o formularios de entrada de datos.
- Al manejar navegación declarativa, parámetros de ruta o redirecciones protegidas.
- Al optimizar el rendimiento de listas, inputs y renderizados en dispositivos móviles.

## 3. Patrones de Expo Router v4
1. **Convención de Archivos:**
   - Carpetas entre paréntesis `(auth)`, `(tabs)` para agrupar rutas sin alterar la URL.
   - Parámetros dinámicos mediante corchetes `[id].tsx`.
   - `_layout.tsx` para definir la pila (`Stack`) o pestañas (`Tabs`).
2. **Navegación Protegida (Auth Flow):**
   - El layout raíz (`src/app/_layout.tsx`) debe escuchar el estado de la sesión de Supabase Auth.
   - Si no hay sesión válida, redirigir inmediatamente a `/(auth)/login`.
   - Mientras se determina el estado de la sesión, mostrar un Splash / Activity Indicator sin renderizar datos privados en memoria (RNF-003).

## 4. Estándares de Componentes y Formularios
1. **Ergonomía Móvil y Zonas Seguras:**
   - Usar `SafeAreaView` o hooks como `useSafeAreaInsets` de `react-native-safe-area-context` para respetar notches, Dynamic Island y barras de gestos nativas.
   - Altura y área táctil mínima para elementos interactivos: $\ge 44 \times 44$ puntos.
   - Usar `KeyboardAvoidingView` con comportamiento adaptativo (`behavior={Platform.OS === 'ios' ? 'padding' : undefined}`) para evitar que el teclado tape los campos numéricos y botones de acción.
2. **Tipado Estricto con TypeScript:**
   - Definir interfaces explícitas para las `props` de cada componente.
   - Prohibido el uso de `any`; utilizar tipos derivados de `src/shared/types/database.types.ts` o tipos de dominio específicos.
3. **Manejo de Estados de UI (RF-014):**
   Todo componente o pantalla que consuma datos asíncronos debe contemplar explícitamente:
   - **Loading:** Skeleton loader o spinner minimalista.
   - **Error:** Mensaje amigable con botón de reintento (`Reintentar`), sin revelar detalles técnicos o errores de base de datos al usuario final.
   - **Empty:** Mensaje orientativo cuando la lista o métrica no contenga registros (ej. "Aún no tienes préstamos activos").
   - **Success:** Notificación o feedback claro al completar transacciones.

## 5. Rendimiento Móvil
- **Listas Largas:** Utilizar `FlatList` con `keyExtractor` estable, `getItemLayout` cuando la altura sea uniforme, y componentes de item memorizados con `React.memo` si es necesario.
- **Formateadores:** Memorizar cálculos pesados con `useMemo` y callbacks estables con `useCallback`.
- **Imports:** Evitar importar paquetes completos; importar únicamente los símbolos requeridos.

## 6. Ejemplo de Estructura de Pantalla
```tsx
import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

interface Props {
  readonly onProceed: () => void
}

export const ActionCard: React.FC<Props> = ({ onProceed }) => {
  return (
    <SafeAreaView edges={['bottom']} className="p-4 bg-[#14141B] rounded-2xl border border-[#262630]">
      <Text className="text-white text-lg font-bold font-['PlusJakartaSans-Bold']">
        Resumen
      </Text>
      <Pressable 
        onPress={onProceed}
        className="mt-4 h-12 bg-[#C94422] active:bg-[#FF7854] rounded-xl items-center justify-center"
      >
        <Text className="text-white font-semibold">Continuar</Text>
      </Pressable>
    </SafeAreaView>
  )
}
```
