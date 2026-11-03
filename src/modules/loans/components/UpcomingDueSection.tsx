import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { CalendarClock, ChevronRight, HandCoins, Calendar } from 'lucide-react-native'
import { ObligationItem } from '../types'
import { formatCOP, formatDateFriendly } from '../../../shared/utils/currency'
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated'

interface UpcomingDueSectionProps {
  readonly obligations: ObligationItem[]
}

export const UpcomingDueSection: React.FC<UpcomingDueSectionProps> = ({ obligations }) => {
  const router = useRouter()
  const reducedMotion = useReducedMotion()

  const displayed = obligations.slice(0, 3)

  if (displayed.length === 0) {
    return null
  }

  return (
    <Animated.View
      entering={reducedMotion ? undefined : FadeInDown.delay(140).duration(420).springify().damping(18).stiffness(160)}
      className="mb-6"
    >
      <View className="flex-row items-center justify-between mb-3 px-1">
        <View className="flex-row items-center">
          <CalendarClock size={16} color="#FF7854" />
          <Text className="text-white text-base font-bold tracking-tight ml-2">
            Próximos Vencimientos
          </Text>
        </View>
        <Pressable
          onPress={() => router.push({ pathname: '/vencimientos', params: { tab: 'proximos' } })}
        >
          <Text className="text-[#FF7854] text-xs font-semibold">
            Ver agenda ({obligations.length})
          </Text>
        </Pressable>
      </View>

      <View className="space-y-2.5">
        {displayed.map((item) => {
          const isToday = item.daysDiff === 0
          const shortCode = `#PR-${item.loan.id.substring(0, 4).toUpperCase()}`

          return (
            <View
              key={item.installment.id}
              className={`bg-[#12131A] border rounded-2xl p-3.5 flex-row items-center justify-between mb-2.5 ${
                isToday ? 'border-amber-500/40 bg-[#16141B]' : 'border-[#1E2030]'
              }`}
            >
              <View className="flex-1 mr-3">
                <View className="flex-row items-center gap-1.5 mb-1">
                  <Text className="text-white text-sm font-bold" numberOfLines={1}>
                    {item.borrowerName}
                  </Text>
                  <Text className="text-zinc-500 text-[10px] font-mono">
                    {shortCode}
                  </Text>
                </View>

                <View className="flex-row items-center gap-2">
                  <View className="flex-row items-center">
                    <Calendar size={11} color="#9CA3AF" />
                    <Text className="text-zinc-400 text-[11px] ml-1">
                      {formatDateFriendly(item.installment.fecha_vencimiento)}
                    </Text>
                  </View>

                  <View
                    className={`px-2 py-0.5 rounded-full ${
                      isToday ? 'bg-amber-500/15' : 'bg-[#1C1E2B]'
                    }`}
                  >
                    <Text
                      className={`text-[9px] font-bold ${
                        isToday ? 'text-amber-400' : 'text-zinc-300'
                      }`}
                    >
                      {isToday ? 'VENCE HOY' : `En ${item.daysDiff}d`}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="items-end gap-1.5">
                <Text className="text-white text-xs font-bold font-mono">
                  {formatCOP(item.saldoExigible)}
                </Text>

                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/pagos/registrar',
                      params: { prestamoId: item.loan.id },
                    })
                  }
                  className="bg-[#D34524] active:bg-[#E54F2C] px-2.5 py-1 rounded-lg flex-row items-center"
                >
                  <HandCoins size={11} color="#FFFFFF" />
                  <Text className="text-white text-[10px] font-bold ml-1">
                    Cobrar
                  </Text>
                </Pressable>
              </View>
            </View>
          )
        })}
      </View>
    </Animated.View>
  )
}

