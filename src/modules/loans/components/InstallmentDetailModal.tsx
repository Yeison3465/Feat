import React, { useEffect, useRef, useState } from 'react'
import { View, Text, ScrollView, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { X, Calendar, CheckCircle2, Clock, AlertTriangle, CreditCard, ExternalLink } from 'lucide-react-native'
import { LoanInstallment } from '../types'
import { InstallmentPaymentItem } from '../../payments/types'
import { paymentsService } from '../../payments/services/payments.service'
import { formatCOP, formatDateFriendly } from '../../../shared/utils/currency'
import { AnimatedPressable } from '../../../shared/components/AnimatedPressable'
import { AppText } from '../../../shared/ui/AppText'
import { Button } from '../../../shared/ui/Button'
import { Chip } from '../../../shared/ui/Chip'
import { Sheet } from '../../../shared/ui/Overlay'
import { colors, fonts } from '../../../shared/theme/tokens'

interface InstallmentDetailModalProps {
  readonly visible: boolean
  readonly installment: LoanInstallment | null
  readonly onClose: () => void
  readonly onRegisterPayment?: () => void
}

// Fila «componente: pagado / esperado»
const BreakdownRow: React.FC<{ label: string; paid: number; expected: number; paidColor: string; last?: boolean }> = ({
  label,
  paid,
  expected,
  paidColor,
  last,
}) => (
  <View
    style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: last ? 0 : 1,
      borderBottomColor: colors.line,
    }}
  >
    <Text style={{ color: colors.muted, fontFamily: fonts.regular, fontSize: 13 }}>{label}</Text>
    <Text style={{ color: colors.muted2, fontFamily: fonts.regular, fontSize: 13 }}>
      <Text style={{ color: paidColor, fontFamily: fonts.semibold }}>{formatCOP(paid)}</Text> / {formatCOP(expected)}
    </Text>
  </View>
)

