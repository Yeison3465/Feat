import React, { useEffect } from 'react'
import { Slot, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider, useAuth } from '../modules/auth/hooks/useAuth'
import { SplashScreen } from '../shared/components/SplashScreen'
import '../../global.css'

function NavigationGuard() {
  const { session, loading } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    const inAuthGroup = segments[0] === '(auth)'

    if (!session && !inAuthGroup) {
      // Redirigir a login si no hay sesión activa y se intenta acceder a rutas privadas
      router.replace('/(auth)/login')
    } else if (session && inAuthGroup) {
      // Redirigir a las pestañas principales si ya existe una sesión autenticada
      router.replace('/(tabs)')
    }
  }, [session, loading, segments, router])

  if (loading) {
    return <SplashScreen />
  }

  return <Slot />
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AuthProvider>
        <NavigationGuard />
      </AuthProvider>
    </SafeAreaProvider>
  )
}
