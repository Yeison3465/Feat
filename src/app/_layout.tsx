import 'react-native-gesture-handler'
import React, { useEffect } from 'react'
import { Platform, View } from 'react-native'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useFonts } from 'expo-font'
import { AuthProvider, useAuth } from '../modules/auth/hooks/useAuth'
import { PeopleProvider } from '../modules/people/context/PeopleContext'
import { LoansProvider } from '../modules/loans/context/LoansContext'
import { SplashScreen } from '../shared/components/SplashScreen'
import '../../global.css'

function NavigationGuard({ fontsReady }: { readonly fontsReady: boolean }) {
  const { session, loading, recordActivity } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  const inAuthGroup = segments[0] === '(auth)'

  useEffect(() => {
    // Asegurar tema oscuro por defecto en Web de forma inmediata
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.classList.add('dark')
      document.documentElement.style.backgroundColor = '#0A0A0B'
      document.body.style.backgroundColor = '#0A0A0B'
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

  const showSplashOverlay = !fontsReady || loading || (!session && !inAuthGroup) || (session && inAuthGroup)

  return (
    <View
      style={{ flex: 1, backgroundColor: '#0A0A0B' }}
      className="flex-1 bg-[#0A0A0B]"
      onTouchStart={recordActivity}
    >
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade_from_bottom',
          contentStyle: { backgroundColor: '#0A0A0B' },
        }}
      >
        <Stack.Screen name="index" options={{ contentStyle: { backgroundColor: '#0A0A0B' } }} />
        <Stack.Screen name="(auth)" options={{ contentStyle: { backgroundColor: '#0A0A0B' } }} />
        <Stack.Screen name="(tabs)" options={{ contentStyle: { backgroundColor: '#0A0A0B' } }} />
        <Stack.Screen
          name="personas/crear"
          options={{
            animation: 'slide_from_right',
            presentation: 'card',
            contentStyle: { backgroundColor: '#0A0A0B' },
          }}
        />
        <Stack.Screen
          name="personas/[id]"
          options={{
            animation: 'slide_from_right',
            presentation: 'card',
            contentStyle: { backgroundColor: '#0A0A0B' },
          }}
        />
        <Stack.Screen
          name="prestamos/crear"
          options={{
            animation: 'slide_from_right',
            presentation: 'card',
            contentStyle: { backgroundColor: '#0A0A0B' },
          }}
        />
        <Stack.Screen
          name="prestamos/editar/[id]"
          options={{
            animation: 'slide_from_right',
            presentation: 'card',
            contentStyle: { backgroundColor: '#0A0A0B' },
          }}
        />
        <Stack.Screen
          name="prestamos/[id]"
          options={{
            animation: 'slide_from_right',
            presentation: 'card',
            contentStyle: { backgroundColor: '#0A0A0B' },
          }}
        />
        <Stack.Screen
          name="pagos/registrar"
          options={{
            animation: 'slide_from_right',
            presentation: 'card',
            contentStyle: { backgroundColor: '#0A0A0B' },
          }}
        />
        <Stack.Screen
          name="pagos/[id]"
          options={{
            animation: 'slide_from_right',
            presentation: 'card',
            contentStyle: { backgroundColor: '#0A0A0B' },
          }}
        />
        <Stack.Screen
          name="vencimientos"
          options={{
            animation: 'slide_from_right',
            presentation: 'card',
            contentStyle: { backgroundColor: '#0A0A0B' },
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
            backgroundColor: '#0A0A0B',
            zIndex: 999,
          }}
        >
          {/* Sin texto hasta que Geist esté cargada, para evitar el salto de fuente */}
          {fontsReady ? <SplashScreen /> : null}
        </View>
      )}
    </View>
  )
}

export default function RootLayout() {
  // Geist (rediseño). Si falla la carga se sigue con la fuente del sistema para no bloquear la app.
  // Se importan solo los 4 pesos usados (el índice del paquete arrastra los 18 y engorda la app)
  const [fontsLoaded, fontError] = useFonts({
    Geist_300Light: require('@expo-google-fonts/geist/300Light/Geist_300Light.ttf'),
    Geist_400Regular: require('@expo-google-fonts/geist/400Regular/Geist_400Regular.ttf'),
    Geist_500Medium: require('@expo-google-fonts/geist/500Medium/Geist_500Medium.ttf'),
    Geist_600SemiBold: require('@expo-google-fonts/geist/600SemiBold/Geist_600SemiBold.ttf'),
  })
  const fontsReady = fontsLoaded || !!fontError

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#0A0A0B' }}>
      <SafeAreaProvider
        initialMetrics={initialWindowMetrics}
        style={{ flex: 1, backgroundColor: '#0A0A0B' }}
      >
        <StatusBar style="light" />
        <AuthProvider>
          <PeopleProvider>
            <LoansProvider>
              <NavigationGuard fontsReady={fontsReady} />
            </LoansProvider>
          </PeopleProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
