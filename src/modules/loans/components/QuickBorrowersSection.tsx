import React from 'react'
import { View, ScrollView, Linking } from 'react-native'
import Animated, { FadeInRight, useReducedMotion } from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import { Phone, ArrowRight, ArrowUpRight, Plus, AlertCircle, ShieldCheck } from 'lucide-react-native'
import { ActiveBorrowerSummary } from '../types'
import { formatCOP } from '../../../shared/utils/currency'
import { AnimatedPressable } from '../../../shared/components/AnimatedPressable'
import { AppText } from '../../../shared/ui/AppText'
import { Avatar } from '../../../shared/ui/Avatar'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { Chip } from '../../../shared/ui/Chip'
import { staggerDelay, DURATION, EASE_OUT } from '../../../shared/motion'
import { colors } from '../../../shared/theme/tokens'

interface QuickBorrowersSectionProps {
  readonly borrowers: ActiveBorrowerSummary[]
}

export const QuickBorrowersSection: React.FC<QuickBorrowersSectionProps> = ({ borrowers }) => {
  const router = useRouter()
  const reduced = useReducedMotion()

  const handleCall = (phone?: string | null) => {
    if (!phone) return
    const cleaned = phone.replace(/\s+/g, '')
    Linking.openURL(`tel:${cleaned}`).catch(() => {})
  }

  return (
    <View style={{ gap: 8 }}>
      {/* Cabecera */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <AppText variant="sec" style={{ flexShrink: 1 }}>
          Prestatarios activos
        </AppText>
        <AnimatedPressable
          onPress={() => router.navigate('/personas')}
          accessibilityRole="link"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44, flexShrink: 0 }}
        >
          <AppText variant="amt" style={{ fontSize: 13 }}>
            Ver directorio
          </AppText>
          <ArrowRight size={16} color={colors.warm} />
        </AnimatedPressable>
      </View>

      {/* Lista horizontal o estado vacío */}
      {borrowers.length === 0 ? (
        <Card variant="dark" style={{ padding: 16, gap: 14, alignItems: 'center' }}>
          <AppText variant="body" style={{ textAlign: 'center' }}>
            Aún no tienes prestatarios con créditos activos en tu cartera.
          </AppText>
          <Button
            label="Registrar primer prestatario"
            onPress={() => router.push('/personas/crear')}
            icon={<Plus size={16} color="#000000" />}
          />
        </Card>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -16 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8, gap: 12 }}
        >
          {borrowers.map((b, index) => (
            <Animated.View
              key={b.personaId}
              entering={reduced ? undefined : FadeInRight.delay(staggerDelay(index)).duration(DURATION.screenIn - 120).easing(EASE_OUT)}
              style={{ width: 196 }}
            >
              <AnimatedPressable
                onPress={() => router.push(`/personas/${b.personaId}`)}
                accessibilityRole="button"
                accessibilityLabel={`Abrir a ${b.nombre}`}
              >
                <Card variant="ink" style={{ padding: 16, gap: 14 }}>
                  <Avatar name={b.nombre} size={56} />
                  <View style={{ gap: 4 }}>
                    <AppText variant="h" numberOfLines={1}>
                      {b.nombre}
                    </AppText>
                    <AppText variant="lbl" tone="muted2">
                      {b.activeLoansCount} {b.activeLoansCount === 1 ? 'crédito' : 'créditos'}
                    </AppText>
                  </View>
                  {b.hasOverdue ? (
                    <Chip tone="danger" label="Atraso" icon={<AlertCircle size={12} color="#FF7A6E" />} />
                  ) : (
                    <Chip tone="ok" label="Al día" icon={<ShieldCheck size={12} color={colors.okSoft} />} />
                  )}
                  <View style={{ height: 1, backgroundColor: colors.line }} />
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ gap: 2, flex: 1 }}>
                      <AppText variant="lbl" tone="muted2">
                        Saldo total
                      </AppText>
                      <AppText variant="amt" numberOfLines={1}>
                        {formatCOP(b.totalSaldoPendiente)}
                      </AppText>
                    </View>
                    {b.telefono ? (
                      <AnimatedPressable
                        onPress={() => handleCall(b.telefono)}
                        accessibilityRole="button"
                        accessibilityLabel={`Llamar a ${b.nombre}`}
                        style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card2, alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Phone size={16} color={colors.warm} />
                      </AnimatedPressable>
                    ) : null}
                  </View>
                </Card>
                {/* Flecha que «muerde» la esquina de la tarjeta */}
                <View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: colors.warm,
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 0 6px #0A0A0B',
                  }}
                >
                  <ArrowUpRight size={16} color={colors.onLight} />
                </View>
              </AnimatedPressable>
            </Animated.View>
          ))}

          {/* Acción rápida: nueva persona */}
          <AnimatedPressable
            onPress={() => router.push('/personas/crear')}
            accessibilityRole="button"
            accessibilityLabel="Nueva persona"
            containerClassName="self-stretch"
            style={{
              width: 150,
              flex: 1,
              padding: 16,
              gap: 10,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: '#3A3A3F',
              borderRadius: 28,
            }}
          >
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.warm, alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={20} color={colors.onLight} />
            </View>
            <AppText variant="h" style={{ fontSize: 14 }}>
              Nueva persona
            </AppText>
            <AppText variant="lbl" tone="muted2">
              Registrar prestatario
            </AppText>
          </AnimatedPressable>
        </ScrollView>
      )}
    </View>
  )
}
