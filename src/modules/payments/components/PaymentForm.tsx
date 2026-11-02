import React, { useState, useMemo } from 'react'
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
  FileText,
} from 'lucide-react-native'
import { CreatePaymentDTO, PaymentMethod } from '../types'
import { LoanWithDetails } from '../../loans/types'
import { formatCOP, parseCOP } from '../../../shared/utils/currency'
import { getInitials } from '../../../shared/utils/initials'
import { getSafeBottomInset } from '../../../shared/utils/responsive'
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
  const totalInteresEsperado = cuotas.reduce((acc, c) => acc + (c.interes_esperado || 0), 0)
  const totalInteresPagado = cuotas.reduce((acc, c) => acc + (c.interes_pagado || 0), 0)
  const interesPendienteTotal = Math.max(0, totalInteresEsperado - totalInteresPagado)
  const saldoExigibleTotal = capitalPendiente + interesPendienteTotal

  // Cuota activa más próxima
  const proximaCuota = cuotas.find((c) => !c.esta_liquidada) || cuotas[0]
  const interesProximaCuota = proximaCuota
    ? Math.max(0, (proximaCuota.interes_esperado || 0) - (proximaCuota.interes_pagado || 0))
    : 0
  const capitalProximaCuota = proximaCuota
    ? Math.max(0, (proximaCuota.capital_esperado || 0) - (proximaCuota.capital_pagado || 0))
    : 0
  const valorProximaCuota = interesProximaCuota + capitalProximaCuota

  // Form states
  const [montoText, setMontoText] = useState<string>('')
  const [metodoPago, setMetodoPago] = useState<PaymentMethod>('efectivo')
  const [notas, setNotas] = useState<string>('')

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

  const handleQuickAmount = (val: number) => {
    setMontoText(val.toString())
    if (montoError) setMontoError(null)
  }

  const validate = (): boolean => {
    let valid = true
    setMontoError(null)
    setFormError(null)

    if (!montoNum || montoNum <= 0) {
      setMontoError('Ingresa un monto mayor a 0.')
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
      })
      router.back()
    } catch (err: any) {
      setFormError(err.message || 'Error al registrar el pago.')
    }
  }

  return (
    <View style={{ paddingTop: Math.max(insets.top, 12) }} className="flex-1 bg-[#060709]">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
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

          {formError && <ErrorMessage message={formError} onRetry={() => setFormError(null)} />}

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
                    #{shortCode} · {loan.tipo_amortizacion === 'solo_interes' ? 'Solo interés' : loan.tipo_amortizacion === 'pago_unico' ? 'Pago único' : 'Cuotas fijas'}
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
                  Interés: <Text className="text-[#FF7854] font-mono">{formatCOP(interesPendienteTotal)}</Text>
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
                  montoError ? 'border-[#FB3758]' : 'border-[#232433]'
                }`}
                style={{ height: 52 }}
              >
                <DollarSign size={18} color="#FF7854" />
                <TextInput
                  value={montoText}
                  onChangeText={(val) => {
                    const clean = val.replace(/[^0-9]/g, '')
                    setMontoText(clean)
                    if (montoError) setMontoError(null)
                  }}
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
                      className={`flex-1 p-2.5 rounded-2xl border items-center justify-center flex-row gap-1.5 ${
                        isSelected
                          ? 'bg-[#D34524]/20 border-[#D34524]'
                          : 'bg-[#0A0B10] border-[#232433] active:border-zinc-700'
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
              disabled={loading}
              style={{ height: 52 }}
              className={`w-full rounded-2xl items-center justify-center flex-row shadow-lg shadow-[#D34524]/20 ${
                loading ? 'bg-[#D34524]/60' : 'bg-[#D34524] active:bg-[#E54F2C]'
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

