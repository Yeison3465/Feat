import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Calendar, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react-native'
import { LoanWithDetails } from '../types'
import { formatCOP, formatDateFriendly } from '../../../shared/utils/currency'
import { formatDateLong } from '../../../shared/utils/dates'
import { loanImage, tintByTone, tintLocations } from '../../../shared/images'
import { AnimatedPressable } from '../../../shared/components/AnimatedPressable'
import { Avatar } from '../../../shared/ui/Avatar'
import { Chip } from '../../../shared/ui/Chip'
import { CoverImage } from '../../../shared/ui/CoverImage'
import { ProgressBar } from '../../../shared/ui/ProgressBar'
import { colors, fonts } from '../../../shared/theme/tokens'

interface LoanCardProps {
  readonly loan: LoanWithDetails
  // «list»: tarjeta de lista (toda tocable). «carousel»: versión compacta para el carrusel circular
  // (el carrusel decide qué hace el toque) con la foto desplazable para el efecto de profundidad.
  readonly variant?: 'list' | 'carousel'
  readonly imageOffset?: SharedValue<number>
}

// Tarjeta de préstamo con foto según su estado (mora > completado > exento > activo)
export const LoanCard: React.FC<LoanCardProps> = ({ loan, variant = 'list', imageOffset }) => {
  const router = useRouter()
  const compact = variant === 'carousel'
  const borrowerName = loan.persona?.nombre || 'Prestatario'
  const isExempt = !!loan.persona?.exento_interes_ordinario || loan.tasa_mensual === 0
  const shortCode = `PR-${loan.id.slice(0, 4).toUpperCase()}`

  // Calcular saldos y cuota próxima
  const cuotas = loan.cuotas || []
  const proximaCuota = cuotas.find((c) => !c.esta_liquidada) || cuotas[0]
  const today = new Date().toISOString().split('T')[0]
  const isOverdue = !!proximaCuota && !proximaCuota.esta_liquidada && proximaCuota.fecha_vencimiento < today

  // Capital pendiente
  const totalCapitalPagado = cuotas.reduce((acc, c) => acc + (c.capital_pagado || 0), 0)
  const capitalPendiente = Math.max(0, loan.capital_original - totalCapitalPagado)
  const capitalRatio = loan.capital_original > 0 ? (totalCapitalPagado / loan.capital_original) * 100 : 0

  // Saldo exigible de la próxima obligación
  const saldoExigible = proximaCuota
    ? Math.max(0, proximaCuota.capital_esperado - proximaCuota.capital_pagado) +
      Math.max(0, proximaCuota.interes_esperado - proximaCuota.interes_pagado) +
      Math.max(0, proximaCuota.mora_acumulada - proximaCuota.mora_pagada)
    : capitalPendiente

  const inMora = isOverdue || loan.estado === 'en_mora'
  const img = loanImage(inMora ? 'en_mora' : loan.estado, isExempt)

  const status =
    loan.estado === 'completado'
      ? { label: 'Completado', tone: 'ok' as const, icon: <CheckCircle2 size={12} color="#A6E8C3" /> }
      : inMora
      ? { label: 'En mora', tone: 'danger' as const, icon: <AlertTriangle size={12} color="#FFB8B0" /> }
      : { label: 'Activo', tone: 'neutral' as const, icon: null }

  // Parallax: la foto (más ancha que la tarjeta) se desplaza a distinta velocidad que la tarjeta
  const imageStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: imageOffset ? imageOffset.value : 0 }],
  }))

  const body = (
    <>
      <Animated.View
        pointerEvents="none"
        style={[
          compact ? { position: 'absolute', top: 0, bottom: 0, left: -30, right: -30 } : StyleSheet.absoluteFill,
          imageStyle,
        ]}
      >
        <CoverImage source={img.source} focusY={img.focusY} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <LinearGradient
        pointerEvents="none"
        colors={tintByTone[img.tone]}
        locations={tintLocations}
        style={StyleSheet.absoluteFill}
      />

      <View style={{ minHeight: compact ? undefined : 440, flex: compact ? 1 : undefined, padding: compact ? 14 : 16, gap: compact ? 12 : 16 }}>
        {/* Estado y código */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Chip glass tone={status.tone} label={status.label} icon={status.icon} />
            {isExempt && !compact && <Chip glass tone="warn" label="Exento" />}
          </View>
          <Chip glass label={`#${shortCode}`} />
        </View>

        <View style={{ flex: 1 }} />

        {/* Prestatario */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Avatar name={borrowerName} size={44} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text numberOfLines={1} style={{ color: colors.warm, fontFamily: fonts.medium, fontSize: 18, lineHeight: 24, letterSpacing: -0.18 }}>
              {borrowerName}
            </Text>
            <Text numberOfLines={1} style={{ color: '#C4C4C8', fontFamily: fonts.regular, fontSize: 12, lineHeight: 16 }}>
              Prestado el {formatDateLong(loan.fecha_desembolso)}
            </Text>
          </View>
        </View>

        {/* Saldo exigible destacado */}
        <View style={{ gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <Text style={{ color: '#C4C4C8', fontFamily: fonts.regular, fontSize: 12, flexShrink: 1 }}>
              {proximaCuota ? 'Saldo próxima obligación' : 'Capital total adeudado'}
            </Text>
            {proximaCuota && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Calendar size={13} color={isOverdue ? colors.dangerSoft : '#D0D0D4'} />
                <Text style={{ color: isOverdue ? colors.dangerSoft : '#D0D0D4', fontFamily: fonts.medium, fontSize: 11 }}>
                  {formatDateFriendly(proximaCuota.fecha_vencimiento)}
                </Text>
              </View>
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
              style={{
                color: colors.warm,
                fontFamily: fonts.semibold,
                fontSize: compact ? 34 : 40,
                lineHeight: compact ? 36 : 42,
                letterSpacing: compact ? -1.5 : -1.8,
                flexShrink: 1,
              }}
            >
              {formatCOP(saldoExigible)}
            </Text>
            <Text style={{ color: colors.muted2, fontFamily: fonts.medium, fontSize: 13, marginLeft: 6 }}>COP</Text>
          </View>
        </View>

        {/* Capital pendiente, avance y tasa */}
        <View
          style={{
            gap: 10,
            padding: 12,
            borderRadius: 22,
            backgroundColor: 'rgba(10,10,11,0.58)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <Text style={{ color: '#C4C4C8', fontFamily: fonts.regular, fontSize: 12, flexShrink: 1 }}>
              Capital pendiente:{' '}
              <Text style={{ color: colors.warm, fontFamily: fonts.medium }}>{formatCOP(capitalPendiente)}</Text>
            </Text>
            <Text style={{ color: '#9A9AA0', fontFamily: fonts.regular, fontSize: 12 }}>de {formatCOP(loan.capital_original)}</Text>
          </View>
          <ProgressBar percent={capitalRatio} />
          <Text style={{ color: '#9A9AA0', fontFamily: fonts.regular, fontSize: 12 }}>
            {isExempt ? 'Tasa 0% pactada (Exento)' : `Tasa ordinaria: ${loan.tasa_mensual}% mensual`}
          </Text>
        </View>

        {/* Invitación a abrir el detalle (toda la tarjeta es tocable) */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View
            style={{
              flex: 1,
              height: 48,
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.14)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.2)',
            }}
          >
            <Text style={{ color: colors.warm, fontFamily: fonts.medium, fontSize: 14 }}>Ver detalle</Text>
          </View>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.warm, alignItems: 'center', justifyContent: 'center' }}>
            <ArrowRight size={16} color={colors.onLight} />
          </View>
        </View>
      </View>
    </>
  )

  const frame = { borderRadius: 32, overflow: 'hidden' as const, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.app }

  // En el carrusel la tarjeta la envuelve el carrusel (decide si abre el detalle o trae la tarjeta al centro)
  if (compact) {
    return <View style={[frame, { flex: 1 }]}>{body}</View>
  }

  return (
    <AnimatedPressable
      onPress={() => router.push(`/prestamos/${loan.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`Préstamo de ${borrowerName}, ${status.label}. Abrir detalle`}
      containerClassName="mb-4"
      style={frame}
    >
      {body}
    </AnimatedPressable>
  )
}
