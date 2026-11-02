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
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Mail, CheckCircle, ArrowLeft, ArrowRight, Shield } from 'lucide-react-native'
import { useAuth } from '../hooks/useAuth'
import { getSafeBottomInset } from '../../../shared/utils/responsive'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'

export const RecoveryForm: React.FC = () => {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { resetPassword, loading, error, clearError } = useAuth()

  const [email, setEmail] = useState('')
  const [emailFocused, setEmailFocused] = useState(false)
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
      className="flex-1 bg-[#07070A]"
    >
      {/* Resplandor radial superior */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -80,
          left: '50%',
          transform: [{ translateX: -150 }],
          width: 300,
          height: 300,
          borderRadius: 150,
          backgroundColor: 'rgba(180, 50, 25, 0.22)',
          filter: Platform.OS === 'web' ? 'blur(70px)' : undefined,
          opacity: 0.85,
        }}
      />

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'space-between',
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: getSafeBottomInset(insets.bottom, 20),
        }}
        keyboardShouldPersistTaps="handled"
        className="px-6 max-w-md mx-auto w-full"
      >
        <View>
          {/* Botón Volver */}
          <Pressable
            onPress={() => router.back()}
            className="flex-row items-center mb-6 py-2"
            hitSlop={10}
          >
            <ArrowLeft size={18} color="#9CA3AF" />
            <Text className="text-stone-400 text-xs font-medium ml-2">
              Volver a iniciar sesión
            </Text>
          </Pressable>

          {!submitted ? (
            /* PASO 1: Solicitud */
            <>
              <View className="mb-6">
                <Text className="text-white text-3xl font-bold tracking-tight mb-2">
                  Restablece tu acceso
                </Text>
                <Text className="text-stone-400 text-sm leading-5">
                  Ingresa el correo asociado a tu cuenta privada. Te enviaremos un enlace temporal.
                </Text>
              </View>

              <View className="bg-[#12131C] border border-[#232433] rounded-[28px] p-5 shadow-2xl shadow-black">
                {error && <ErrorMessage message={error} onRetry={clearError} />}

                <View className="mb-6">
                  <Text className="text-stone-300 text-xs font-medium mb-2 ml-1">
                    Correo electrónico
                  </Text>
                  <View
                    className={`flex-row items-center px-4 h-13 bg-[#08080E] rounded-2xl border transition-all ${
                      emailError
                        ? 'border-[#FB3758]'
                        : emailFocused
                        ? 'border-[#FF7854]'
                        : 'border-[#232433]'
                    }`}
                    style={{ height: 50 }}
                  >
                    <Mail
                      size={18}
                      color={emailError ? '#FB3758' : emailFocused ? '#FF7854' : '#6B7280'}
                    />
                    <TextInput
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text)
                        if (emailError) setEmailError(null)
                        if (error) clearError()
                      }}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                      placeholder="alejandro@cartera.co"
                      placeholderTextColor="#4B5563"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      className="flex-1 ml-3 text-white text-[15px]"
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
                  style={{ height: 52 }}
                  className={`w-full rounded-2xl items-center justify-center flex-row shadow-lg shadow-[#C94422]/20 ${
                    loading ? 'bg-[#C94422]/60' : 'bg-[#D34524] active:bg-[#E54F2C]'
                  }`}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <View className="flex-row items-center justify-center gap-2">
                      <Text className="text-white text-[15px] font-bold tracking-wide">
                        Enviar instrucciones
                      </Text>
                      <ArrowRight size={17} color="#FFFFFF" strokeWidth={2.5} />
                    </View>
                  )}
                </Pressable>
              </View>
            </>
          ) : (
            /* PASO 2: Confirmación tras envío */
            <View className="bg-[#12131C] border border-[#232433] rounded-[28px] p-6 items-center shadow-2xl shadow-black my-4">
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
                style={{ height: 50 }}
                className="w-full bg-[#D34524] active:bg-[#E54F2C] rounded-2xl items-center justify-center mb-3"
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

        {/* Footer */}
        <View className="items-center mt-2 pb-2">
          <View className="w-full bg-[#11121C] border border-[#1E2030] rounded-2xl p-3.5 flex-row items-center gap-3 mb-4">
            <Shield size={18} color="#6B7280" />
            <Text className="text-stone-400 text-xs flex-1 leading-4">
              Acceso exclusivo para el titular. Los prestatarios no tienen acceso a esta aplicación.
            </Text>
          </View>
          <Text className="text-stone-600 text-[11px] font-mono tracking-wider">
            Sistema seguro · Moneda COP · v2.4
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
