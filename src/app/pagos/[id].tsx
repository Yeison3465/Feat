import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
  AlertTriangle,
  ShieldCheck,
  ExternalLink,
  X,
} from 'lucide-react-native'
import { paymentsService } from '../../modules/payments/services/payments.service'
import { useLoans } from '../../modules/loans/hooks/useLoans'
import { formatCOP } from '../../shared/utils/currency'
import { getSafeBottomInset } from '../../shared/utils/responsive'
import { ErrorMessage } from '../../shared/components/ErrorMessage'
import Animated, { FadeInDown, FadeInUp, ZoomIn, useReducedMotion } from 'react-native-reanimated'
import { SkeletonCardList } from '../../shared/components/SkeletonBox'

export default function DetallePagoScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const reducedMotion = useReducedMotion()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { reload: reloadLoans } = useLoans()

  const [pago, setPago] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal de Reverso (FL-10)
  const [showReverseModal, setShowReverseModal] = useState(false)
  const [motivoReverso, setMotivoReverso] = useState('')
  const [reverseError, setReverseError] = useState<string | null>(null)
  const [reversing, setReversing] = useState(false)

  const loadPago = useCallback(async () => {
    if (!id) return
    try {
      setLoading(true)
      setError(null)
      const data = await paymentsService.getPaymentById(id)
      setPago(data)
    } catch (e: any) {
      setError(e.message || 'Error al consultar el comprobante de pago.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadPago()
  }, [loadPago])

  const handleConfirmReverse = async () => {
    if (!pago) return
    if (!motivoReverso.trim()) {
      setReverseError('Debes especificar el motivo de la corrección.')
      return
    }

    try {
      setReversing(true)
      setReverseError(null)
      await paymentsService.reversePayment(pago.id, motivoReverso.trim())
      setShowReverseModal(false)
      setMotivoReverso('')
      await Promise.all([loadPago(), reloadLoans()])
    } catch (e: any) {
      setReverseError(e.message || 'No se pudo reversar el pago.')
    } finally {
      setReversing(false)
    }
  }

  if (loading) {
    return (
      <View
        style={{ paddingTop: Math.max(insets.top, 20) }}
        className="flex-1 bg-[#060709] px-6 max-w-md mx-auto w-full"
      >
        <SkeletonCardList count={2} />
      </View>
    )
  }

  if (error || !pago) {
    return (
      <View
        style={{ paddingTop: Math.max(insets.top, 16) }}
        className="flex-1 bg-[#060709] px-6 justify-center items-center"
      >
        <ErrorMessage message={error || 'Comprobante no encontrado'} onRetry={loadPago} />
        <Pressable
          onPress={() => router.back()}
          className="mt-4 bg-[#151622] px-4 py-2 rounded-xl border border-[#232433]"
        >
          <Text className="text-[#FF7854] text-xs font-semibold">Volver</Text>
        </Pressable>
      </View>
    )
  }

  const borrowerName = pago.prestamos?.personas?.nombre || 'Prestatario'
  const distribuciones = pago.distribucion_pagos || []
  const isReversalEntry = Boolean(pago.es_reverso)
  const isReversed = Boolean(pago.esta_reversado)
  const fechaCorta = (pago.fecha_recepcion || '').split('T')[0]

  const getComponentLabel = (comp: string) => {
    if (comp === 'interes' || comp === 'interes_ordinario') return 'Interés ordinario'
    if (comp === 'capital') return 'Abono a capital'
    if (comp === 'mora') return 'Cargo por mora'
    return comp
  }

  return (
    <View style={{ paddingTop: Math.max(insets.top, 12) }} className="flex-1 bg-[#060709]">
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: getSafeBottomInset(insets.bottom, 24) + 20,
        }}
        className="px-6 max-w-md mx-auto w-full"
      >
        {/* Cabecera */}
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
            <Text className="text-zinc-400 text-sm font-medium ml-2">Volver</Text>
          </Pressable>

          <Text className="text-zinc-500 text-xs font-mono uppercase tracking-widest">
            Comprobante #{pago.id.slice(0, 6).toUpperCase()}
          </Text>
        </Animated.View>

        {/* Tarjeta Hero del Pago */}
        <Animated.View
          entering={FadeInDown.delay(70).duration(300).springify()}
          className="bg-[#12131A] border border-[#1E2030] rounded-3xl p-6 items-center mb-5 shadow-2xl shadow-black"
        >
          {isReversalEntry ? (
            <View className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 items-center justify-center mb-3">
              <RotateCcw size={30} color="#F59E0B" />
            </View>
          ) : isReversed ? (
            <View className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 items-center justify-center mb-3">
              <AlertTriangle size={30} color="#FB3758" />
            </View>
          ) : (
            <View className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 items-center justify-center mb-3">
              <CheckCircle2 size={32} color="#10B981" />
            </View>
          )}

          <Text
            className={`text-xs font-bold uppercase tracking-wider ${
              isReversalEntry
                ? 'text-amber-400'
                : isReversed
                ? 'text-[#FB3758]'
                : 'text-emerald-400'
            }`}
          >
            {isReversalEntry
              ? 'Asiento de Reverso Contable'
              : isReversed
              ? 'Pago Reversado / Anulado'
              : 'Pago Confirmado'}
          </Text>

          <Text
            className={`text-3xl font-extrabold font-mono mt-1.5 mb-1 ${
              isReversed ? 'text-zinc-500 line-through' : 'text-white'
            }`}
          >
            {isReversalEntry ? `- ${formatCOP(pago.monto)}` : formatCOP(pago.monto)}
          </Text>
          <Text className="text-zinc-500 text-xs font-mono">COP</Text>

          <View className="mt-4 pt-3 border-t border-[#1C1E2B] w-full flex-row justify-between items-center">
            <Text className="text-zinc-400 text-xs">Prestatario:</Text>
            <Pressable
              onPress={() => router.push(`/prestamos/${pago.prestamo_id}`)}
              className="flex-row items-center gap-1.5 active:opacity-75"
            >
              <Text className="text-white text-xs font-bold">{borrowerName}</Text>
              <ExternalLink size={13} color="#FF7854" />
            </Pressable>
          </View>
        </Animated.View>

        {/* Alerta de Reverso si este pago fue anulado */}
        {isReversed && pago.reverso_info && (
          <Animated.View
            entering={FadeInDown.delay(110).duration(280)}
            className="bg-rose-950/25 border border-rose-500/35 rounded-2xl p-4 mb-5"
          >
            <View className="flex-row items-center gap-2 mb-1">
              <RotateCcw size={15} color="#FB3758" />
              <Text className="text-[#FB3758] text-xs font-bold">
                Operación reversada contablemente
              </Text>
            </View>
            <Text className="text-zinc-300 text-xs leading-4 mt-1">
              Motivo: {pago.reverso_info.notas || 'Corrección de operación'}
            </Text>
            <Pressable
              onPress={() => router.push(`/pagos/${pago.reverso_info.id}`)}
              className="mt-2.5 self-start bg-[#161722] border border-[#252738] px-3 py-1.5 rounded-xl"
            >
              <Text className="text-[#FF7854] text-[11px] font-semibold">
                Ver comprobante del reverso →
              </Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Detalles de la Transacción */}
        <Animated.View
          entering={FadeInUp.delay(140).duration(300).springify()}
          className="bg-[#12131A] border border-[#1E2030] rounded-3xl p-5 mb-5 shadow-xl shadow-black"
        >
          <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Detalles de transacción
          </Text>

          <View className="space-y-3">
            <View className="flex-row justify-between items-center py-2 border-b border-[#1A1C29]">
              <Text className="text-zinc-400 text-xs">Fecha de recepción</Text>
              <Text className="text-white text-xs font-mono font-medium">
                {fechaCorta}
              </Text>
            </View>

            <View className="flex-row justify-between items-center py-2 border-b border-[#1A1C29]">
              <Text className="text-zinc-400 text-xs">Método de pago</Text>
              <Text className="text-white text-xs font-medium capitalize">
                {pago.metodo_pago}
              </Text>
            </View>

            <View className="flex-row justify-between items-center py-2">
              <Text className="text-zinc-400 text-xs">ID de auditoría</Text>
              <Text className="text-zinc-500 text-[11px] font-mono">
                {pago.id.slice(0, 12)}...
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Distribución del Recaudo */}
        {distribuciones.length > 0 && (
          <Animated.View
            entering={FadeInUp.delay(190).duration(300).springify()}
            className="bg-[#12131A] border border-[#1E2030] rounded-3xl p-5 mb-5 shadow-xl shadow-black"
          >
            <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-3">
              Imputación contable del dinero
            </Text>

            {distribuciones.map((dist: any) => (
              <View
                key={dist.id}
                className="flex-row justify-between items-center py-2.5 border-b border-[#1A1C29] last:border-b-0"
              >
                <Text className="text-zinc-300 text-xs font-medium">
                  {getComponentLabel(dist.componente)}
                </Text>
                <Text
                  className={`text-xs font-mono font-bold ${
                    isReversed
                      ? 'text-zinc-500 line-through'
                      : dist.componente === 'capital'
                      ? 'text-emerald-400'
                      : 'text-[#FF7854]'
                  }`}
                >
                  {formatCOP(dist.monto)}
                </Text>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Notas */}
        {pago.notas && (
          <Animated.View
            entering={FadeInUp.delay(220).duration(300)}
            className="bg-[#12131A] border border-[#1E2030] rounded-2xl p-4 mb-5"
          >
            <Text className="text-zinc-500 text-[11px] uppercase font-semibold mb-1">
              Notas / Motivo
            </Text>
            <Text className="text-zinc-300 text-xs leading-relaxed">
              {pago.notas}
            </Text>
          </Animated.View>
        )}

        {/* Acción: Corregir / Reversar Operación (FL-10) */}
        {!isReversalEntry && !isReversed && (
          <Animated.View entering={FadeInUp.delay(260).duration(300)} className="mt-2 mb-4">
            <Pressable
              onPress={() => {
                setReverseError(null)
                setShowReverseModal(true)
              }}
              className="flex-row items-center justify-center p-4 rounded-2xl border border-rose-950/60 bg-rose-950/20 active:bg-rose-950/40"
            >
              <RotateCcw size={16} color="#FB3758" />
              <Text className="text-[#FB3758] text-xs font-bold ml-2">
                Reversar / Anular este pago
              </Text>
            </Pressable>
            <View className="flex-row items-center justify-center gap-1.5 mt-2.5 px-4">
              <ShieldCheck size={13} color="#6B7280" />
              <Text className="text-zinc-500 text-[10px] text-center">
                Los pagos confirmados no se borran: al reversar se crea un movimiento compensatorio auditable.
              </Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Modal de Confirmación de Reverso (FL-10) */}
      <Modal
        visible={showReverseModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!reversing) setShowReverseModal(false)
        }}
      >
        <View className="flex-1 bg-black/80 justify-center px-6">
          <Animated.View
            entering={reducedMotion ? undefined : ZoomIn.duration(220).springify()}
            className="bg-[#12131A] border border-[#232433] rounded-3xl p-6 max-w-md w-full mx-auto"
          >
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2">
                <View className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 items-center justify-center">
                  <RotateCcw size={18} color="#FB3758" />
                </View>
                <Text className="text-white text-base font-bold">
                  Reversar pago
                </Text>
              </View>
              <Pressable
                onPress={() => !reversing && setShowReverseModal(false)}
                hitSlop={10}
              >
                <X size={18} color="#9CA3AF" />
              </Pressable>
            </View>

            <Text className="text-zinc-400 text-xs leading-4 mb-4">
              Se registrará un asiento compensatorio por{' '}
              <Text className="text-white font-mono font-bold">{formatCOP(pago.monto)} COP</Text>{' '}
              y se restaurará el saldo pendiente de las cuotas del préstamo. El registro original se
              conservará para auditoría.
            </Text>

            <Text className="text-zinc-300 text-xs font-medium mb-2">
              Motivo de la corrección <Text className="text-[#FB3758]">*</Text>
            </Text>
            <View className="bg-[#0A0B10] border border-[#232433] rounded-2xl px-3.5 py-2.5 mb-3">
              <TextInput
                value={motivoReverso}
                onChangeText={(t) => {
                  setMotivoReverso(t)
                  if (reverseError) setReverseError(null)
                }}
                placeholder="Ej. Error al digitar el monto recibido..."
                placeholderTextColor="#4B5563"
                multiline
                numberOfLines={2}
                className="text-white text-xs min-h-[48px]"
              />
            </View>

            {reverseError && (
              <Text className="text-[#FB3758] text-xs mb-3">{reverseError}</Text>
            )}

            <View className="flex-row gap-3 mt-2">
              <Pressable
                onPress={() => setShowReverseModal(false)}
                disabled={reversing}
                className="flex-1 py-3 rounded-xl bg-[#1A1B26] border border-[#252738] items-center"
              >
                <Text className="text-zinc-300 text-xs font-semibold">Cancelar</Text>
              </Pressable>

              <Pressable
                onPress={handleConfirmReverse}
                disabled={reversing}
                className="flex-1 py-3 rounded-xl bg-[#FB3758] active:bg-rose-600 items-center justify-center flex-row"
              >
                {reversing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-xs font-bold">Confirmar reverso</Text>
                )}
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  )
}
