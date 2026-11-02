import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { ChevronRight, Phone, ShieldAlert } from 'lucide-react-native'
import { Person } from '../types'
import { getInitials } from '../../../shared/utils/initials'
import Animated, { FadeInDown } from 'react-native-reanimated'

interface PersonCardProps {
  readonly person: Person
}

export const PersonCard: React.FC<PersonCardProps> = ({ person }) => {
  const router = useRouter()
  const initials = getInitials(person.nombre)

  return (
    <Animated.View entering={FadeInDown.duration(240).springify()}>
      <Pressable
        onPress={() => router.push(`/personas/${person.id}`)}
        className="w-full bg-[#12131C] border border-[#232433] active:border-[#383A4F] rounded-2xl p-4 mb-3 flex-row items-center justify-between shadow-lg shadow-black/40"
      >
        <View className="flex-row items-center flex-1 mr-3">
          {/* Avatar con Iniciales */}
          <View className="w-12 h-12 rounded-xl bg-[#1A1215] border border-[#3A1F24] items-center justify-center mr-3.5 shadow-sm">
            <Text className="text-[#FF7854] text-sm font-bold font-mono">
              {initials}
            </Text>
          </View>

          {/* Información Principal */}
          <View className="flex-1">
            <Text
              numberOfLines={1}
              className="text-white text-[15px] font-bold tracking-tight mb-1"
            >
              {person.nombre}
            </Text>

            <View className="flex-row items-center flex-wrap gap-2">
              {person.telefono && (
                <View className="flex-row items-center">
                  <Phone size={12} color="#9CA3AF" />
                  <Text className="text-stone-400 text-xs ml-1 font-mono">
                    {person.telefono}
                  </Text>
                </View>
              )}

              {person.exento_interes_ordinario && (
                <View className="bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full flex-row items-center">
                  <ShieldAlert size={10} color="#F59E0B" />
                  <Text className="text-amber-400 text-[10px] font-semibold ml-1">
                    Exento int. ord.
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <ChevronRight size={18} color="#6B7280" />
      </Pressable>
    </Animated.View>
  )
}

