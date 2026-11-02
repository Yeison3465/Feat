import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Mail, Lock, Eye, EyeOff, ShieldCheck, Wallet } from 'lucide-react-native'
import { useAuth } from '../hooks/useAuth'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'

export const LoginForm: React.FC = () => {
  const router = useRouter()
  const { signIn, loading, error, clearError } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const validate = (): boolean => {
    let valid = true
    setEmailError(null)
    setPasswordError(null)
    clearError()

    const emailTrimmed = email.trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailTrimmed) {
      setEmailError('El correo electrónico es requerido.')
      valid = false
    } else if (!emailRegex.test(emailTrimmed)) {
      setEmailError('Ingresa un correo electrónico válido (ej. nombre@dominio.co).')
      valid = false
    }

    if (!password) {
      setPasswordError('La contraseña es requerida.')
      valid = false
    } else if (password.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres.')
      valid = false
    }

    return valid
  }

  const handleSubmit = async () => {
    if (!validate()) return
    const result = await signIn({ email, password })
    if (result.success) {
      router.replace('/(tabs)')
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-[#09090D]"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between' }}
        keyboardShouldPersistTaps="handled"
        className="px-6 py-12"
      >
        <View className="items-center mt-6">
          {/* Badge / Isotipo */}
          <View className="w-14 h-14 rounded-2xl bg-[#14141B] border border-[#262630] items-center justify-center mb-4 shadow-lg shadow-black">
            <View className="w-10 h-10 rounded-xl bg-[#C94422]/20 items-center justify-center">
              <Wallet size={22} color="#FF7854" />
            </View>
          </View>

          <Text className="text-white text-2xl font-bold tracking-tight text-center mb-2">
            Acceso privado
          </Text>
          <Text className="text-stone-400 text-sm text-center max-w-[280px]">
            Ingresa tus credenciales para administrar tu cartera.
          </Text>
        </View>

        {/* Formulario en Tarjeta */}
        <View className="bg-[#14141B] border border-[#262630] rounded-3xl p-5 my-6 shadow-2xl shadow-black">
          {error && <ErrorMessage message={error} onRetry={clearError} />}

          {/* Campo: Correo Electrónico */}
          <View className="mb-4">
            <Text className="text-stone-300 text-xs font-semibold uppercase tracking-wider mb-2">
              Correo electrónico
            </Text>
            <View
              className={`flex-row items-center px-4 h-12 bg-[#09090D] rounded-xl border ${
                emailError ? 'border-[#FB3758]' : 'border-[#262630] focus:border-[#FF7854]'
              }`}
            >
              <Mail size={18} color={emailError ? '#FB3758' : '#A8A29E'} />
              <TextInput
                value={email}
                onChangeText={(text) => {
                  setEmail(text)
                  if (emailError) setEmailError(null)
                  if (error) clearError()
                }}
                placeholder="alejandro@cartera.co"
                placeholderTextColor="#52525B"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                className="flex-1 ml-3 text-white text-sm"
              />
            </View>
            {emailError && (
              <Text className="text-[#FB3758] text-xs mt-1.5 ml-1">
                {emailError}
              </Text>
            )}
          </View>

          {/* Campo: Contraseña */}
          <View className="mb-2">
            <Text className="text-stone-300 text-xs font-semibold uppercase tracking-wider mb-2">
              Contraseña
            </Text>
            <View
              className={`flex-row items-center px-4 h-12 bg-[#09090D] rounded-xl border ${
                passwordError ? 'border-[#FB3758]' : 'border-[#262630] focus:border-[#FF7854]'
              }`}
            >
              <Lock size={18} color={passwordError ? '#FB3758' : '#A8A29E'} />
              <TextInput
                value={password}
                onChangeText={(text) => {
                  setPassword(text)
                  if (passwordError) setPasswordError(null)
                  if (error) clearError()
                }}
                placeholder="••••••••••••"
                placeholderTextColor="#52525B"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                className="flex-1 ml-3 text-white text-sm"
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={8}
                className="p-1"
              >
                {showPassword ? (
                  <EyeOff size={18} color="#A8A29E" />
                ) : (
                  <Eye size={18} color="#A8A29E" />
                )}
              </Pressable>
            </View>
            {passwordError && (
              <Text className="text-[#FB3758] text-xs mt-1.5 ml-1">
                {passwordError}
              </Text>
            )}
          </View>

          {/* Enlace Olvidaste Contraseña */}
          <View className="items-end mb-6 mt-1">
            <Pressable
              onPress={() => router.push('/(auth)/recuperar-password')}
              hitSlop={8}
            >
              <Text className="text-[#FF7854] text-xs font-medium">
                ¿Olvidaste tu contraseña?
              </Text>
            </Pressable>
          </View>

          {/* Botón Principal */}
          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            className={`w-full h-12 rounded-xl items-center justify-center flex-row ${
              loading ? 'bg-[#C94422]/60' : 'bg-[#C94422] active:bg-[#FF7854]'
            }`}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className="text-white text-sm font-bold tracking-wide">
                Iniciar sesión
              </Text>
            )}
          </Pressable>
        </View>

        {/* Footer y Aviso de Seguridad */}
        <View className="items-center pb-4">
          <View className="flex-row items-center mb-2 px-4">
            <ShieldCheck size={14} color="#A8A29E" />
            <Text className="text-stone-400 text-xs text-center ml-1.5">
              Acceso exclusivo para el titular. Los prestatarios no tienen acceso a esta aplicación.
            </Text>
          </View>
          <Text className="text-stone-600 text-[11px] tracking-wider mt-1">
            Sistema seguro · Moneda COP · v2.4
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

