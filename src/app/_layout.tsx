import React, { useEffect } from 'react'
import { Platform } from 'react-native'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider, useAuth } from '../modules/auth/hooks/useAuth'
import { PeopleProvider } from '../modules/people/context/PeopleContext'
import { SplashScreen } from '../shared/components/SplashScreen'
import '../../global.css'

function NavigationGuard() {
  const { session, loading } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  const inAuthGroup = segments[0] === '(auth)'

  useEffect(() => {
    // Asegurar tema oscuro por defecto en Web
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.classList.add('dark')
    }
  }, [])

  useEffect(() => {
    if (loading) return

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login')
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)')
    }
  }, [session, loading, inAuthGroup, router])

  if (loading) {
    return <SplashScreen />
  }

  // Prevenir que se rendericen rutas privadas si no hay sesión activa
  if (!session && !inAuthGroup) {
    return <SplashScreen />
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="personas/crear"
        options={{
          animation: 'slide_from_right',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="personas/[id]"
        options={{
          animation: 'slide_from_right',
          presentation: 'card',
        }}
      />
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AuthProvider>
        <PeopleProvider>
          <NavigationGuard />
        </PeopleProvider>
      </AuthProvider>
    </SafeAreaProvider>
  )
}
