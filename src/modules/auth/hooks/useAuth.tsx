import React, { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { AuthContextValue, SignInCredentials } from '../types'
import { authService } from '../services/auth.service'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

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

  const signIn = async (credentials: SignInCredentials) => {
    try {
      setLoading(true)
      setError(null)
      const data = await authService.signInWithPassword(credentials)
      setSession(data.session)
      setUser(data.user)
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

  const signOut = async () => {
    try {
      setLoading(true)
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
    }),
    [session, user, loading, error]
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

