import React from 'react'
import { View, Text, Pressable, ActivityIndicator, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LogOut, User, Shield } from 'lucide-react-native'
import { useAuth } from '../../modules/auth/hooks/useAuth'
import { useSettings } from '../../modules/settings/hooks/useSettings'
import { InterestSettingsCard } from '../../modules/settings/components/InterestSettingsCard'
import { LateFeeSettingsCard } from '../../modules/settings/components/LateFeeSettingsCard'
import Animated, { FadeInUp, useReducedMotion } from 'react-native-reanimated'
import { AnimatedPressable } from '../../shared/components/AnimatedPressable'

export default function ConfiguracionScreen() {
  const reducedMotion = useReducedMotion()
  const { user, signOut, loading: authLoading } = useAuth()
  const { settings, saving, updateSettings } = useSettings()

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#07070A' }} edges={['top']} className="flex-1 bg-[#07070A]">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        className="px-6 pt-4 max-w-md mx-auto w-full"
      >
        <Text className="text-white text-3xl font-bold tracking-tight mb-1">
          Configuración
        </Text>
        <Text className="text-stone-400 text-xs mb-6">
          Condiciones predeterminadas y administración de cuenta
        </Text>

        {/* Tarjeta de Condiciones Predeterminadas (SCR-19) */}
        <InterestSettingsCard
          settings={settings}
          onSave={updateSettings}
          loading={saving}
        />

        {/* Tarjeta de Configuración de Mora (SCR-20) */}
        <LateFeeSettingsCard
          settings={settings}
          onSave={updateSettings}
          loading={saving}
        />

        {/* Tarjeta de Cuenta de Administrador */}
        <Animated.View
          entering={reducedMotion ? undefined : FadeInUp.delay(100).duration(420).springify().damping(18).stiffness(160)}
          className="bg-[#12131C] border border-[#232433] rounded-[24px] p-5 mb-5 shadow-xl shadow-black"
        >
          <Text className="text-stone-400 text-xs font-semibold uppercase tracking-wider mb-4">
            Cuenta administrativa
          </Text>

          <View className="flex-row items-center mb-3">
            <View className="w-12 h-12 rounded-xl bg-[#1A1215] border border-[#3A1F24] items-center justify-center mr-3.5">
              <User size={22} color="#FF7854" />
            </View>
            <View className="flex-1">
              <Text className="text-white text-sm font-semibold">
                Titular Prestamista
              </Text>
              <Text className="text-stone-400 text-xs mt-0.5 font-mono">
                {user?.email ?? 'Sesión activa'}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center pt-3 border-t border-[#1E2030]">
            <Shield size={14} color="#10B981" />
            <Text className="text-stone-400 text-xs ml-2">
              Aislamiento por usuario garantizado (RLS activo)
            </Text>
          </View>
        </Animated.View>

        {/* Botón de Cerrar Sesión */}
        <AnimatedPressable
          onPress={signOut}
          disabled={authLoading}
          style={{ height: 48 }}
          className="w-full bg-[#FB3758]/10 border border-[#FB3758]/40 active:bg-[#FB3758]/25 rounded-2xl flex-row items-center justify-center"
        >
          {authLoading ? (
            <ActivityIndicator size="small" color="#FB3758" />
          ) : (
            <>
              <LogOut size={16} color="#FB3758" />
              <Text className="text-[#FB3758] text-xs font-bold ml-2">
                Cerrar sesión
              </Text>
            </>
          )}
        </AnimatedPressable>
      </ScrollView>
    </SafeAreaView>
  )
}
