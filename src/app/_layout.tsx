import React, { useEffect } from 'react'
import { Platform, View } from 'react-native'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context'
import { AuthProvider, useAuth } from '../modules/auth/hooks/useAuth'
import { PeopleProvider } from '../modules/people/context/PeopleContext'
import { LoansProvider } from '../modules/loans/context/LoansContext'
import { SplashScreen } from '../shared/components/SplashScreen'
import '../../global.css'

function NavigationGuard() {
  const { session, loading, recordActivity } = useAuth()
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
    <View className="flex-1 bg-[#060709]" onTouchStart={recordActivity}>
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
        <Stack.Screen
          name="prestamos/crear"
          options={{
            animation: 'slide_from_right',
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="prestamos/[id]"
          options={{
            animation: 'slide_from_right',
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="pagos/registrar"
          options={{
            animation: 'slide_from_right',
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="pagos/[id]"
          options={{
            animation: 'slide_from_right',
            presentation: 'card',
          }}
        />
      </Stack>
    </View>
  )
}

export default function RootLayout() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <StatusBar style="light" />
      <AuthProvider>
        <PeopleProvider>
          <LoansProvider>
            <NavigationGuard />
          </LoansProvider>
        </PeopleProvider>
      </AuthProvider>
    </SafeAreaProvider>
  )
}
