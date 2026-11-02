import React from 'react'
import { Platform } from 'react-native'
import { Tabs } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Home, Users, CreditCard, Settings } from 'lucide-react-native'

export default function TabsLayout() {
  const insets = useSafeAreaInsets()

  // En dispositivos con barra de navegación nativa (Android) o indicador Home (iOS),
  // garantizamos que las etiquetas e iconos queden por encima de la barra del sistema.
  const bottomInset = insets.bottom > 0 ? insets.bottom : Platform.OS === 'android' ? 10 : 8
  const tabHeight = 56 + bottomInset

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#12131A',
          borderTopColor: '#1F202E',
          borderTopWidth: 1,
          height: tabHeight,
          paddingBottom: bottomInset,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#FF7854',
        tabBarInactiveTintColor: '#71717A',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="personas"
        options={{
          title: 'Personas',
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="prestamos"
        options={{
          title: 'Préstamos',
          tabBarIcon: ({ color, size }) => <CreditCard size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="configuracion"
        options={{
          title: 'Configuración',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  )
}