export const InstallmentDetailModal: React.FC<InstallmentDetailModalProps> = ({
  visible,
  installment,
  onClose,
  onRegisterPayment,
}) => {
  const router = useRouter()
  const [allocations, setAllocations] = useState<InstallmentPaymentItem[]>([])
  const [loading, setLoading] = useState(false)
  // La hoja se anima al salir: se conserva la última cuota mostrada mientras baja
  const lastInstallment = useRef<LoanInstallment | null>(null)
  if (installment) lastInstallment.current = installment
  const shown = installment ?? lastInstallment.current

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

  if (!shown) return null

  const today = new Date().toISOString().split('T')[0]
  const isOverdue = !shown.esta_liquidada && shown.fecha_vencimiento < today
  const interesRestante = Math.max(0, shown.interes_esperado - shown.interes_pagado)
  const capitalRestante = Math.max(0, shown.capital_esperado - shown.capital_pagado)
  const moraRestante = Math.max(0, shown.mora_acumulada - shown.mora_pagada)
  const saldoExigibleCuota = interesRestante + capitalRestante + moraRestante

  return (
    <Sheet visible={visible} onClose={onClose}>
      {/* Cabecera */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingBottom: 14 }}>
        <View style={{ flex: 1, gap: 4 }}>
          <AppText variant="sec" style={{ fontSize: 20 }}>
            Detalle de Cuota #{shown.numero_cuota}
          </AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Calendar size={13} color={colors.muted2} />
            <AppText variant="lbl" tone="muted2">
              Vence: {formatDateFriendly(shown.fecha_vencimiento)}
            </AppText>
          </View>
        </View>
        <AnimatedPressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card2, alignItems: 'center', justifyContent: 'center' }}
        >
          <X size={18} color={colors.warm} />
        </AnimatedPressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 14, paddingBottom: 8 }}>
        {/* Estado de la obligación */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            padding: 16,
            borderRadius: 24,
            backgroundColor: colors.card2,
          }}
        >
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ color: colors.muted2, fontFamily: fonts.medium, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
              Saldo pendiente en cuota
            </Text>
            <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: colors.warm, fontFamily: fonts.semibold, fontSize: 26, letterSpacing: -1 }}>
              {formatCOP(saldoExigibleCuota)} COP
            </Text>
          </View>
          {shown.esta_liquidada ? (
            <Chip tone="ok" label="Pagada" icon={<CheckCircle2 size={12} color={colors.okSoft} />} />
          ) : isOverdue ? (
            <Chip tone="danger" label="Atrasada" icon={<AlertTriangle size={12} color="#FF7A6E" />} />
          ) : (
            <Chip tone="warn" label="Pendiente" icon={<Clock size={12} color={colors.warn} />} />
          )}
        </View>

        {/* Desglose financiero */}
        <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4, borderRadius: 24, backgroundColor: colors.ink, borderWidth: 1, borderColor: colors.line }}>
          <Text style={{ color: colors.muted2, fontFamily: fonts.medium, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
            Desglose por componente
          </Text>
          <BreakdownRow label="Interés ordinario" paid={shown.interes_pagado} expected={shown.interes_esperado} paidColor={colors.okSoft} />
          <BreakdownRow label="Capital" paid={shown.capital_pagado} expected={shown.capital_esperado} paidColor={colors.okSoft} />
          <BreakdownRow label="Mora" paid={shown.mora_pagada} expected={shown.mora_acumulada} paidColor={colors.dangerSoft} last />
        </View>

        {/* Abonos aplicados */}
        <Text style={{ color: colors.muted2, fontFamily: fonts.medium, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: 4 }}>
          Abonos aplicados a esta cuota
        </Text>

        {loading ? (
          <View style={{ paddingVertical: 24, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={colors.warm} />
          </View>
        ) : allocations.length === 0 ? (
          <View style={{ padding: 16, borderRadius: 20, backgroundColor: colors.ink, borderWidth: 1, borderColor: colors.line }}>
            <Text style={{ color: colors.muted2, fontFamily: fonts.regular, fontSize: 13, textAlign: 'center' }}>
              Aún no se han registrado abonos sobre esta obligación.
            </Text>
          </View>
        ) : (
          allocations.map((item) => (
            <AnimatedPressable
              key={item.id}
              onPress={() => {
                onClose()
                router.push(`/pagos/${item.pago_id}`)
              }}
              accessibilityRole="button"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                padding: 14,
                borderRadius: 20,
                backgroundColor: colors.ink,
                borderWidth: 1,
                borderColor: colors.line,
              }}
            >
              <View style={{ flexShrink: 1, gap: 3 }}>
                <Text style={{ color: colors.warm, fontFamily: fonts.medium, fontSize: 14 }}>
                  {item.componente === 'interes'
                    ? 'Abono a interés ordinario'
                    : item.componente === 'capital'
                      ? 'Abono a capital'
                      : 'Abono a mora'}
                </Text>
                <Text style={{ color: colors.muted2, fontFamily: fonts.regular, fontSize: 12 }}>
                  {(item.pago?.fecha_recepcion || item.creado_en || '').split('T')[0]} · {item.pago?.metodo_pago || 'efectivo'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ color: colors.okSoft, fontFamily: fonts.semibold, fontSize: 14 }}>+ {formatCOP(item.monto)}</Text>
                <ExternalLink size={14} color={colors.muted} />
              </View>
            </AnimatedPressable>
          ))
        )}
      </ScrollView>

      {/* Acciones */}
      <View style={{ flexDirection: 'row', gap: 10, paddingTop: 12 }}>
        <Button label="Cerrar" variant="ghost" onPress={onClose} style={{ flex: 1 }} />
        {!shown.esta_liquidada && onRegisterPayment && (
          <Button
            label="Registrar pago"
            onPress={() => {
              onClose()
              onRegisterPayment()
            }}
            icon={<CreditCard size={16} color="#000000" />}
            style={{ flex: 1 }}
          />
        )}
      </View>
    </Sheet>
  )
}
