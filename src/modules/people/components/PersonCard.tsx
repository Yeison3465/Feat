import React from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { ArrowRight, Phone } from 'lucide-react-native'
import { Person } from '../types'
import { AnimatedPressable } from '../../../shared/components/AnimatedPressable'
import { AppText } from '../../../shared/ui/AppText'
import { Avatar } from '../../../shared/ui/Avatar'
import { Card } from '../../../shared/ui/Card'
import { Chip } from '../../../shared/ui/Chip'
import { colors } from '../../../shared/theme/tokens'

interface PersonCardProps {
  readonly person: Person
}

// Fila de persona en negro laca: iniciales, nombre, teléfono y marca de exención
export const PersonCard: React.FC<PersonCardProps> = ({ person }) => {
  const router = useRouter()

  return (
    <AnimatedPressable
      onPress={() => router.push(`/personas/${person.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`Abrir a ${person.nombre}`}
      containerClassName="mb-3"
    >
      <Card variant="ink" style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 }}>
        <Avatar name={person.nombre} size={56} />

        <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
          <AppText variant="h" numberOfLines={1} style={{ fontSize: 17 }}>
            {person.nombre}
          </AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            {person.telefono ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Phone size={13} color={colors.muted2} />
                <AppText variant="lbl">{person.telefono}</AppText>
              </View>
            ) : null}
            {person.exento_interes_ordinario && <Chip tone="warn" label="Exento int. ord." />}
          </View>
        </View>

        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card2, alignItems: 'center', justifyContent: 'center' }}>
          <ArrowRight size={16} color={colors.warm} />
        </View>
      </Card>
    </AnimatedPressable>
  )
}
