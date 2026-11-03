import React from 'react'
import { View, Text, ScrollView, Pressable, Linking } from 'react-native'
import { useRouter } from 'expo-router'
import { Users, Phone, ChevronRight, Plus, ShieldCheck, AlertCircle } from 'lucide-react-native'
import { ActiveBorrowerSummary } from '../types'
import { formatCOP } from '../../../shared/utils/currency'
import { AnimatedPressable } from '../../../shared/components/AnimatedPressable'
import Animated, { FadeInRight, useReducedMotion } from 'react-native-reanimated'

interface QuickBorrowersSectionProps {
  readonly borrowers: ActiveBorrowerSummary[]
}

export const QuickBorrowersSection: React.FC<QuickBorrowersSectionProps> = ({ borrowers }) => {
  const router = useRouter()
  const reducedMotion = useReducedMotion()

  const handleCall = (phone?: string | null) => {
    if (!phone) return
    const cleaned = phone.replace(/\s+/g, '')
    Linking.openURL(`tel:${cleaned}`).catch(() => {})
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  return (
    <View className="mb-6">
      {/* Cabecera */}
      <View className="flex-row items-center justify-between mb-3 px-1">
        <View className="flex-row items-center">
          <View className="w-6 h-6 rounded-lg bg-[#191316] border border-[#2F191D] items-center justify-center mr-2">
            <Users size={13} color="#FF7854" />
          </View>
          <Text className="text-white text-base font-bold tracking-tight">
            Prestatarios Activos
          </Text>
        </View>

        <Pressable
          onPress={() => router.navigate('/personas')}
          className="flex-row items-center"
        >
          <Text className="text-[#FF7854] text-xs font-semibold mr-1">
            Ver directorio
          </Text>
          <ChevronRight size={13} color="#FF7854" />
        </Pressable>
      </View>

      {/* Lista Horizontal o Estado Vacío */}
      {borrowers.length === 0 ? (
        <View key="borrowers-empty" className="bg-[#12131A] border border-[#1E2030] rounded-2xl p-4 items-center">
          <Text className="text-zinc-400 text-xs text-center mb-3">
            Aún no tienes prestatarios con créditos activos en tu cartera.
          </Text>
          <AnimatedPressable
            onPress={() => router.push('/personas/crear')}
            className="flex-row items-center bg-[#D34524] px-4 py-2 rounded-xl"
          >
            <Plus size={14} color="#FFFFFF" strokeWidth={2.5} />
            <Text className="text-white text-xs font-bold ml-1.5">
              Registrar primer prestatario
            </Text>
          </AnimatedPressable>
        </View>
      ) : (
        <ScrollView
          key="borrowers-list"
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 2 }}
          className="-mx-2"
        >
          <View className="flex-row gap-3">
            {borrowers.map((b, index) => (
              <Animated.View
                key={b.personaId}
                entering={
                  reducedMotion
                    ? undefined
                    : FadeInRight.delay(index * 60).duration(380).springify().damping(18).stiffness(160)
                }
              >
                <AnimatedPressable
                  onPress={() => router.push(`/personas/${b.personaId}`)}
                  className="bg-[#12131A] border border-[#1E2030] active:border-[#FF7854]/50 rounded-2xl p-4 w-44 shadow-lg shadow-black"
                >
                  {/* Avatar y Estado */}
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="w-10 h-10 rounded-full bg-[#191316] border border-[#2F191D] items-center justify-center">
                      <Text className="text-[#FF7854] font-bold text-sm font-mono">
                        {getInitials(b.nombre)}
                      </Text>
                    </View>

                    {b.hasOverdue ? (
                      <View key="badge-overdue" className="bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-full flex-row items-center">
                        <AlertCircle size={10} color="#FB3758" />
                        <Text className="text-rose-400 text-[9px] font-bold ml-1">
                          Atraso
                        </Text>
                      </View>
                    ) : (
                      <View key="badge-ontime" className="bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full flex-row items-center">
                        <ShieldCheck size={10} color="#10B981" />
                        <Text className="text-emerald-400 text-[9px] font-bold ml-1">
                          Al día
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Nombre y Deuda */}
                  <Text className="text-white text-xs font-bold mb-0.5" numberOfLines={1}>
                    {b.nombre}
                  </Text>
                  <Text className="text-zinc-500 text-[10px] mb-2 font-mono">
                    {b.activeLoansCount} {b.activeLoansCount === 1 ? 'crédito' : 'créditos'}
                  </Text>

                  <View className="pt-2 border-t border-[#1C1E2B] flex-row items-center justify-between">
                    <View>
                      <Text className="text-zinc-500 text-[9px]">Saldo total</Text>
                      <Text className="text-white text-xs font-bold font-mono">
                        {formatCOP(b.totalSaldoPendiente)}
                      </Text>
                    </View>

                    {b.telefono && (
                      <Pressable
                        onPress={() => handleCall(b.telefono)}
                        className="w-7 h-7 rounded-lg bg-[#181A26] border border-[#26293D] items-center justify-center"
                        hitSlop={6}
                      >
                        <Phone size={12} color="#9CA3AF" />
                      </Pressable>
                    )}
                  </View>
                </AnimatedPressable>
              </Animated.View>
            ))}

            {/* Tarjeta de Acción Rápida: Agregar Persona */}
            <Pressable
              onPress={() => router.push('/personas/crear')}
              className="bg-[#0D0E14] border border-dashed border-[#232433] rounded-2xl p-4 w-36 items-center justify-center"
            >
              <View className="w-9 h-9 rounded-full bg-[#181A26] items-center justify-center mb-2">
                <Plus size={16} color="#FF7854" />
              </View>
              <Text className="text-zinc-300 text-xs font-bold text-center">
                + Nueva Persona
              </Text>
              <Text className="text-zinc-500 text-[9px] text-center mt-0.5">
                Registrar prestatario
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      )}
    </View>
  )
}

