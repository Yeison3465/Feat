import React from 'react'
import { Redirect } from 'expo-router'
import { useAuth } from '../modules/auth/hooks/useAuth'
import { SplashScreen } from '../shared/components/SplashScreen'

export default function RootIndex() {
  const { session, loading } = useAuth()

  if (loading) {
    return <SplashScreen />
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />
  }

  return <Redirect href="/(tabs)" />
}

