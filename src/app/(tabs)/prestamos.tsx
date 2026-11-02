import React from 'react'
import { View, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function PrestamosScreen() {
  return (
    <SafeAreaView className="flex-1 bg-[#09090D] p-6">
      <Text className="text-white text-2xl font-bold tracking-tight mb-2">
        Préstamos
      </Text>
      <Text className="text-stone-400 text-sm mb-6">
        Administración de créditos y obligaciones
      </Text>
    </SafeAreaView>
  )
}
