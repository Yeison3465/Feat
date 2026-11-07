import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  Modal,
  TextInput,
  Pressable,
  FlatList,
  Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Search, X, Check, UserPlus, Users, ShieldAlert } from 'lucide-react-native'
import { usePeople } from '../../people/hooks/usePeople'
import { Person } from '../../people/types'
import { getInitials } from '../../../shared/utils/initials'

interface BorrowerPickerModalProps {
  readonly visible: boolean
  readonly onClose: () => void
  readonly selectedPersonId: string
  readonly onSelectPerson: (person: Person) => void
}

export const BorrowerPickerModal: React.FC<BorrowerPickerModalProps> = ({
  visible,
  onClose,
  selectedPersonId,
  onSelectPerson,
}) => {
  const router = useRouter()
  const { people } = usePeople()
  const [search, setSearch] = useState('')

  // Filtrar prestatarios por nombre o teléfono
  const filteredPeople = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return people
    return people.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        (p.telefono && p.telefono.toLowerCase().includes(q))
    )
  }, [people, search])

  const handleSelect = (person: Person) => {
    onSelectPerson(person)
    onClose()
  }

  const handleCreateNew = () => {
    onClose()
    router.push('/personas/crear')
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/75 justify-end">
        <Pressable onPress={onClose} className="flex-1" />

        <View className="bg-[#12131A] border-t border-[#1E2030] rounded-t-3xl max-h-[85%] w-full max-w-lg mx-auto shadow-2xl shadow-black">
          {/* Barra de Arrastre / Indicador Superior */}
          <View className="items-center pt-3 pb-2">
            <View className="w-10 h-1 rounded-full bg-[#2A2C3D]" />
          </View>

          {/* Header del Modal */}
          <View className="flex-row items-center justify-between px-6 pb-3 border-b border-[#1C1E2B]">
            <View>
              <Text className="text-white text-lg font-bold tracking-tight">
                Seleccionar prestatario
              </Text>
              <Text className="text-zinc-400 text-xs mt-0.5">
                {people.length} personas en tu cartera privada
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              hitSlop={10}
              className="p-1.5 rounded-xl bg-[#1A1B26] active:bg-[#252738]"
            >
              <X size={18} color="#9CA3AF" />
            </Pressable>
          </View>

          {/* Buscador de Prestatarios */}
          <View className="px-6 pt-3 pb-2">
            <View className="flex-row items-center px-3.5 h-12 bg-[#0A0B10] border border-[#232433] rounded-2xl">
              <Search size={18} color="#6B7280" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar por nombre o teléfono..."
                placeholderTextColor="#4B5563"
                autoFocus={Platform.OS !== 'web'}
                className="flex-1 ml-2.5 text-white text-sm"
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch('')} hitSlop={8}>
                  <X size={16} color="#9CA3AF" />
                </Pressable>
              )}
            </View>
          </View>

          {/* Listado de Personas Filtradas */}
          <FlatList
            data={filteredPeople}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 36, paddingTop: 6 }}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isSelected = item.id === selectedPersonId
              const initials = getInitials(item.nombre)

              return (
                <Pressable
                  onPress={() => handleSelect(item)}
                  className={`flex-row items-center justify-between p-3.5 mb-2 rounded-2xl border transition-colors active:opacity-80 ${
                    isSelected
                      ? 'bg-[#1C1518] border-[#D34524]'
                      : 'bg-[#0E0F16] border-[#1C1E2B]'
                  }`}
                >
                  <View className="flex-row items-center flex-1 mr-2">
                    <View
                      className={`w-11 h-11 rounded-xl items-center justify-center mr-3 border ${
                        isSelected
                          ? 'bg-[#29161A] border-[#D34524]'
                          : 'bg-[#181924] border-[#252738]'
                      }`}
                    >
                      <Text
                        className={`text-sm font-bold font-mono ${
                          isSelected ? 'text-[#FF7854]' : 'text-zinc-300'
                        }`}
                      >
                        {initials}
                      </Text>
                    </View>

                    <View className="flex-1">
                      <View className="flex-row items-center gap-1.5 flex-wrap">
                        <Text
                          className={`text-sm font-semibold ${
                            isSelected ? 'text-white' : 'text-zinc-200'
                          }`}
                          numberOfLines={1}
                        >
                          {item.nombre}
                        </Text>
                        {item.exento_interes_ordinario && (
                          <View className="bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded-md flex-row items-center">
                            <ShieldAlert size={10} color="#F59E0B" />
                            <Text className="text-amber-400 text-[9px] font-bold ml-0.5">
                              0% Exento
                            </Text>
                          </View>
                        )}
                      </View>

                      <Text className="text-zinc-500 text-xs mt-0.5" numberOfLines={1}>
                        {item.telefono || 'Sin teléfono registrado'}
                      </Text>
                    </View>
                  </View>

                  {isSelected && (
                    <View className="w-6 h-6 rounded-full bg-[#D34524] items-center justify-center shadow-sm shadow-[#D34524]">
                      <Check size={14} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  )}
                </Pressable>
              )
            }}
            ListEmptyComponent={
              <View className="py-10 items-center justify-center">
                <View className="w-14 h-14 rounded-2xl bg-[#151622] border border-[#202234] items-center justify-center mb-3">
                  <Users size={24} color="#6B7280" />
                </View>
                <Text className="text-white text-sm font-bold mb-1">
                  {search ? 'Sin resultados para la búsqueda' : 'No hay prestatarios registrados'}
                </Text>
                <Text className="text-zinc-400 text-xs text-center max-w-[260px] mb-4">
                  {search
                    ? `No se encontró a nadie que coincida con "${search}".`
                    : 'Crea tu primer prestatario para otorgarle préstamos.'}
                </Text>

                <Pressable
                  onPress={handleCreateNew}
                  className="flex-row items-center bg-[#D34524] active:bg-[#E54F2C] px-4 py-2.5 rounded-xl shadow-md shadow-[#D34524]/20"
                >
                  <UserPlus size={15} color="#FFFFFF" />
                  <Text className="text-white text-xs font-bold ml-1.5">
                    + Crear nueva persona
                  </Text>
                </Pressable>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  )
}

