import React, { useState, useMemo } from 'react'
import { View, Text, FlatList } from 'react-native'
import { useRouter } from 'expo-router'
import { Check, UserPlus, Users, ShieldCheck, X } from 'lucide-react-native'
import { usePeople } from '../../people/hooks/usePeople'
import { Person } from '../../people/types'
import { AnimatedPressable } from '../../../shared/components/AnimatedPressable'
import { AppText } from '../../../shared/ui/AppText'
import { Avatar } from '../../../shared/ui/Avatar'
import { Button } from '../../../shared/ui/Button'
import { Sheet } from '../../../shared/ui/Overlay'
import { SearchField } from '../../../shared/ui/SearchField'
import { colors, fonts } from '../../../shared/theme/tokens'

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
    <Sheet visible={visible} onClose={onClose}>
      {/* Cabecera de la hoja */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingBottom: 14 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="sec" style={{ fontSize: 20 }}>
            Seleccionar prestatario
          </AppText>
          <AppText variant="lbl" tone="muted2">
            {people.length} personas en tu cartera privada
          </AppText>
        </View>
        <AnimatedPressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card2, alignItems: 'center', justifyContent: 'center' }}
        >
          <X size={18} color={colors.warm} />
        </AnimatedPressable>
      </View>

      {/* Buscador */}
      <SearchField
        value={search}
        onChangeText={setSearch}
        placeholder="Buscar por nombre o teléfono..."
        accessibilityLabel="Buscar prestatario"
        autoFocus={visible}
      />

      {/* Listado de personas filtradas */}
      <FlatList
        data={filteredPeople}
        keyExtractor={(item) => item.id}
        style={{ marginTop: 12 }}
        contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isSelected = item.id === selectedPersonId
          return (
            <AnimatedPressable
              onPress={() => handleSelect(item)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={item.nombre}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 12,
                borderRadius: 22,
                backgroundColor: isSelected ? colors.card2 : colors.ink,
                borderWidth: 1,
                borderColor: isSelected ? colors.warm : colors.line,
              }}
            >
              <Avatar name={item.nombre} size={48} />
              <View style={{ flex: 1, gap: 3 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Text numberOfLines={1} style={{ flexShrink: 1, color: colors.warm, fontFamily: fonts.medium, fontSize: 15 }}>
                    {item.nombre}
                  </Text>
                  {item.exento_interes_ordinario && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, height: 22, paddingHorizontal: 8, borderRadius: 999, backgroundColor: 'rgba(242,196,109,0.14)' }}>
                      <ShieldCheck size={11} color={colors.warn} />
                      <Text style={{ color: colors.warn, fontFamily: fonts.medium, fontSize: 11 }}>0% Exento</Text>
                    </View>
                  )}
                </View>
                <Text numberOfLines={1} style={{ color: colors.muted2, fontFamily: fonts.regular, fontSize: 13 }}>
                  {item.telefono || 'Sin teléfono registrado'}
                </Text>
              </View>
              {isSelected && (
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.warm, alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={15} color="#000000" strokeWidth={2.5} />
                </View>
              )}
            </AnimatedPressable>
          )
        }}
        ListEmptyComponent={
          <View style={{ paddingVertical: 32, alignItems: 'center', gap: 10 }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.card2, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' }}>
              <Users size={24} color={colors.muted2} />
            </View>
            <AppText variant="h" style={{ textAlign: 'center' }}>
              {search ? 'Sin resultados para la búsqueda' : 'No hay prestatarios registrados'}
            </AppText>
            <AppText variant="lbl" tone="muted2" style={{ textAlign: 'center', maxWidth: 260, lineHeight: 18 }}>
              {search
                ? `No se encontró a nadie que coincida con "${search}".`
                : 'Crea tu primer prestatario para otorgarle préstamos.'}
            </AppText>
            <Button
              label="+ Crear nueva persona"
              size="sm"
              onPress={handleCreateNew}
              icon={<UserPlus size={16} color="#000000" />}
              style={{ marginTop: 6 }}
            />
          </View>
        }
      />
    </Sheet>
  )
}
