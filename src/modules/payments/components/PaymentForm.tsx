import React, { useState, useMemo, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
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
import { getInitials } from '../../../shared/utils/initials'
import { getSafeBottomInset } from '../../../shared/utils/responsive'
import { generateUUID } from '../../../shared/utils/uuid'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { DatePickerModal } from '../../../shared/components/DatePickerModal'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'

interface PaymentFormProps {
  readonly loan: LoanWithDetails
  readonly onSubmit: (data: CreatePaymentDTO) => Promise<void>
  readonly loading: boolean
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ loan, onSubmit, loading }) => {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const borrowerName = loan.persona?.nombre || 'Prestatario'
  const initials = getInitials(borrowerName)
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
    } catch (err: any) {
      setFormError(err.message || 'Error al registrar el pago. Puedes reintentar de forma segura.')
    }
  }

  return (
    <View style={{ paddingTop: Math.max(insets.top, 12) }} className="flex-1 bg-[#060709]">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 28 }}
          keyboardShouldPersistTaps="handled"
          className="px-6 max-w-md mx-auto w-full"
        >
          {/* Cabecera Superior con Botón Cancelar */}
          <Animated.View
            entering={FadeInDown.duration(260)}
            className="flex-row items-center justify-between mt-2 mb-6"
          >
            <Pressable
              onPress={() => router.back()}
              className="flex-row items-center py-2 pr-4"
              hitSlop={10}
            >
              <ArrowLeft size={20} color="#9CA3AF" />
              <Text className="text-zinc-400 text-sm font-medium ml-2">Cancelar</Text>
            </Pressable>

            <Text className="text-zinc-500 text-xs font-mono uppercase tracking-widest">
              Registrar Recaudo
            </Text>
          </Animated.View>

          {/* Título */}
          <Animated.View entering={FadeInDown.delay(60).duration(280)} className="mb-5">
            <Text className="text-white text-3xl font-bold tracking-tight">
              Registrar pago
            </Text>
            <Text className="text-zinc-400 text-xs mt-1">
              Abono a capital o intereses con trazabilidad contable inmediata
            </Text>
          </Animated.View>

          {formError && <ErrorMessage message={formError} onRetry={handleSubmit} />}

          {/* Ficha Resumen del Préstamo */}
          <Animated.View
            entering={FadeInDown.delay(120).duration(300).springify()}
            className="bg-[#12131A] border border-[#1E2030] rounded-3xl p-5 mb-5 shadow-2xl shadow-black"
          >
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center flex-1 mr-2">
                <View className="w-11 h-11 rounded-2xl bg-[#191316] border border-[#2F191D] items-center justify-center mr-3 shadow-md shadow-black">
                  <Text className="text-[#FF7854] text-base font-bold font-mono">
                    {initials}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white text-base font-bold tracking-tight" numberOfLines={1}>
                    {borrowerName}
                  </Text>
                  <Text className="text-zinc-400 text-xs mt-0.5 font-mono">
                    #{shortCode} ·{' '}
                    {loan.tipo_amortizacion === 'solo_interes'
                      ? 'Solo interés'
                      : loan.tipo_amortizacion === 'pago_unico'
                      ? 'Pago único'
                      : 'Cuotas fijas'}
                  </Text>
                </View>
              </View>

              <View className="bg-[#D34524]/15 border border-[#D34524]/30 px-2.5 py-1 rounded-full">
                <Text className="text-[#FF7854] text-[11px] font-bold">Activo</Text>
              </View>
            </View>

            {/* Saldo adeudado actual */}
            <View className="bg-[#0A0B10] rounded-2xl p-4 border border-[#1C1E2B]">
              <Text className="text-zinc-500 text-[11px] uppercase font-semibold tracking-wider">
                Saldo total adeudado
              </Text>
              <View className="flex-row items-baseline gap-1.5 mt-1">
                <Text className="text-white text-2xl font-extrabold font-mono">
                  {formatCOP(saldoExigibleTotal)}
                </Text>
                <Text className="text-zinc-500 text-xs font-mono">COP</Text>
              </View>
              <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-[#161722]">
                <Text className="text-zinc-400 text-xs">
                  Capital: <Text className="text-white font-mono">{formatCOP(capitalPendiente)}</Text>
                </Text>
                <Text className="text-zinc-400 text-xs">
                  Interés:{' '}
                  <Text className="text-[#FF7854] font-mono">{formatCOP(interesPendienteTotal)}</Text>
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Formulario de Pago */}
          <Animated.View
            entering={FadeInUp.delay(180).duration(300).springify()}
            className="bg-[#12131A] border border-[#1E2030] rounded-3xl p-5 mb-5 shadow-2xl shadow-black"
          >
            {/* Campo: Monto a pagar */}
            <View className="mb-5">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-zinc-300 text-xs font-medium ml-1">
                  Monto recibido <Text className="text-[#FF7854]">*</Text>
                </Text>
                <Text className="text-zinc-500 text-[10px] uppercase font-semibold">Obligatorio</Text>
              </View>

              <View
                className={`flex-row items-center px-4 bg-[#0A0B10] rounded-2xl border ${
                  montoError || preview.excedeSaldoTotal ? 'border-[#FB3758]' : 'border-[#232433]'
                }`}
                style={{ height: 52 }}
              >
                <DollarSign size={18} color="#FF7854" />
                <TextInput
                  value={montoText}
                  onChangeText={handleMontoChange}
                  placeholder="0"
                  placeholderTextColor="#4B5563"
                  keyboardType="numeric"
                  className="flex-1 ml-2 text-white text-lg font-mono font-bold"
                />
                <Text className="text-zinc-500 text-xs font-mono font-semibold ml-2">COP</Text>
              </View>
              {montoError && (
                <Text className="text-[#FB3758] text-xs mt-1.5 ml-1">{montoError}</Text>
              )}

              {/* Botones de atajo rápido según la modalidad */}
              <View className="flex-row flex-wrap gap-2 mt-2.5">
                {interesProximaCuota > 0 && (
                  <Pressable
                    onPress={() => handleQuickAmount(interesProximaCuota)}
                    className="py-1.5 px-3 bg-[#0A0B10] border border-[#232433] rounded-xl items-center active:bg-[#1E2030]"
                  >
                    <Text className="text-[#FF7854] text-[11px] font-semibold">
                      Interés ({formatCOP(interesProximaCuota)})
                    </Text>
                  </Pressable>
                )}

                {valorProximaCuota > 0 && valorProximaCuota !== interesProximaCuota && (
                  <Pressable
                    onPress={() => handleQuickAmount(valorProximaCuota)}
                    className="py-1.5 px-3 bg-[#0A0B10] border border-[#232433] rounded-xl items-center active:bg-[#1E2030]"
                  >
                    <Text className="text-zinc-200 text-[11px] font-semibold">
                      Cuota ({formatCOP(valorProximaCuota)})
                    </Text>
                  </Pressable>
                )}

                {saldoExigibleTotal > 0 && (
                  <Pressable
                    onPress={() => handleQuickAmount(saldoExigibleTotal)}
                    className="py-1.5 px-3 bg-[#0A0B10] border border-[#232433] rounded-xl items-center active:bg-[#1E2030]"
                  >
                    <Text className="text-emerald-400 text-[11px] font-semibold">
                      Liquidar total ({formatCOP(saldoExigibleTotal)})
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>

            {/* Previsualización de la Distribución en Vivo (FL-04 Paso 6) */}
            {montoNum > 0 && (
              <View
                className={`mb-5 p-4 rounded-2xl border ${
                  preview.excedeSaldoTotal
                    ? 'bg-rose-950/20 border-rose-500/40'
                    : preview.liquidaCreditoCompleto
                    ? 'bg-emerald-950/20 border-emerald-500/35'
                    : 'bg-[#0A0B10] border-[#1E2030]'
                }`}
              >
                <View className="flex-row items-center justify-between mb-2.5">
                  <View className="flex-row items-center gap-1.5">
                    <Sparkles
                      size={14}
                      color={preview.liquidaCreditoCompleto ? '#10B981' : '#FF7854'}
                    />
                    <Text className="text-zinc-300 text-xs font-bold uppercase tracking-wider">
                      Previsualización de distribución
                    </Text>
                  </View>
                  {preview.liquidaCreditoCompleto && (
                    <View className="bg-emerald-500/20 px-2 py-0.5 rounded-full">
                      <Text className="text-emerald-400 text-[10px] font-bold">
                        Liquida 100%
                      </Text>
                    </View>
                  )}
                </View>

                {preview.excedeSaldoTotal ? (
                  <Text className="text-[#FB3758] text-xs leading-4">
                    El monto ingresado supera la deuda total de {formatCOP(saldoExigibleTotal)} COP.
                    Ajusta el valor para no generar saldos negativos.
                  </Text>
                ) : (
                  <View className="space-y-1.5">
                    {preview.abonoMora > 0 && (
                      <View className="flex-row justify-between items-center py-1">
                        <Text className="text-zinc-400 text-xs">1° Imputación a mora:</Text>
                        <Text className="text-rose-400 text-xs font-mono font-bold">
                          {formatCOP(preview.abonoMora)}
                        </Text>
                      </View>
                    )}

                    <View className="flex-row justify-between items-center py-1">
                      <Text className="text-zinc-400 text-xs">Interés ordinario cubierto:</Text>
                      <Text className="text-[#FF7854] text-xs font-mono font-bold">
                        {formatCOP(preview.abonoInteres)}
                      </Text>
                    </View>

                    <View className="flex-row justify-between items-center py-1">
                      <Text className="text-zinc-400 text-xs">Abono directo a capital:</Text>
                      <Text className="text-emerald-400 text-xs font-mono font-bold">
                        {formatCOP(preview.abonoCapital)}
                      </Text>
                    </View>

                    <View className="pt-2 mt-1 border-t border-[#1A1C29] flex-row justify-between items-center">
                      <View className="flex-row items-center gap-1">
                        <TrendingDown size={13} color="#9CA3AF" />
                        <Text className="text-zinc-400 text-[11px]">Nuevo capital pendiente:</Text>
                      </View>
                      <Text className="text-white text-xs font-mono font-bold">
                        {formatCOP(preview.nuevoCapitalPendiente)}
                      </Text>
                    </View>

                    {!preview.liquidaCreditoCompleto &&
                      (loan.tipo_amortizacion === 'solo_interes' ||
                        loan.tipo_amortizacion === 'pago_unico') &&
                      preview.nuevoInteresPendiente === 0 && (
                        <View className="flex-row justify-between items-center pt-0.5">
                          <Text className="text-zinc-500 text-[11px]">
                            Próximo interés mensual ({loan.tasa_mensual}%):
                          </Text>
                          <Text className="text-zinc-300 text-[11px] font-mono font-semibold">
                            {formatCOP(preview.proximoInteresMensualEstimado)} COP
                          </Text>
                        </View>
                      )}
                  </View>
                )}
              </View>
            )}

            {/* Campo: Fecha de Recepción */}
            <View className="mb-5">
              <Text className="text-zinc-300 text-xs font-medium mb-2 ml-1">
                Fecha de recepción del pago
              </Text>
              <Pressable
                onPress={() => setShowDatePicker(true)}
                className="bg-[#0A0B10] border border-[#232433] rounded-2xl p-3.5 flex-row items-center justify-between active:border-zinc-700"
              >
                <View className="flex-row items-center gap-2.5">
                  <Calendar size={16} color="#FF7854" />
                  <Text className="text-white text-xs font-bold font-mono">
                    {fechaRecepcion}
                  </Text>
                </View>
                <Text className="text-[#FF7854] text-xs font-semibold">Cambiar</Text>
              </Pressable>
            </View>

            {/* Campo: Método de Pago */}
            <View className="mb-5">
              <Text className="text-zinc-300 text-xs font-medium mb-2 ml-1">
                Método de pago
              </Text>
              <View className="flex-row gap-2">
                {[
                  { id: 'efectivo', label: 'Efectivo', icon: Banknote },
                  { id: 'transferencia', label: 'Nequi / Transf.', icon: Smartphone },
                  { id: 'otro', label: 'Otro', icon: CreditCard },
                ].map((item) => {
                  const isSelected = metodoPago === item.id
                  const IconComp = item.icon
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => setMetodoPago(item.id as PaymentMethod)}
                      className={`flex-1 p-2.5 rounded-2xl border items-center justify-center flex-row gap-1.5 active:opacity-80 ${
                        isSelected
                          ? 'bg-[#D34524]/20 border-[#D34524]'
                          : 'bg-[#0A0B10] border-[#232433]'
                      }`}
                    >
                      <IconComp
                        size={14}
                        color={isSelected ? '#FF7854' : '#6B7280'}
                      />
                      <Text
                        className={`text-xs font-semibold ${
                          isSelected ? 'text-white' : 'text-zinc-400'
                        }`}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            </View>

            {/* Campo: Notas u observaciones */}
            <View className="mb-2">
              <Text className="text-zinc-300 text-xs font-medium mb-2 ml-1">
                Notas privadas o referencia (opcional)
              </Text>
              <View className="px-4 py-2.5 bg-[#0A0B10] rounded-xl border border-[#232433] min-h-[70px]">
                <TextInput
                  value={notas}
                  onChangeText={setNotas}
                  placeholder="Ej. Transferencia Nequi M-9281, pagó en el local..."
                  placeholderTextColor="#4B5563"
                  multiline
                  numberOfLines={2}
                  className="text-white text-xs"
                />
              </View>
            </View>
          </Animated.View>

          {/* Aviso de transaccionalidad e idempotencia */}
          <View className="flex-row items-center justify-center gap-1.5 mb-2 px-2">
            <ShieldCheck size={14} color="#6B7280" />
            <Text className="text-zinc-500 text-[11px] text-center">
              Operación protegida con clave de idempotencia contra cobros duplicados
            </Text>
          </View>
        </ScrollView>

        {/* Footer Ergonómico Pinned con Zona Segura Responsiva */}
        <Animated.View
          entering={FadeInUp.delay(240).duration(280)}
          style={{
            paddingBottom: getSafeBottomInset(insets.bottom, 20),
            paddingTop: 12,
            paddingHorizontal: 24,
          }}
          className="bg-[#060709] border-t border-[#161722] w-full"
        >
          <View className="max-w-md mx-auto w-full">
            <Pressable
              onPress={handleSubmit}
              disabled={loading || preview.excedeSaldoTotal}
              style={{ height: 52 }}
              className={`w-full rounded-2xl items-center justify-center flex-row shadow-lg shadow-[#D34524]/20 active:bg-[#E54F2C] ${
                loading || preview.excedeSaldoTotal ? 'bg-[#D34524]/50' : 'bg-[#D34524]'
              }`}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <View className="flex-row items-center justify-center gap-2">
                  <Check size={18} color="#FFFFFF" strokeWidth={2.5} />
                  <Text className="text-white text-[15px] font-bold tracking-wide">
                    Confirmar pago de {formatCOP(montoNum)}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </Animated.View>

        {/* Modal de Fecha de Recepción */}
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
