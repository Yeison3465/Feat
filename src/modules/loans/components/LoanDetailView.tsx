import React, { useState } from 'react'
import { View, Text, ScrollView, Linking, ActivityIndicator, StyleSheet } from 'react-native'
import Animated, { useReducedMotion } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  ArrowLeft,
  Phone,
  Lock,
  ChevronRight,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  RotateCcw,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  Pencil,
  Trash2,
  CalendarCheck,
} from 'lucide-react-native'
import { LoanWithDetails, LoanConditionsSnapshot, LoanInstallment } from '../types'
import { LoanMovementItem, PaymentWithDetails } from '../../payments/types'
import { InstallmentCard } from './InstallmentCard'
import { InstallmentDetailModal } from './InstallmentDetailModal'
import { formatCOP } from '../../../shared/utils/currency'
import { formatDateLong } from '../../../shared/utils/dates'
import { getSafeBottomInset } from '../../../shared/utils/responsive'
import { loanHeroImage, tintByTone, tintLocations } from '../../../shared/images'
import { AnimatedPressable } from '../../../shared/components/AnimatedPressable'
import { Accordion, AccordionChevron } from '../../../shared/ui/Accordion'
import { AppText } from '../../../shared/ui/AppText'
import { Avatar } from '../../../shared/ui/Avatar'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { Chip } from '../../../shared/ui/Chip'
import { CountUpText } from '../../../shared/ui/CountUpText'
import { CoverImage } from '../../../shared/ui/CoverImage'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { Segmented } from '../../../shared/ui/Segmented'
import { screenEnter } from '../../../shared/motion'
import { haptic } from '../../../shared/haptics'
import { colors, fonts } from '../../../shared/theme/tokens'

interface LoanDetailViewProps {
  readonly loan: LoanWithDetails
  readonly payments?: PaymentWithDetails[]
  readonly movements?: LoanMovementItem[]
  readonly historyLoading?: boolean
  readonly onEdit?: () => void
  readonly onDelete?: () => void
}

type DetailTab = 'cuotas' | 'pagos' | 'movimientos'
type InstallmentView = 'foto' | 'compacta'

const Hair: React.FC = () => <View style={{ height: 1, backgroundColor: colors.line }} />

// Fila «etiqueta — valor» de los términos congelados
const KvRow: React.FC<{ readonly k: string; readonly v: string; readonly capitalize?: boolean }> = ({ k, v, capitalize }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingVertical: 13 }}>
    <Text style={{ color: colors.muted, fontFamily: fonts.regular, fontSize: 13, flexShrink: 1 }}>{k}</Text>
    <Text style={{ color: colors.warm, fontFamily: fonts.medium, fontSize: 13, textAlign: 'right', textTransform: capitalize ? 'capitalize' : 'none' }}>{v}</Text>
  </View>
)

// Panel de vidrio oscuro sobre la foto del hero
const GlassPanel: React.FC<{ readonly label: string; readonly value: string; readonly sub: string; readonly valueColor?: string }> = ({
  label,
  value,
  sub,
  valueColor = colors.warm,
}) => (
  <View
    style={{
      flex: 1,
      gap: 4,
      padding: 14,
      borderRadius: 22,
      backgroundColor: 'rgba(10,10,11,0.58)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    }}
  >
    <Text style={{ color: '#C4C4C8', fontFamily: fonts.regular, fontSize: 12 }}>{label}</Text>
    <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: valueColor, fontFamily: fonts.semibold, fontSize: 16 }}>
      {value}
    </Text>
    <Text style={{ color: '#9A9AA0', fontFamily: fonts.regular, fontSize: 12 }}>{sub}</Text>
  </View>
)

const SectionHead: React.FC<{ readonly title: string; readonly sub?: string; readonly right?: string }> = ({ title, sub, right }) => (
  <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 }}>
    <View style={{ gap: 2, flexShrink: 1 }}>
      <AppText variant="sec" style={{ fontSize: 20 }}>
        {title}
      </AppText>
      {sub ? (
        <AppText variant="lbl" tone="muted2">
          {sub}
        </AppText>
      ) : null}
    </View>
    {right ? (
      <AppText variant="lbl" tone="muted2">
        {right}
      </AppText>
    ) : null}
  </View>
)

