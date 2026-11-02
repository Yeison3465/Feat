import React from 'react'
import { View, Text, Pressable, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LogOut, User, Shield } from 'lucide-react-native'
import { useAuth } from '../../modules/auth/hooks/useAuth'

export default function ConfiguracionScreen() {
  const { user, signOut, loading } = useAuth()

  return (
    <SafeAreaView className="flex-1 bg-[#09090D] p-6 justify-between">
      <View>
        <Text className="text-white text-2xl font-bold tracking-tight mb-6">
          Configuración
        </Text>

        <View className="bg-[#14141B] border border-[#262630] rounded-2xl p-4 mb-4">
          <View className="flex-row items-center mb-3">
            <View className="w-10 h-10 rounded-full bg-[#C94422]/20 items-center justify-center mr-3">
              <User size={20} color="#FF7854" />
            </View>
            <View className="flex-1">
              <Text className="text-white text-sm font-semibold">
                Cuenta de Administrador
              </Text>
              <Text className="text-stone-400 text-xs mt-0.5">
                {user?.email ?? 'Sesión activa'}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center pt-2 border-t border-[#262630]">
            <Shield size={14} color="#10B981" />
            <Text className="text-stone-400 text-xs ml-1.5">
              Sesión privada cifrada (RLS activo)
            </Text>
          </View>
        </View>
      </View>

      <Pressable
        onPress={signOut}
        disabled={loading}
        className="w-full h-12 bg-[#FB3758]/15 border border-[#FB3758]/40 active:bg-[#FB3758]/30 rounded-xl flex-row items-center justify-center mb-4"
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FB3758" />
        ) : (
          <>
            <LogOut size={18} color="#FB3758" />
            <Text className="text-[#FB3758] text-sm font-bold ml-2">
              Cerrar sesión
            </Text>
          </>
        )}
      </Pressable>
    </SafeAreaView>
  )
}
