import React from 'react'
import { View, Text, ActivityIndicator, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LogOut, User, ShieldCheck, Database, Clock, Smartphone } from 'lucide-react-native'
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
        <View className="flex-row items-center gap-1.5 mb-1">
          <View className="w-1.5 h-1.5 rounded-full bg-[#FF7854]" />
          <Text className="text-zinc-400 text-[11px] font-mono font-bold tracking-widest uppercase">
            FEAT
          </Text>
        </View>

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

        {/* Tarjeta de Cuenta de Administrador (SCR-21) */}
        <Animated.View
          entering={reducedMotion ? undefined : FadeInUp.delay(100).duration(420).springify().damping(18).stiffness(160)}
          className="bg-[#12131C] border border-[#232433] rounded-[24px] p-5 mb-5 shadow-xl shadow-black"
        >
          <Text className="text-stone-400 text-xs font-semibold uppercase tracking-wider mb-4">
            Cuenta administrativa
          </Text>

          <View className="flex-row items-center mb-4">
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

          {/* Indicadores de Seguridad y Motor */}
          <View className="space-y-2 pt-3 border-t border-[#1E2030]">
            <View className="flex-row items-center justify-between py-1">
              <View className="flex-row items-center">
                <Database size={13} color="#9CA3AF" />
                <Text className="text-zinc-400 text-xs ml-2">Base de datos</Text>
              </View>
              <Text className="text-emerald-400 text-xs font-mono font-semibold">
                Supabase PostgreSQL
              </Text>
            </View>

            <View className="flex-row items-center justify-between py-1">
              <View className="flex-row items-center">
                <ShieldCheck size={13} color="#10B981" />
                <Text className="text-zinc-400 text-xs ml-2">Aislamiento RLS</Text>
              </View>
              <Text className="text-zinc-300 text-xs font-mono font-medium">
                Activo y verificado
              </Text>
            </View>

            <View className="flex-row items-center justify-between py-1">
              <View className="flex-row items-center">
                <Clock size={13} color="#FF7854" />
                <Text className="text-zinc-400 text-xs ml-2">Inactividad</Text>
              </View>
              <Text className="text-zinc-300 text-xs font-mono">
                Cierre auto en 15m
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Tarjeta Informativa de Aplicación FEAT */}
        <Animated.View
          entering={reducedMotion ? undefined : FadeInUp.delay(140).duration(420).springify().damping(18).stiffness(160)}
          className="bg-[#0F1017] border border-[#1E2030] rounded-2xl p-4 mb-6"
        >
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-1.5">
              <Smartphone size={14} color="#FF7854" />
              <Text className="text-white text-xs font-bold font-mono">
                FEAT · Cartera Privada
              </Text>
            </View>
            <View className="bg-[#1C1E2B] px-2 py-0.5 rounded-full">
              <Text className="text-zinc-400 text-[10px] font-mono">v1.0.0</Text>
            </View>
          </View>

          <Text className="text-zinc-500 text-[11px] leading-relaxed">
            Aplicación móvil privada para gestión integral de créditos personales, liquidación de intereses sobre saldo, cobro de mora y registro inmutable de movimientos en pesos colombianos (COP).
          </Text>
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
