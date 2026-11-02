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
import { Mail, CheckCircle, ArrowLeft } from 'lucide-react-native'
import { useAuth } from '../hooks/useAuth'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'

export const RecoveryForm: React.FC = () => {
  const router = useRouter()
  const { resetPassword, loading, error, clearError } = useAuth()

  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const validate = (): boolean => {
    setEmailError(null)
    clearError()
    const emailTrimmed = email.trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailTrimmed) {
      setEmailError('El correo electrónico es requerido.')
      return false
    }
    if (!emailRegex.test(emailTrimmed)) {
      setEmailError('Ingresa un correo electrónico válido (ej. nombre@dominio.co).')
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validate()) return
    const result = await resetPassword(email)
    if (result.success) {
      setSubmitted(true)
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
        <View>
          {/* Botón Volver */}
          <Pressable
            onPress={() => router.back()}
            className="flex-row items-center mb-6 py-2"
            hitSlop={8}
          >
            <ArrowLeft size={18} color="#A8A29E" />
            <Text className="text-stone-400 text-xs font-medium ml-2">
              Volver a iniciar sesión
            </Text>
          </Pressable>

          {!submitted ? (
            /* PASO 1: Solicitud */
            <>
              <View className="mb-6">
                <Text className="text-white text-2xl font-bold tracking-tight mb-2">
                  Restablece tu acceso
                </Text>
                <Text className="text-stone-400 text-sm leading-5">
                  Ingresa el correo asociado a tu cuenta privada. Te enviaremos un enlace temporal.
                </Text>
              </View>

              <View className="bg-[#14141B] border border-[#262630] rounded-3xl p-5 shadow-2xl shadow-black">
                {error && <ErrorMessage message={error} onRetry={clearError} />}

                <View className="mb-6">
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
                      Enviar instrucciones
                    </Text>
                  )}
                </Pressable>
              </View>
            </>
          ) : (
            /* PASO 2: Confirmación tras envío */
            <View className="bg-[#14141B] border border-[#262630] rounded-3xl p-6 items-center shadow-2xl shadow-black my-4">
              <View className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 items-center justify-center mb-4">
                <CheckCircle size={32} color="#10B981" />
              </View>

              <Text className="text-white text-xl font-bold mb-2 text-center">
                Correo enviado
              </Text>
              <Text className="text-stone-300 text-sm text-center mb-1">
                Revisa tu bandeja de entrada. Enviamos un enlace de recuperación a:
              </Text>
              <Text className="text-[#FF7854] text-sm font-semibold text-center mb-3">
                {email}
              </Text>
              <Text className="text-stone-500 text-xs text-center mb-6">
                El enlace expira en 15 minutos por motivos de seguridad.
              </Text>

              <Pressable
                onPress={() => router.replace('/(auth)/login')}
                className="w-full h-12 bg-[#C94422] active:bg-[#FF7854] rounded-xl items-center justify-center mb-3"
              >
                <Text className="text-white text-sm font-bold">
                  Volver a iniciar sesión
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setSubmitted(false)}
                hitSlop={8}
                className="py-2"
              >
                <Text className="text-stone-400 text-xs">
                  ¿No recibiste el correo? <Text className="text-[#FF7854]">Reintentar</Text>
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        <View className="items-center pb-4">
          <Text className="text-stone-600 text-[11px] tracking-wider">
            Sistema seguro · Moneda COP · v2.4
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

