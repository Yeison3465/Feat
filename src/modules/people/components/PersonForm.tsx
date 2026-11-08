import React, { useEffect, useRef, useState } from 'react'
import { View, KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native'
import Animated, { useReducedMotion } from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Phone, MapPin, ArrowLeft, Check } from 'lucide-react-native'
import { CreatePersonDTO, Person } from '../types'
import { getInitials } from '../../../shared/utils/initials'
import { getSafeBottomInset } from '../../../shared/utils/responsive'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { AnimatedPressable } from '../../../shared/components/AnimatedPressable'
import { AppText } from '../../../shared/ui/AppText'
import { Avatar } from '../../../shared/ui/Avatar'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { Chip } from '../../../shared/ui/Chip'
import { Field } from '../../../shared/ui/Field'
import { Snackbar } from '../../../shared/ui/Snackbar'
import { Toggle } from '../../../shared/ui/Toggle'
import { screenEnter } from '../../../shared/motion'
import { haptic } from '../../../shared/haptics'
import { colors, fonts } from '../../../shared/theme/tokens'

interface PersonFormProps {
  readonly initialData?: Person
  readonly onSubmit: (data: CreatePersonDTO) => Promise<void>
  readonly loading: boolean
}

export const PersonForm: React.FC<PersonFormProps> = ({ initialData, onSubmit, loading }) => {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const reduced = useReducedMotion()
  const isEditing = !!initialData

  const [nombre, setNombre] = useState(initialData?.nombre ?? '')
  const [telefono, setTelefono] = useState(initialData?.telefono ?? '')
  const [direccion, setDireccion] = useState(initialData?.direccion ?? '')
  const [notas, setNotas] = useState(initialData?.notas ?? '')
  const [exentoInteres, setExentoInteres] = useState(initialData?.exento_interes_ordinario ?? false)

  const [nombreError, setNombreError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const backTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (backTimer.current) clearTimeout(backTimer.current)
    },
    []
  )

  const handleSubmit = async () => {
    setNombreError(null)
    setFormError(null)

    if (!nombre.trim()) {
      setNombreError('El nombre completo es obligatorio.')
      return
    }

    try {
      await onSubmit({
        nombre: nombre.trim(),
        telefono: telefono.trim() || null,
        direccion: direccion.trim() || null,
        notas: notas.trim() || null,
        exento_interes_ordinario: exentoInteres,
      })
      // Confirmación breve (check verde y aviso) antes de volver
      haptic('success')
      setDone(true)
      backTimer.current = setTimeout(() => router.back(), 900)
    } catch (err: any) {
      setFormError(err.message || 'Error al guardar la persona.')
    }
  }

  const iconColor = (focused: boolean, error: boolean) => (error ? colors.danger : focused ? colors.warm : colors.muted2)

  return (
    <View style={{ flex: 1, backgroundColor: colors.app, paddingTop: Math.max(insets.top, 12) }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, gap: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Cabecera con botón cancelar */}
          <Animated.View
            entering={screenEnter(0, reduced)}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Button
              label="Cancelar"
              variant="ghost"
              size="sm"
              onPress={() => router.back()}
              icon={<ArrowLeft size={16} color={colors.warm} />}
            />
            <Chip glass label={isEditing ? 'Modo Edición' : 'Nuevo Registro'} />
          </Animated.View>

          {/* Avatar con iniciales en vivo y título */}
          <Animated.View entering={screenEnter(1, reduced)} style={{ gap: 16, alignItems: 'flex-start', paddingHorizontal: 4 }}>
            <Avatar name={nombre || 'Nueva Persona'} size={80} />
            <View style={{ gap: 8 }}>
              <AppText variant="title" accessibilityRole="header" style={{ fontSize: 40, lineHeight: 40, letterSpacing: -1.8 }}>
                {isEditing ? 'Editar persona' : 'Nueva persona'}
              </AppText>
              <AppText variant="body">Sin foto ni archivos adjuntos · Privacidad total</AppText>
            </View>
          </Animated.View>

          {formError && <ErrorMessage message={formError} onRetry={() => setFormError(null)} />}

          <Animated.View entering={screenEnter(2, reduced)} style={{ gap: 18 }}>
            {/* Nombre completo (obligatorio) */}
            <Field
              label="Nombre completo *"
              hint="Obligatorio"
              error={nombreError}
              value={nombre}
              onChangeText={(text) => {
                setNombre(text)
                if (nombreError) setNombreError(null)
              }}
              placeholder="Ej. Carlos Andrés Mejía"
              autoCapitalize="words"
            />

            {/* Teléfono de contacto */}
            <Field
              label="Teléfono de contacto"
              value={telefono}
              onChangeText={setTelefono}
              placeholder="Ej. 300 123 4567"
              keyboardType="phone-pad"
              prefix={({ focused, error }) => <Phone size={16} color={iconColor(focused, error)} />}
            />

            {/* Dirección o ubicación */}
            <Field
              label="Dirección o ubicación"
              value={direccion}
              onChangeText={setDireccion}
              placeholder="Ej. Calle 10 # 45-20, Medellín"
              prefix={({ focused, error }) => <MapPin size={16} color={iconColor(focused, error)} />}
            />

            {/* Notas privadas */}
            <Field
              label="Notas privadas"
              value={notas}
              onChangeText={setNotas}
              placeholder="Información de confianza, horarios de cobro..."
              multiline
              numberOfLines={3}
            />

            {/* Exención de interés ordinario */}
            <AnimatedPressable
              onPress={() => {
                haptic('selection')
                setExentoInteres(!exentoInteres)
              }}
              accessibilityRole="switch"
              accessibilityState={{ checked: exentoInteres }}
              accessibilityLabel="Exento de interés ordinario"
            >
              <Card variant="ink" style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ color: colors.warm, fontFamily: fonts.medium, fontSize: 15 }}>Exento de interés ordinario</Text>
                  <Text style={{ color: '#B4B4B9', fontFamily: fonts.regular, fontSize: 12, lineHeight: 18 }}>
                    Si se activa, los préstamos otorgados a esta persona se crearán sin generar intereses ordinarios (tasa 0%).
                  </Text>
                </View>
                <Toggle value={exentoInteres} />
              </Card>
            </AnimatedPressable>
          </Animated.View>
        </ScrollView>

        {/* Acción fija abajo */}
        <View
          style={{
            paddingTop: 12,
            paddingHorizontal: 16,
            paddingBottom: getSafeBottomInset(insets.bottom, 20),
            backgroundColor: colors.app,
          }}
        >
          <Button
            label={done ? (isEditing ? 'Cambios guardados' : 'Persona creada') : isEditing ? 'Guardar cambios' : 'Crear persona'}
            size="lg"
            variant={done ? 'success' : 'solid'}
            onPress={handleSubmit}
            loading={loading}
            disabled={done}
            icon={<Check size={16} color={done ? '#06220F' : '#000000'} />}
            style={{ width: '100%', opacity: 1 }}
          />
        </View>
      </KeyboardAvoidingView>

      <Snackbar visible={done && !isEditing} message="Persona creada" bottom={Math.max(insets.bottom, 20) + 84} />
    </View>
  )
}
