import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Calendar, CheckCircle2, Clock, AlertTriangle, ChevronRight } from 'lucide-react-native'
import { LoanInstallment } from '../types'
import { formatCOP, formatDateFriendly } from '../../../shared/utils/currency'
import { installmentImage, tintByTone, tintLocations, InstallmentState } from '../../../shared/images'
import { AnimatedPressable } from '../../../shared/components/AnimatedPressable'
import { Chip } from '../../../shared/ui/Chip'
import { Card } from '../../../shared/ui/Card'
import { CoverImage } from '../../../shared/ui/CoverImage'
import { colors, fonts } from '../../../shared/theme/tokens'

interface InstallmentCardProps {
  readonly installment: LoanInstallment
  readonly onPress?: () => void
  // «foto»: tarjeta con foto según el estado de la cuota. «compacta»: tarjeta oscura sin foto.
  readonly variant?: 'foto' | 'compacta'
}

export const InstallmentCard: React.FC<InstallmentCardProps> = ({ installment, onPress, variant = 'foto' }) => {
  const today = new Date().toISOString().split('T')[0]
  const isOverdue = !installment.esta_liquidada && installment.fecha_vencimiento < today

  const totalEsperado = installment.capital_esperado + installment.interes_esperado
  const totalPagado =
    installment.capital_pagado + installment.interes_pagado + installment.mora_pagada
  const interesRestante = Math.max(0, installment.interes_esperado - installment.interes_pagado)
  const capitalRestante = Math.max(0, installment.capital_esperado - installment.capital_pagado)
  const moraRestante = Math.max(0, installment.mora_acumulada - installment.mora_pagada)
  const saldoRestante = interesRestante + capitalRestante + moraRestante

  const state: InstallmentState = installment.esta_liquidada ? 'pagada' : isOverdue ? 'atrasada' : 'pendiente'
  const badge =
    state === 'pagada'
      ? { label: 'Pagada', tone: 'ok' as const, icon: <CheckCircle2 size={12} color="#A6E8C3" /> }
      : state === 'atrasada'
        ? { label: 'Atrasada', tone: 'danger' as const, icon: <AlertTriangle size={12} color="#FFB8B0" /> }
        : { label: 'Pendiente', tone: 'warn' as const, icon: <Clock size={12} color="#F8D58E" /> }

  const capitalText =
    installment.capital_pagado > installment.capital_esperado
      ? `${formatCOP(installment.capital_pagado)} abonado`
      : formatCOP(installment.capital_esperado)

  const a11y = `Cuota ${installment.numero_cuota}, ${badge.label}. Ver detalle`

  if (variant === 'compacta') {
    return (
      <AnimatedPressable
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole="button"
        accessibilityLabel={a11y}
        containerClassName="mb-3"
      >
        <Card variant="ink" style={{ padding: 16, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 }}>
              <Text style={{ color: colors.warm, fontFamily: fonts.medium, fontSize: 17 }}>#{installment.numero_cuota}</Text>
              <Text style={{ color: colors.muted, fontFamily: fonts.regular, fontSize: 12 }}>
                {formatDateFriendly(installment.fecha_vencimiento)}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Chip tone={badge.tone} label={badge.label} />
              {onPress && <ChevronRight size={15} color={colors.muted2} />}
            </View>
          </View>

          <View style={{ gap: 6, padding: 12, borderRadius: 18, backgroundColor: colors.card2 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: colors.muted, fontFamily: fonts.regular, fontSize: 12 }}>Obligación del periodo:</Text>
              <Text style={{ color: colors.warm, fontFamily: fonts.semibold, fontSize: 14 }}>{formatCOP(totalEsperado)}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
              <Text style={{ color: colors.muted2, fontFamily: fonts.regular, fontSize: 12, flexShrink: 1 }}>Capital: {capitalText}</Text>
              <Text style={{ color: colors.muted2, fontFamily: fonts.regular, fontSize: 12 }}>
                Interés: {formatCOP(installment.interes_esperado)}
              </Text>
            </View>
            {installment.mora_acumulada > 0 && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.dangerSoft, fontFamily: fonts.regular, fontSize: 12 }}>Mora acumulada:</Text>
                <Text style={{ color: colors.dangerSoft, fontFamily: fonts.semibold, fontSize: 13 }}>
                  {formatCOP(installment.mora_acumulada)}
                </Text>
              </View>
            )}
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <Text style={{ color: colors.muted, fontFamily: fonts.regular, fontSize: 12 }}>
              Recaudado: <Text style={{ color: colors.warm, fontFamily: fonts.medium }}>{formatCOP(totalPagado)}</Text>
            </Text>
            {saldoRestante > 0 ? (
              <Text style={{ color: colors.muted, fontFamily: fonts.regular, fontSize: 12 }}>
                Resta: <Text style={{ color: colors.warm, fontFamily: fonts.medium }}>{formatCOP(saldoRestante)}</Text>
              </Text>
            ) : (
              <Text style={{ color: colors.okSoft, fontFamily: fonts.regular, fontSize: 12 }}>Periodo liquidado</Text>
            )}
          </View>
        </Card>
      </AnimatedPressable>
    )
  }

  const img = installmentImage(state)

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      containerClassName="mb-3"
      style={{ borderRadius: 32, overflow: 'hidden', borderWidth: 1, borderColor: colors.line, backgroundColor: colors.app }}
    >
      <CoverImage source={img.source} focusY={img.focusY} style={StyleSheet.absoluteFill} />
      <LinearGradient pointerEvents="none" colors={tintByTone[img.tone]} locations={tintLocations} style={StyleSheet.absoluteFill} />

      <View style={{ minHeight: 320, padding: 16, gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <Chip glass tone={badge.tone} label={badge.label} icon={badge.icon} />
          <Chip
            glass
            label={`#${installment.numero_cuota} · ${formatDateFriendly(installment.fecha_vencimiento)}`}
            icon={<Calendar size={12} color={colors.warm} />}
          />
        </View>

        <View style={{ flex: 1 }} />

        <View style={{ gap: 4 }}>
          <Text style={{ color: '#D6D6DA', fontFamily: fonts.regular, fontSize: 12 }}>Obligación del periodo:</Text>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
            style={{ color: colors.warm, fontFamily: fonts.semibold, fontSize: 34, lineHeight: 38, letterSpacing: -1.4 }}
          >
            {formatCOP(totalEsperado)}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ color: '#C4C4C8', fontFamily: fonts.regular, fontSize: 12 }}>Capital:</Text>
            <Text style={{ color: colors.warm, fontFamily: fonts.semibold, fontSize: 14 }}>{capitalText}</Text>
          </View>
          <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.18)', marginHorizontal: 16 }} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ color: '#C4C4C8', fontFamily: fonts.regular, fontSize: 12 }}>Interés:</Text>
            <Text style={{ color: colors.warm, fontFamily: fonts.semibold, fontSize: 14 }}>{formatCOP(installment.interes_esperado)}</Text>
          </View>
        </View>

        {installment.mora_acumulada > 0 && (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 999,
              backgroundColor: 'rgba(255,107,94,0.2)',
              borderWidth: 1,
              borderColor: 'rgba(255,107,94,0.45)',
            }}
          >
            <Text style={{ color: '#FFB0A8', fontFamily: fonts.regular, fontSize: 12 }}>Mora acumulada:</Text>
            <Text style={{ color: '#FFB0A8', fontFamily: fonts.semibold, fontSize: 14 }}>{formatCOP(installment.mora_acumulada)}</Text>
          </View>
        )}

        <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.14)' }} />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <Text style={{ color: '#C4C4C8', fontFamily: fonts.regular, fontSize: 12 }}>
            Recaudado: <Text style={{ color: colors.warm, fontFamily: fonts.medium }}>{formatCOP(totalPagado)}</Text>
          </Text>
          {saldoRestante > 0 ? (
            <Text style={{ color: '#C4C4C8', fontFamily: fonts.regular, fontSize: 12 }}>
              Resta: <Text style={{ color: colors.warm, fontFamily: fonts.medium }}>{formatCOP(saldoRestante)}</Text>
            </Text>
          ) : (
            <Text style={{ color: colors.okSoft, fontFamily: fonts.regular, fontSize: 12 }}>Periodo liquidado</Text>
          )}
        </View>
      </View>
    </AnimatedPressable>
  )
}
