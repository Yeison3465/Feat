import React, { useState, useMemo, useRef } from 'react'
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import Animated, { useReducedMotion } from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  Check,
  CreditCard,
  Banknote,
  Smartphone,
  ShieldCheck,
  Sparkles,
  TrendingDown,
} from 'lucide-react-native'
import { CreatePaymentDTO, PaymentMethod } from '../types'
import { paymentsService } from '../services/payments.service'
import { LoanWithDetails } from '../../loans/types'
import { formatCOP, parseCOP } from '../../../shared/utils/currency'
import { getSafeBottomInset } from '../../../shared/utils/responsive'
import { generateUUID } from '../../../shared/utils/uuid'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { DatePickerModal } from '../../../shared/components/DatePickerModal'
import { AnimatedPressable } from '../../../shared/components/AnimatedPressable'
import { AppText } from '../../../shared/ui/AppText'
import { Avatar } from '../../../shared/ui/Avatar'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { Chip } from '../../../shared/ui/Chip'
import { CountUpText } from '../../../shared/ui/CountUpText'
import { Field } from '../../../shared/ui/Field'
import { screenEnter } from '../../../shared/motion'
import { haptic } from '../../../shared/haptics'
import { colors, fonts } from '../../../shared/theme/tokens'

interface PaymentFormProps {
  readonly loan: LoanWithDetails
  readonly onSubmit: (data: CreatePaymentDTO) => Promise<void>
  readonly loading: boolean
}

const METHODS: ReadonlyArray<{ id: PaymentMethod; label: string; Icon: typeof Banknote }> = [
  { id: 'efectivo', label: 'Efectivo', Icon: Banknote },
  { id: 'transferencia', label: 'Nequi / Transf.', Icon: Smartphone },
  { id: 'otro', label: 'Otro', Icon: CreditCard },
]

// Fila de la previsualización: punto de color + etiqueta a la izquierda, importe a la derecha
const PvRow: React.FC<{ readonly label: string; readonly value: string; readonly dot?: string; readonly valueColor?: string; readonly icon?: React.ReactNode }> = ({
  label,
  value,
  dot,
  valueColor = colors.warm,
  icon,
}) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
      {dot ? <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: dot }} /> : icon}
      <Text style={{ color: colors.muted, fontFamily: fonts.regular, fontSize: 13, flexShrink: 1 }}>{label}</Text>
    </View>
    <Text style={{ color: valueColor, fontFamily: fonts.semibold, fontSize: 14 }}>{value}</Text>
  </View>
)

