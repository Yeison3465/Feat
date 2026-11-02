import React, { useState, useEffect, useMemo } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Switch,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  Percent,
  User,
  ShieldCheck,
  Check,
  AlertCircle,
  HelpCircle,
  Search,
} from 'lucide-react-native'
import { usePeople } from '../../people/hooks/usePeople'
import { useSettings } from '../../settings/hooks/useSettings'
import { AmortizationType, CreateLoanDTO } from '../types'
import { formatCOP, formatCOPFull, parseCOP } from '../../../shared/utils/currency'
import { getInitials } from '../../../shared/utils/initials'
import { getSafeBottomInset } from '../../../shared/utils/responsive'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { DatePickerModal } from '../../../shared/components/DatePickerModal'
import { BorrowerPickerModal } from './BorrowerPickerModal'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'

interface LoanFormProps {
  readonly onSubmit: (data: CreateLoanDTO) => Promise<void>
  readonly loading: boolean
  readonly preselectedPersonId?: string
}

export const LoanForm: React.FC<LoanFormProps> = ({
  onSubmit,
  loading,
  preselectedPersonId,
}) => {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { people } = usePeople()
  const { settings } = useSettings()

  // Estados del formulario
  const [selectedPersonId, setSelectedPersonId] = useState<string>(preselectedPersonId || '')
  const [showBorrowerModal, setShowBorrowerModal] = useState<boolean>(false)
  const [showDesembolsoPicker, setShowDesembolsoPicker] = useState<boolean>(false)
  const [showVencimientoPicker, setShowVencimientoPicker] = useState<boolean>(false)

  const [capitalText, setCapitalText] = useState<string>('')
  const [amortizationType, setAmortizationType] = useState<AmortizationType>('solo_interes')
  const [numeroCuotasText, setNumeroCuotasText] = useState<string>('1')
  const [tasaMensualText, setTasaMensualText] = useState<string>(
    settings?.tasa_mensual_defecto?.toString() ?? '20'
  )
  const [isZeroRateOverride, setIsZeroRateOverride] = useState<boolean>(false)
  const [notas, setNotas] = useState<string>('')

  // Fechas (ISO YYYY-MM-DD)
  const todayStr = useMemo(() => {
    const d = new Date()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${d.getFullYear()}-${m}-${day}`
  }, [])

  const nextMonthStr = useMemo(() => {
    const d = new Date()
    d.setMonth(d.getMonth() + 1)
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${d.getFullYear()}-${m}-${day}`
  }, [])

  const [fechaDesembolso, setFechaDesembolso] = useState<string>(todayStr)
  const [fechaPrimerVencimiento, setFechaPrimerVencimiento] = useState<string>(nextMonthStr)

  // Errores de validación
  const [personError, setPersonError] = useState<string | null>(null)
  const [capitalError, setCapitalError] = useState<string | null>(null)
  const [vencimientoError, setVencimientoError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  // Detectar persona seleccionada y su estado de exención
  const selectedPerson = useMemo(
    () => people.find((p) => p.id === selectedPersonId),
    [people, selectedPersonId]
  )

  // Sincronizar tasa mensual con la configuración global una vez cargada
  useEffect(() => {
    if (settings?.tasa_mensual_defecto !== undefined && !selectedPerson?.exento_interes_ordinario) {
      setTasaMensualText((prev) =>
        prev === '0' || prev === '' ? settings.tasa_mensual_defecto.toString() : prev
      )
    }
  }, [settings, selectedPerson])

  // Ajustar tasa al cambiar de persona si está exenta de interés
  useEffect(() => {
    if (selectedPerson?.exento_interes_ordinario) {
      setTasaMensualText('0')
      setIsZeroRateOverride(true)
    } else {
      setIsZeroRateOverride(false)
      setTasaMensualText((prev) =>
        prev === '0' || prev === ''
          ? (settings?.tasa_mensual_defecto?.toString() ?? '20')
          : prev
      )
    }
  }, [selectedPerson, settings])

  // Cálculos preliminares en vivo
  const capitalNum = parseCOP(capitalText)
  const tasaNum = isZeroRateOverride ? 0 : parseFloat(tasaMensualText) || 0
  const numeroCuotasNum = Math.max(1, parseInt(numeroCuotasText, 10) || 1)

  const interesMensualEstimado = Math.round(capitalNum * (tasaNum / 100))

  const totalEstimadoPrimeraObligacion = useMemo(() => {
    if (amortizationType === 'solo_interes') {
      return interesMensualEstimado
    }
    if (amortizationType === 'pago_unico') {
      return capitalNum + interesMensualEstimado
    }
    // Cuotas fijas simple
    const capitalCuota = Math.round(capitalNum / numeroCuotasNum)
    return capitalCuota + interesMensualEstimado
  }, [capitalNum, interesMensualEstimado, amortizationType, numeroCuotasNum])

  const addCapital = (amount: number) => {
    const current = parseCOP(capitalText)
    setCapitalText((current + amount).toString())
    if (capitalError) setCapitalError(null)
  }

  const validate = (): boolean => {
    let valid = true
    setPersonError(null)
    setCapitalError(null)
    setVencimientoError(null)
    setFormError(null)

    if (!selectedPersonId) {
      setPersonError('Debes seleccionar un prestatario.')
      valid = false
    }

    if (!capitalNum || capitalNum <= 0) {
      setCapitalError('Ingresa un monto de capital mayor a 0.')
      valid = false
    }

    if (!fechaPrimerVencimiento.trim()) {
      setVencimientoError('La fecha de vencimiento es obligatoria.')
      valid = false
    }

    return valid
  }

  const handleSubmit = async () => {
    if (!validate()) return

    try {
      await onSubmit({
        persona_id: selectedPersonId,
        capital_original: capitalNum,
        tasa_mensual: tasaNum,
        tipo_amortizacion: amortizationType,
        numero_cuotas: amortizationType === 'cuotas_fijas' ? numeroCuotasNum : 1,
        fecha_desembolso: fechaDesembolso,
        fecha_primer_vencimiento: fechaPrimerVencimiento,
        notas: notas.trim() || null,
      })
      router.back()
    } catch (err: any) {
      setFormError(err.message || 'Error al crear el préstamo.')
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
          {/* Cabecera con Cancelar */}
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
              Nuevo Préstamo
            </Text>
          </Animated.View>

          {/* Título Principal */}
          <Animated.View entering={FadeInDown.delay(50).duration(280)} className="mb-6">
            <Text className="text-white text-3xl font-bold tracking-tight">
              Crear préstamo
            </Text>
            <Text className="text-zinc-400 text-xs mt-1">
              Desembolso en pesos colombianos y congelamiento de condiciones
            </Text>
          </Animated.View>

          {formError && <ErrorMessage message={formError} onRetry={() => setFormError(null)} />}

          {/* Formulario en Tarjeta */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(300).springify()}
            className="bg-[#12131A] border border-[#1E2030] rounded-3xl p-5 mb-5 shadow-2xl shadow-black"
          >
            {/* Campo 1: Seleccionar Prestatario con Buscador */}
            <View className="mb-5">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-zinc-300 text-xs font-medium ml-1">
                  Prestatario <Text className="text-[#FF7854]">*</Text>
                </Text>
                <Text className="text-zinc-500 text-[10px] uppercase font-semibold">Obligatorio</Text>
              </View>

              {people.length === 0 ? (
                <View className="bg-[#0A0B10] border border-[#232433] rounded-2xl p-4 items-center">
                  <Text className="text-zinc-400 text-xs text-center mb-2">
                    Aún no tienes personas registradas en tu directorio.
                  </Text>
                  <Pressable
                    onPress={() => router.push('/personas/crear')}
                    className="bg-[#D34524] px-4 py-2 rounded-xl"
                  >
                    <Text className="text-white text-xs font-bold">+ Crear persona</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => setShowBorrowerModal(true)}
                  className={`p-3.5 rounded-2xl border flex-row items-center justify-between transition-colors ${
                    personError
                      ? 'border-[#FB3758] bg-[#170E12]'
                      : 'border-[#232433] bg-[#0A0B10] active:bg-[#141520]'
                  }`}
                >
                  {selectedPerson ? (
                    <View className="flex-row items-center flex-1 mr-2">
                      <View className="w-10 h-10 rounded-xl bg-[#29161A] border border-[#D34524] items-center justify-center mr-3">
                        <Text className="text-sm font-bold font-mono text-[#FF7854]">
                          {getInitials(selectedPerson.nombre)}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center gap-1.5 flex-wrap">
                          <Text className="text-white text-sm font-semibold" numberOfLines={1}>
                            {selectedPerson.nombre}
                          </Text>
                          {selectedPerson.exento_interes_ordinario && (
                            <View className="bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded-md flex-row items-center">
                              <ShieldCheck size={10} color="#F59E0B" />
                              <Text className="text-amber-400 text-[9px] font-bold ml-0.5">
                                0% Exento
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-zinc-500 text-xs mt-0.5" numberOfLines={1}>
                          {selectedPerson.telefono || 'Sin teléfono registrado'}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View className="flex-row items-center flex-1">
                      <View className="w-10 h-10 rounded-xl bg-[#161722] border border-[#232433] items-center justify-center mr-3">
                        <User size={18} color="#6B7280" />
                      </View>
                      <View>
                        <Text className="text-zinc-300 text-sm font-medium">
                          Toca para seleccionar prestatario
                        </Text>
                        <Text className="text-zinc-500 text-xs mt-0.5">
                          Buscar en el directorio privado...
                        </Text>
                      </View>
                    </View>
                  )}

                  <View className="flex-row items-center bg-[#151622] border border-[#232433] px-3 py-1.5 rounded-xl ml-2">
                    <Search size={13} color="#FF7854" />
                    <Text className="text-[#FF7854] text-xs font-semibold ml-1.5">
                      {selectedPerson ? 'Cambiar' : 'Buscar'}
                    </Text>
                  </View>
                </Pressable>
              )}

              {personError && (
                <Text className="text-[#FB3758] text-xs mt-1.5 ml-1">{personError}</Text>
              )}

              {selectedPerson?.exento_interes_ordinario && (
                <View className="mt-2.5 bg-amber-500/10 border border-amber-500/25 p-2.5 rounded-xl flex-row items-center">
                  <ShieldCheck size={16} color="#F59E0B" />
                  <Text className="text-amber-400 text-xs font-medium ml-2 flex-1">
                    Persona exenta de intereses: Tasa ajustada automáticamente a 0%.
                  </Text>
                </View>
              )}
            </View>

            {/* Campo 2: Capital Original */}
            <View className="mb-5">
              <Text className="text-zinc-300 text-xs font-medium mb-2 ml-1">
                Capital original a desembolsar
              </Text>
              <View
                className={`flex-row items-center px-4 bg-[#0A0B10] rounded-2xl border ${
                  capitalError ? 'border-[#FB3758]' : 'border-[#232433]'
                }`}
                style={{ height: 52 }}
              >
                <DollarSign size={18} color="#FF7854" />
                <TextInput
                  value={capitalText}
                  onChangeText={(val) => {
                    const clean = val.replace(/[^0-9]/g, '')
                    setCapitalText(clean)
                    if (capitalError) setCapitalError(null)
                  }}
                  placeholder="0"
                  placeholderTextColor="#4B5563"
                  keyboardType="numeric"
                  className="flex-1 ml-2 text-white text-lg font-mono font-bold"
                />
                <Text className="text-zinc-500 text-xs font-mono font-semibold ml-2">COP</Text>
              </View>
              {capitalError && (
                <Text className="text-[#FB3758] text-xs mt-1.5 ml-1">{capitalError}</Text>
              )}

              {/* Botones de incremento rápido */}
              <View className="flex-row gap-2 mt-2.5">
                {[500000, 1000000, 2000000].map((increment) => (
                  <Pressable
                    key={increment}
                    onPress={() => addCapital(increment)}
                    className="flex-1 py-1.5 bg-[#0A0B10] border border-[#232433] rounded-xl items-center active:bg-[#1E2030]"
                  >
                    <Text className="text-zinc-300 text-[11px] font-mono">
                      +{formatCOP(increment)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Campo 3: Modalidad de Amortización con Explicación Detallada */}
            <View className="mb-5">
              <Text className="text-zinc-300 text-xs font-medium mb-2 ml-1">
                Modalidad de pago y cuotas
              </Text>
              <View className="flex-row gap-2">
                {[
                  { id: 'solo_interes', label: 'Solo interés', desc: 'Réditos mensuales' },
                  { id: 'pago_unico', label: 'Pago único', desc: 'Todo al vencer' },
                  { id: 'cuotas_fijas', label: 'Cuotas fijas', desc: 'Amortización fija' },
                ].map((item) => {
                  const isSelected = amortizationType === item.id
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => setAmortizationType(item.id as AmortizationType)}
                      className={`flex-1 p-2.5 rounded-2xl border items-center justify-center ${
                        isSelected
                          ? 'bg-[#D34524]/20 border-[#D34524]'
                          : 'bg-[#0A0B10] border-[#232433] active:border-zinc-700'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold text-center ${
                          isSelected ? 'text-white' : 'text-zinc-300'
                        }`}
                      >
                        {item.label}
                      </Text>
                      <Text className="text-zinc-500 text-[10px] text-center mt-0.5">
                        {item.desc}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>

              {/* Ficha Explicativa Contextual de la Modalidad Elegida */}
              <View className="mt-2.5 p-3 rounded-2xl bg-[#0A0B10] border border-[#1E2030]">
                {amortizationType === 'solo_interes' && (
                  <View className="flex-row items-start gap-2">
                    <HelpCircle size={15} color="#FF7854" style={{ marginTop: 2 }} />
                    <View className="flex-1">
                      <Text className="text-white text-xs font-bold mb-0.5">
                        Solo interés (Réditos periódicos):
                      </Text>
                      <Text className="text-zinc-400 text-xs leading-4">
                        El prestatario paga periódicamente solo el rendimiento generado. El capital original se mantiene intacto y se devuelve al final del préstamo o mediante abonos directos a capital.
                      </Text>
                    </View>
                  </View>
                )}

                {amortizationType === 'pago_unico' && (
                  <View className="flex-row items-start gap-2">
                    <HelpCircle size={15} color="#FF7854" style={{ marginTop: 2 }} />
                    <View className="flex-1">
                      <Text className="text-white text-xs font-bold mb-0.5">
                        Pago único (Todo al vencimiento):
                      </Text>
                      <Text className="text-zinc-400 text-xs leading-4">
                        Sin cuotas intermedias. El prestatario devuelve la totalidad del capital prestado más los intereses acumulados en un único pago al llegar la fecha de vencimiento.
                      </Text>
                    </View>
                  </View>
                )}

                {amortizationType === 'cuotas_fijas' && (
                  <View className="flex-row items-start gap-2">
                    <HelpCircle size={15} color="#FF7854" style={{ marginTop: 2 }} />
                    <View className="flex-1">
                      <Text className="text-white text-xs font-bold mb-0.5">
                        Cuotas fijas (Amortización estructurada):
                      </Text>
                      <Text className="text-zinc-400 text-xs leading-4">
                        El crédito se divide en {numeroCuotasNum} cuotas iguales periódicas. Cada cuota abonará una parte del capital prestado y otra parte de los intereses devengados.
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Número de cuotas (Solo si cuotas fijas) */}
            {amortizationType === 'cuotas_fijas' && (
              <View className="mb-5">
                <Text className="text-zinc-300 text-xs font-medium mb-2 ml-1">
                  Número de cuotas mensuales
                </Text>
                <View className="flex-row items-center px-4 bg-[#0A0B10] rounded-xl border border-[#232433] h-12">
                  <TextInput
                    value={numeroCuotasText}
                    onChangeText={(val) => setNumeroCuotasText(val.replace(/[^0-9]/g, ''))}
                    placeholder="3"
                    placeholderTextColor="#4B5563"
                    keyboardType="number-pad"
                    className="flex-1 text-white text-sm font-mono"
                  />
                  <Text className="text-zinc-500 text-xs">cuotas</Text>
                </View>
              </View>
            )}

            {/* Campo 4: Tasa de Interés Mensual */}
            <View className="mb-5">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-zinc-300 text-xs font-medium ml-1">
                  Tasa ordinaria mensual (% mes)
                </Text>
                <View className="flex-row items-center">
                  <Text className="text-zinc-400 text-xs mr-2">Tasa 0% especial</Text>
                  <Switch
                    value={isZeroRateOverride}
                    onValueChange={(val) => {
                      setIsZeroRateOverride(val)
                      if (val) {
                        setTasaMensualText('0')
                      } else {
                        setTasaMensualText(
                          settings?.tasa_mensual_defecto?.toString() ?? '20'
                        )
                      }
                    }}
                    trackColor={{ false: '#232433', true: '#D34524' }}
                    thumbColor={isZeroRateOverride ? '#FFFFFF' : '#9CA3AF'}
                  />
                </View>
              </View>

              {!isZeroRateOverride ? (
                <View className="flex-row items-center px-4 bg-[#0A0B10] rounded-xl border border-[#232433] h-12">
                  <Percent size={16} color="#6B7280" />
                  <TextInput
                    value={tasaMensualText}
                    onChangeText={(val) => {
                      const clean = val.replace(/[^0-9.]/g, '')
                      setTasaMensualText(clean)
                    }}
                    placeholder={settings?.tasa_mensual_defecto?.toString() ?? '20'}
                    placeholderTextColor="#4B5563"
                    keyboardType="numeric"
                    className="flex-1 ml-2 text-white text-sm font-mono"
                  />
                  <Text className="text-zinc-500 text-xs font-mono">% mensual</Text>
                </View>
              ) : (
                <View className="bg-[#0A0B10] p-3 rounded-xl border border-amber-500/30 flex-row items-center">
                  <ShieldCheck size={16} color="#F59E0B" />
                  <Text className="text-amber-400 text-xs ml-2 font-medium">
                    Préstamo pactado a tasa 0% (sin intereses ordinarios).
                  </Text>
                </View>
              )}
            </View>

            {/* Fechas de Desembolso y Primer Vencimiento con Selector Visual */}
            <View className="mb-5">
              <Text className="text-zinc-300 text-xs font-medium mb-2 ml-1">
                Fechas de operación (Calendario)
              </Text>

              <View className="flex-row gap-3">
                {/* Selector Desembolso */}
                <Pressable
                  onPress={() => setShowDesembolsoPicker(true)}
                  className="flex-1 bg-[#0A0B10] border border-[#232433] rounded-2xl p-3 active:border-zinc-700"
                >
                  <Text className="text-zinc-500 text-[11px] mb-1 font-medium">
                    Desembolso
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <Calendar size={14} color="#FF7854" />
                    <Text className="text-white text-xs font-bold font-mono">
                      {fechaDesembolso}
                    </Text>
                  </View>
                  <Text className="text-zinc-600 text-[10px] mt-1">Toca para cambiar</Text>
                </Pressable>

                {/* Selector Primer Vencimiento */}
                <Pressable
                  onPress={() => setShowVencimientoPicker(true)}
                  className={`flex-1 bg-[#0A0B10] rounded-2xl p-3 border active:border-zinc-700 ${
                    vencimientoError ? 'border-[#FB3758]' : 'border-[#232433]'
                  }`}
                >
                  <Text className="text-zinc-500 text-[11px] mb-1 font-medium">
                    1.er Vencimiento
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <Calendar size={14} color={vencimientoError ? '#FB3758' : '#FF7854'} />
                    <Text className="text-white text-xs font-bold font-mono">
                      {fechaPrimerVencimiento}
                    </Text>
                  </View>
                  <Text className="text-zinc-600 text-[10px] mt-1">Toca para cambiar</Text>
                </Pressable>
              </View>

              {vencimientoError && (
                <Text className="text-[#FB3758] text-xs mt-1.5 ml-1">{vencimientoError}</Text>
              )}
            </View>

            {/* Notas opcionales */}
            <View className="mb-2">
              <Text className="text-zinc-300 text-xs font-medium mb-2 ml-1">
                Notas privadas o garantía (opcional)
              </Text>
              <View className="px-4 py-2.5 bg-[#0A0B10] rounded-xl border border-[#232433] min-h-[70px]">
                <TextInput
                  value={notas}
                  onChangeText={setNotas}
                  placeholder="Ej. Prestatario de confianza, moto en respaldo..."
                  placeholderTextColor="#4B5563"
                  multiline
                  numberOfLines={2}
                  className="text-white text-xs"
                />
              </View>
            </View>
          </Animated.View>

          {/* Tarjeta de Previsualización y Advertencia Explícita Figma */}
          <Animated.View
            entering={FadeInUp.delay(180).duration(300).springify()}
            className="bg-[#12131A] border border-[#1E2030] rounded-3xl p-5 mb-4 shadow-xl shadow-black"
          >
            <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
              Resumen estimado 1.ª obligación
            </Text>
            <View className="bg-[#0A0B10] border border-[#1C1E2B] rounded-2xl p-4 mb-3">
              <Text className="text-zinc-400 text-xs">
                {amortizationType === 'solo_interes'
                  ? 'Interés a pagar en 1.er corte'
                  : 'Total exigible en 1.er vencimiento'}
              </Text>
              <View className="flex-row items-baseline gap-1.5 mt-0.5">
                <Text className="text-white text-2xl font-extrabold font-mono">
                  {formatCOP(totalEstimadoPrimeraObligacion)}
                </Text>
                <Text className="text-zinc-500 text-xs font-mono">COP</Text>
              </View>
              <Text className="text-zinc-500 text-[11px] mt-1.5">
                Capital original: {formatCOP(capitalNum)} · Tasa: {tasaNum}% mensual
              </Text>
            </View>

            <View className="flex-row items-start gap-2 bg-[#171415] border border-[#3A1F24] p-3 rounded-xl">
              <AlertCircle size={16} color="#FF7854" style={{ marginTop: 2 }} />
              <Text className="text-zinc-400 text-xs flex-1 leading-4">
                <Text className="text-white font-semibold">Confirmación explícita:</Text> Revisa el
                capital, fechas y tasa antes de confirmar. Al confirmar se registrará el desembolso
                en tu cartera privada y se programará el cobro inicial.
              </Text>
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
                    Confirmar y crear préstamo
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </Animated.View>

        {/* Modal de Búsqueda y Selección de Prestatario */}
        <BorrowerPickerModal
          visible={showBorrowerModal}
          onClose={() => setShowBorrowerModal(false)}
          selectedPersonId={selectedPersonId}
          onSelectPerson={(person) => {
            setSelectedPersonId(person.id)
            if (personError) setPersonError(null)
          }}
        />

        {/* Modales de Selección Visual de Fecha */}
        <DatePickerModal
          visible={showDesembolsoPicker}
          onClose={() => setShowDesembolsoPicker(false)}
          selectedDate={fechaDesembolso}
          onSelectDate={setFechaDesembolso}
          title="Fecha de desembolso"
        />

        <DatePickerModal
          visible={showVencimientoPicker}
          onClose={() => setShowVencimientoPicker(false)}
          selectedDate={fechaPrimerVencimiento}
          onSelectDate={(date) => {
            setFechaPrimerVencimiento(date)
            if (vencimientoError) setVencimientoError(null)
          }}
          title="Primer vencimiento"
          minDate={fechaDesembolso}
        />
      </KeyboardAvoidingView>
    </View>
  )
}
