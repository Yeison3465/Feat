import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { AppState, AppStateStatus } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Session, User } from '@supabase/supabase-js'
import { AuthContextValue, SignInCredentials } from '../types'
import { authService } from '../services/auth.service'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// Tiempo límite de inactividad: 15 minutos (900.000 ms)
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000
const LAST_ACTIVE_KEY = '@prestamos_last_activity_time'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    // Check initial active session
    authService
      .getSession()
      .then((initialSession) => {
        if (!mounted) return
        setSession(initialSession)
        setUser(initialSession?.user ?? null)
      })
      .catch((err) => {
        if (!mounted) return
        setError(err.message)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    // Listen to auth state changes
    const { data: authListener } = authService.onAuthStateChange((_event, currentSession) => {
      if (!mounted) return
      setSession(currentSession)
      setUser(currentSession?.user ?? null)
      setLoading(false)
    })

    return () => {
      mounted = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  const recordActivity = useCallback(() => {
    AsyncStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString()).catch(() => {})
  }, [])

  const signOut = async () => {
    try {
      setLoading(true)
      await AsyncStorage.removeItem(LAST_ACTIVE_KEY).catch(() => {})
      await authService.signOut()
      setSession(null)
      setUser(null)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const checkInactivity = useCallback(async (): Promise<boolean> => {
    try {
      const raw = await AsyncStorage.getItem(LAST_ACTIVE_KEY)
      if (raw) {
        const lastActive = parseInt(raw, 10)
        if (!isNaN(lastActive) && Date.now() - lastActive >= INACTIVITY_TIMEOUT_MS) {
          await signOut()
          return true
        }
      }
    } catch {}
    return false
  }, [])

  // Monitoreo de inactividad de 30 minutos mientras exista sesión
  useEffect(() => {
    if (!session) return

    recordActivity()

    // 1. Detección inmediata al volver de segundo plano
    const subscription = AppState.addEventListener('change', async (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        const timedOut = await checkInactivity()
        if (!timedOut) {
          recordActivity()
        }
      } else {
        recordActivity()
      }
    })

    // 2. Temporizador periódico en primer plano (cada 30 segundos)
    const interval = setInterval(async () => {
      await checkInactivity()
    }, 30000)

    return () => {
      subscription.remove()
      clearInterval(interval)
    }
  }, [session, checkInactivity, recordActivity])

  const signIn = async (credentials: SignInCredentials) => {
    try {
      setLoading(true)
      setError(null)
      const data = await authService.signInWithPassword(credentials)
      setSession(data.session)
      setUser(data.user)
      recordActivity()
      return { success: true }
    } catch (err: any) {
      const msg = err.message || 'Error al iniciar sesión'
      setError(msg)
      return { success: false, error: msg }
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      setLoading(true)
      setError(null)
      await authService.resetPasswordForEmail(email)
      return { success: true }
    } catch (err: any) {
      const msg = err.message || 'Error al enviar instrucciones'
      setError(msg)
      return { success: false, error: msg }
    } finally {
      setLoading(false)
    }
  }

  const clearError = () => setError(null)

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      loading,
      error,
      signIn,
      resetPassword,
      signOut,
      clearError,
      recordActivity,
    }),
    [session, user, loading, error, recordActivity]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider')
  }
  return context
}

