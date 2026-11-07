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
    // Asegurar tema oscuro por defecto en Web de forma inmediata
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.classList.add('dark')
      document.documentElement.style.backgroundColor = '#060709'
      document.body.style.backgroundColor = '#060709'
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

  const showSplashOverlay = loading || (!session && !inAuthGroup) || (session && inAuthGroup)

  return (
    <View
      style={{ flex: 1, backgroundColor: '#060709' }}
      className="flex-1 bg-[#060709]"
      onTouchStart={recordActivity}
    >
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade_from_bottom',
          contentStyle: { backgroundColor: '#060709' },
        }}
      >
        <Stack.Screen name="index" options={{ contentStyle: { backgroundColor: '#060709' } }} />
        <Stack.Screen name="(auth)" options={{ contentStyle: { backgroundColor: '#060709' } }} />
        <Stack.Screen name="(tabs)" options={{ contentStyle: { backgroundColor: '#060709' } }} />
        <Stack.Screen
          name="personas/crear"
          options={{
            animation: 'slide_from_right',
            presentation: 'card',
            contentStyle: { backgroundColor: '#060709' },
          }}
        />
        <Stack.Screen
          name="personas/[id]"
          options={{
            animation: 'slide_from_right',
            presentation: 'card',
            contentStyle: { backgroundColor: '#060709' },
          }}
        />
        <Stack.Screen
          name="prestamos/crear"
          options={{
            animation: 'slide_from_right',
            presentation: 'card',
            contentStyle: { backgroundColor: '#060709' },
          }}
        />
        <Stack.Screen
          name="prestamos/editar/[id]"
          options={{
            animation: 'slide_from_right',
            presentation: 'card',
            contentStyle: { backgroundColor: '#060709' },
          }}
        />
        <Stack.Screen
          name="prestamos/[id]"
          options={{
            animation: 'slide_from_right',
            presentation: 'card',
            contentStyle: { backgroundColor: '#060709' },
          }}
        />
        <Stack.Screen
          name="pagos/registrar"
          options={{
            animation: 'slide_from_right',
            presentation: 'card',
            contentStyle: { backgroundColor: '#060709' },
          }}
        />
        <Stack.Screen
          name="pagos/[id]"
          options={{
            animation: 'slide_from_right',
            presentation: 'card',
            contentStyle: { backgroundColor: '#060709' },
          }}
        />
        <Stack.Screen
          name="vencimientos"
          options={{
            animation: 'slide_from_right',
            presentation: 'card',
            contentStyle: { backgroundColor: '#060709' },
          }}
        />
      </Stack>
      {showSplashOverlay && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#060709',
            zIndex: 999,
          }}
        >
          <SplashScreen />
        </View>
      )}
    </View>
  )
}

export default function RootLayout() {
  return (
    <SafeAreaProvider
      initialMetrics={initialWindowMetrics}
      style={{ flex: 1, backgroundColor: '#060709' }}
    >
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
