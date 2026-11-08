import React from 'react'
import { View, Text, ScrollView } from 'react-native'
import Animated, { useReducedMotion } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LogOut, User, ShieldCheck, Database, Clock, Smartphone } from 'lucide-react-native'
import { useAuth } from '../../modules/auth/hooks/useAuth'
import { useSettings } from '../../modules/settings/hooks/useSettings'
import { InterestSettingsCard } from '../../modules/settings/components/InterestSettingsCard'
import { LateFeeSettingsCard } from '../../modules/settings/components/LateFeeSettingsCard'
import { AppText } from '../../shared/ui/AppText'
import { Button } from '../../shared/ui/Button'
import { Card } from '../../shared/ui/Card'
import { Chip } from '../../shared/ui/Chip'
import { screenEnter } from '../../shared/motion'
import { colors, fonts } from '../../shared/theme/tokens'

// Fila «icono + clave — valor» de la tarjeta de cuenta
const InfoRow: React.FC<{ readonly icon: React.ReactNode; readonly k: string; readonly v: string; readonly vColor?: string; readonly last?: boolean }> = ({
  icon,
  k,
  v,
  vColor = colors.warm,
  last,
}) => (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      paddingVertical: 14,
      borderBottomWidth: last ? 0 : 1,
      borderBottomColor: colors.line,
    }}
  >
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      {icon}
      <Text style={{ color: colors.muted, fontFamily: fonts.regular, fontSize: 13 }}>{k}</Text>
    </View>
    <Text style={{ color: vColor, fontFamily: fonts.medium, fontSize: 13, flexShrink: 1, textAlign: 'right' }}>{v}</Text>
  </View>
)

export default function ConfiguracionScreen() {
  const reduced = useReducedMotion()
  const { user, signOut, loading: authLoading } = useAuth()
  const { settings, saving, updateSettings } = useSettings()

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.app }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32, gap: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={screenEnter(0, reduced)} style={{ gap: 10, paddingHorizontal: 4, paddingTop: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.warm }} />
            <Text style={{ color: colors.muted, fontFamily: fonts.semibold, fontSize: 12, letterSpacing: 2.2 }}>FEAT</Text>
          </View>
          <AppText variant="title" accessibilityRole="header" style={{ fontSize: 40, lineHeight: 42, letterSpacing: -1.8 }}>
            Configuración
          </AppText>
          <AppText variant="body">Condiciones predeterminadas y administración de cuenta</AppText>
        </Animated.View>

        {/* Condiciones predeterminadas (SCR-19) */}
        <InterestSettingsCard settings={settings} onSave={updateSettings} loading={saving} />

        {/* Configuración de mora (SCR-20) */}
        <LateFeeSettingsCard settings={settings} onSave={updateSettings} loading={saving} />

        {/* Cuenta de administrador (SCR-21) */}
        <Animated.View entering={screenEnter(4, reduced)}>
          <Card variant="ink" style={{ padding: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <AppText variant="sec" style={{ fontSize: 20 }}>
                Cuenta administrativa
              </AppText>
              <Text style={{ color: colors.muted2, fontFamily: fonts.regular, fontSize: 10, letterSpacing: 0.8 }}>SCR-21</Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.line }}>
              <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#26262A', alignItems: 'center', justifyContent: 'center' }}>
                <User size={22} color={colors.warm} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ color: colors.warm, fontFamily: fonts.semibold, fontSize: 16 }}>Titular Prestamista</Text>
                <Text style={{ color: '#B4B4B9', fontFamily: fonts.regular, fontSize: 12 }}>{user?.email ?? 'Sesión activa'}</Text>
              </View>
            </View>

            <InfoRow icon={<Database size={14} color={colors.muted2} />} k="Base de datos" v="Supabase PostgreSQL" vColor={colors.okSoft} />
            <InfoRow icon={<ShieldCheck size={14} color={colors.okSoft} />} k="Aislamiento RLS" v="Activo y verificado" />
            <InfoRow icon={<Clock size={14} color={colors.muted2} />} k="Inactividad" v="Cierre auto en 15m" last />
          </Card>
        </Animated.View>

        {/* Tarjeta informativa de la aplicación */}
        <Animated.View entering={screenEnter(5, reduced)}>
          <Card variant="dark" radius={26} style={{ paddingHorizontal: 20, paddingVertical: 18, gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
                <Smartphone size={15} color={colors.warm} />
                <Text style={{ color: colors.warm, fontFamily: fonts.semibold, fontSize: 14 }}>FEAT · Cartera Privada</Text>
              </View>
              <Chip label="v1.0.0" />
            </View>
            <Text style={{ color: colors.muted, fontFamily: fonts.regular, fontSize: 12, lineHeight: 18 }}>
              Aplicación móvil privada para gestión integral de créditos personales, liquidación de intereses sobre saldo, cobro de mora y registro inmutable de movimientos en pesos colombianos (COP).
            </Text>
          </Card>
        </Animated.View>

        {/* Cerrar sesión */}
        <Animated.View entering={screenEnter(6, reduced)}>
          <Button
            label="Cerrar sesión"
            variant="danger"
            size="lg"
            onPress={signOut}
            loading={authLoading}
            haptic="medium"
            icon={<LogOut size={16} color="#000000" />}
            style={{ width: '100%' }}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  )
}
