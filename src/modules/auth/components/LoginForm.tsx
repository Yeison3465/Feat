import React, { useState } from 'react'
import {
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native'
import Animated, { useReducedMotion } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react-native'
import { useAuth } from '../hooks/useAuth'
import { getSafeBottomInset } from '../../../shared/utils/responsive'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { AnimatedPressable } from '../../../shared/components/AnimatedPressable'
import { Button } from '../../../shared/ui/Button'
import { Field } from '../../../shared/ui/Field'
import { CoverImage } from '../../../shared/ui/CoverImage'
import { images } from '../../../shared/images'
import { screenEnter } from '../../../shared/motion'
import { colors, fonts } from '../../../shared/theme/tokens'
import { AuthSecurityFooter } from './AuthSecurityFooter'

export const LoginForm: React.FC = () => {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const reduced = useReducedMotion()
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
      style={{ flex: 1, backgroundColor: colors.app }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: getSafeBottomInset(insets.bottom, 20) }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flexGrow: 1, width: '100%', maxWidth: 448, alignSelf: 'center' }}>
          {/* Cabecera: foto de billetes, FEAT centrado y título */}
          <Animated.View entering={screenEnter(0, reduced)}>
            <CoverImage source={images.bills} focusY={0.4} style={{ height: 272 + insets.top }}>
              <LinearGradient
                pointerEvents="none"
                colors={['rgba(10,10,11,0.7)', 'rgba(10,10,11,0.76)', colors.app]}
                locations={[0, 0.55, 1]}
                style={StyleSheet.absoluteFill}
              />
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { justifyContent: 'space-between', paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 18 },
                ]}
              >
                <View />
                <Text
                  style={{
                    color: colors.warm,
                    fontFamily: fonts.light,
                    fontSize: 32,
                    lineHeight: 36,
                    letterSpacing: 13.4,
                    // El espaciado agrega un hueco al final: se compensa para centrar la palabra
                    marginRight: -13.4,
                    textAlign: 'center',
                  }}
                >
                  FEAT
                </Text>
                <View style={{ gap: 12 }}>
                  <Text
                    accessibilityRole="header"
                    style={{
                      color: colors.warm,
                      fontFamily: fonts.semibold,
                      fontSize: 40,
                      lineHeight: 42,
                      letterSpacing: -1.8,
                    }}
                  >
                    Acceso privado
                  </Text>
                  <Text style={{ color: '#C4C4C8', fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 }}>
                    Ingresa tus credenciales para administrar tu cartera.
                  </Text>
                </View>
              </View>
            </CoverImage>
          </Animated.View>

          <View style={{ flex: 1, gap: 16, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 28 }}>
            <Animated.View entering={screenEnter(1, reduced)} style={{ gap: 16 }}>
              {error && <ErrorMessage message={error} onRetry={clearError} />}

              {/* Campo: Correo electrónico */}
              <Field
                compact
                label="Correo electrónico"
                error={emailError}
                value={email}
                onChangeText={(text) => {
                  setEmail(text)
                  if (emailError) setEmailError(null)
                  if (error) clearError()
                }}
                placeholder="alejandro@cartera.co"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                prefix={({ focused, error: bad }) => (
                  <Mail size={16} color={bad ? colors.danger : focused ? colors.warm : colors.muted2} />
                )}
              />

              {/* Campo: Contraseña */}
              <Field
                compact
                label="Contraseña"
                error={passwordError}
                value={password}
                onChangeText={(text) => {
                  setPassword(text)
                  if (passwordError) setPasswordError(null)
                  if (error) clearError()
                }}
                placeholder="supersecretpassword1%"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password"
                prefix={({ focused, error: bad }) => (
                  <Lock size={16} color={bad ? colors.danger : focused ? colors.warm : colors.muted2} />
                )}
                trailing={
                  <AnimatedPressable
                    onPress={() => setShowPassword(!showPassword)}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
                  >
                    {showPassword ? (
                      <EyeOff size={16} color={colors.warm} />
                    ) : (
                      <Eye size={16} color={colors.muted2} />
                    )}
                  </AnimatedPressable>
                }
              />

              {/* Enlace: ¿Olvidaste tu contraseña? */}
              <View style={{ alignItems: 'flex-end', marginTop: -6 }}>
                <Pressable
                  onPress={() => router.push('/(auth)/recuperar-password')}
                  hitSlop={8}
                  accessibilityRole="link"
                  style={{ minHeight: 44, justifyContent: 'center' }}
                >
                  <Text style={{ color: colors.warm, fontFamily: fonts.medium, fontSize: 13 }}>
                    ¿Olvidaste tu contraseña?
                  </Text>
                </Pressable>
              </View>

              {/* Botón Iniciar sesión → */}
              <Button
                label="Iniciar sesión"
                size="lg"
                onPress={handleSubmit}
                loading={loading}
                iconAfter={<ArrowRight size={16} color="#000000" />}
                style={{ width: '100%' }}
              />
            </Animated.View>

            <View style={{ flex: 1 }} />

            <Animated.View entering={screenEnter(2, reduced)}>
              <AuthSecurityFooter />
            </Animated.View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