export const PaymentForm: React.FC<PaymentFormProps> = ({ loan, onSubmit, loading }) => {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const reduced = useReducedMotion()

  const borrowerName = loan.persona?.nombre || 'Prestatario'
  const shortCode = `PR-${loan.id.slice(0, 4).toUpperCase()}`

  // Métricas financieras calculadas
  const cuotas = loan.cuotas || []
  const totalCapitalPagado = cuotas.reduce((acc, c) => acc + (c.capital_pagado || 0), 0)
  const capitalPendiente = Math.max(0, loan.capital_original - totalCapitalPagado)
  const cuotasAbiertas = cuotas.filter((c) => !c.esta_liquidada)
  const interesPendienteTotal = cuotasAbiertas.reduce(
    (acc, c) => acc + Math.max(0, (c.interes_esperado || 0) - (c.interes_pagado || 0)),
    0
  )
  const moraPendienteTotal = cuotasAbiertas.reduce(
    (acc, c) => acc + Math.max(0, (c.mora_acumulada || 0) - (c.mora_pagada || 0)),
    0
  )
  const saldoExigibleTotal = capitalPendiente + interesPendienteTotal + moraPendienteTotal

  // Cuota activa más próxima
  const proximaCuota = cuotas.find((c) => !c.esta_liquidada) || cuotas[0]
  const interesProximaCuota = proximaCuota
    ? Math.max(0, (proximaCuota.interes_esperado || 0) - (proximaCuota.interes_pagado || 0))
    : 0
  const capitalProximaCuota = proximaCuota
    ? Math.max(0, (proximaCuota.capital_esperado || 0) - (proximaCuota.capital_pagado || 0))
    : 0
  const valorProximaCuota = interesProximaCuota + capitalProximaCuota

  // Estados del formulario
  const [montoText, setMontoText] = useState<string>('')
  const [metodoPago, setMetodoPago] = useState<PaymentMethod>('efectivo')
  const [notas, setNotas] = useState<string>('')

  // Clave de idempotencia estable por intento (FL-11: reintento seguro ante corte de red)
  const idempotencyKeyRef = useRef<string>(generateUUID())

  // Fecha de recepción
  const todayStr = useMemo(() => {
    const d = new Date()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${d.getFullYear()}-${m}-${day}`
  }, [])
  const [fechaRecepcion, setFechaRecepcion] = useState<string>(todayStr)
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false)

  // Errores
  const [montoError, setMontoError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const montoNum = parseCOP(montoText)

  // Previsualización de distribución en vivo (FL-04 paso 6)
  const preview = useMemo(
    () => paymentsService.previewAllocation(loan, montoNum),
    [loan, montoNum]
  )

  const handleMontoChange = (val: string) => {
    const clean = val.replace(/[^0-9]/g, '')
    setMontoText(clean)
    // Solo renovamos la clave de idempotencia cuando el usuario cambia la intención de monto
    idempotencyKeyRef.current = generateUUID()
    if (montoError) setMontoError(null)
  }

  const handleQuickAmount = (val: number) => {
    haptic('selection')
    setMontoText(val.toString())
    idempotencyKeyRef.current = generateUUID()
    if (montoError) setMontoError(null)
  }

  const validate = (): boolean => {
    let valid = true
    setMontoError(null)
    setFormError(null)

    if (!montoNum || montoNum <= 0) {
      setMontoError('Ingresa un monto mayor a 0.')
      valid = false
    } else if (preview.excedeSaldoTotal) {
      setMontoError(
        `El monto supera el saldo total adeudado (${formatCOP(saldoExigibleTotal)} COP).`
      )
      valid = false
    }

    return valid
  }

  const handleSubmit = async () => {
    if (!validate()) return

    try {
      await onSubmit({
        prestamo_id: loan.id,
        monto: montoNum,
        fecha_recepcion: fechaRecepcion,
        metodo_pago: metodoPago,
        notas: notas.trim() || null,
        clave_idempotencia: idempotencyKeyRef.current,
      })
      haptic('success')
    } catch (err: any) {
      setFormError(err.message || 'Error al registrar el pago. Puedes reintentar de forma segura.')
    }
  }

  const exceeds = preview.excedeSaldoTotal
  const quickChips: Array<{ key: string; label: string; amount: number; ok?: boolean }> = []
  if (interesProximaCuota > 0) {
    quickChips.push({ key: 'int', label: `Interés (${formatCOP(interesProximaCuota)})`, amount: interesProximaCuota })
  }
  if (valorProximaCuota > 0 && valorProximaCuota !== interesProximaCuota) {
    quickChips.push({ key: 'cuota', label: `Cuota (${formatCOP(valorProximaCuota)})`, amount: valorProximaCuota })
  }
  if (saldoExigibleTotal > 0) {
    quickChips.push({ key: 'total', label: `Liquidar total (${formatCOP(saldoExigibleTotal)})`, amount: saldoExigibleTotal, ok: true })
  }

  const planLabel =
    loan.tipo_amortizacion === 'solo_interes'
      ? 'Solo interés'
      : loan.tipo_amortizacion === 'pago_unico'
        ? 'Pago único'
        : 'Cuotas fijas'

  return (
    <View style={{ flex: 1, backgroundColor: colors.app, paddingTop: Math.max(insets.top, 12) }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, gap: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Cabecera con Cancelar */}
          <Animated.View
            entering={screenEnter(0, reduced)}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Button
              label="Cancelar"
              variant="ghost"
              size="sm"
              onPress={() => router.back()}
              icon={<ArrowLeft size={16} color={colors.warm} />}
            />
            <Chip glass label="Registrar Recaudo" />
          </Animated.View>

          {/* Título */}
          <Animated.View entering={screenEnter(1, reduced)} style={{ gap: 8, paddingHorizontal: 4 }}>
            <AppText variant="title" accessibilityRole="header" style={{ fontSize: 40, lineHeight: 42, letterSpacing: -1.8 }}>
              Registrar pago
            </AppText>
            <AppText variant="body">Abono a capital o intereses con trazabilidad contable inmediata</AppText>
          </Animated.View>

          {formError && <ErrorMessage message={formError} onRetry={handleSubmit} />}

          {/* Ficha resumen del préstamo */}
          <Animated.View entering={screenEnter(2, reduced)}>
            <Card variant="ink" style={{ padding: 16, gap: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 }}>
                  <Avatar name={borrowerName} size={56} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text numberOfLines={1} style={{ color: colors.warm, fontFamily: fonts.medium, fontSize: 17 }}>
                      {borrowerName}
                    </Text>
                    <Text numberOfLines={1} style={{ color: colors.muted2, fontFamily: fonts.regular, fontSize: 12 }}>
                      #{shortCode} · {planLabel}
                    </Text>
                  </View>
                </View>
                <Chip label="Activo" style={{ height: 28 }} />
              </View>

              <View style={{ gap: 8, padding: 18, borderRadius: 24, backgroundColor: colors.card2 }}>
                <Text style={{ color: colors.muted, fontFamily: fonts.medium, fontSize: 12 }}>Saldo total adeudado</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                  <CountUpText
                    value={saldoExigibleTotal}
                    style={{ color: colors.warm, fontFamily: fonts.semibold, fontSize: 36, lineHeight: 38, letterSpacing: -1.4, flexShrink: 1, padding: 0 }}
                  />
                  <Text style={{ color: colors.muted2, fontFamily: fonts.medium, fontSize: 13, marginLeft: 6 }}>COP</Text>
                </View>
                <View style={{ height: 1, backgroundColor: colors.line, marginTop: 6, marginBottom: 2 }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                  <Text style={{ color: colors.muted, fontFamily: fonts.regular, fontSize: 12 }}>
                    Capital: <Text style={{ color: colors.warm, fontFamily: fonts.medium }}>{formatCOP(capitalPendiente)}</Text>
                  </Text>
                  <Text style={{ color: colors.muted, fontFamily: fonts.regular, fontSize: 12 }}>
                    Interés: <Text style={{ color: colors.warm, fontFamily: fonts.medium }}>{formatCOP(interesPendienteTotal)}</Text>
                  </Text>
                </View>
              </View>
            </Card>
          </Animated.View>

          <Animated.View entering={screenEnter(3, reduced)} style={{ gap: 28 }}>
            {/* Monto recibido */}
            <View style={{ gap: 12 }}>
              <Field
                label="Monto recibido *"
                hint="Obligatorio"
                value={montoText}
                onChangeText={handleMontoChange}
                error={montoError}
                placeholder="0"
                keyboardType="numeric"
                suffix="COP"
                prefix={({ focused, error }) => (
                  <DollarSign size={18} color={error || exceeds ? colors.danger : focused ? colors.warm : colors.muted2} />
                )}
              />

              {/* Atajos de monto según la modalidad */}
              {quickChips.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {quickChips.map((q) => (
                    <AnimatedPressable
                      key={q.key}
                      onPress={() => handleQuickAmount(q.amount)}
                      accessibilityRole="button"
                      style={{
                        minHeight: 44,
                        paddingHorizontal: 16,
                        borderRadius: 999,
                        justifyContent: 'center',
                        backgroundColor: q.ok ? 'rgba(127,214,164,0.12)' : colors.card,
                        borderWidth: 1,
                        borderColor: q.ok ? 'rgba(127,214,164,0.35)' : colors.line,
                      }}
                    >
                      <Text style={{ color: q.ok ? colors.okSoft : colors.warm, fontFamily: fonts.medium, fontSize: 13 }}>{q.label}</Text>
                    </AnimatedPressable>
                  ))}
                </View>
              )}
            </View>

            {/* Previsualización de la distribución en vivo (FL-04 paso 6) */}
            {montoNum > 0 && (
              <View
                accessibilityLiveRegion="polite"
                style={{
                  gap: 16,
                  padding: 18,
                  borderRadius: 28,
                  backgroundColor: exceeds ? 'rgba(255,107,94,0.08)' : preview.liquidaCreditoCompleto ? 'rgba(127,214,164,0.08)' : colors.ink,
                  borderWidth: 1,
                  borderColor: exceeds ? 'rgba(255,107,94,0.45)' : preview.liquidaCreditoCompleto ? 'rgba(127,214,164,0.4)' : colors.line,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
                    <Sparkles size={14} color={preview.liquidaCreditoCompleto ? colors.okSoft : colors.muted} />
                    <Text style={{ color: colors.warm, fontFamily: fonts.semibold, fontSize: 12, flexShrink: 1 }}>
                      Previsualización de distribución
                    </Text>
                  </View>
                  {preview.liquidaCreditoCompleto && <Chip tone="ok" label="Liquida 100%" />}
                </View>

                {exceeds ? (
                  <Text style={{ color: colors.dangerSoft, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 }}>
                    El monto ingresado supera la deuda total de {formatCOP(saldoExigibleTotal)} COP. Ajusta el valor para no generar saldos negativos.
                  </Text>
                ) : (
                  <>
                    {/* Barra de distribución: mora · interés · capital */}
                    <View style={{ flexDirection: 'row', height: 10, borderRadius: 999, overflow: 'hidden', gap: 3 }} accessibilityElementsHidden>
                      {preview.abonoMora > 0 && <View style={{ flex: preview.abonoMora, backgroundColor: colors.danger }} />}
                      {preview.abonoInteres > 0 && <View style={{ flex: preview.abonoInteres, backgroundColor: colors.warm }} />}
                      {preview.abonoCapital > 0 && <View style={{ flex: preview.abonoCapital, backgroundColor: colors.ok }} />}
                    </View>

                    <View style={{ gap: 12 }}>
                      {preview.abonoMora > 0 && (
                        <PvRow label="1° Imputación a mora:" value={formatCOP(preview.abonoMora)} dot={colors.danger} valueColor={colors.dangerSoft} />
                      )}
                      <PvRow label="Interés ordinario cubierto:" value={formatCOP(preview.abonoInteres)} dot={colors.warm} />
                      <PvRow label="Abono directo a capital:" value={formatCOP(preview.abonoCapital)} dot={colors.ok} valueColor={colors.okSoft} />
                      <View style={{ height: 1, backgroundColor: colors.line }} />
                      <PvRow
                        label="Nuevo capital pendiente:"
                        value={formatCOP(preview.nuevoCapitalPendiente)}
                        icon={<TrendingDown size={13} color={colors.muted2} />}
                      />
                      {!preview.liquidaCreditoCompleto &&
                        (loan.tipo_amortizacion === 'solo_interes' || loan.tipo_amortizacion === 'pago_unico') &&
                        preview.nuevoInteresPendiente === 0 && (
                          <PvRow
                            label={`Próximo interés mensual (${loan.tasa_mensual}%):`}
                            value={`${formatCOP(preview.proximoInteresMensualEstimado)} COP`}
                            valueColor={colors.muted}
                          />
                        )}
                    </View>
                  </>
                )}
              </View>
            )}

            {/* Fecha de recepción */}
            <View style={{ gap: 14 }}>
              <Text style={{ color: colors.warm, fontFamily: fonts.medium, fontSize: 14 }}>Fecha de recepción del pago</Text>
              <AnimatedPressable
                onPress={() => setShowDatePicker(true)}
                accessibilityRole="button"
                accessibilityLabel={`Fecha de recepción: ${fechaRecepcion}. Cambiar`}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    minHeight: 64,
                    paddingLeft: 18,
                    paddingRight: 14,
                    borderRadius: 22,
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.line,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Calendar size={18} color={colors.warm} />
                    <Text style={{ color: colors.warm, fontFamily: fonts.medium, fontSize: 16 }}>{fechaRecepcion}</Text>
                  </View>
                  <Chip label="Cambiar" style={{ height: 32, paddingHorizontal: 14 }} />
                </View>
              </AnimatedPressable>
            </View>

            {/* Método de pago */}
            <View style={{ gap: 14 }}>
              <Text style={{ color: colors.warm, fontFamily: fonts.medium, fontSize: 14 }}>Método de pago</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {METHODS.map(({ id, label, Icon }) => {
                  const isSelected = metodoPago === id
                  return (
                    <AnimatedPressable
                      key={id}
                      onPress={() => {
                        haptic('selection')
                        setMetodoPago(id)
                      }}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                      containerStyle={{ flex: 1 }}
                      style={{
                        minHeight: 72,
                        paddingHorizontal: 4,
                        paddingVertical: 10,
                        borderRadius: 20,
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        backgroundColor: isSelected ? colors.warm : colors.card,
                        borderWidth: 1,
                        borderColor: isSelected ? colors.warm : colors.line,
                      }}
                    >
                      <Icon size={18} color={isSelected ? colors.onLight : colors.muted2} />
                      <Text
                        style={{
                          color: isSelected ? colors.onLight : colors.warm,
                          fontFamily: fonts.medium,
                          fontSize: 12,
                          textAlign: 'center',
                        }}
                      >
                        {label}
                      </Text>
                    </AnimatedPressable>
                  )
                })}
              </View>
            </View>

            {/* Notas */}
            <Field
              label="Notas privadas o referencia (opcional)"
              value={notas}
              onChangeText={setNotas}
              placeholder="Ej. Transferencia Nequi M-9281, pagó en el local..."
              multiline
              numberOfLines={3}
            />
          </Animated.View>

          {/* Aviso de transaccionalidad e idempotencia */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 8 }}>
            <ShieldCheck size={14} color={colors.muted2} />
            <Text style={{ flexShrink: 1, color: colors.muted2, fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, textAlign: 'center' }}>
              Operación protegida con clave de idempotencia contra cobros duplicados
            </Text>
          </View>
        </ScrollView>

        {/* Acción fija abajo */}
        <View
          style={{
            paddingTop: 12,
            paddingHorizontal: 16,
            paddingBottom: getSafeBottomInset(insets.bottom, 20),
            backgroundColor: colors.app,
          }}
        >
          <Button
            label={`Confirmar pago de ${formatCOP(montoNum)}`}
            size="lg"
            onPress={handleSubmit}
            loading={loading}
            disabled={exceeds}
            icon={<Check size={16} color="#000000" strokeWidth={2.5} />}
            style={{ width: '100%' }}
          />
        </View>

        {/* Fecha de recepción */}
        <DatePickerModal
          visible={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          selectedDate={fechaRecepcion}
          onSelectDate={setFechaRecepcion}
          title="Fecha de recepción del pago"
        />
      </KeyboardAvoidingView>
    </View>
  )
}
