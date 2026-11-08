import React from 'react'
import { View, Text, ScrollView, Linking } from 'react-native'
import Animated, { useReducedMotion } from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, Pencil, Plus, Trash2, CreditCard } from 'lucide-react-native'
import { Person } from '../types'
import { getSafeBottomInset } from '../../../shared/utils/responsive'
import { useLoans } from '../../loans/hooks/useLoans'
import { LoanCard } from '../../loans/components/LoanCard'
import { AnimatedPressable } from '../../../shared/components/AnimatedPressable'
import { AppText } from '../../../shared/ui/AppText'
import { Avatar } from '../../../shared/ui/Avatar'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { Chip } from '../../../shared/ui/Chip'
import { screenEnter } from '../../../shared/motion'
import { colors, fonts } from '../../../shared/theme/tokens'

interface PersonDetailViewProps {
  readonly person: Person
  readonly onEdit: () => void
  // El diseño ya no muestra «Archivar»: la prop se conserva para no cambiar el contrato del componente
  readonly onArchive?: () => void
  readonly onDelete?: () => void
}

// Fila etiqueta + valor de la tarjeta de contacto
const Row: React.FC<{ readonly label: string; readonly children: React.ReactNode; readonly last?: boolean }> = ({ label, children, last }) => (
  <View style={{ gap: 6, paddingVertical: 14, borderBottomWidth: last ? 0 : 1, borderBottomColor: colors.line }}>
    <AppText variant="lbl" tone="muted2">
      {label}
    </AppText>
    {children}
  </View>
)

export const PersonDetailView: React.FC<PersonDetailViewProps> = ({ person, onEdit, onDelete }) => {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const reduced = useReducedMotion()
  const { allLoans } = useLoans()

  const personLoans = allLoans.filter((l) => l.persona_id === person.id)

  const handleCall = () => {
    if (person.telefono) {
      Linking.openURL(`tel:${person.telefono}`)
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.app }}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: Math.max(insets.top, 16) + 8,
        paddingBottom: getSafeBottomInset(insets.bottom, 24) + 16,
        gap: 24,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Barra superior con Volver y Editar */}
      <Animated.View entering={screenEnter(0, reduced)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Button
          label="Volver"
          variant="ghost"
          size="sm"
          onPress={() => router.back()}
          icon={<ArrowLeft size={16} color={colors.warm} />}
        />
        <Button
          label="Editar"
          variant="ghost"
          size="sm"
          onPress={onEdit}
          icon={<Pencil size={16} color={colors.warm} />}
        />
      </Animated.View>

      {/* Ficha principal: iniciales, nombre y condición de interés */}
      <Animated.View entering={screenEnter(1, reduced)} style={{ gap: 16, alignItems: 'flex-start', paddingHorizontal: 4 }}>
        <Avatar name={person.nombre} size={88} />
        <View style={{ gap: 12 }}>
          <AppText variant="title" accessibilityRole="header" style={{ fontSize: 40, lineHeight: 40, letterSpacing: -1.8 }}>
            {person.nombre}
          </AppText>
          {person.exento_interes_ordinario ? (
            <Chip tone="warn" label="Exento de interés ordinario" style={{ height: 28, paddingHorizontal: 12 }} />
          ) : (
            <AppText variant="lbl" tone="muted2">
              Sujeto a intereses ordinarios estándar
            </AppText>
          )}
        </View>
      </Animated.View>

      {/* Datos de contacto y ubicación */}
      <Animated.View entering={screenEnter(2, reduced)}>
        <Card variant="ink" style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 6 }}>
          <AppText variant="sec" style={{ fontSize: 18, lineHeight: 24 }}>
            Información de contacto
          </AppText>

          <View style={{ marginTop: 6 }}>
            <Row label="Teléfono">
              {person.telefono ? (
                <AnimatedPressable
                  onPress={handleCall}
                  accessibilityRole="link"
                  accessibilityLabel={`Llamar al ${person.telefono}`}
                  style={{ minHeight: 28, justifyContent: 'center', alignSelf: 'flex-start' }}
                >
                  <AppText variant="h">{person.telefono}</AppText>
                </AnimatedPressable>
              ) : (
                <Text style={{ color: colors.muted2, fontFamily: fonts.regular, fontSize: 14, fontStyle: 'italic' }}>No registrado</Text>
              )}
            </Row>
            <Row label="Dirección">
              {person.direccion ? (
                <AppText variant="h">{person.direccion}</AppText>
              ) : (
                <Text style={{ color: colors.muted2, fontFamily: fonts.regular, fontSize: 14, fontStyle: 'italic' }}>No registrada</Text>
              )}
            </Row>
            <Row label="Notas confidenciales" last>
              <Text style={{ color: '#D6D6DA', fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 }}>
                {person.notas || 'Sin notas registradas para esta persona.'}
              </Text>
            </Row>
          </View>
        </Card>
      </Animated.View>

      {/* Historial de préstamos asociados */}
      <Animated.View entering={screenEnter(3, reduced)} style={{ gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <AppText variant="sec" style={{ fontSize: 20, flexShrink: 1 }}>
            Préstamos vinculados ({personLoans.length})
          </AppText>
          <Button
            label="Prestar"
            size="sm"
            onPress={() => router.push(`/prestamos/crear?persona_id=${person.id}`)}
            icon={<Plus size={16} color="#000000" />}
            style={{ paddingLeft: 12, paddingRight: 16 }}
          />
        </View>

        {personLoans.length === 0 ? (
          <Card variant="dark" style={{ padding: 20, alignItems: 'center', gap: 10 }}>
            <CreditCard size={24} color={colors.muted2} />
            <AppText variant="lbl" style={{ textAlign: 'center', lineHeight: 18 }}>
              Esta persona no tiene préstamos activos actualmente.
            </AppText>
          </Card>
        ) : (
          <View>
            {personLoans.map((loan) => (
              <LoanCard key={loan.id} loan={loan} />
            ))}
          </View>
        )}
      </Animated.View>

      {/* Eliminar */}
      {onDelete && (
        <Animated.View entering={screenEnter(4, reduced)}>
          <Button
            label="Eliminar persona definitivamente"
            variant="danger"
            onPress={onDelete}
            haptic="medium"
            icon={<Trash2 size={16} color="#000000" />}
            style={{ height: 52, width: '100%' }}
          />
        </Animated.View>
      )}
    </ScrollView>
  )
}
