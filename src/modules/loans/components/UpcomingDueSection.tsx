import React from 'react'
import { View, Text } from 'react-native'
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  SharedValue,
} from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import { ArrowRight, Calendar } from 'lucide-react-native'
import { ObligationItem } from '../types'
import { formatCOP, formatDateFriendly } from '../../../shared/utils/currency'
import { AnimatedPressable } from '../../../shared/components/AnimatedPressable'
import { AppText } from '../../../shared/ui/AppText'
import { Avatar } from '../../../shared/ui/Avatar'
import { colors, fonts } from '../../../shared/theme/tokens'

interface UpcomingDueSectionProps {
  readonly obligations: ObligationItem[]
}

const CARD_WIDTH = 292
const GAP = 12
const SNAP = CARD_WIDTH + GAP
const GOLD = '#A6824A'

// Punto del indicador: se ensancha y se dora cuando su tarjeta está al centro. Sigue el desplazamiento sin re-renderizar.
const Dot: React.FC<{ readonly index: number; readonly scrollX: SharedValue<number> }> = ({ index, scrollX }) => {
  const style = useAnimatedStyle(() => {
    const input = [(index - 1) * SNAP, index * SNAP, (index + 1) * SNAP]
    return {
      width: interpolate(scrollX.value, input, [6, 20, 6], Extrapolation.CLAMP),
      backgroundColor: interpolateColor(scrollX.value, input, ['#3A3A3F', GOLD, '#3A3A3F']),
    }
  })
  return <Animated.View style={[{ height: 6, borderRadius: 3 }, style]} />
}

export const UpcomingDueSection: React.FC<UpcomingDueSectionProps> = ({ obligations }) => {
  const router = useRouter()
  const scrollX = useSharedValue(0)
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x
  })

  const displayed = obligations.slice(0, 3)

  if (displayed.length === 0) {
    return null
  }

  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <AppText variant="sec">Próximos vencimientos</AppText>
        <AnimatedPressable
          onPress={() => router.push({ pathname: '/vencimientos', params: { tab: 'proximos' } })}
          accessibilityRole="link"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44 }}
        >
          <AppText variant="amt" style={{ fontSize: 13 }}>
            Ver agenda ({obligations.length})
          </AppText>
          <ArrowRight size={16} color={colors.warm} />
        </AnimatedPressable>
      </View>

      {/* Carrusel dorado: tarjetas blancas con brillo antiguo, se detienen una a una */}
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP}
        snapToAlignment="start"
        decelerationRate="fast"
        onScroll={onScroll}
        scrollEventThrottle={16}
        accessibilityLabel="Próximos vencimientos"
        style={{ marginHorizontal: -16, marginBottom: -30 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 46, gap: GAP }}
      >
        {displayed.map((item) => {
          const isToday = item.daysDiff === 0
          const shortCode = `#PR-${item.loan.id.substring(0, 4).toUpperCase()}`
          return (
            <View
              key={item.installment.id}
              style={{
                width: CARD_WIDTH,
                backgroundColor: '#FFFFFF',
                borderRadius: 28,
                padding: 16,
                gap: 14,
                boxShadow: isToday
                  ? '0 0 0 1.5px rgba(166,130,74,0.8), 0 6px 18px rgba(166,130,74,0.42), 0 24px 48px -8px rgba(166,130,74,0.62)'
                  : '0 0 0 1px rgba(166,130,74,0.5), 0 4px 14px rgba(166,130,74,0.28), 0 18px 40px -10px rgba(166,130,74,0.5)',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    height: 28,
                    paddingHorizontal: 12,
                    borderRadius: 999,
                    backgroundColor: '#F6EEDD',
                    flexShrink: 1,
                  }}
                >
                  <Calendar size={13} color="#7A5B28" />
                  <Text numberOfLines={1} style={{ color: '#7A5B28', fontFamily: fonts.medium, fontSize: 12 }}>
                    {formatDateFriendly(item.installment.fecha_vencimiento)}
                  </Text>
                </View>
                <Avatar name={item.borrowerName} size={44} ring />
              </View>

              <View style={{ gap: 2 }}>
                <Text numberOfLines={1} style={{ color: colors.onLight, fontFamily: fonts.medium, fontSize: 19, lineHeight: 24, letterSpacing: -0.19 }}>
                  {item.borrowerName}
                </Text>
                <Text style={{ color: '#6E6E74', fontFamily: fonts.regular, fontSize: 12, lineHeight: 16 }}>{shortCode}</Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                  style={{ color: colors.onLight, fontFamily: fonts.semibold, fontSize: 30, lineHeight: 32, letterSpacing: -1.2, flexShrink: 1 }}
                >
                  {formatCOP(item.saldoExigible)}
                </Text>
                <Text style={{ color: '#8A6A33', fontFamily: fonts.medium, fontSize: 13, marginLeft: 6 }}>COP</Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <View
                  style={{
                    height: 28,
                    paddingHorizontal: 12,
                    borderRadius: 999,
                    justifyContent: 'center',
                    backgroundColor: isToday ? colors.app : '#F6EEDD',
                  }}
                >
                  <Text
                    style={{
                      color: isToday ? '#F0DDB0' : '#7A5B28',
                      fontFamily: fonts.medium,
                      fontSize: 11,
                      letterSpacing: isToday ? 0.44 : 0,
                    }}
                  >
                    {isToday ? 'VENCE HOY' : `En ${item.daysDiff}d`}
                  </Text>
                </View>

                <AnimatedPressable
                  onPress={() =>
                    router.push({
                      pathname: '/pagos/registrar',
                      params: { prestamoId: item.loan.id },
                    })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`Cobrar a ${item.borrowerName}`}
                  style={{
                    height: 44,
                    paddingHorizontal: 16,
                    borderRadius: 999,
                    backgroundColor: colors.app,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontFamily: fonts.medium, fontSize: 13 }}>Cobrar</Text>
                  <ArrowRight size={16} color="#FFFFFF" />
                </AnimatedPressable>
              </View>
            </View>
          )
        })}
      </Animated.ScrollView>

      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{ flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: -16 }}
      >
        {displayed.map((item, i) => (
          <Dot key={item.installment.id} index={i} scrollX={scrollX} />
        ))}
      </View>
    </View>
  )
}
