import React, { useState } from 'react'
import { View, Text, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import Animated, { useReducedMotion } from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Mail, ArrowLeft, CheckCircle2, Clock } from 'lucide-react-native'
import { useAuth } from '../hooks/useAuth'
import { getSafeBottomInset } from '../../../shared/utils/responsive'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { Field } from '../../../shared/ui/Field'
import { screenEnter } from '../../../shared/motion'
import { haptic } from '../../../shared/haptics'
import { colors, fonts } from '../../../shared/theme/tokens'
import { AuthSecurityFooter } from './AuthSecurityFooter'

const titleStyle = {
  color: colors.warm,
  fontFamily: fonts.semibold,
  fontSize: 40,
  lineHeight: 42,
  letterSpacing: -1.8,
} as const

export const RecoveryForm: React.FC = () => {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const reduced = useReducedMotion()
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
      haptic('success')
      setSubmitted(true)
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
        <View
          style={{
            flexGrow: 1,
            width: '100%',
            maxWidth: 448,
            alignSelf: 'center',
            gap: 28,
            paddingHorizontal: 16,
            paddingTop: Math.max(insets.top, 16) + 16,
            paddingBottom: 28,
          }}
        >
          {/* Botón Volver */}
          <Animated.View entering={screenEnter(0, reduced)} style={{ alignSelf: 'flex-start' }}>
            <Button
              label="Volver a iniciar sesión"
              variant="ghost"
              size="sm"
              onPress={() => router.back()}
              icon={<ArrowLeft size={16} color={colors.warm} />}
            />
          </Animated.View>

          {!submitted ? (
            /* PASO 1: Solicitud */
            <Animated.View entering={screenEnter(1, reduced)} style={{ gap: 28 }}>
              <View style={{ gap: 12, paddingHorizontal: 4 }}>
                <Text accessibilityRole="header" style={titleStyle}>
                  Restablece tu acceso
                </Text>
                <Text style={{ color: colors.muted, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 }}>
                  Ingresa el correo asociado a tu cuenta privada. Te enviaremos un enlace temporal.
                </Text>
              </View>

              {error && <ErrorMessage message={error} onRetry={clearError} />}

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

              <Button
                label="Enviar instrucciones"
                size="lg"
                onPress={handleSubmit}
                loading={loading}
                style={{ width: '100%' }}
              />
            </Animated.View>
          ) : (
            /* PASO 2: Confirmación tras envío */
            <Animated.View entering={screenEnter(0, reduced)} style={{ gap: 28 }}>
              <View style={{ gap: 20, paddingHorizontal: 4, alignItems: 'flex-start' }}>
                <View
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    backgroundColor: 'rgba(127,214,164,0.14)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CheckCircle2 size={32} color={colors.ok} />
                </View>
                <Text accessibilityRole="header" style={titleStyle}>
                  Correo enviado
                </Text>
                <Text style={{ color: colors.muted, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 }}>
                  Revisa tu bandeja de entrada. Enviamos un enlace de recuperación a:
                </Text>
              </View>

              <Card
                variant="ink"
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 16, paddingHorizontal: 18 }}
              >
                <Mail size={16} color={colors.warm} />
                <Text selectable style={{ flex: 1, color: colors.warm, fontFamily: fonts.medium, fontSize: 15 }}>
                  {email}
                </Text>
              </Card>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 }}>
                <Clock size={16} color={colors.muted2} />
                <Text style={{ flex: 1, color: colors.muted, fontFamily: fonts.regular, fontSize: 12, lineHeight: 16 }}>
                  El enlace expira en 15 minutos por motivos de seguridad.
                </Text>
              </View>

              <View style={{ gap: 8, alignItems: 'center' }}>
                <Button
                  label="Volver a iniciar sesión"
                  size="lg"
                  onPress={() => router.replace('/(auth)/login')}
                  style={{ width: '100%' }}
                />
                <Pressable
                  onPress={() => setSubmitted(false)}
                  hitSlop={8}
                  accessibilityRole="button"
                  style={{ minHeight: 44, justifyContent: 'center' }}
                >
                  <Text style={{ color: colors.muted, fontFamily: fonts.regular, fontSize: 13 }}>
                    ¿No recibiste el correo?{' '}
                    <Text style={{ color: colors.warm, fontFamily: fonts.medium }}>Reintentar</Text>
                  </Text>
                </Pressable>
              </View>
            </Animated.View>
          )}

          <View style={{ flex: 1 }} />

          <Animated.View entering={screenEnter(2, reduced)}>
            <AuthSecurityFooter />
          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
