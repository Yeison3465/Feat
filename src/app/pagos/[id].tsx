import React, { useEffect, useState } from 'react'
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  ArrowLeft,
  CheckCircle2,
  Calendar,
  CreditCard,
  FileText,
  ShieldCheck,
} from 'lucide-react-native'
import { supabase } from '../../lib/supabase'
import { formatCOP, formatDateFriendly } from '../../shared/utils/currency'
import { getSafeBottomInset } from '../../shared/utils/responsive'
import { ErrorMessage } from '../../shared/components/ErrorMessage'

export default function DetallePagoScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()

  const [pago, setPago] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadPago() {
      try {
        setLoading(true)
        setError(null)
        const { data, error: err } = await supabase
          .from('pagos')
          .select('*, distribucion_pagos(*), prestamos(id, capital_original, personas(nombre))')
          .eq('id', id)
          .single()

        if (err) throw err
        setPago(data)
      } catch (e: any) {
        setError(e.message || 'Error al consultar el comprobante de pago.')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadPago()
    }
  }, [id])

  if (loading) {
    return (
      <View className="flex-1 bg-[#060709] items-center justify-center">
        <ActivityIndicator size="small" color="#FF7854" />
        <Text className="text-zinc-400 text-xs mt-3">Cargando comprobante...</Text>
      </View>
    )
  }

  if (error || !pago) {
    return (
      <View
        style={{ paddingTop: Math.max(insets.top, 16) }}
        className="flex-1 bg-[#060709] px-6 justify-center items-center"
      >
        <ErrorMessage message={error || 'Comprobante no encontrado'} onRetry={() => router.back()} />
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

  return (
    <View style={{ paddingTop: Math.max(insets.top, 12) }} className="flex-1 bg-[#060709]">
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: getSafeBottomInset(insets.bottom, 20) + 20,
        }}
        className="px-6 max-w-md mx-auto w-full"
      >
        {/* Cabecera */}
        <View className="flex-row items-center justify-between mt-2 mb-6">
          <Pressable
            onPress={() => router.back()}
            className="flex-row items-center py-2 pr-4"
            hitSlop={10}
          >
            <ArrowLeft size={20} color="#9CA3AF" />
            <Text className="text-zinc-400 text-sm font-medium ml-2">Volver</Text>
          </Pressable>

          <Text className="text-zinc-500 text-xs font-mono uppercase tracking-widest">
            Comprobante
          </Text>
        </View>

        {/* Tarjeta Hero del Pago */}
        <View className="bg-[#12131A] border border-[#1E2030] rounded-3xl p-6 items-center mb-5 shadow-2xl shadow-black">
          <View className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 items-center justify-center mb-3">
            <CheckCircle2 size={32} color="#10B981" />
          </View>
          <Text className="text-white text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Pago confirmado
          </Text>
          <Text className="text-white text-3xl font-extrabold font-mono mt-1 mb-1">
            {formatCOP(pago.monto)}
          </Text>
          <Text className="text-zinc-500 text-xs font-mono">COP</Text>

          <View className="mt-4 pt-3 border-t border-[#1C1E2B] w-full flex-row justify-between items-center">
            <Text className="text-zinc-400 text-xs">Prestatario:</Text>
            <Text className="text-white text-xs font-bold">{borrowerName}</Text>
          </View>
        </View>

        {/* Detalles de la Transacción */}
        <View className="bg-[#12131A] border border-[#1E2030] rounded-3xl p-5 mb-5 shadow-xl shadow-black">
          <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Detalles de transacción
          </Text>

          <View className="space-y-3">
            <View className="flex-row justify-between items-center py-2 border-b border-[#1A1C29]">
              <Text className="text-zinc-400 text-xs">Fecha de recepción</Text>
              <Text className="text-white text-xs font-mono font-medium">
                {pago.fecha_recepcion}
              </Text>
            </View>

            <View className="flex-row justify-between items-center py-2 border-b border-[#1A1C29]">
              <Text className="text-zinc-400 text-xs">Método de pago</Text>
              <Text className="text-white text-xs font-medium capitalize">
                {pago.metodo_pago}
              </Text>
            </View>

            <View className="flex-row justify-between items-center py-2">
              <Text className="text-zinc-400 text-xs">ID de pago</Text>
              <Text className="text-zinc-500 text-[11px] font-mono">
                {pago.id.slice(0, 8)}...
              </Text>
            </View>
          </View>
        </View>

        {/* Distribución del Recaudo */}
        {distribuciones.length > 0 && (
          <View className="bg-[#12131A] border border-[#1E2030] rounded-3xl p-5 mb-5 shadow-xl shadow-black">
            <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-3">
              Imputación del dinero
            </Text>

            {distribuciones.map((dist: any) => (
              <View
                key={dist.id}
                className="flex-row justify-between items-center py-2 border-b border-[#1A1C29] last:border-b-0"
              >
                <Text className="text-zinc-300 text-xs capitalize">
                  {dist.componente === 'interes_ordinario'
                    ? 'Interés ordinario'
                    : dist.componente === 'capital'
                    ? 'Abono a capital'
                    : dist.componente}
                </Text>
                <Text className="text-white text-xs font-mono font-bold">
                  {formatCOP(dist.monto)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Notas */}
        {pago.notas && (
          <View className="bg-[#12131A] border border-[#1E2030] rounded-2xl p-4 mb-4">
            <Text className="text-zinc-500 text-[11px] uppercase font-semibold mb-1">
              Notas privadas
            </Text>
            <Text className="text-zinc-300 text-xs leading-relaxed">
              {pago.notas}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}
