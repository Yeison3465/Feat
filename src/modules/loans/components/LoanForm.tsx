import React, { useState, useEffect, useMemo, useRef } from 'react'
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import Animated, { useReducedMotion } from 'react-native-reanimated'
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
import { AmortizationType, CreateLoanDTO, LoanConditionsSnapshot, LoanWithDetails } from '../types'
import { formatCOP, parseCOP } from '../../../shared/utils/currency'
import { addMonthsISO, formatDateLong, todayISO } from '../../../shared/utils/dates'
import { getSafeBottomInset } from '../../../shared/utils/responsive'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { DatePickerModal } from '../../../shared/components/DatePickerModal'
import { AnimatedPressable } from '../../../shared/components/AnimatedPressable'
import { Accordion, AccordionChevron } from '../../../shared/ui/Accordion'
import { AppText } from '../../../shared/ui/AppText'
import { Avatar } from '../../../shared/ui/Avatar'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { Chip } from '../../../shared/ui/Chip'
import { Field } from '../../../shared/ui/Field'
import { Toggle } from '../../../shared/ui/Toggle'
import { screenEnter } from '../../../shared/motion'
import { haptic } from '../../../shared/haptics'
import { colors, fonts } from '../../../shared/theme/tokens'
import { BorrowerPickerModal } from './BorrowerPickerModal'

interface LoanFormProps {
  readonly onSubmit: (data: CreateLoanDTO) => Promise<void>
  readonly loading: boolean
  readonly preselectedPersonId?: string
  /** Si se pasa, el formulario edita este préstamo en lugar de crear uno nuevo */
  readonly initialData?: LoanWithDetails
}

const MODALITIES: ReadonlyArray<{ id: AmortizationType; label: string; desc: string }> = [
  { id: 'solo_interes', label: 'Solo interés', desc: 'Réditos mensuales' },
  { id: 'pago_unico', label: 'Pago único', desc: 'Todo al vencer' },
  { id: 'cuotas_fijas', label: 'Cuotas fijas', desc: 'Amortización fija' },
]

// Etiqueta de sección (misma jerarquía que las etiquetas de Field)
const Label: React.FC<{ readonly children: React.ReactNode }> = ({ children }) => (
  <Text style={{ color: colors.warm, fontFamily: fonts.medium, fontSize: 14 }}>{children}</Text>
)

const FieldError: React.FC<{ readonly message: string }> = ({ message }) => (
  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
    <AlertCircle size={13} color={colors.dangerSoft} style={{ marginTop: 2 }} />
    <Text style={{ flex: 1, color: colors.dangerSoft, fontFamily: fonts.regular, fontSize: 12, lineHeight: 16 }}>{message}</Text>
  </View>
)

