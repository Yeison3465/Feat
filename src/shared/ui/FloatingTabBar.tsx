import React from 'react'
import { Text, View } from 'react-native'
import Animated, { FadeIn, LinearTransition, useReducedMotion } from 'react-native-reanimated'
import { Home, Users, CreditCard, SlidersHorizontal } from 'lucide-react-native'
import type { BottomTabBarProps } from 'expo-router/build/layouts/Tabs'
import { AnimatedPressable } from '../components/AnimatedPressable'
import { getSafeBottomInset } from '../utils/responsive'
import { DURATION, EASE_OUT } from '../motion'
import { colors, fonts } from '../theme/tokens'

const ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  index: Home,
  personas: Users,
  prestamos: CreditCard,
  configuracion: SlidersHorizontal,
}

// Barra inferior flotante en píldora: la pestaña activa se rellena de blanco cálido y muestra su nombre;
// las demás son círculos de 48 px. Al cambiar de pestaña los anchos se reacomodan en 280 ms (ease-out).
// El contenido de las pestañas no se desliza: son pares, no una jerarquía.
export const FloatingTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, emitter, navigateToTab, insets }) => {
  const reduced = useReducedMotion()
  const layout = reduced ? undefined : LinearTransition.duration(DURATION.accordion).easing(EASE_OUT)

  return (
    <View
      style={{
        alignItems: 'center',
        backgroundColor: colors.app,
        paddingTop: 8,
        paddingBottom: getSafeBottomInset(insets.bottom, 12),
      }}
    >
      <View
        accessibilityRole="tablist"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          padding: 6,
          borderRadius: 999,
          backgroundColor: colors.card2,
          borderWidth: 1,
          borderColor: colors.line,
          boxShadow: '0 14px 36px rgba(0,0,0,0.5)',
        }}
      >
        {state.routes.map((route, index) => {
          const focused = state.index === index
          const { options } = descriptors[route.key]
          const label = typeof options.title === 'string' ? options.title : route.name
          const Icon = ICONS[route.name] ?? Home

          const onPress = () => {
            const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true })
            if (!focused && !event.defaultPrevented) navigateToTab(route.key)
          }

          return (
            <Animated.View key={route.key} layout={layout}>
              <AnimatedPressable
                onPress={onPress}
                accessibilityRole="tab"
                accessibilityLabel={label}
                accessibilityState={{ selected: focused }}
                style={{
                  height: 48,
                  minWidth: 48,
                  borderRadius: 999,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  paddingLeft: focused ? 14 : 0,
                  paddingRight: focused ? 18 : 0,
                  backgroundColor: focused ? colors.warm : 'transparent',
                }}
              >
                <Icon size={20} color={focused ? colors.onLight : colors.muted} />
                {focused && (
                  <Animated.View entering={reduced ? undefined : FadeIn.duration(DURATION.control)}>
                    <Text style={{ color: colors.onLight, fontFamily: fonts.medium, fontSize: 14 }}>{label}</Text>
                  </Animated.View>
                )}
              </AnimatedPressable>
            </Animated.View>
          )
        })}
      </View>
    </View>
  )
}
