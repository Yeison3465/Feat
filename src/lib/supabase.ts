import { AppState, Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import { Database } from '../shared/types/database.types'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''

const crossPlatformStorage = {
  getItem: (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') return Promise.resolve(null)
      return Promise.resolve(window.localStorage.getItem(key))
    }
    return AsyncStorage.getItem(key)
  },
  setItem: (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, value)
      }
      return Promise.resolve()
    }
    return AsyncStorage.setItem(key, value)
  },
  removeItem: (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key)
      }
      return Promise.resolve()
    }
    return AsyncStorage.removeItem(key)
  },
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: crossPlatformStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
})

if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh()
    } else {
      supabase.auth.stopAutoRefresh()
    }
  })
}