export const LoanForm: React.FC<LoanFormProps> = ({
  onSubmit,
  loading,
  preselectedPersonId,
  initialData,
}) => {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const reduced = useReducedMotion()
  const { people } = usePeople()
  const { settings } = useSettings()
  const isEditing = Boolean(initialData)
  const initialSnapshot = initialData?.resumen_condiciones as unknown as LoanConditionsSnapshot | undefined
  // En edición, la persona original conserva la tasa pactada; solo un cambio de persona la recalcula
  const initialPersonIdRef = useRef(initialData?.persona_id)

  // Estados del formulario
  const [selectedPersonId, setSelectedPersonId] = useState<string>(
    initialData?.persona_id ?? preselectedPersonId ?? ''
  )
  const [showBorrowerModal, setShowBorrowerModal] = useState<boolean>(false)
  const [showDesembolsoPicker, setShowDesembolsoPicker] = useState<boolean>(false)
  const [showVencimientoPicker, setShowVencimientoPicker] = useState<boolean>(false)
  const [explainOpen, setExplainOpen] = useState<boolean>(false)
  const [done, setDone] = useState<boolean>(false)
  const backTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (backTimer.current) clearTimeout(backTimer.current)
    },
    []
  )

  const [capitalText, setCapitalText] = useState<string>(
    initialData ? String(initialData.capital_original) : ''
  )
  const [amortizationType, setAmortizationType] = useState<AmortizationType>(
    initialData?.tipo_amortizacion ?? 'solo_interes'
  )
  const [numeroCuotasText, setNumeroCuotasText] = useState<string>(
    String(initialSnapshot?.numero_cuotas ?? initialData?.cuotas?.length ?? 1)
  )
  const [tasaMensualText, setTasaMensualText] = useState<string>(
    initialData
      ? String(initialData.tasa_mensual)
      : settings?.tasa_mensual_defecto?.toString() ?? '20'
  )
  const [isZeroRateOverride, setIsZeroRateOverride] = useState<boolean>(initialData?.tasa_mensual === 0)
  const [notas, setNotas] = useState<string>('')

  // Fechas (ISO YYYY-MM-DD)
  const todayStr = useMemo(() => todayISO(), [])

  const [fechaDesembolso, setFechaDesembolso] = useState<string>(
    initialData?.fecha_desembolso ?? todayStr
  )
  const [fechaPrimerVencimiento, setFechaPrimerVencimiento] = useState<string>(
    initialData?.fecha_primer_vencimiento ?? addMonthsISO(todayStr, 1)
  )

  // Al elegir la fecha de inicio, el 1.er vencimiento pasa al mismo día del mes siguiente
  // (ej. 3 dic → 3 ene; 31 ene → 28/29 feb)
  const handleSelectDesembolso = (date: string) => {
    setFechaDesembolso(date)
    setFechaPrimerVencimiento(addMonthsISO(date, 1))
    if (vencimientoError) setVencimientoError(null)
  }

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
    if (isEditing) return
    if (settings?.tasa_mensual_defecto !== undefined && !selectedPerson?.exento_interes_ordinario) {
      setTasaMensualText((prev) =>
        prev === '0' || prev === '' ? settings.tasa_mensual_defecto.toString() : prev
      )
    }
  }, [settings, selectedPerson])

  // Ajustar tasa al cambiar de persona si está exenta de interés
  useEffect(() => {
    if (isEditing && selectedPerson?.id === initialPersonIdRef.current) return
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
    } else if (fechaPrimerVencimiento < fechaDesembolso) {
      setVencimientoError('El 1.er vencimiento no puede ser anterior a la fecha del préstamo.')
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
      // Confirmación breve (check verde) antes de volver
      haptic('success')
      setDone(true)
      backTimer.current = setTimeout(() => router.back(), 900)
    } catch (err: any) {
      setFormError(err.message || (isEditing ? 'Error al guardar el préstamo.' : 'Error al crear el préstamo.'))
    }
  }

  const explanation =
    amortizationType === 'solo_interes'
      ? {
          title: 'Solo interés (Réditos periódicos):',
          body: 'El prestatario paga periódicamente solo el rendimiento generado. El capital original se mantiene intacto y se devuelve al final del préstamo o mediante abonos directos a capital.',
        }
      : amortizationType === 'pago_unico'
        ? {
            title: 'Pago único (Todo al vencimiento):',
            body: 'Sin cuotas intermedias. El prestatario devuelve la totalidad del capital prestado más los intereses acumulados en un único pago al llegar la fecha de vencimiento.',
          }
        : {
            title: 'Cuotas fijas (Amortización estructurada):',
            body: `El crédito se divide en ${numeroCuotasNum} cuotas iguales periódicas. Cada cuota abonará una parte del capital prestado y otra parte de los intereses devengados.`,
          }

  const canSubmit = capitalNum > 0

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
            <Chip glass label={isEditing ? 'Editar Préstamo' : 'Nuevo Préstamo'} />
          </Animated.View>

          {/* Título principal */}
          <Animated.View entering={screenEnter(1, reduced)} style={{ gap: 8, paddingHorizontal: 4 }}>
            <AppText variant="title" accessibilityRole="header" style={{ fontSize: 40, lineHeight: 42, letterSpacing: -1.8 }}>
              {isEditing ? 'Editar préstamo' : 'Crear préstamo'}
            </AppText>
            <AppText variant="body">
              {isEditing
                ? 'Al guardar se regenera el calendario de cuotas con las nuevas condiciones'
                : 'Desembolso en pesos colombianos y congelamiento de condiciones'}
            </AppText>
          </Animated.View>

          {formError && <ErrorMessage message={formError} onRetry={() => setFormError(null)} />}

          <Animated.View entering={screenEnter(2, reduced)} style={{ gap: 28 }}>
            {/* Prestatario */}
            <View style={{ gap: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Text style={{ color: colors.warm, fontFamily: fonts.medium, fontSize: 14 }}>
                  Prestatario <Text style={{ color: colors.danger }}>*</Text>
                </Text>
                <Text style={{ color: colors.muted2, fontFamily: fonts.regular, fontSize: 12 }}>Obligatorio</Text>
              </View>

              {people.length === 0 ? (
                <Card variant="ink" style={{ padding: 20, alignItems: 'center', gap: 12 }}>
                  <AppText variant="lbl" style={{ textAlign: 'center', lineHeight: 18 }}>
                    Aún no tienes personas registradas en tu directorio.
                  </AppText>
                  <Button label="+ Crear persona" size="sm" onPress={() => router.push('/personas/crear')} />
                </Card>
              ) : (
                <AnimatedPressable
                  onPress={() => setShowBorrowerModal(true)}
                  accessibilityRole="button"
                  accessibilityLabel={selectedPerson ? `Prestatario: ${selectedPerson.nombre}. Cambiar` : 'Seleccionar prestatario'}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      padding: 12,
                      borderRadius: 24,
                      backgroundColor: colors.card,
                      borderWidth: 1,
                      borderColor: personError ? colors.danger : colors.line,
                    }}
                  >
                    {selectedPerson ? (
                      <Avatar name={selectedPerson.nombre} size={48} />
                    ) : (
                      <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.card2, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' }}>
                        <User size={20} color={colors.muted2} />
                      </View>
                    )}
                    <View style={{ flex: 1, gap: 3 }}>
                      {selectedPerson ? (
                        <>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <Text numberOfLines={1} style={{ flexShrink: 1, color: colors.warm, fontFamily: fonts.medium, fontSize: 15 }}>
                              {selectedPerson.nombre}
                            </Text>
                            {selectedPerson.exento_interes_ordinario && (
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, height: 22, paddingHorizontal: 8, borderRadius: 999, backgroundColor: 'rgba(242,196,109,0.14)' }}>
                                <ShieldCheck size={11} color={colors.warn} />
                                <Text style={{ color: colors.warn, fontFamily: fonts.medium, fontSize: 11 }}>0% Exento</Text>
                              </View>
                            )}
                          </View>
                          <Text numberOfLines={1} style={{ color: colors.muted2, fontFamily: fonts.regular, fontSize: 13 }}>
                            {selectedPerson.telefono || 'Sin teléfono registrado'}
                          </Text>
                        </>
                      ) : (
                        <>
                          <Text style={{ color: colors.warm, fontFamily: fonts.medium, fontSize: 15 }}>
                            Toca para seleccionar prestatario
                          </Text>
                          <Text style={{ color: colors.muted2, fontFamily: fonts.regular, fontSize: 13 }}>
                            Buscar en el directorio privado...
                          </Text>
                        </>
                      )}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 14, borderRadius: 999, backgroundColor: colors.card2 }}>
                      <Search size={14} color={colors.warm} />
                      <Text style={{ color: colors.warm, fontFamily: fonts.medium, fontSize: 13 }}>
                        {selectedPerson ? 'Cambiar' : 'Buscar'}
                      </Text>
                    </View>
                  </View>
                </AnimatedPressable>
              )}

              {personError && <FieldError message={personError} />}

              {selectedPerson?.exento_interes_ordinario && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 18, backgroundColor: 'rgba(242,196,109,0.10)' }}>
                  <ShieldCheck size={16} color={colors.warn} />
                  <Text style={{ flex: 1, color: colors.warn, fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 }}>
                    Persona exenta de intereses: Tasa ajustada automáticamente a 0%.
                  </Text>
                </View>
              )}
            </View>

            {/* Capital original */}
            <View style={{ gap: 12 }}>
              <Field
                label="Capital original a desembolsar"
                value={capitalText}
                onChangeText={(val) => {
                  const clean = val.replace(/[^0-9]/g, '')
                  setCapitalText(clean)
                  // Avisar en vivo si el monto queda en 0 tras haber escrito algo
                  setCapitalError(
                    clean !== '' && parseCOP(clean) <= 0
                      ? 'Ingresa un monto de capital mayor a 0.'
                      : null
                  )
                }}
                error={capitalError}
                placeholder="0"
                keyboardType="numeric"
                suffix="COP"
                prefix={({ focused, error }) => (
                  <DollarSign size={18} color={error ? colors.danger : focused ? colors.warm : colors.muted2} />
                )}
              />

              {/* Atajos de incremento rápido */}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[500000, 1000000, 2000000].map((increment) => (
                  <AnimatedPressable
                    key={increment}
                    onPress={() => {
                      haptic('selection')
                      addCapital(increment)
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Sumar ${formatCOP(increment)}`}
                    containerStyle={{ flex: 1 }}
                    style={{ height: 44, borderRadius: 999, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text style={{ color: colors.warm, fontFamily: fonts.medium, fontSize: 12 }}>+{formatCOP(increment)}</Text>
                  </AnimatedPressable>
                ))}
              </View>
            </View>

            {/* Modalidad de amortización */}
            <View style={{ gap: 12 }}>
              <Label>Modalidad de pago y cuotas</Label>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {MODALITIES.map((item) => {
                  const isSelected = amortizationType === item.id
                  return (
                    <AnimatedPressable
                      key={item.id}
                      onPress={() => {
                        haptic('selection')
                        setAmortizationType(item.id)
                      }}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                      containerStyle={{ flex: 1 }}
                      style={{
                        minHeight: 68,
                        paddingHorizontal: 6,
                        paddingVertical: 10,
                        borderRadius: 20,
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 3,
                        backgroundColor: isSelected ? colors.warm : colors.card,
                        borderWidth: 1,
                        borderColor: isSelected ? colors.warm : colors.line,
                      }}
                    >
                      <Text
                        style={{
                          color: isSelected ? colors.onLight : colors.warm,
                          fontFamily: fonts.medium,
                          fontSize: 13,
                          textAlign: 'center',
                        }}
                      >
                        {item.label}
                      </Text>
                      <Text
                        style={{
                          color: isSelected ? colors.onLightMuted : colors.muted2,
                          fontFamily: fonts.regular,
                          fontSize: 11,
                          textAlign: 'center',
                        }}
                      >
                        {item.desc}
                      </Text>
                    </AnimatedPressable>
                  )
                })}
              </View>

              {/* Explicación de la modalidad elegida, desplegable */}
              <Card variant="ink" style={{ paddingHorizontal: 16 }}>
                <AnimatedPressable
                  onPress={() => {
                    haptic('selection')
                    setExplainOpen((v) => !v)
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: explainOpen }}
                  accessibilityLabel={explanation.title}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52 }}
                >
                  <HelpCircle size={16} color={colors.muted2} />
                  <Text style={{ flex: 1, color: colors.warm, fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 }}>
                    {explanation.title}
                  </Text>
                  <AccordionChevron open={explainOpen} />
                </AnimatedPressable>
                <Accordion open={explainOpen}>
                  <Text style={{ color: '#B4B4B9', fontFamily: fonts.regular, fontSize: 13, lineHeight: 20, paddingBottom: 16 }}>
                    {explanation.body}
                  </Text>
                </Accordion>
              </Card>
            </View>

            {/* Número de cuotas (solo si cuotas fijas) */}
            {amortizationType === 'cuotas_fijas' && (
              <Field
                label="Número de cuotas mensuales"
                value={numeroCuotasText}
                onChangeText={(val) => setNumeroCuotasText(val.replace(/[^0-9]/g, ''))}
                placeholder="3"
                keyboardType="number-pad"
                suffix="cuotas"
              />
            )}

            {/* Tasa de interés mensual */}
            <View style={{ gap: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Label>Tasa ordinaria mensual (% mes)</Label>
                </View>
                <AnimatedPressable
                  onPress={() => {
                    const val = !isZeroRateOverride
                    haptic('selection')
                    setIsZeroRateOverride(val)
                    if (val) {
                      setTasaMensualText('0')
                    } else {
                      setTasaMensualText(settings?.tasa_mensual_defecto?.toString() ?? '20')
                    }
                  }}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: isZeroRateOverride }}
                  accessibilityLabel="Tasa 0% especial"
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 }}
                >
                  <Text style={{ color: colors.muted, fontFamily: fonts.regular, fontSize: 12 }}>Tasa 0% especial</Text>
                  <Toggle value={isZeroRateOverride} />
                </AnimatedPressable>
              </View>

              {!isZeroRateOverride ? (
                <Field
                  value={tasaMensualText}
                  onChangeText={(val) => setTasaMensualText(val.replace(/[^0-9.]/g, ''))}
                  placeholder={settings?.tasa_mensual_defecto?.toString() ?? '20'}
                  keyboardType="numeric"
                  suffix="% mensual"
                  accessibilityLabel="Tasa ordinaria mensual"
                  prefix={({ focused }) => <Percent size={16} color={focused ? colors.warm : colors.muted2} />}
                />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 20, backgroundColor: 'rgba(242,196,109,0.10)', borderWidth: 1, borderColor: 'rgba(242,196,109,0.28)' }}>
                  <ShieldCheck size={16} color={colors.warn} />
                  <Text style={{ flex: 1, color: colors.warn, fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 }}>
                    Préstamo pactado a tasa 0% (sin intereses ordinarios).
                  </Text>
                </View>
              )}
            </View>

            {/* Fechas de operación */}
            <View style={{ gap: 12 }}>
              <Label>Fechas de operación (Calendario)</Label>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <AnimatedPressable
                  onPress={() => setShowDesembolsoPicker(true)}
                  accessibilityRole="button"
                  accessibilityLabel={`Fecha del préstamo: ${formatDateLong(fechaDesembolso)}`}
                  containerStyle={{ flex: 1 }}
                  style={{ gap: 8, padding: 14, borderRadius: 22, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line }}
                >
                  <Text style={{ color: colors.muted2, fontFamily: fonts.regular, fontSize: 12 }}>Fecha del préstamo</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Calendar size={15} color={colors.warm} />
                    <Text style={{ flexShrink: 1, color: colors.warm, fontFamily: fonts.medium, fontSize: 13 }}>
                      {formatDateLong(fechaDesembolso)}
                    </Text>
                  </View>
                  <Text style={{ color: colors.muted2, fontFamily: fonts.regular, fontSize: 11 }}>Toca para cambiar</Text>
                </AnimatedPressable>

                <AnimatedPressable
                  onPress={() => setShowVencimientoPicker(true)}
                  accessibilityRole="button"
                  accessibilityLabel={`1.er Vencimiento: ${formatDateLong(fechaPrimerVencimiento)}`}
                  containerStyle={{ flex: 1 }}
                  style={{
                    gap: 8,
                    padding: 14,
                    borderRadius: 22,
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: vencimientoError ? colors.danger : colors.line,
                  }}
                >
                  <Text style={{ color: colors.muted2, fontFamily: fonts.regular, fontSize: 12 }}>1.er Vencimiento</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Calendar size={15} color={vencimientoError ? colors.danger : colors.warm} />
                    <Text style={{ flexShrink: 1, color: colors.warm, fontFamily: fonts.medium, fontSize: 13 }}>
                      {formatDateLong(fechaPrimerVencimiento)}
                    </Text>
                  </View>
                  <Text style={{ color: colors.muted2, fontFamily: fonts.regular, fontSize: 11 }}>Toca para cambiar</Text>
                </AnimatedPressable>
              </View>

              <Text style={{ color: colors.muted2, fontFamily: fonts.regular, fontSize: 12, lineHeight: 18 }}>
                Al cambiar la fecha del préstamo, el 1.er vencimiento se ajusta al mismo día del mes siguiente. Puedes modificarlo después si lo necesitas.
              </Text>

              {vencimientoError && <FieldError message={vencimientoError} />}
            </View>

            {/* Notas opcionales */}
            <Field
              label="Notas privadas o garantía (opcional)"
              value={notas}
              onChangeText={setNotas}
              placeholder="Ej. Prestatario de confianza, moto en respaldo..."
              multiline
              numberOfLines={3}
            />
          </Animated.View>

          {/* Resumen de la primera obligación y confirmación explícita */}
          <Animated.View entering={screenEnter(3, reduced)} style={{ gap: 12 }}>
            <AppText variant="lbl" tone="muted2" style={{ textTransform: 'uppercase', letterSpacing: 1.2 }}>
              Resumen estimado 1.ª obligación
            </AppText>
            <Card variant="inkRed" style={{ padding: 20, gap: 6 }}>
              <Text style={{ color: colors.muted, fontFamily: fonts.regular, fontSize: 13 }}>
                {amortizationType === 'solo_interes'
                  ? 'Interés a pagar en 1.er corte'
                  : 'Total exigible en 1.er vencimiento'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={{ flexShrink: 1, color: colors.warm, fontFamily: fonts.medium, fontSize: 36, letterSpacing: -1.4 }}
                >
                  {formatCOP(totalEstimadoPrimeraObligacion)}
                </Text>
                <Text style={{ color: colors.muted2, fontFamily: fonts.medium, fontSize: 13 }}>COP</Text>
              </View>
              <Text style={{ color: colors.muted2, fontFamily: fonts.regular, fontSize: 12, marginTop: 4 }}>
                Capital original: {formatCOP(capitalNum)} · Tasa: {tasaNum}% mensual
              </Text>
            </Card>

            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line }}>
              <AlertCircle size={16} color={colors.muted} style={{ marginTop: 2 }} />
              <Text style={{ flex: 1, color: colors.muted, fontFamily: fonts.regular, fontSize: 12, lineHeight: 18 }}>
                <Text style={{ color: colors.warm, fontFamily: fonts.medium }}>Confirmación explícita:</Text> Revisa el capital, fechas y tasa antes de confirmar. Al confirmar se registrará el desembolso en tu cartera privada y se programará el cobro inicial.
              </Text>
            </View>
          </Animated.View>
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
            label={done ? (isEditing ? 'Cambios guardados' : 'Préstamo creado') : isEditing ? 'Guardar cambios' : 'Confirmar y crear préstamo'}
            size="lg"
            variant={done ? 'success' : 'solid'}
            onPress={handleSubmit}
            loading={loading}
            disabled={done || !canSubmit}
            icon={<Check size={16} color={done ? '#06220F' : '#000000'} strokeWidth={2.5} />}
            style={{ width: '100%', ...(done ? { opacity: 1 } : null) }}
          />
        </View>

        {/* Modal de búsqueda y selección de prestatario */}
        <BorrowerPickerModal
          visible={showBorrowerModal}
          onClose={() => setShowBorrowerModal(false)}
          selectedPersonId={selectedPersonId}
          onSelectPerson={(person) => {
            setSelectedPersonId(person.id)
            if (personError) setPersonError(null)
          }}
        />

        {/* Modales de selección visual de fecha */}
        <DatePickerModal
          visible={showDesembolsoPicker}
          onClose={() => setShowDesembolsoPicker(false)}
          selectedDate={fechaDesembolso}
          onSelectDate={handleSelectDesembolso}
          title="Fecha del préstamo"
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
