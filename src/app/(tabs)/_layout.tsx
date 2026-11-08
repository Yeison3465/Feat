import React from 'react'
import { Tabs } from 'expo-router'
import { FloatingTabBar } from '../../shared/ui/FloatingTabBar'

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          backgroundColor: '#0A0A0B',
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="personas" options={{ title: 'Personas' }} />
      <Tabs.Screen name="prestamos" options={{ title: 'Préstamos' }} />
      <Tabs.Screen name="configuracion" options={{ title: 'Configuración' }} />
    </Tabs>
  )
}
