import React from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import Animated, { useReducedMotion } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, CheckCircle2, RotateCcw, AlertTriangle, ShieldCheck, ExternalLink, X } from 'lucide-react-native'
import { formatCOP } from '../../../shared/utils/currency'
import { getSafeBottomInset } from '../../../shared/utils/responsive'
import { images, tintByTone, tintLocations, LoanImageTone } from '../../../shared/images'
import { AnimatedPressable } from '../../../shared/components/AnimatedPressable'
import { AppText } from '../../../shared/ui/AppText'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { CoverImage } from '../../../shared/ui/CoverImage'
import { Field } from '../../../shared/ui/Field'
import { Dialog } from '../../../shared/ui/Overlay'
import { screenEnter } from '../../../shared/motion'
import { colors, fonts } from '../../../shared/theme/tokens'

export interface ReverseModalState {
  readonly visible: boolean
  readonly motivo: string
  readonly error: string | null
  readonly reversing: boolean
  readonly onChangeMotivo: (text: string) => void
  readonly onCancel: () => void
  readonly onConfirm: () => void
}

interface PaymentReceiptProps {
  // Fila de pago con sus relaciones, tal como la entrega paymentsService.getPaymentById
  readonly pago: any
  readonly fromRegistration: boolean
  readonly onBack: () => void
  readonly onGoToLoan: () => void
  readonly onOpenReverse: () => void
  readonly reverse: ReverseModalState
}

const getComponentLabel = (comp: string) => {
  if (comp === 'interes' || comp === 'interes_ordinario') return 'Interés ordinario'
  if (comp === 'capital') return 'Abono a capital'
  if (comp === 'mora') return 'Cargo por mora'
  return comp
}

const Hair: React.FC = () => <View style={{ height: 1, backgroundColor: colors.line }} />

