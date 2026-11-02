import { supabase } from '../../../lib/supabase'
import { SignInCredentials } from '../types'
import { AuthChangeEvent, Session } from '@supabase/supabase-js'

export const authService = {
  async signInWithPassword(credentials: SignInCredentials) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email.trim(),
      password: credentials.password,
    })

    if (error) {
      // Map error message to friendly Spanish without leaking internal details
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Credenciales inválidas. Verifica tu correo y contraseña.')
      }
      throw new Error(error.message)
    }

    return data
  },

  async resetPasswordForEmail(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim())

    if (error) {
      throw new Error(error.message)
    }

    return data
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw new Error(error.message)
    }
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      throw new Error(error.message)
    }
    return data.session
  },

  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback)
  },
}