export const LoanDetailView: React.FC<LoanDetailViewProps> = ({
  loan,
  payments = [],
  movements = [],
  historyLoading = false,
  onEdit,
  onDelete,
}) => {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const reduced = useReducedMotion()
  const [showSnapshot, setShowSnapshot] = useState(false)
  const [activeTab, setActiveTab] = useState<DetailTab>('cuotas')
  const [installmentView, setInstallmentView] = useState<InstallmentView>('foto')
  const [selectedInstallment, setSelectedInstallment] = useState<LoanInstallment | null>(null)

  const borrowerName = loan.persona?.nombre || 'Prestatario'
  const shortCode = `PR-${loan.id.slice(0, 4).toUpperCase()}`

  // Parse snapshot
  const snapshot = loan.resumen_condiciones as unknown as LoanConditionsSnapshot | null

  // Métricas financieras calculadas
  const cuotas = loan.cuotas || []
  const totalCapitalPagado = cuotas.reduce((acc, c) => acc + (c.capital_pagado || 0), 0)
  const capitalPendiente = Math.max(0, loan.capital_original - totalCapitalPagado)
  const totalInteresEsperado = cuotas.reduce((acc, c) => acc + (c.interes_esperado || 0), 0)
  const totalInteresPagado = cuotas.reduce((acc, c) => acc + (c.interes_pagado || 0), 0)
  const totalMoraAcumulada = cuotas.reduce((acc, c) => acc + (c.mora_acumulada || 0), 0)
  const totalMoraPagada = cuotas.reduce((acc, c) => acc + (c.mora_pagada || 0), 0)

  // Saldo exigible de cuotas abiertas
  const cuotasAbiertas = cuotas.filter((c) => !c.esta_liquidada)
  const interesPendienteActivo = cuotasAbiertas.reduce(
    (acc, c) => acc + Math.max(0, (c.interes_esperado || 0) - (c.interes_pagado || 0)),
    0
  )
  const moraPendienteActiva = cuotasAbiertas.reduce(
    (acc, c) => acc + Math.max(0, (c.mora_acumulada || 0) - (c.mora_pagada || 0)),
    0
  )

  const proximaCuota = cuotas.find((c) => !c.esta_liquidada) || cuotas[0]
  // Interés generado por la cuota que toca cobrar (el del mes en curso)
  const cuotaDelMes = loan.estado !== 'completado' && proximaCuota && !proximaCuota.esta_liquidada ? proximaCuota : null
  const interesDelMes = cuotaDelMes ? cuotaDelMes.interes_esperado || 0 : 0
  const interesDelMesPendiente = cuotaDelMes
    ? Math.max(0, (cuotaDelMes.interes_esperado || 0) - (cuotaDelMes.interes_pagado || 0))
    : 0
  const today = new Date().toISOString().split('T')[0]
  const isOverdue =
    proximaCuota && !proximaCuota.esta_liquidada && proximaCuota.fecha_vencimiento < today
  const inMora = Boolean(isOverdue) || loan.estado === 'en_mora'

  const saldoExigibleTotal =
    loan.estado === 'completado'
      ? 0
      : capitalPendiente + interesPendienteActivo + moraPendienteActiva

  const hero = loanHeroImage(loan.estado !== 'completado' && inMora)

  const handleCall = () => {
    if (loan.persona?.telefono) {
      Linking.openURL(`tel:${loan.persona.telefono}`)
    }
  }

  const statusChip =
    loan.estado === 'completado' ? (
      <Chip tone="ok" label="Completado" icon={<CheckCircle2 size={13} color={colors.okSoft} />} style={{ height: 32, paddingHorizontal: 14 }} />
    ) : inMora ? (
      <Chip tone="danger" label="En mora" icon={<AlertTriangle size={13} color="#FF7A6E" />} style={{ height: 32, paddingHorizontal: 14 }} />
    ) : (
      <Chip tone="neutral" label="Activo" style={{ height: 32, paddingHorizontal: 14 }} />
    )

  const circleButton = (label: string, onPress: () => void, icon: React.ReactNode) => (
    <AnimatedPressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card2, alignItems: 'center', justifyContent: 'center' }}
    >
      {icon}
    </AnimatedPressable>
  )

  const tabs = [
    { id: 'cuotas' as const, label: `Cuotas (${cuotas.length})` },
    { id: 'pagos' as const, label: `Pagos (${payments.length})` },
    { id: 'movimientos' as const, label: `Libro (${movements.length})` },
  ]

  return (
    <View style={{ flex: 1, backgroundColor: colors.app, paddingTop: Math.max(insets.top, 12) }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, gap: 20 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Barra superior: Volver, estado, editar y eliminar */}
        <Animated.View
          entering={screenEnter(0, reduced)}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
        >
          <Button
            label="Volver"
            variant="ghost"
            size="sm"
            onPress={() => router.back()}
            icon={<ArrowLeft size={16} color={colors.warm} />}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {statusChip}
            {onEdit && circleButton('Editar préstamo', onEdit, <Pencil size={16} color={colors.warm} />)}
            {onDelete && circleButton('Eliminar préstamo', onDelete, <Trash2 size={16} color={colors.dangerSoft} />)}
          </View>
        </Animated.View>

        {/* Prestatario (lleva al perfil) */}
        <Animated.View entering={screenEnter(1, reduced)} style={{ gap: 10 }}>
          <Card variant="ink" style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 }}>
            <AnimatedPressable
              onPress={() => router.push(`/personas/${loan.persona_id}`)}
              accessibilityRole="link"
              accessibilityLabel={`Ver perfil de ${borrowerName}`}
              containerStyle={{ flex: 1 }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}
            >
              <Avatar name={borrowerName} size={56} />
              <View style={{ flex: 1, gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text numberOfLines={1} style={{ flexShrink: 1, color: colors.warm, fontFamily: fonts.medium, fontSize: 17 }}>
                    {borrowerName}
                  </Text>
                  <ChevronRight size={16} color={colors.muted2} />
                </View>
                <Text numberOfLines={1} style={{ color: colors.muted2, fontFamily: fonts.regular, fontSize: 12 }}>
                  {loan.persona?.direccion || 'Toca para ver perfil completo'}
                </Text>
              </View>
            </AnimatedPressable>
            {loan.persona?.telefono && (
              <AnimatedPressable
                onPress={handleCall}
                accessibilityRole="button"
                accessibilityLabel={`Llamar al ${loan.persona.telefono}`}
                style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card2, alignItems: 'center', justifyContent: 'center' }}
              >
                <Phone size={18} color={colors.warm} />
              </AnimatedPressable>
            )}
          </Card>

          {loan.persona?.exento_interes_ordinario && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 18, backgroundColor: 'rgba(242,196,109,0.10)' }}>
              <ShieldCheck size={16} color={colors.warn} />
              <Text style={{ flex: 1, color: colors.warn, fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 }}>
                Prestatario con exención de interés ordinario (Tasa pactada 0%).
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Hero con foto: al día o en mora */}
        <Animated.View entering={screenEnter(2, reduced)}>
          <View style={{ borderRadius: 32, overflow: 'hidden', borderWidth: 1, borderColor: colors.line, backgroundColor: colors.app }}>
            <CoverImage source={hero.source} focusY={hero.focusY} style={StyleSheet.absoluteFill} />
            <LinearGradient pointerEvents="none" colors={tintByTone[hero.tone]} locations={tintLocations} style={StyleSheet.absoluteFill} />
            <View style={{ padding: 18, gap: 18 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <Text style={{ color: '#E4E4E8', fontFamily: fonts.regular, fontSize: 12 }}>Saldo total adeudado</Text>
                <Chip glass label={`#${shortCode}`} />
              </View>

              <View style={{ gap: 6, marginTop: 56 }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                  <CountUpText
                    value={saldoExigibleTotal}
                    style={{ color: colors.warm, fontFamily: fonts.semibold, fontSize: 46, lineHeight: 48, letterSpacing: -2.07, flexShrink: 1, padding: 0 }}
                  />
                  <Text style={{ color: colors.muted2, fontFamily: fonts.medium, fontSize: 13, marginLeft: 6 }}>COP</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <CalendarCheck size={14} color="#C4C4C8" />
                  <Text style={{ color: '#C4C4C8', fontFamily: fonts.regular, fontSize: 12 }}>
                    Prestado el{' '}
                    <Text style={{ color: colors.warm, fontFamily: fonts.medium }}>{formatDateLong(loan.fecha_desembolso)}</Text>
                  </Text>
                </View>
              </View>

              {cuotaDelMes && (
                <View style={{ flexDirection: 'row' }}>
                  <GlassPanel
                    label="Interés del mes"
                    value={formatCOP(interesDelMes)}
                    sub={
                      interesDelMesPendiente > 0
                        ? `Por cobrar: ${formatCOP(interesDelMesPendiente)} · vence ${formatDateLong(cuotaDelMes.fecha_vencimiento)}`
                        : `Cobrado · vence ${formatDateLong(cuotaDelMes.fecha_vencimiento)}`
                    }
                    valueColor={interesDelMesPendiente > 0 ? colors.warm : colors.okSoft}
                  />
                </View>
              )}

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <GlassPanel label="Capital pendiente" value={formatCOP(capitalPendiente)} sub={`de ${formatCOP(loan.capital_original)}`} />
                <GlassPanel
                  label="Interés cobrado"
                  value={formatCOP(totalInteresPagado)}
                  sub={`generado: ${formatCOP(totalInteresEsperado)}`}
                  valueColor={colors.okSoft}
                />
              </View>

              {totalMoraAcumulada > 0 && (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 10,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 999,
                    backgroundColor: '#FFDAD4',
                    boxShadow: 'inset 0 0 0 1px rgba(255,107,94,0.6)',
                  }}
                >
                  <Text style={{ flex: 1, color: '#8E1B14', fontFamily: fonts.medium, fontSize: 12 }}>
                    Mora pendiente ({formatCOP(totalMoraPagada)} cobrada):
                  </Text>
                  <Text style={{ color: '#A81F17', fontFamily: fonts.semibold, fontSize: 14 }}>{formatCOP(moraPendienteActiva)} COP</Text>
                </View>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Términos contractuales congelados */}
        <Animated.View entering={screenEnter(3, reduced)}>
          <Card variant="ink" style={{ paddingHorizontal: 16, paddingVertical: 4 }}>
            <AnimatedPressable
              onPress={() => {
                haptic('selection')
                setShowSnapshot((v) => !v)
              }}
              accessibilityRole="button"
              accessibilityState={{ expanded: showSnapshot }}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 56 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 }}>
                <Lock size={16} color={colors.muted} />
                <Text style={{ color: colors.warm, fontFamily: fonts.medium, fontSize: 15, flexShrink: 1 }}>
                  Términos contractuales congelados
                </Text>
              </View>
              <AccordionChevron open={showSnapshot} />
            </AnimatedPressable>

            <Accordion open={showSnapshot}>
              <View style={{ paddingBottom: 14 }}>
                <Hair />
                <KvRow k="Tasa ordinaria mensual:" v={`${loan.tasa_mensual}% mensual`} />
                <Hair />
                <KvRow k="Modalidad:" v={loan.tipo_amortizacion.replace('_', ' ')} capitalize />
                <Hair />
                <KvRow k="Fecha de desembolso:" v={formatDateLong(loan.fecha_desembolso)} />
                <Hair />
                <KvRow k="Días de gracia pactados:" v={`${snapshot?.dias_gracia ?? 3} días`} />
                <Text style={{ color: colors.muted2, fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, fontStyle: 'italic', marginTop: 4 }}>
                  Snapshot congelado al momento del desembolso. Modificar la tasa en la configuración general no altera las condiciones de este préstamo.
                </Text>
              </View>
            </Accordion>
          </Card>
        </Animated.View>

        {/* Pestañas: Cuotas | Pagos | Libro */}
        <Animated.View entering={screenEnter(4, reduced)}>
          <Segmented options={tabs} value={activeTab} onChange={setActiveTab} />
        </Animated.View>

        {/* Contenido de la pestaña activa */}
        <Animated.View entering={screenEnter(5, reduced)} style={{ gap: 12 }}>
          {activeTab === 'cuotas' && (
            <>
              <View style={{ gap: 12 }}>
                <SectionHead title="Calendario de obligaciones" sub="Toca una cuota para ver su detalle" />
                <Segmented
                  compact
                  style={{ alignSelf: 'flex-start' }}
                  options={[
                    { id: 'foto', label: 'Foto' },
                    { id: 'compacta', label: 'Compacta' },
                  ]}
                  value={installmentView}
                  onChange={setInstallmentView}
                />
              </View>

              {cuotas.length === 0 ? (
                <Card variant="dark" style={{ padding: 20, alignItems: 'center', gap: 10 }}>
                  <Clock size={24} color={colors.muted2} />
                  <AppText variant="lbl" style={{ textAlign: 'center', lineHeight: 18 }}>
                    No hay obligaciones registradas para este préstamo.
                  </AppText>
                </Card>
              ) : (
                <View>
                  {cuotas.map((installment) => (
                    <InstallmentCard
                      key={`${installmentView}-${installment.id}`}
                      installment={installment}
                      variant={installmentView}
                      onPress={() => setSelectedInstallment(installment)}
                    />
                  ))}
                </View>
              )}
            </>
          )}

          {activeTab === 'pagos' && (
            <>
              <SectionHead
                title="Historial de pagos y abonos"
                right={`${payments.length} ${payments.length === 1 ? 'registro' : 'registros'}`}
              />

              {historyLoading ? (
                <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={colors.warm} />
                </View>
              ) : payments.length === 0 ? (
                <EmptyState
                  icon={<CreditCard size={24} color={colors.muted2} />}
                  title="Sin pagos registrados"
                  text="Aún no se han recibido abonos en este préstamo."
                />
              ) : (
                payments.map((p) => {
                  const isReversal = Boolean(p.es_reverso)
                  const isReversed = Boolean(p.esta_reversado)
                  const fecha = (p.fecha_recepcion || p.creado_en || '').split('T')[0]
                  const dists = p.distribuciones || p.distribucion_pagos || []

                  return (
                    <AnimatedPressable
                      key={p.id}
                      onPress={() => router.push(`/pagos/${p.id}`)}
                      accessibilityRole="button"
                      accessibilityLabel={`Pago de ${formatCOP(p.monto)}. Ver comprobante`}
                    >
                      <Card variant="ink" style={{ padding: 16, gap: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <Text
                            numberOfLines={1}
                            style={{
                              flexShrink: 1,
                              color: isReversed ? colors.muted2 : colors.warm,
                              fontFamily: fonts.semibold,
                              fontSize: 24,
                              letterSpacing: -0.8,
                              textDecorationLine: isReversed ? 'line-through' : 'none',
                            }}
                          >
                            {isReversal ? `- ${formatCOP(p.monto)}` : formatCOP(p.monto)}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            {isReversal ? (
                              <Chip tone="warn" label="Reverso" icon={<RotateCcw size={11} color={colors.warn} />} />
                            ) : isReversed ? (
                              <Chip tone="danger" label="Anulado" />
                            ) : (
                              <Chip tone="ok" label="Confirmado" />
                            )}
                            <ChevronRight size={15} color={colors.muted2} />
                          </View>
                        </View>
                        <Text style={{ color: colors.muted, fontFamily: fonts.regular, fontSize: 12 }}>
                          {fecha} · {p.metodo_pago}
                        </Text>

                        {dists.length > 0 && !isReversal && (
                          <>
                            <Hair />
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
                              {dists.map((d) => (
                                <Text key={d.id} style={{ color: colors.muted2, fontFamily: fonts.regular, fontSize: 12 }}>
                                  {d.componente === 'interes' ? 'Interés: ' : d.componente === 'capital' ? 'Capital: ' : 'Mora: '}
                                  <Text style={{ color: colors.warm, fontFamily: fonts.semibold }}>{formatCOP(d.monto)}</Text>
                                </Text>
                              ))}
                            </View>
                          </>
                        )}
                      </Card>
                    </AnimatedPressable>
                  )
                })
              )}
            </>
          )}

          {activeTab === 'movimientos' && (
            <>
              <SectionHead title="Libro mayor de movimientos" sub="Auditoría inmutable" />

              {historyLoading ? (
                <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={colors.warm} />
                </View>
              ) : movements.length === 0 ? (
                <Card variant="dark" style={{ padding: 20, alignItems: 'center', gap: 10 }}>
                  <FileText size={24} color={colors.muted2} />
                  <AppText variant="lbl" style={{ textAlign: 'center', lineHeight: 18 }}>
                    No hay movimientos registrados para este préstamo.
                  </AppText>
                </Card>
              ) : (
                <Card variant="ink" style={{ paddingHorizontal: 16 }}>
                  {movements.map((mov, idx) => {
                    const isDesembolso = mov.tipo_movimiento === 'desembolso'
                    const isPago = mov.tipo_movimiento === 'pago'
                    const isReverso = mov.tipo_movimiento === 'reverso'
                    const fechaMov = (mov.fecha_efectiva || mov.creado_en || '').split('T')[0]
                    const meta = mov.metadatos || {}
                    const last = idx === movements.length - 1
                    const amountColor = isDesembolso ? colors.warm : isReverso ? colors.dangerSoft : colors.okSoft

                    return (
                      <AnimatedPressable
                        key={mov.id}
                        disabled={!mov.pago_origen_id}
                        onPress={() => {
                          if (mov.pago_origen_id) {
                            router.push(`/pagos/${mov.pago_origen_id}`)
                          }
                        }}
                        accessibilityRole={mov.pago_origen_id ? 'button' : undefined}
                        style={{
                          gap: 8,
                          paddingVertical: 14,
                          borderBottomWidth: last ? 0 : 1,
                          borderBottomColor: colors.line,
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 }}>
                            <View
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 18,
                                backgroundColor: colors.card2,
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {isDesembolso ? (
                                <ArrowUpRight size={16} color={colors.warm} />
                              ) : isReverso ? (
                                <RotateCcw size={16} color={colors.dangerSoft} />
                              ) : (
                                <ArrowDownLeft size={16} color={colors.okSoft} />
                              )}
                            </View>
                            <View style={{ flexShrink: 1, gap: 2 }}>
                              <Text style={{ color: colors.warm, fontFamily: fonts.medium, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                                {isDesembolso
                                  ? 'Desembolso inicial'
                                  : isPago
                                    ? 'Pago / Abono recibido'
                                    : isReverso
                                      ? 'Reverso compensatorio'
                                      : mov.tipo_movimiento}
                              </Text>
                              <Text style={{ color: colors.muted2, fontFamily: fonts.regular, fontSize: 12 }}>{fechaMov}</Text>
                            </View>
                          </View>
                          <Text style={{ color: amountColor, fontFamily: fonts.semibold, fontSize: 14 }}>
                            {isDesembolso || isReverso ? '- ' : '+ '}
                            {formatCOP(mov.monto)}
                          </Text>
                        </View>

                        {mov.notas && (
                          <Text style={{ color: colors.muted, fontFamily: fonts.regular, fontSize: 12, paddingLeft: 48 }}>{mov.notas}</Text>
                        )}

                        {isPago && (meta.interes_pagado !== undefined || meta.capital_pagado !== undefined) && (
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingLeft: 48 }}>
                            <Text style={{ color: colors.muted2, fontFamily: fonts.regular, fontSize: 12 }}>
                              Interés: {formatCOP(Number(meta.interes_pagado || 0))}
                            </Text>
                            <Text style={{ color: colors.muted2, fontFamily: fonts.regular, fontSize: 12 }}>
                              Capital: {formatCOP(Number(meta.capital_pagado || 0))}
                            </Text>
                          </View>
                        )}
                      </AnimatedPressable>
                    )
                  })}
                </Card>
              )}
            </>
          )}
        </Animated.View>
      </ScrollView>

      {/* Acción fija abajo: registrar pago o préstamo liquidado */}
      <View
        style={{
          paddingTop: 12,
          paddingHorizontal: 16,
          paddingBottom: getSafeBottomInset(insets.bottom, 20),
          backgroundColor: colors.app,
        }}
      >
        {loan.estado === 'completado' ? (
          <View
            style={{
              height: 56,
              borderRadius: 999,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: 'rgba(127,214,164,0.14)',
              borderWidth: 1,
              borderColor: 'rgba(127,214,164,0.3)',
            }}
          >
            <CheckCircle2 size={18} color={colors.okSoft} />
            <Text style={{ color: colors.okSoft, fontFamily: fonts.medium, fontSize: 15 }}>Préstamo 100% liquidado</Text>
          </View>
        ) : (
          <Button
            label="Registrar pago"
            size="lg"
            onPress={() => router.push(`/pagos/registrar?prestamo_id=${loan.id}`)}
            icon={<CreditCard size={16} color="#000000" />}
            style={{ width: '100%' }}
          />
        )}
      </View>

      {/* Detalle de cuota */}
      <InstallmentDetailModal
        visible={Boolean(selectedInstallment)}
        installment={selectedInstallment}
        onClose={() => setSelectedInstallment(null)}
        onRegisterPayment={
          loan.estado !== 'completado'
            ? () => router.push(`/pagos/registrar?prestamo_id=${loan.id}`)
            : undefined
        }
      />
    </View>
  )
}
