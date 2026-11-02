import React from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import {
  Search,
  Plus,
  CreditCard,
  X,
  RefreshCw,
  Filter,
  ShieldCheck,
  CheckCircle2,
  Clock,
} from 'lucide-react-native'
import { useLoans } from '../../modules/loans/hooks/useLoans'
import { LoanCard } from '../../modules/loans/components/LoanCard'
import { LoanStatus } from '../../modules/loans/types'
import { ErrorMessage } from '../../shared/components/ErrorMessage'

export default function PrestamosScreen() {
  const router = useRouter()
  const {
    loans,
    allLoans,
    loading,
    refreshing,
    error,
    searchQuery,
    estadoFilter,
    setSearchQuery,
    setEstadoFilter,
    reload,
  } = useLoans()

  const filterOptions: { id: LoanStatus | 'todos'; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'activo', label: 'Activos' },
    { id: 'en_mora', label: 'En mora' },
    { id: 'completado', label: 'Completados' },
  ]

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-[#060709]">
      <View className="px-6 pt-4 pb-2">
        {/* Cabecera Superior con Botón Crear */}
        <View className="flex-row items-center justify-between mb-2">
          <View>
            <Text className="text-white text-3xl font-bold tracking-tight">
              Préstamos
            </Text>
            <Text className="text-zinc-400 text-xs mt-0.5">
              Administración de créditos y obligaciones
            </Text>
          </View>

          <Pressable
            onPress={() => router.push('/prestamos/crear')}
            className="flex-row items-center bg-[#D34524] active:bg-[#E54F2C] px-3.5 py-2 rounded-xl shadow-md shadow-[#D34524]/20"
          >
            <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
            <Text className="text-white text-xs font-bold ml-1">
              Crear
            </Text>
          </Pressable>
        </View>

        {/* Barra de Búsqueda */}
        <View className="flex-row items-center px-3.5 h-11 bg-[#12131A] border border-[#1E2030] rounded-xl my-2.5">
          <Search size={16} color="#6B7280" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar por prestatario o código #PR..."
            placeholderTextColor="#4B5563"
            className="flex-1 ml-2.5 text-white text-xs"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <X size={15} color="#9CA3AF" />
            </Pressable>
          )}
        </View>

        {/* Chips de Filtrado por Estado */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-1 mb-1">
          <View className="flex-row gap-2">
            {filterOptions.map((opt) => {
              const isActive = estadoFilter === opt.id
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => setEstadoFilter(opt.id)}
                  className={`px-3.5 py-1.5 rounded-full border ${
                    isActive
                      ? 'bg-[#D34524] border-[#D34524]'
                      : 'bg-[#12131A] border-[#1E2030] active:border-zinc-700'
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      isActive ? 'text-white' : 'text-zinc-400'
                    }`}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </ScrollView>

        {/* Contador Informativo */}
        {!loading && !error && (
          <View className="flex-row items-center justify-between mt-1 mb-2 px-1">
            <Text className="text-zinc-500 text-[11px] font-mono">
              {loans.length} {loans.length === 1 ? 'préstamo registrado' : 'préstamos registrados'}
            </Text>
            {searchQuery.length > 0 && (
              <Text className="text-[#FF7854] text-[11px]">
                Filtrado por: "{searchQuery}"
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Contenido / Listado de Préstamos */}
      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="small" color="#FF7854" />
          <Text className="text-zinc-400 text-xs mt-3">
            Cargando préstamos y saldos...
          </Text>
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
          data={loans}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <LoanCard loan={item} />}
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
            <View className="flex-1 items-center justify-center py-16 px-4">
              {/* Caso 1: Búsqueda activa sin coincidencias */}
              {searchQuery.trim().length > 0 ? (
                <>
                  <View className="w-16 h-16 rounded-2xl bg-[#12131A] border border-[#1E2030] items-center justify-center mb-4">
                    <Search size={28} color="#9CA3AF" />
                  </View>
                  <Text className="text-white text-base font-bold mb-1 text-center">
                    Sin resultados de búsqueda
                  </Text>
                  <Text className="text-zinc-400 text-xs text-center max-w-[270px] leading-4 mb-5">
                    No se encontraron préstamos que coincidan con "{searchQuery}".
                  </Text>
                  <Pressable
                    onPress={() => setSearchQuery('')}
                    className="bg-[#1A1B26] border border-[#252738] active:bg-[#252738] px-4 py-2.5 rounded-xl"
                  >
                    <Text className="text-[#FF7854] text-xs font-bold">
                      Limpiar búsqueda
                    </Text>
                  </Pressable>
                </>
              ) : estadoFilter === 'en_mora' ? (
                /* Caso 2: Pestaña En mora limpia (Excelente salud de cartera) */
                <>
                  <View className="w-16 h-16 rounded-2xl bg-[#064E3B]/20 border border-[#065F46]/40 items-center justify-center mb-4 shadow-lg shadow-emerald-950/30">
                    <ShieldCheck size={28} color="#10B981" />
                  </View>
                  <Text className="text-white text-base font-bold mb-1 text-center">
                    Sin préstamos en mora
                  </Text>
                  <Text className="text-zinc-400 text-xs text-center max-w-[270px] leading-relaxed">
                    ¡Excelente! Toda tu cartera se encuentra al día. No tienes obligaciones en mora actualmente.
                  </Text>
                </>
              ) : estadoFilter === 'completado' ? (
                /* Caso 3: Pestaña Completados sin préstamos liquidados */
                <>
                  <View className="w-16 h-16 rounded-2xl bg-[#12131A] border border-[#1E2030] items-center justify-center mb-4">
                    <CheckCircle2 size={28} color="#10B981" />
                  </View>
                  <Text className="text-white text-base font-bold mb-1 text-center">
                    Sin préstamos completados
                  </Text>
                  <Text className="text-zinc-400 text-xs text-center max-w-[270px] leading-relaxed">
                    Aún no tienes préstamos totalmente liquidados y saldados en tu historial.
                  </Text>
                </>
              ) : estadoFilter === 'activo' && allLoans.length > 0 ? (
                /* Caso 4: Pestaña Activos vacía pero hay historial */
                <>
                  <View className="w-16 h-16 rounded-2xl bg-[#12131A] border border-[#1E2030] items-center justify-center mb-4">
                    <Clock size={28} color="#F59E0B" />
                  </View>
                  <Text className="text-white text-base font-bold mb-1 text-center">
                    Sin préstamos activos
                  </Text>
                  <Text className="text-zinc-400 text-xs text-center max-w-[270px] leading-4 mb-5">
                    Todos los préstamos registrados en tu cartera han sido saldados o no están activos.
                  </Text>
                  <Pressable
                    onPress={() => router.push('/prestamos/crear')}
                    className="bg-[#D34524] active:bg-[#E54F2C] px-5 py-2.5 rounded-xl shadow-lg shadow-[#D34524]/20"
                  >
                    <Text className="text-white text-xs font-bold">
                      + Crear nuevo préstamo
                    </Text>
                  </Pressable>
                </>
              ) : (
                /* Caso 5: Cartera total completamente vacía */
                <>
                  <View className="w-16 h-16 rounded-2xl bg-[#12131A] border border-[#1E2030] items-center justify-center mb-4">
                    <CreditCard size={28} color="#FF7854" />
                  </View>
                  <Text className="text-white text-base font-bold mb-1 text-center">
                    Aún no hay préstamos
                  </Text>
                  <Text className="text-zinc-400 text-xs text-center max-w-[270px] leading-4 mb-5">
                    Crea tu primer préstamo seleccionando una persona de tu directorio, el capital en pesos colombianos y la tasa aplicable.
                  </Text>
                  <Pressable
                    onPress={() => router.push('/prestamos/crear')}
                    className="bg-[#D34524] active:bg-[#E54F2C] px-5 py-2.5 rounded-xl shadow-lg shadow-[#D34524]/20"
                  >
                    <Text className="text-white text-xs font-bold">
                      + Crear primer préstamo
                    </Text>
                  </Pressable>
                </>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}
