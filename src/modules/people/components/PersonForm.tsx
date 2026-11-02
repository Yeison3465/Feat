import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  Switch,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { User, Phone, MapPin, FileText, ArrowLeft, ShieldCheck, Check } from 'lucide-react-native'
import { CreatePersonDTO, Person } from '../types'
import { getInitials } from '../../../shared/utils/initials'
import { getSafeBottomInset } from '../../../shared/utils/responsive'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'

interface PersonFormProps {
  readonly initialData?: Person
  readonly onSubmit: (data: CreatePersonDTO) => Promise<void>
  readonly loading: boolean
}

export const PersonForm: React.FC<PersonFormProps> = ({ initialData, onSubmit, loading }) => {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const isEditing = !!initialData

  const [nombre, setNombre] = useState(initialData?.nombre ?? '')
  const [telefono, setTelefono] = useState(initialData?.telefono ?? '')
  const [direccion, setDireccion] = useState(initialData?.direccion ?? '')
  const [notas, setNotas] = useState(initialData?.notas ?? '')
  const [exentoInteres, setExentoInteres] = useState(initialData?.exento_interes_ordinario ?? false)

  const [nombreError, setNombreError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const initials = getInitials(nombre || 'Nueva Persona')

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
      router.back()
    } catch (err: any) {
      setFormError(err.message || 'Error al guardar la persona.')
    }
  }

  return (
    <View
      style={{ paddingTop: Math.max(insets.top, 12) }}
      className="flex-1 bg-[#060709]"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
          className="px-6 max-w-md mx-auto w-full"
        >
          {/* Cabecera con Botón Volver */}
          <Animated.View
            entering={FadeInDown.duration(260)}
            className="flex-row items-center justify-between mt-2 mb-6"
          >
            <Pressable
              onPress={() => router.back()}
              className="flex-row items-center py-2 pr-4"
              hitSlop={10}
            >
              <ArrowLeft size={20} color="#9CA3AF" />
              <Text className="text-zinc-400 text-sm font-medium ml-2">
                Cancelar
              </Text>
            </Pressable>

            <Text className="text-zinc-500 text-xs font-mono uppercase tracking-widest">
              {isEditing ? 'Modo Edición' : 'Nuevo Registro'}
            </Text>
          </Animated.View>

          {/* Título y Avatar con Iniciales automáticas */}
          <Animated.View entering={FadeInDown.delay(50).duration(280)} className="items-center mb-6">
            <View className="w-16 h-16 rounded-2xl bg-[#191316] border border-[#2F191D] items-center justify-center mb-3 shadow-lg shadow-black/50">
              <Text className="text-[#FF7854] text-xl font-bold font-mono">
                {initials}
              </Text>
            </View>
            <Text className="text-white text-2xl font-bold tracking-tight text-center">
              {isEditing ? 'Editar persona' : 'Nueva persona'}
            </Text>
            <Text className="text-zinc-500 text-xs text-center mt-1">
              Sin foto ni archivos adjuntos · Privacidad total
            </Text>
          </Animated.View>

          {formError && <ErrorMessage message={formError} onRetry={() => setFormError(null)} />}

          {/* Formulario en Tarjeta */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(300).springify()}
            className="bg-[#12131A] border border-[#1E2030] rounded-3xl p-5 mb-4 shadow-2xl shadow-black"
          >
            {/* Campo: Nombre Completo (Obligatorio) */}
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-zinc-300 text-xs font-medium ml-1">
                  Nombre completo <Text className="text-[#FF7854]">*</Text>
                </Text>
                <Text className="text-zinc-500 text-[10px] uppercase font-semibold">Obligatorio</Text>
              </View>
              <View
                className={`flex-row items-center px-4 bg-[#0A0B10] rounded-xl border ${
                  nombreError ? 'border-[#FB3758]' : 'border-[#232433]'
                }`}
                style={{ height: 48 }}
              >
                <User size={18} color={nombreError ? '#FB3758' : '#6B7280'} />
                <TextInput
                  value={nombre}
                  onChangeText={(text) => {
                    setNombre(text)
                    if (nombreError) setNombreError(null)
                  }}
                  placeholder="Ej. Carlos Andrés Mejía"
                  placeholderTextColor="#4B5563"
                  autoCapitalize="words"
                  className="flex-1 ml-3 text-white text-sm"
                />
              </View>
              {nombreError && (
                <Text className="text-[#FB3758] text-xs mt-1.5 ml-1">
                  {nombreError}
                </Text>
              )}
            </View>

            {/* Campo: Teléfono de Contacto */}
            <View className="mb-4">
              <Text className="text-zinc-300 text-xs font-medium mb-2 ml-1">
                Teléfono de contacto
              </Text>
              <View
                className="flex-row items-center px-4 bg-[#0A0B10] rounded-xl border border-[#232433]"
                style={{ height: 48 }}
              >
                <Phone size={18} color="#6B7280" />
                <TextInput
                  value={telefono}
                  onChangeText={setTelefono}
                  placeholder="Ej. 300 123 4567"
                  placeholderTextColor="#4B5563"
                  keyboardType="phone-pad"
                  className="flex-1 ml-3 text-white text-sm"
                />
              </View>
            </View>

            {/* Campo: Dirección o Ubicación */}
            <View className="mb-4">
              <Text className="text-zinc-300 text-xs font-medium mb-2 ml-1">
                Dirección o ubicación
              </Text>
              <View
                className="flex-row items-center px-4 bg-[#0A0B10] rounded-xl border border-[#232433]"
                style={{ height: 48 }}
              >
                <MapPin size={18} color="#6B7280" />
                <TextInput
                  value={direccion}
                  onChangeText={setDireccion}
                  placeholder="Ej. Calle 10 # 45-20, Medellín"
                  placeholderTextColor="#4B5563"
                  className="flex-1 ml-3 text-white text-sm"
                />
              </View>
            </View>

            {/* Campo: Notas Privadas */}
            <View className="mb-4">
              <Text className="text-zinc-300 text-xs font-medium mb-2 ml-1">
                Notas privadas
              </Text>
              <View className="flex-row px-4 py-3 bg-[#0A0B10] rounded-xl border border-[#232433] min-h-[85px]">
                <FileText size={18} color="#6B7280" style={{ marginTop: 2 }} />
                <TextInput
                  value={notas}
                  onChangeText={setNotas}
                  placeholder="Información de confianza, horarios de cobro..."
                  placeholderTextColor="#4B5563"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  className="flex-1 ml-3 text-white text-sm"
                />
              </View>
            </View>

            {/* Sección de Exención de Interés Ordinario */}
            <View className="bg-[#0A0B10] border border-[#1E2030] rounded-2xl p-4">
              <View className="flex-row items-center justify-between mb-1.5">
                <View className="flex-row items-center flex-1 mr-3">
                  <ShieldCheck size={18} color={exentoInteres ? '#F59E0B' : '#6B7280'} />
                  <Text className="text-white text-sm font-semibold ml-2">
                    Exento de interés ordinario
                  </Text>
                </View>
                <Switch
                  value={exentoInteres}
                  onValueChange={setExentoInteres}
                  trackColor={{ false: '#232433', true: '#D34524' }}
                  thumbColor={exentoInteres ? '#FFFFFF' : '#9CA3AF'}
                />
              </View>
              <Text className="text-zinc-400 text-xs leading-4">
                Si se activa, los préstamos otorgados a esta persona se crearán sin generar intereses ordinarios (tasa 0%).
              </Text>
            </View>
          </Animated.View>
        </ScrollView>

        {/* Footer de Acción Fijo Responsivo para Cualquier Dispositivo */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(280)}
          style={{
            paddingBottom: getSafeBottomInset(insets.bottom, 20),
            paddingTop: 12,
            paddingHorizontal: 24,
          }}
          className="bg-[#060709] border-t border-[#161722] w-full"
        >
          <View className="max-w-md mx-auto w-full">
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
                  <Check size={18} color="#FFFFFF" strokeWidth={2.5} />
                  <Text className="text-white text-[15px] font-bold tracking-wide">
                    {isEditing ? 'Guardar cambios' : 'Crear persona'}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  )
}
