import { Session, User } from '@supabase/supabase-js'

export interface SignInCredentials {
  email: string
  password: string
}

export interface ResetPasswordParams {
  email: string
}

export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
}

export interface AuthContextValue extends AuthState {
  signIn: (credentials: SignInCredentials) => Promise<{ success: boolean; error?: string }>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  clearError: () => void
}
