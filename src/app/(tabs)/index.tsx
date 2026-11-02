import React from 'react'
import { View, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Wallet } from 'lucide-react-native'

export default function DashboardScreen() {
  return (
    <SafeAreaView className="flex-1 bg-[#09090D] p-6 justify-between">
      <View>
        <Text className="text-white text-2xl font-bold tracking-tight mb-2">
          Dashboard
        </Text>
        <Text className="text-stone-400 text-sm mb-6">
          Estado actual de tu cartera privada
        </Text>

        <View className="bg-[#14141B] border border-[#262630] rounded-2xl p-6 items-center my-4">
          <View className="w-12 h-12 rounded-xl bg-[#C94422]/20 items-center justify-center mb-3">
            <Wallet size={24} color="#FF7854" />
          </View>
          <Text className="text-stone-400 text-xs uppercase tracking-wider mb-1">
            Cartera pendiente
          </Text>
          <Text className="text-white text-3xl font-extrabold font-mono">
            $ 0 COP
          </Text>
          <Text className="text-stone-500 text-xs mt-2">
            Aún no hay préstamos activos registrados
          </Text>
        </View>
      </View>
    </SafeAreaView>
  )
}