export const PaymentReceipt: React.FC<PaymentReceiptProps> = ({ pago, fromRegistration, onBack, onGoToLoan, onOpenReverse, reverse }) => {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const reduced = useReducedMotion()

  const borrowerName = pago.prestamos?.personas?.nombre || 'Prestatario'
  const distribuciones = pago.distribucion_pagos || []
  const isReversalEntry = Boolean(pago.es_reverso)
  const isReversed = Boolean(pago.esta_reversado)
  const fechaCorta = (pago.fecha_recepcion || '').split('T')[0]

  // Tres variantes: asiento de reverso, pago reversado y pago confirmado
  const variant = isReversalEntry
    ? {
        label: 'Asiento de Reverso Contable',
        tone: 'gold' as LoanImageTone,
        source: images.hourglass,
        accent: colors.warn,
        icon: <RotateCcw size={18} color={colors.warn} />,
      }
    : isReversed
      ? {
          label: 'Pago Reversado / Anulado',
          tone: 'danger' as LoanImageTone,
          source: images.clock,
          accent: colors.dangerSoft,
          icon: <AlertTriangle size={18} color={colors.dangerSoft} />,
        }
      : {
          label: 'Pago Confirmado',
          tone: 'ok' as LoanImageTone,
          source: images.cash,
          accent: colors.okSoft,
          icon: <CheckCircle2 size={18} color={colors.okSoft} />,
        }

  return (
    <View style={{ flex: 1, backgroundColor: colors.app, paddingTop: Math.max(insets.top, 12) }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabecera */}
        <Animated.View
          entering={screenEnter(0, reduced)}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
        >
          <Button label="Volver" variant="ghost" size="sm" onPress={onBack} icon={<ArrowLeft size={16} color={colors.warm} />} />
          <Text style={{ color: colors.muted2, fontFamily: fonts.regular, fontSize: 11, letterSpacing: 0.9, textTransform: 'uppercase' }}>
            Comprobante #{pago.id.slice(0, 6).toUpperCase()}
          </Text>
        </Animated.View>

        {/* Hero del pago con foto según la variante */}
        <Animated.View entering={screenEnter(1, reduced)}>
          <View style={{ borderRadius: 32, overflow: 'hidden', borderWidth: 1, borderColor: colors.line, backgroundColor: colors.app }}>
            <CoverImage source={variant.source} focusY={0.4} style={StyleSheet.absoluteFill} />
            <LinearGradient pointerEvents="none" colors={tintByTone[variant.tone]} locations={tintLocations} style={StyleSheet.absoluteFill} />
            <View style={{ padding: 18, gap: 22 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(10,10,11,0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' }}>
                  {variant.icon}
                </View>
                <Text style={{ color: variant.accent, fontFamily: fonts.semibold, fontSize: 13, flexShrink: 1 }}>{variant.label}</Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 48 }}>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.6}
                  style={{
                    flexShrink: 1,
                    color: isReversed ? colors.muted2 : colors.warm,
                    fontFamily: fonts.semibold,
                    fontSize: 50,
                    lineHeight: 52,
                    letterSpacing: -2.2,
                    textDecorationLine: isReversed ? 'line-through' : 'none',
                  }}
                >
                  {isReversalEntry ? `- ${formatCOP(pago.monto)}` : formatCOP(pago.monto)}
                </Text>
                <Text style={{ color: colors.muted2, fontFamily: fonts.medium, fontSize: 13, marginLeft: 6 }}>COP</Text>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderRadius: 22,
                  backgroundColor: 'rgba(10,10,11,0.58)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.1)',
                }}
              >
                <Text style={{ color: '#C4C4C8', fontFamily: fonts.regular, fontSize: 12 }}>Prestatario:</Text>
                <AnimatedPressable
                  onPress={() => router.push(`/prestamos/${pago.prestamo_id}`)}
                  accessibilityRole="link"
                  accessibilityLabel={`Ver préstamo de ${borrowerName}`}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 28 }}
                >
                  <Text numberOfLines={1} style={{ flexShrink: 1, color: colors.warm, fontFamily: fonts.semibold, fontSize: 15 }}>
                    {borrowerName}
                  </Text>
                  <ExternalLink size={14} color={colors.warm} />
                </AnimatedPressable>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Alerta de reverso si este pago fue anulado */}
        {isReversed && pago.reverso_info && (
          <Animated.View
            entering={screenEnter(2, reduced)}
            style={{ gap: 10, paddingVertical: 16, paddingHorizontal: 18, borderRadius: 28, backgroundColor: '#FFDAD4', boxShadow: 'inset 0 0 0 1px rgba(255,107,94,0.6)' }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <RotateCcw size={16} color="#8E1B14" />
              <Text style={{ flex: 1, color: '#8E1B14', fontFamily: fonts.semibold, fontSize: 15 }}>Operación reversada contablemente</Text>
            </View>
            <Text style={{ color: '#6B1410', fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 }}>
              Motivo: {pago.reverso_info.notas || 'Corrección de operación'}
            </Text>
            <AnimatedPressable
              onPress={() => router.push(`/pagos/${pago.reverso_info.id}`)}
              accessibilityRole="link"
              style={{ alignSelf: 'flex-start', height: 44, paddingHorizontal: 16, borderRadius: 999, backgroundColor: colors.app, justifyContent: 'center' }}
            >
              <Text style={{ color: '#FFFFFF', fontFamily: fonts.medium, fontSize: 13 }}>Ver comprobante del reverso →</Text>
            </AnimatedPressable>
          </Animated.View>
        )}

        {/* Detalles de la transacción */}
        <Animated.View entering={screenEnter(3, reduced)} style={{ gap: 8 }}>
          <AppText variant="sec" style={{ fontSize: 20, paddingHorizontal: 4 }}>
            Detalles de transacción
          </AppText>
          <Card variant="ink" style={{ paddingHorizontal: 18, paddingVertical: 4 }}>
            <KvRow k="Fecha de recepción" v={fechaCorta} />
            <Hair />
            <KvRow k="Método de pago" v={pago.metodo_pago} capitalize />
            <Hair />
            <KvRow k="ID de auditoría" v={`${pago.id.slice(0, 12)}...`} muted />
          </Card>
        </Animated.View>

        {/* Imputación contable */}
        {distribuciones.length > 0 && (
          <Animated.View entering={screenEnter(4, reduced)} style={{ gap: 8 }}>
            <AppText variant="sec" style={{ fontSize: 20, paddingHorizontal: 4 }}>
              Imputación contable del dinero
            </AppText>
            <Card variant="ink" style={{ paddingHorizontal: 20, paddingVertical: 4 }}>
              {distribuciones.map((dist: any, idx: number) => (
                <View
                  key={dist.id}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingVertical: 15,
                    borderBottomWidth: idx === distribuciones.length - 1 ? 0 : 1,
                    borderBottomColor: colors.line,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dist.componente === 'capital' ? colors.ok : dist.componente === 'mora' ? colors.danger : colors.warm }} />
                    <Text style={{ color: colors.muted, fontFamily: fonts.regular, fontSize: 14 }}>{getComponentLabel(dist.componente)}</Text>
                  </View>
                  <Text
                    style={{
                      color: isReversed ? colors.muted2 : dist.componente === 'capital' ? colors.okSoft : colors.warm,
                      fontFamily: fonts.semibold,
                      fontSize: 14,
                      textDecorationLine: isReversed ? 'line-through' : 'none',
                    }}
                  >
                    {formatCOP(dist.monto)}
                  </Text>
                </View>
              ))}
            </Card>
          </Animated.View>
        )}

        {/* Notas */}
        {pago.notas && (
          <Animated.View entering={screenEnter(5, reduced)}>
            <Card variant="ink" style={{ paddingVertical: 16, paddingHorizontal: 18, gap: 6 }}>
              <Text style={{ color: colors.muted, fontFamily: fonts.semibold, fontSize: 12 }}>Notas / Motivo</Text>
              <Text style={{ color: '#E4E4E8', fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 }}>{pago.notas}</Text>
            </Card>
          </Animated.View>
        )}

        {/* Corregir / reversar operación (FL-10) */}
        {!isReversalEntry && !isReversed && (
          <Animated.View entering={screenEnter(6, reduced)} style={{ gap: 12 }}>
            <Button
              label="Reversar / Anular este pago"
              variant="danger"
              size="lg"
              onPress={onOpenReverse}
              haptic="medium"
              icon={<RotateCcw size={16} color="#000000" />}
              style={{ width: '100%' }}
            />
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingHorizontal: 8 }}>
              <ShieldCheck size={14} color={colors.muted2} style={{ marginTop: 1 }} />
              <Text style={{ flex: 1, color: colors.muted2, fontFamily: fonts.regular, fontSize: 12, lineHeight: 17 }}>
                Los pagos confirmados no se borran: al reversar se crea un movimiento compensatorio auditable.
              </Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Tras registrar: volver al préstamo pagado */}
      {fromRegistration && (
        <View style={{ paddingTop: 12, paddingHorizontal: 16, paddingBottom: getSafeBottomInset(insets.bottom, 20), backgroundColor: colors.app }}>
          <Button
            label="Volver al préstamo"
            size="lg"
            onPress={onGoToLoan}
            icon={<ArrowLeft size={16} color="#000000" />}
            style={{ width: '100%' }}
          />
        </View>
      )}

      {/* Reverso de pago (FL-10) */}
      <Dialog visible={reverse.visible} onClose={() => !reverse.reversing && reverse.onCancel()}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,107,94,0.16)', alignItems: 'center', justifyContent: 'center' }}>
              <RotateCcw size={18} color={colors.dangerSoft} />
            </View>
            <AppText variant="h" accessibilityRole="header" style={{ fontSize: 18 }}>
              Reversar pago
            </AppText>
          </View>
          <AnimatedPressable
            onPress={() => !reverse.reversing && reverse.onCancel()}
            accessibilityRole="button"
            accessibilityLabel="Cerrar"
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card2, alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={18} color={colors.warm} />
          </AnimatedPressable>
        </View>

        <Text style={{ color: '#B4B4B9', fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 }}>
          Se registrará un asiento compensatorio por{' '}
          <Text style={{ color: colors.warm, fontFamily: fonts.semibold }}>{formatCOP(pago.monto)} COP</Text>{' '}
          y se restaurará el saldo pendiente de las cuotas del préstamo. El registro original se conservará para auditoría.
        </Text>

        <Field
          compact
          label="Motivo de la corrección *"
          value={reverse.motivo}
          onChangeText={reverse.onChangeMotivo}
          error={reverse.error}
          placeholder="Ej. Error al digitar el monto recibido..."
          multiline
          numberOfLines={3}
        />

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button label="Cancelar" variant="ghost" onPress={reverse.onCancel} disabled={reverse.reversing} style={{ flex: 1, height: 52 }} />
          <Button
            label="Confirmar reverso"
            variant="danger"
            onPress={reverse.onConfirm}
            loading={reverse.reversing}
            haptic="medium"
            style={{ flex: 1, height: 52 }}
          />
        </View>
      </Dialog>
    </View>
  )
}

// Fila «clave — valor» de la tarjeta de detalles
const KvRow: React.FC<{ readonly k: string; readonly v: string; readonly capitalize?: boolean; readonly muted?: boolean }> = ({ k, v, capitalize, muted }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingVertical: 15 }}>
    <Text style={{ color: colors.muted, fontFamily: fonts.regular, fontSize: 14 }}>{k}</Text>
    <Text
      style={{
        color: muted ? '#97979D' : colors.warm,
        fontFamily: muted ? fonts.regular : fonts.medium,
        fontSize: muted ? 12 : 14,
        textTransform: capitalize ? 'capitalize' : 'none',
      }}
    >
      {v}
    </Text>
  </View>
)
