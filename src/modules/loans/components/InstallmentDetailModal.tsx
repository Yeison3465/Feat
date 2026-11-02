import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import {
  X,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CreditCard,
  ExternalLink,
} from 'lucide-react-native'
import { LoanInstallment } from '../types'
import { InstallmentPaymentItem } from '../../payments/types'
import { paymentsService } from '../../payments/services/payments.service'
import { formatCOP, formatDateFriendly } from '../../../shared/utils/currency'

interface InstallmentDetailModalProps {
  readonly visible: boolean
  readonly installment: LoanInstallment | null
  readonly onClose: () => void
  readonly onRegisterPayment?: () => void
}

export const InstallmentDetailModal: React.FC<InstallmentDetailModalProps> = ({
  visible,
  installment,
  onClose,
  onRegisterPayment,
}) => {
  const router = useRouter()
  const [allocations, setAllocations] = useState<InstallmentPaymentItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadAllocations() {
      if (!installment || !visible) return
      try {
        setLoading(true)
        const data = await paymentsService.getAllocationsByInstallment(installment.id)
        setAllocations(data)
      } catch {
        setAllocations([])
      } finally {
        setLoading(false)
      }
    }
    loadAllocations()
  }, [installment, visible])

  if (!installment) return null

  const today = new Date().toISOString().split('T')[0]
  const isOverdue = !installment.esta_liquidada && installment.fecha_vencimiento < today
  const interesRestante = Math.max(0, installment.interes_esperado - installment.interes_pagado)
  const capitalRestante = Math.max(0, installment.capital_esperado - installment.capital_pagado)
  const moraRestante = Math.max(0, installment.mora_acumulada - installment.mora_pagada)
  const saldoExigibleCuota = interesRestante + capitalRestante + moraRestante

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/80 justify-end">
        <View className="bg-[#12131A] border-t border-[#232433] rounded-t-3xl p-6 max-h-[85%] max-w-md w-full mx-auto">
          {/* Cabecera del Modal (SCR-12) */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-2.5">
              <View className="w-9 h-9 rounded-xl bg-[#191316] border border-[#2F191D] items-center justify-center">
                <Text className="text-[#FF7854] text-sm font-bold font-mono">
                  #{installment.numero_cuota}
                </Text>
              </View>
              <View>
                <Text className="text-white text-base font-bold">
                  Detalle de Cuota #{installment.numero_cuota}
                </Text>
                <View className="flex-row items-center mt-0.5">
                  <Calendar size={12} color="#9CA3AF" />
                  <Text className="text-zinc-400 text-xs ml-1">
                    Vence: {formatDateFriendly(installment.fecha_vencimiento)}
                  </Text>
                </View>
              </View>
            </View>

            <Pressable onPress={onClose} hitSlop={10} className="p-1">
              <X size={20} color="#9CA3AF" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="mb-2">
            {/* Estado de la Obligación */}
            <View className="bg-[#0A0B10] border border-[#1C1E2B] rounded-2xl p-4 mb-4 flex-row items-center justify-between">
              <View>
                <Text className="text-zinc-500 text-[11px] uppercase font-semibold">
                  Saldo pendiente en cuota
                </Text>
                <Text className="text-white text-xl font-extrabold font-mono mt-0.5">
                  {formatCOP(saldoExigibleCuota)} COP
                </Text>
              </View>

              {installment.esta_liquidada ? (
                <View className="bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-full flex-row items-center">
                  <CheckCircle2 size={13} color="#10B981" />
                  <Text className="text-emerald-400 text-xs font-bold ml-1.5">Pagada</Text>
                </View>
              ) : isOverdue ? (
                <View className="bg-rose-500/15 border border-rose-500/30 px-3 py-1 rounded-full flex-row items-center">
                  <AlertTriangle size={13} color="#FB3758" />
                  <Text className="text-[#FB3758] text-xs font-bold ml-1.5">Atrasada</Text>
                </View>
              ) : (
                <View className="bg-amber-500/15 border border-amber-500/30 px-3 py-1 rounded-full flex-row items-center">
                  <Clock size={13} color="#F59E0B" />
                  <Text className="text-amber-400 text-xs font-bold ml-1.5">Pendiente</Text>
                </View>
              )}
            </View>

            {/* Desglose Financiero de la Cuota */}
            <View className="bg-[#0A0B10] border border-[#1C1E2B] rounded-2xl p-4 mb-4 space-y-2.5">
              <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">
                Desglose por componente
              </Text>

              <View className="flex-row justify-between items-center py-1.5 border-b border-[#161722]">
                <Text className="text-zinc-400 text-xs">Interés ordinario</Text>
                <Text className="text-white text-xs font-mono">
                  <Text className="text-emerald-400 font-bold">
                    {formatCOP(installment.interes_pagado)}
                  </Text>{' '}
                  / {formatCOP(installment.interes_esperado)}
                </Text>
              </View>

              <View className="flex-row justify-between items-center py-1.5 border-b border-[#161722]">
                <Text className="text-zinc-400 text-xs">Capital</Text>
                <Text className="text-white text-xs font-mono">
                  <Text className="text-emerald-400 font-bold">
                    {formatCOP(installment.capital_pagado)}
                  </Text>{' '}
                  / {formatCOP(installment.capital_esperado)}
                </Text>
              </View>

              <View className="flex-row justify-between items-center py-1">
                <Text className="text-zinc-400 text-xs">Mora</Text>
                <Text className="text-white text-xs font-mono">
                  <Text className="text-rose-400 font-bold">
                    {formatCOP(installment.mora_pagada)}
                  </Text>{' '}
                  / {formatCOP(installment.mora_acumulada)}
                </Text>
              </View>
            </View>

            {/* Pagos e Imputaciones Asociados a esta Cuota */}
            <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2.5 px-1">
              Abonos aplicados a esta cuota
            </Text>

            {loading ? (
              <View className="py-6 items-center">
                <ActivityIndicator size="small" color="#FF7854" />
              </View>
            ) : allocations.length === 0 ? (
              <View className="bg-[#0A0B10] border border-[#1C1E2B] rounded-2xl p-4 items-center mb-3">
                <Text className="text-zinc-500 text-xs text-center">
                  Aún no se han registrado abonos sobre esta obligación.
                </Text>
              </View>
            ) : (
              allocations.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    onClose()
                    router.push(`/pagos/${item.pago_id}`)
                  }}
                  className="bg-[#0A0B10] border border-[#1C1E2B] active:border-[#2C2F45] rounded-2xl p-3.5 mb-2 flex-row items-center justify-between"
                >
                  <View>
                    <Text className="text-white text-xs font-bold capitalize">
                      {item.componente === 'interes'
                        ? 'Abono a interés ordinario'
                        : item.componente === 'capital'
                        ? 'Abono a capital'
                        : 'Abono a mora'}
                    </Text>
                    <Text className="text-zinc-500 text-[11px] font-mono mt-0.5">
                      {(item.pago?.fecha_recepcion || item.creado_en || '').split('T')[0]} ·{' '}
                      {item.pago?.metodo_pago || 'efectivo'}
                    </Text>
                  </View>

                  <View className="flex-row items-center gap-2">
                    <Text className="text-emerald-400 text-xs font-mono font-bold">
                      + {formatCOP(item.monto)}
                    </Text>
                    <ExternalLink size={13} color="#FF7854" />
                  </View>
                </Pressable>
              ))
            )}
          </ScrollView>

          {/* Botones de Acción */}
          <View className="flex-row gap-3 pt-2 border-t border-[#1C1E2B]">
            <Pressable
              onPress={onClose}
              className="flex-1 py-3 rounded-xl bg-[#1A1B26] border border-[#252738] items-center justify-center"
            >
              <Text className="text-zinc-300 text-xs font-semibold">Cerrar</Text>
            </Pressable>

            {!installment.esta_liquidada && onRegisterPayment && (
              <Pressable
                onPress={() => {
                  onClose()
                  onRegisterPayment()
                }}
                className="flex-1 py-3 rounded-xl bg-[#D34524] active:bg-[#E54F2C] items-center justify-center flex-row gap-1.5"
              >
                <CreditCard size={14} color="#FFFFFF" />
                <Text className="text-white text-xs font-bold">Registrar pago</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  )
}

