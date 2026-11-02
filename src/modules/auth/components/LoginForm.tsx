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
import { Mail, Lock, Eye, EyeOff, Shield, Wallet, ArrowRight } from 'lucide-react-native'
import { useAuth } from '../hooks/useAuth'
import { getSafeBottomInset } from '../../../shared/utils/responsive'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'

export const LoginForm: React.FC = () => {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { signIn, loading, error, clearError } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
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
      className="flex-1 bg-[#060709]"
    >
      {/* Resplandor radial superior idéntico a Figma */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -60,
          left: '50%',
          transform: [{ translateX: -170 }],
          width: 340,
          height: 340,
          borderRadius: 170,
          backgroundColor: '#C94422',
          opacity: 0.16,
          ...(Platform.OS === 'web' ? { filter: 'blur(80px)' } : {}),
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
        {/* Cabecera / Marca Figma */}
        <View className="items-center mt-3 mb-2">
          {/* Isotipo con caja redondeada oscura y halo coral */}
          <View
            style={{
              shadowColor: '#C94422',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.3,
              shadowRadius: 14,
              elevation: 8,
            }}
            className="w-14 h-14 rounded-2xl bg-[#191316] border border-[#2F191D] items-center justify-center mb-3"
          >
            <Wallet size={26} color="#FF7854" strokeWidth={2.2} />
          </View>

          {/* Badge [NOMBREAPP] con punto coral */}
          <View className="flex-row items-center justify-center gap-1.5 mb-2">
            <View className="w-1.5 h-1.5 rounded-full bg-[#E05335]" />
            <Text className="text-zinc-400 text-xs font-mono font-semibold tracking-widest uppercase">
              [NOMBREAPP]
            </Text>
          </View>

          {/* Título y Subtítulo */}
          <Text className="text-white text-3xl font-bold tracking-tight text-center mb-1.5">
            Acceso privado
          </Text>
          <Text className="text-zinc-400 text-sm text-center leading-5 max-w-[290px]">
            Ingresa tus credenciales para administrar tu cartera.
          </Text>
        </View>

        {/* Tarjeta del Formulario Elevada */}
        <View className="bg-[#12131A] border border-[#1E2030] rounded-3xl p-6 my-4 shadow-2xl shadow-black">
          {error && <ErrorMessage message={error} onRetry={clearError} />}

          {/* Campo: Correo Electrónico */}
          <View className="mb-4">
            <Text className="text-zinc-300 text-xs font-medium mb-2 ml-0.5">
              Correo electrónico
            </Text>
            <View
              className={`flex-row items-center px-4 bg-[#0A0B10] rounded-2xl border transition-all ${
                emailError
                  ? 'border-[#FB3758]'
                  : emailFocused || email.length > 0
                  ? 'border-[#D34524]'
                  : 'border-[#232433]'
              }`}
              style={{ height: 52 }}
            >
              <Mail
                size={18}
                color={
                  emailError
                    ? '#FB3758'
                    : emailFocused || email.length > 0
                    ? '#FF7854'
                    : '#6B7280'
                }
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

          {/* Campo: Contraseña */}
          <View className="mb-1">
            <Text className="text-zinc-300 text-xs font-medium mb-2 ml-0.5">
              Contraseña
            </Text>
            <View
              className={`flex-row items-center px-4 bg-[#0A0B10] rounded-2xl border transition-all ${
                passwordError
                  ? 'border-[#FB3758]'
                  : passwordFocused
                  ? 'border-[#D34524]'
                  : 'border-[#232433]'
              }`}
              style={{ height: 52 }}
            >
              <Lock
                size={18}
                color={
                  passwordError
                    ? '#FB3758'
                    : passwordFocused
                    ? '#FF7854'
                    : '#6B7280'
                }
              />
              <TextInput
                value={password}
                onChangeText={(text) => {
                  setPassword(text)
                  if (passwordError) setPasswordError(null)
                  if (error) clearError()
                }}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                placeholder="supersecretpassword1%"
                placeholderTextColor="#4B5563"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                className="flex-1 ml-3 text-white text-[15px] font-mono"
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={10}
                className="p-1"
              >
                {showPassword ? (
                  <EyeOff size={18} color="#9CA3AF" />
                ) : (
                  <Eye size={18} color="#6B7280" />
                )}
              </Pressable>
            </View>
            {passwordError && (
              <Text className="text-[#FB3758] text-xs mt-1.5 ml-1">
                {passwordError}
              </Text>
            )}
          </View>

          {/* Enlace: ¿Olvidaste tu contraseña? */}
          <View className="items-end mb-6 mt-3">
            <Pressable
              onPress={() => router.push('/(auth)/recuperar-password')}
              hitSlop={8}
            >
              <Text className="text-[#FF7854] text-xs font-medium">
                ¿Olvidaste tu contraseña?
              </Text>
            </Pressable>
          </View>

          {/* Botón Iniciar Sesión → */}
          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            style={{ height: 52 }}
            className={`w-full rounded-2xl items-center justify-center flex-row shadow-lg shadow-[#D34524]/20 ${
              loading ? 'bg-[#D34524]/60' : 'bg-[#D34524] active:bg-[#E54F2C]'
            }`}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <View className="flex-row items-center justify-center gap-2">
                <Text className="text-white text-[15px] font-bold tracking-wide">
                  Iniciar sesión
                </Text>
                <ArrowRight size={17} color="#FFFFFF" strokeWidth={2.5} />
              </View>
            )}
          </Pressable>
        </View>

        {/* Sección Inferior / Card de Seguridad Figma */}
        <View className="items-center mt-2 pb-2">
          <View className="w-full bg-[#0F1017] border border-[#1C1D29] rounded-2xl p-4 flex-row items-center gap-3 mb-4">
            <Shield size={18} color="#6B7280" />
            <Text className="text-zinc-400 text-xs flex-1 leading-relaxed">
              Acceso exclusivo para el titular. Los prestatarios no tienen acceso a esta aplicación.
            </Text>
          </View>

          <Text className="text-zinc-600 text-[11px] font-mono tracking-wider">
            Sistema seguro · Moneda COP · v2.4
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
