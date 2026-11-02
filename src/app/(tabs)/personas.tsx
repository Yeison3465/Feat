import React from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Search, Plus, Users, X, RefreshCw } from 'lucide-react-native'
import { usePeople } from '../../modules/people/hooks/usePeople'
import { PersonCard } from '../../modules/people/components/PersonCard'
import { ErrorMessage } from '../../shared/components/ErrorMessage'
import { SkeletonCardList } from '../../shared/components/SkeletonBox'
import { AnimatedPressable } from '../../shared/components/AnimatedPressable'

export default function PersonasScreen() {
  const router = useRouter()
  const {
    people,
    loading,
    refreshing,
    error,
    searchQuery,
    setSearchQuery,
    reload,
  } = usePeople()

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-[#060709]">
      <View className="px-6 pt-4 pb-2">
        {/* Header Superior con Botón Crear */}
        <View className="flex-row items-center justify-between mb-2">
          <View>
            <Text className="text-white text-3xl font-bold tracking-tight">
              Personas
            </Text>
            <Text className="text-zinc-400 text-xs mt-0.5">
              Directorio privado de prestatarios
            </Text>
          </View>

          <AnimatedPressable
            onPress={() => router.push('/personas/crear')}
            className="flex-row items-center bg-[#D34524] active:bg-[#E54F2C] px-3.5 py-2 rounded-xl shadow-md shadow-[#D34524]/20"
          >
            <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
            <Text className="text-white text-xs font-bold ml-1">
              Crear
            </Text>
          </AnimatedPressable>
        </View>

        {/* Barra de Búsqueda */}
        <View className="flex-row items-center px-3.5 h-11 bg-[#12131A] border border-[#1E2030] rounded-xl my-3">
          <Search size={16} color="#6B7280" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar por nombre o nota privada..."
            placeholderTextColor="#4B5563"
            className="flex-1 ml-2.5 text-white text-xs"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <X size={15} color="#9CA3AF" />
            </Pressable>
          )}
        </View>

        {/* Contador Informativo */}
        {!loading && !error && (
          <View className="flex-row items-center justify-between mb-2 px-1">
            <Text className="text-zinc-500 text-[11px] font-mono">
              {people.length} {people.length === 1 ? 'persona registrada' : 'personas registradas'}
            </Text>
            {searchQuery.length > 0 && (
              <Text className="text-[#FF7854] text-[11px]">
                Filtrado por: "{searchQuery}"
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Contenido / Listado */}
      {loading && !refreshing ? (
        <View className="flex-1 px-6 pt-2">
          <SkeletonCardList count={4} />
        </View>
      ) : error ? (
        <View className="flex-1 px-6 justify-center items-center">
          <ErrorMessage message={error} onRetry={reload} />
          <Pressable
            onPress={reload}
            className="mt-4 flex-row items-center bg-[#151622] px-4 py-2 rounded-xl border border-[#232433]"
          >
            <RefreshCw size={14} color="#FF7854" />
            <Text className="text-[#FF7854] text-xs font-semibold ml-2">
              Reintentar
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={people}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PersonCard person={item} />}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24, flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={reload}
              tintColor="#FF7854"
              colors={['#FF7854']}
            />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-16">
              <View className="w-16 h-16 rounded-2xl bg-[#12131A] border border-[#1E2030] items-center justify-center mb-4">
                <Users size={28} color="#6B7280" />
              </View>
              <Text className="text-white text-base font-bold mb-1">
                {searchQuery.length > 0 ? 'Sin resultados' : 'Directorio vacío'}
              </Text>
              <Text className="text-zinc-400 text-xs text-center max-w-[260px] leading-4 mb-5">
                {searchQuery.length > 0
                  ? `No se encontraron personas que coincidan con "${searchQuery}".`
                  : 'Aún no has registrado prestatarios en tu cartera privada.'}
              </Text>
              {searchQuery.length > 0 ? (
                <Pressable
                  onPress={() => setSearchQuery('')}
                  className="bg-[#1A1B26] border border-[#252738] active:bg-[#252738] px-4 py-2.5 rounded-xl"
                >
                  <Text className="text-[#FF7854] text-xs font-bold">
                    Limpiar búsqueda
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => router.push('/personas/crear')}
                  className="bg-[#D34524] active:bg-[#E54F2C] px-5 py-2.5 rounded-xl shadow-lg shadow-[#D34524]/20"
                >
                  <Text className="text-white text-xs font-bold">
                    + Nueva persona
                  </Text>
                </Pressable>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}
