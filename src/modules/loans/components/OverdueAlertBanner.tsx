import React from 'react'
import { View, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react-native'
import { AnimatedPressable } from '../../../shared/components/AnimatedPressable'
import { Card } from '../../../shared/ui/Card'
import { colors, fonts } from '../../../shared/theme/tokens'

interface OverdueAlertBannerProps {
  readonly personasAtrasadasCount: number
  readonly cuotasVencidasCount: number
  readonly saldoMoraVencido: number
}

export const OverdueAlertBanner: React.FC<OverdueAlertBannerProps> = ({
  personasAtrasadasCount,
  cuotasVencidasCount,
}) => {
  const router = useRouter()

  // Cartera al día: aviso tranquilo en negro laca, sin alarma
  if (personasAtrasadasCount <= 0 && cuotasVencidasCount <= 0) {
    return (
      <Card variant="ink" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: 'rgba(127,214,164,0.14)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ShieldCheck size={16} color={colors.ok} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ color: colors.okSoft, fontFamily: fonts.semibold, fontSize: 14 }}>Cartera 100% al día</Text>
          <Text style={{ color: '#B4B4B9', fontFamily: fonts.regular, fontSize: 12, lineHeight: 16 }}>
            No tienes ningún prestatario con obligaciones vencidas hoy.
          </Text>
        </View>
      </Card>
    )
  }

  const personas = `${personasAtrasadasCount} ${personasAtrasadasCount === 1 ? 'persona' : 'personas'}`
  const cuotas = `${cuotasVencidasCount} ${cuotasVencidasCount === 1 ? 'cuota vencida' : 'cuotas vencidas'} pendientes por cobrar`

  return (
    <AnimatedPressable
      onPress={() => router.push({ pathname: '/vencimientos', params: { tab: 'atrasados' } })}
      accessibilityRole="button"
      accessibilityLabel={`Atención requerida: ${personas}, ${cuotas}`}
    >
      {/* Tarjeta blanca con brillo rojo: lo más urgente de la pantalla */}
      <Card
        variant="white"
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          gap: 12,
          padding: 16,
          boxShadow:
            '0 0 0 1px rgba(255,107,94,0.45), 0 4px 14px rgba(255,107,94,0.3), 0 20px 48px -8px rgba(255,107,94,0.5)',
        }}
      >
        <View style={{ flex: 1, gap: 10 }}>
          <Text style={{ color: '#B3261E', fontFamily: fonts.medium, fontSize: 12, lineHeight: 16 }}>Atención requerida</Text>
          <Text
            style={{
              color: '#C8372A',
              fontFamily: fonts.semibold,
              fontSize: 32,
              lineHeight: 34,
              letterSpacing: -1.1,
              marginTop: 18,
            }}
          >
            {personas}
          </Text>
          <View style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: '#FFF4F2' }}>
            <Text style={{ color: '#B3261E', fontFamily: fonts.medium, fontSize: 11, lineHeight: 14 }}>{cuotas}</Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFE9E5', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={16} color="#D2392B" />
          </View>
          <View
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
          </View>
        </View>
      </Card>
    </AnimatedPressable>
  )
}
