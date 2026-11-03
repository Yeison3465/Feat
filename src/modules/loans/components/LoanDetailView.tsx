import React, { useState } from 'react'
import { View, Text, Pressable, ScrollView, Linking, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  ArrowLeft,
  Phone,
  Lock,
  ChevronDown,
  ChevronUp,
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
} from 'lucide-react-native'
import { LoanWithDetails, LoanConditionsSnapshot, LoanInstallment } from '../types'
import { LoanMovementItem, PaymentWithDetails } from '../../payments/types'
import { InstallmentCard } from './InstallmentCard'
import { InstallmentDetailModal } from './InstallmentDetailModal'
import { getInitials } from '../../../shared/utils/initials'
import { formatCOP } from '../../../shared/utils/currency'
import { getSafeBottomInset } from '../../../shared/utils/responsive'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'

interface LoanDetailViewProps {
  readonly loan: LoanWithDetails
  readonly payments?: PaymentWithDetails[]
  readonly movements?: LoanMovementItem[]
  readonly historyLoading?: boolean
}

type DetailTab = 'cuotas' | 'pagos' | 'movimientos'

export const LoanDetailView: React.FC<LoanDetailViewProps> = ({
  loan,
  payments = [],
  movements = [],
  historyLoading = false,
}) => {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [showSnapshot, setShowSnapshot] = useState(false)
  const [activeTab, setActiveTab] = useState<DetailTab>('cuotas')
  const [selectedInstallment, setSelectedInstallment] = useState<LoanInstallment | null>(null)

  const borrowerName = loan.persona?.nombre || 'Prestatario'
  const initials = getInitials(borrowerName)
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
  const today = new Date().toISOString().split('T')[0]
  const isOverdue =
    proximaCuota && !proximaCuota.esta_liquidada && proximaCuota.fecha_vencimiento < today

  const saldoExigibleTotal =
    loan.estado === 'completado'
      ? 0
      : capitalPendiente + interesPendienteActivo + moraPendienteActiva

  const handleCall = () => {
    if (loan.persona?.telefono) {
      Linking.openURL(`tel:${loan.persona.telefono}`)
    }
  }

  const getStatusBadge = () => {
    if (loan.estado === 'completado') {
      return (
        <View className="bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-full flex-row items-center">
          <CheckCircle2 size={13} color="#10B981" />
          <Text className="text-emerald-400 text-xs font-semibold ml-1.5">Completado</Text>
        </View>
      )
    }
    if (isOverdue || loan.estado === 'en_mora') {
      return (
        <View className="bg-rose-500/15 border border-rose-500/30 px-3 py-1 rounded-full flex-row items-center">
          <AlertTriangle size={13} color="#FB3758" />
          <Text className="text-[#FB3758] text-xs font-semibold ml-1.5">En mora</Text>
        </View>
      )
    }
    return (
      <View className="bg-[#D34524]/15 border border-[#D34524]/30 px-3 py-1 rounded-full flex-row items-center">
        <Text className="text-[#FF7854] text-xs font-semibold">Activo</Text>
      </View>
    )
  }

  return (
    <View style={{ paddingTop: Math.max(insets.top, 12) }} className="flex-1 bg-[#060709]">
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: getSafeBottomInset(insets.bottom, 20) + 76,
        }}
        keyboardShouldPersistTaps="handled"
        className="px-6 max-w-md mx-auto w-full"
      >
        {/* Cabecera superior con Volver y Código */}
        <Animated.View
          entering={FadeInDown.duration(380).springify()}
          className="flex-row items-center justify-between mt-2 mb-5"
        >
          <Pressable
            onPress={() => router.back()}
            className="flex-row items-center py-2 pr-4"
            hitSlop={10}
          >
            <ArrowLeft size={20} color="#9CA3AF" />
            <Text className="text-zinc-400 text-sm font-medium ml-2">Volver</Text>
          </Pressable>

          <View className="flex-row items-center gap-2">
            <Text className="text-zinc-500 text-xs font-mono font-semibold">
              #{shortCode}
            </Text>
            {getStatusBadge()}
          </View>
        </Animated.View>

        {/* Ficha del Prestatario (Clickeable hacia Detalle de Persona) */}
        <Animated.View
          entering={FadeInDown.delay(70).duration(420).springify().damping(18).stiffness(160)}
          className="bg-[#12131A] border border-[#1E2030] rounded-3xl p-5 mb-5 shadow-2xl shadow-black"
        >
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={() => router.push(`/personas/${loan.persona_id}`)}
              className="flex-row items-center flex-1 mr-3 active:opacity-75"
            >
              <View className="w-13 h-13 rounded-2xl bg-[#191316] border border-[#2F191D] items-center justify-center mr-3.5 shadow-md shadow-black">
                <Text className="text-[#FF7854] text-lg font-bold font-mono">
                  {initials}
                </Text>
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-white text-lg font-bold tracking-tight" numberOfLines={1}>
                    {borrowerName}
                  </Text>
                  <ChevronRight size={17} color="#FF7854" />
                </View>
                <Text className="text-zinc-400 text-xs mt-0.5">
                  {loan.persona?.direccion || 'Toca para ver perfil completo'}
                </Text>
              </View>
            </Pressable>

            {loan.persona?.telefono && (
              <Pressable
                onPress={handleCall}
                className="w-10 h-10 rounded-xl bg-[#0A0B10] border border-[#232433] items-center justify-center active:bg-[#1E2030]"
              >
                <Phone size={18} color="#FF7854" />
              </Pressable>
            )}
          </View>

          {loan.persona?.exento_interes_ordinario && (
            <View className="mt-3.5 bg-amber-500/10 border border-amber-500/25 p-2.5 rounded-xl flex-row items-center">
              <ShieldCheck size={16} color="#F59E0B" />
              <Text className="text-amber-400 text-xs font-medium ml-2">
                Prestatario con exención de interés ordinario (Tasa pactada 0%).
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Panel Hero: Métricas Financieras del Préstamo */}
        <Animated.View
          entering={FadeInDown.delay(120).duration(420).springify().damping(18).stiffness(160)}
          className="bg-[#12131A] border border-[#1E2030] rounded-3xl p-5 mb-5 shadow-2xl shadow-black"
        >
          <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
            Saldo total adeudado
          </Text>

          <View className="flex-row items-baseline gap-2 mb-4">
            <Text className="text-white text-3xl font-extrabold font-mono tracking-tight">
              {formatCOP(saldoExigibleTotal)}
            </Text>
            <Text className="text-zinc-500 text-sm font-mono font-semibold">COP</Text>
          </View>

          {/* Grid de 2 Columnas para Desglose */}
          <View className="grid grid-cols-2 gap-2.5 pt-3 border-t border-[#1C1E2B]">
            {/* Capital Original vs Pendiente */}
            <View className="bg-[#0A0B10] rounded-2xl p-3 border border-[#161722]">
              <Text className="text-zinc-500 text-[11px] mb-1">Capital pendiente</Text>
              <Text className="text-white text-base font-bold font-mono">
                {formatCOP(capitalPendiente)}
              </Text>
              <Text className="text-zinc-500 text-[10px] mt-0.5">
                de {formatCOP(loan.capital_original)}
              </Text>
            </View>

            {/* Intereses Generados vs Cobrados */}
            <View className="bg-[#0A0B10] rounded-2xl p-3 border border-[#161722]">
              <Text className="text-zinc-500 text-[11px] mb-1">Interés cobrado</Text>
              <Text className="text-emerald-400 text-base font-bold font-mono">
                {formatCOP(totalInteresPagado)}
              </Text>
              <Text className="text-zinc-500 text-[10px] mt-0.5">
                generado: {formatCOP(totalInteresEsperado)}
              </Text>
            </View>
          </View>

          {totalMoraAcumulada > 0 && (
            <View className="mt-2.5 bg-rose-500/10 border border-rose-500/25 p-3 rounded-2xl flex-row justify-between items-center">
              <Text className="text-rose-400 text-xs font-medium">
                Mora pendiente ({formatCOP(totalMoraPagada)} cobrada):
              </Text>
              <Text className="text-rose-400 text-xs font-bold font-mono">
                {formatCOP(moraPendienteActiva)} COP
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Snapshot Inmutable de Condiciones Pactadas */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(300).springify()}
          className="bg-[#12131A] border border-[#1E2030] rounded-3xl p-5 mb-5 shadow-xl shadow-black"
        >
          <Pressable
            onPress={() => setShowSnapshot(!showSnapshot)}
            className="flex-row items-center justify-between"
          >
            <View className="flex-row items-center">
              <Lock size={16} color="#FF7854" />
              <Text className="text-white text-sm font-bold ml-2">
                Términos contractuales congelados
              </Text>
            </View>
            {showSnapshot ? (
              <ChevronUp size={18} color="#9CA3AF" />
            ) : (
              <ChevronDown size={18} color="#9CA3AF" />
            )}
          </Pressable>

          {showSnapshot && (
            <View className="mt-4 pt-3 border-t border-[#1C1E2B] space-y-2">
              <View className="flex-row justify-between text-xs py-1">
                <Text className="text-zinc-400 text-xs">Tasa ordinaria mensual:</Text>
                <Text className="text-white text-xs font-mono font-bold">
                  {loan.tasa_mensual}% mensual
                </Text>
              </View>
              <View className="flex-row justify-between text-xs py-1">
                <Text className="text-zinc-400 text-xs">Modalidad:</Text>
                <Text className="text-white text-xs font-semibold capitalize">
                  {loan.tipo_amortizacion.replace('_', ' ')}
                </Text>
              </View>
              <View className="flex-row justify-between text-xs py-1">
                <Text className="text-zinc-400 text-xs">Fecha de desembolso:</Text>
                <Text className="text-white text-xs font-mono">
                  {loan.fecha_desembolso}
                </Text>
              </View>
              <View className="flex-row justify-between text-xs py-1">
                <Text className="text-zinc-400 text-xs">Días de gracia pactados:</Text>
                <Text className="text-white text-xs font-mono">
                  {snapshot?.dias_gracia ?? 3} días
                </Text>
              </View>
              <Text className="text-zinc-500 text-[10px] mt-2 italic leading-3.5">
                Snapshot congelado al momento del desembolso. Modificar la tasa en la configuración
                general no altera las condiciones de este préstamo.
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Selector de Pestañas: Cuotas (SCR-11) | Pagos (SCR-15) | Movimientos (SCR-16) */}
        <Animated.View
          entering={FadeInUp.delay(240).duration(300).springify()}
          className="bg-[#12131A] border border-[#1E2030] rounded-2xl p-1.5 flex-row mb-4"
        >
          {[
            { id: 'cuotas', label: `Cuotas (${cuotas.length})` },
            { id: 'pagos', label: `Pagos (${payments.length})` },
            { id: 'movimientos', label: `Libro (${movements.length})` },
          ].map((tab) => {
            const isSelected = activeTab === tab.id
            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id as DetailTab)}
                className={`flex-1 py-2.5 rounded-xl items-center justify-center ${
                  isSelected ? 'bg-[#D34524]' : 'bg-transparent'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    isSelected ? 'text-white' : 'text-zinc-400'
                  }`}
                >
                  {tab.label}
                </Text>
              </Pressable>
            )
          })}
        </Animated.View>

        {/* Contenido de la Pestaña Activa */}
        <Animated.View entering={FadeInUp.delay(280).duration(300)} className="mb-6">
          {activeTab === 'cuotas' && (
            <View>
              <View className="flex-row items-center justify-between mb-3 px-1">
                <Text className="text-white text-sm font-bold tracking-tight">
                  Calendario de obligaciones
                </Text>
                <Text className="text-zinc-500 text-[11px]">
                  Toca una cuota para ver su detalle
                </Text>
              </View>

              {cuotas.length === 0 ? (
                <View className="bg-[#12131A] border border-[#1E2030] rounded-2xl p-6 items-center">
                  <Clock size={24} color="#6B7280" />
                  <Text className="text-zinc-400 text-xs mt-2 text-center">
                    No hay obligaciones registradas para este préstamo.
                  </Text>
                </View>
              ) : (
                cuotas.map((installment) => (
                  <InstallmentCard
                    key={installment.id}
                    installment={installment}
                    onPress={() => setSelectedInstallment(installment)}
                  />
                ))
              )}
            </View>
          )}

          {activeTab === 'pagos' && (
            <View>
              <View className="flex-row items-center justify-between mb-3 px-1">
                <Text className="text-white text-sm font-bold tracking-tight">
                  Historial de pagos y abonos
                </Text>
                <Text className="text-zinc-500 text-[11px] font-mono">
                  {payments.length} {payments.length === 1 ? 'registro' : 'registros'}
                </Text>
              </View>

              {historyLoading ? (
                <View className="py-8 items-center">
                  <ActivityIndicator size="small" color="#FF7854" />
                </View>
              ) : payments.length === 0 ? (
                <View className="bg-[#12131A] border border-[#1E2030] rounded-2xl p-6 items-center">
                  <CreditCard size={24} color="#6B7280" />
                  <Text className="text-white text-sm font-bold mt-2">
                    Sin pagos registrados
                  </Text>
                  <Text className="text-zinc-400 text-xs mt-1 text-center">
                    Aún no se han recibido abonos en este préstamo.
                  </Text>
                </View>
              ) : (
                payments.map((p) => {
                  const isReversal = Boolean(p.es_reverso)
                  const isReversed = Boolean(p.esta_reversado)
                  const fecha = (p.fecha_recepcion || p.creado_en || '').split('T')[0]
                  const dists = p.distribuciones || p.distribucion_pagos || []

                  return (
                    <Pressable
                      key={p.id}
                      onPress={() => router.push(`/pagos/${p.id}`)}
                      className="bg-[#101119] border border-[#1C1E2B] active:border-[#2C2F45] rounded-2xl p-4 mb-3"
                    >
                      <View className="flex-row items-center justify-between mb-2">
                        <View className="flex-row items-center gap-2">
                          <View
                            className={`w-8 h-8 rounded-xl items-center justify-center ${
                              isReversal
                                ? 'bg-amber-500/15 border border-amber-500/30'
                                : isReversed
                                ? 'bg-rose-500/15 border border-rose-500/30'
                                : 'bg-emerald-500/15 border border-emerald-500/30'
                            }`}
                          >
                            {isReversal ? (
                              <RotateCcw size={15} color="#F59E0B" />
                            ) : (
                              <CheckCircle2
                                size={15}
                                color={isReversed ? '#FB3758' : '#10B981'}
                              />
                            )}
                          </View>
                          <View>
                            <Text
                              className={`text-sm font-bold font-mono ${
                                isReversed ? 'text-zinc-500 line-through' : 'text-white'
                              }`}
                            >
                              {isReversal ? `- ${formatCOP(p.monto)}` : formatCOP(p.monto)}
                            </Text>
                            <Text className="text-zinc-500 text-[11px] font-mono">
                              {fecha} · {p.metodo_pago}
                            </Text>
                          </View>
                        </View>

                        <View className="flex-row items-center gap-1.5">
                          {isReversal ? (
                            <View className="bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                              <Text className="text-amber-400 text-[10px] font-bold">
                                Reverso
                              </Text>
                            </View>
                          ) : isReversed ? (
                            <View className="bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 rounded-full">
                              <Text className="text-[#FB3758] text-[10px] font-bold">
                                Anulado
                              </Text>
                            </View>
                          ) : (
                            <View className="bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                              <Text className="text-emerald-400 text-[10px] font-bold">
                                Confirmado
                              </Text>
                            </View>
                          )}
                          <ChevronRight size={15} color="#6B7280" />
                        </View>
                      </View>

                      {dists.length > 0 && !isReversal && (
                        <View className="bg-[#0A0B10] rounded-xl p-2.5 border border-[#161722] flex-row flex-wrap gap-3 mt-1">
                          {dists.map((d) => (
                            <Text key={d.id} className="text-zinc-400 text-[11px]">
                              {d.componente === 'interes'
                                ? 'Interés: '
                                : d.componente === 'capital'
                                ? 'Capital: '
                                : 'Mora: '}
                              <Text className="text-white font-mono font-semibold">
                                {formatCOP(d.monto)}
                              </Text>
                            </Text>
                          ))}
                        </View>
                      )}
                    </Pressable>
                  )
                })
              )}
            </View>
          )}

          {activeTab === 'movimientos' && (
            <View>
              <View className="flex-row items-center justify-between mb-3 px-1">
                <Text className="text-white text-sm font-bold tracking-tight">
                  Libro mayor de movimientos
                </Text>
                <Text className="text-zinc-500 text-[11px]">
                  Auditoría inmutable
                </Text>
              </View>

              {historyLoading ? (
                <View className="py-8 items-center">
                  <ActivityIndicator size="small" color="#FF7854" />
                </View>
              ) : movements.length === 0 ? (
                <View className="bg-[#12131A] border border-[#1E2030] rounded-2xl p-6 items-center">
                  <FileText size={24} color="#6B7280" />
                  <Text className="text-zinc-400 text-xs mt-2 text-center">
                    No hay movimientos registrados para este préstamo.
                  </Text>
                </View>
              ) : (
                movements.map((mov) => {
                  const isDesembolso = mov.tipo_movimiento === 'desembolso'
                  const isPago = mov.tipo_movimiento === 'pago'
                  const isReverso = mov.tipo_movimiento === 'reverso'
                  const fechaMov = (mov.fecha_efectiva || mov.creado_en || '').split('T')[0]
                  const meta = mov.metadatos || {}

                  return (
                    <Pressable
                      key={mov.id}
                      disabled={!mov.pago_origen_id}
                      onPress={() => {
                        if (mov.pago_origen_id) {
                          router.push(`/pagos/${mov.pago_origen_id}`)
                        }
                      }}
                      className="bg-[#101119] border border-[#1C1E2B] rounded-2xl p-4 mb-3"
                    >
                      <View className="flex-row items-center justify-between mb-1.5">
                        <View className="flex-row items-center gap-2.5">
                          <View
                            className={`w-8 h-8 rounded-xl items-center justify-center ${
                              isDesembolso
                                ? 'bg-[#D34524]/15 border border-[#D34524]/30'
                                : isReverso
                                ? 'bg-rose-500/15 border border-rose-500/30'
                                : 'bg-emerald-500/15 border border-emerald-500/30'
                            }`}
                          >
                            {isDesembolso ? (
                              <ArrowUpRight size={15} color="#FF7854" />
                            ) : isReverso ? (
                              <RotateCcw size={15} color="#FB3758" />
                            ) : (
                              <ArrowDownLeft size={15} color="#10B981" />
                            )}
                          </View>

                          <View>
                            <Text className="text-white text-xs font-bold uppercase tracking-wider">
                              {isDesembolso
                                ? 'Desembolso inicial'
                                : isPago
                                ? 'Pago / Abono recibido'
                                : isReverso
                                ? 'Reverso compensatorio'
                                : mov.tipo_movimiento}
                            </Text>
                            <Text className="text-zinc-500 text-[11px] font-mono">
                              {fechaMov}
                            </Text>
                          </View>
                        </View>

                        <Text
                          className={`text-sm font-bold font-mono ${
                            isDesembolso
                              ? 'text-[#FF7854]'
                              : isReverso
                              ? 'text-[#FB3758]'
                              : 'text-emerald-400'
                          }`}
                        >
                          {isDesembolso || isReverso ? '- ' : '+ '}
                          {formatCOP(mov.monto)}
                        </Text>
                      </View>

                      {mov.notas && (
                        <Text className="text-zinc-400 text-xs mt-1 pl-1">
                          {mov.notas}
                        </Text>
                      )}

                      {isPago &&
                        (meta.interes_pagado !== undefined ||
                          meta.capital_pagado !== undefined) && (
                          <View className="mt-2 pt-2 border-t border-[#161722] flex-row justify-between">
                            <Text className="text-zinc-500 text-[11px]">
                              Interés: {formatCOP(Number(meta.interes_pagado || 0))}
                            </Text>
                            <Text className="text-zinc-500 text-[11px]">
                              Capital: {formatCOP(Number(meta.capital_pagado || 0))}
                            </Text>
                          </View>
                        )}
                    </Pressable>
                  )
                })
              )}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Footer Ergonómico Pinned con Botón Registrar Pago (Bloque 4) */}
      <Animated.View
        entering={FadeInUp.delay(300).duration(280)}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingBottom: getSafeBottomInset(insets.bottom, 20),
          paddingTop: 12,
          paddingHorizontal: 24,
        }}
        className="bg-[#060709] border-t border-[#161722]"
      >
        <View className="max-w-md mx-auto w-full">
          {loan.estado === 'completado' ? (
            <View
              style={{ height: 52 }}
              className="w-full rounded-2xl bg-emerald-500/15 border border-emerald-500/30 items-center justify-center flex-row"
            >
              <CheckCircle2 size={18} color="#10B981" />
              <Text className="text-emerald-400 text-sm font-bold ml-2">
                Préstamo 100% liquidado
              </Text>
            </View>
          ) : (
            <Pressable
              onPress={() => router.push(`/pagos/registrar?prestamo_id=${loan.id}`)}
              style={{ height: 52 }}
              className="w-full rounded-2xl bg-[#D34524] active:bg-[#E54F2C] items-center justify-center flex-row shadow-lg shadow-[#D34524]/20"
            >
              <CreditCard size={18} color="#FFFFFF" />
              <Text className="text-white text-[15px] font-bold tracking-wide ml-2">
                Registrar pago
              </Text>
            </Pressable>
          )}
        </View>
      </Animated.View>

      {/* Modal de Detalle de Cuota (SCR-12) */}
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
