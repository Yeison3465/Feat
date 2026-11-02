import React from 'react'
import { View, Text, Pressable, ScrollView, Linking } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  ArrowLeft,
  Edit3,
  Phone,
  MapPin,
  FileText,
  ShieldAlert,
  Archive,
  CreditCard,
} from 'lucide-react-native'
import { Person } from '../types'
import { getInitials } from '../../../shared/utils/initials'

interface PersonDetailViewProps {
  readonly person: Person
  readonly onEdit: () => void
  readonly onArchive?: () => void
}

export const PersonDetailView: React.FC<PersonDetailViewProps> = ({ person, onEdit, onArchive }) => {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const initials = getInitials(person.nombre)

  const handleCall = () => {
    if (person.telefono) {
      Linking.openURL(`tel:${person.telefono}`)
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-[#060709]"
      contentContainerStyle={{
        paddingTop: Math.max(insets.top, 16),
        paddingBottom: Math.max(insets.bottom + 20, 36),
      }}
    >
      <View className="px-6 pb-6 max-w-md mx-auto w-full">
        {/* Barra superior con Volver y Editar */}
        <View className="flex-row items-center justify-between mb-6">
          <Pressable
            onPress={() => router.back()}
            className="flex-row items-center py-2 pr-4"
            hitSlop={10}
          >
            <ArrowLeft size={20} color="#9CA3AF" />
            <Text className="text-zinc-400 text-sm font-medium ml-2">
              Volver
            </Text>
          </Pressable>

          <Pressable
            onPress={onEdit}
            className="flex-row items-center bg-[#151622] border border-[#232433] px-3.5 py-1.5 rounded-xl active:bg-[#202232]"
          >
            <Edit3 size={15} color="#FF7854" />
            <Text className="text-[#FF7854] text-xs font-semibold ml-1.5">
              Editar
            </Text>
          </Pressable>
        </View>

        {/* Ficha Principal con Avatar */}
        <View className="bg-[#12131A] border border-[#1E2030] rounded-3xl p-6 items-center mb-5 shadow-2xl shadow-black">
          <View className="w-20 h-20 rounded-2xl bg-[#191316] border border-[#2F191D] items-center justify-center mb-3 shadow-lg shadow-black">
            <Text className="text-[#FF7854] text-2xl font-bold font-mono">
              {initials}
            </Text>
          </View>

          <Text className="text-white text-2xl font-bold text-center tracking-tight mb-2">
            {person.nombre}
          </Text>

          {person.exento_interes_ordinario ? (
            <View className="bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full flex-row items-center mt-1">
              <ShieldAlert size={13} color="#F59E0B" />
              <Text className="text-amber-400 text-xs font-semibold ml-1.5">
                Exento de interés ordinario
              </Text>
            </View>
          ) : (
            <Text className="text-zinc-500 text-xs">
              Sujeto a intereses ordinarios estándar
            </Text>
          )}
        </View>

        {/* Datos de Contacto y Ubicación */}
        <View className="bg-[#12131A] border border-[#1E2030] rounded-3xl p-5 mb-5 shadow-xl shadow-black">
          <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-4">
            Información de contacto
          </Text>

          {/* Teléfono */}
          <View className="flex-row items-center justify-between py-2 border-b border-[#1C1E2B]">
            <View className="flex-row items-center flex-1">
              <Phone size={16} color="#6B7280" />
              <Text className="text-zinc-400 text-xs ml-3">Teléfono</Text>
            </View>
            {person.telefono ? (
              <Pressable onPress={handleCall} className="active:opacity-70">
                <Text className="text-[#FF7854] text-sm font-semibold font-mono">
                  {person.telefono}
                </Text>
              </Pressable>
            ) : (
              <Text className="text-zinc-600 text-xs italic">No registrado</Text>
            )}
          </View>

          {/* Dirección */}
          <View className="flex-row items-center justify-between py-2.5 border-b border-[#1C1E2B]">
            <View className="flex-row items-center flex-1">
              <MapPin size={16} color="#6B7280" />
              <Text className="text-zinc-400 text-xs ml-3">Dirección</Text>
            </View>
            <Text className="text-zinc-200 text-xs max-w-[180px] text-right">
              {person.direccion || <Text className="text-zinc-600 italic">No registrada</Text>}
            </Text>
          </View>

          {/* Notas Privadas */}
          <View className="pt-3">
            <View className="flex-row items-center mb-1.5">
              <FileText size={16} color="#6B7280" />
              <Text className="text-zinc-400 text-xs ml-3">Notas confidenciales</Text>
            </View>
            <Text className="text-zinc-300 text-xs leading-5 bg-[#0A0B10] p-3 rounded-xl border border-[#1C1E2B]">
              {person.notas || 'Sin notas registradas para esta persona.'}
            </Text>
          </View>
        </View>

        {/* Historial de Préstamos Asociados */}
        <View className="bg-[#12131A] border border-[#1E2030] rounded-3xl p-5 mb-5 shadow-xl shadow-black">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
              Préstamos vinculados
            </Text>
            <Pressable
              onPress={() => router.push('/prestamos/crear')}
              className="flex-row items-center bg-[#D34524]/20 px-2.5 py-1 rounded-lg border border-[#D34524]/30"
            >
              <CreditCard size={13} color="#FF7854" />
              <Text className="text-[#FF7854] text-xs font-semibold ml-1.5">
                Prestar
              </Text>
            </Pressable>
          </View>

          <View className="bg-[#0A0B10] border border-[#1C1E2B] rounded-2xl p-4 items-center justify-center">
            <CreditCard size={24} color="#4B5563" />
            <Text className="text-zinc-400 text-xs mt-2 text-center">
              Esta persona no tiene préstamos activos actualmente.
            </Text>
          </View>
        </View>

        {/* Zona de Peligro / Archivar */}
        {onArchive && (
          <View className="mt-2">
            <Pressable
              onPress={onArchive}
              className="flex-row items-center justify-center p-3.5 rounded-2xl border border-red-950/40 bg-red-950/20 active:bg-red-950/40"
            >
              <Archive size={16} color="#FB3758" />
              <Text className="text-[#FB3758] text-xs font-semibold ml-2">
                {person.archivado ? 'Reactivar persona' : 'Archivar prestatario'}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </ScrollView>
  )
}
