import React, { useEffect, useRef, useState } from 'react'
import { View, FlatList, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import Animated, { useReducedMotion } from 'react-native-reanimated'
import { Plus, Users, RefreshCw } from 'lucide-react-native'
import { usePeople } from '../../modules/people/hooks/usePeople'
import { PersonCard } from '../../modules/people/components/PersonCard'
import { ErrorMessage } from '../../shared/components/ErrorMessage'
import { SkeletonCardList } from '../../shared/components/SkeletonBox'
import { AppText } from '../../shared/ui/AppText'
import { Button } from '../../shared/ui/Button'
import { EmptyState } from '../../shared/ui/EmptyState'
import { SearchField } from '../../shared/ui/SearchField'
import { TopBar } from '../../shared/ui/TopBar'
import { screenEnter } from '../../shared/motion'
import { colors } from '../../shared/theme/tokens'

export default function PersonasScreen() {
  const router = useRouter()
  const reduced = useReducedMotion()
  const { people, loading, refreshing, error, searchQuery, setSearchQuery, reload } = usePeople()

  // Las filas solo se animan al abrir la pantalla (no al buscar)
  const [animateIn, setAnimateIn] = useState(true)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    timer.current = setTimeout(() => setAnimateIn(false), 2500)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  const header = (
    <View style={{ gap: 20 }}>
      <Animated.View entering={screenEnter(0, reduced)}>
        <TopBar />
      </Animated.View>

      {/* Título y botón crear */}
      <Animated.View
        entering={screenEnter(1, reduced)}
        style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, paddingTop: 12, paddingHorizontal: 4 }}
      >
        <View style={{ gap: 10, flex: 1 }}>
          <AppText variant="title" accessibilityRole="header">
            Personas
          </AppText>
          <AppText variant="body" style={{ fontSize: 15, lineHeight: 22 }}>
            Directorio privado de prestatarios
          </AppText>
        </View>
        <Button
          label="Crear"
          onPress={() => router.push('/personas/crear')}
          icon={<Plus size={16} color="#000000" />}
          style={{ paddingLeft: 14, paddingRight: 18 }}
        />
      </Animated.View>

      {/* Búsqueda */}
      <Animated.View entering={screenEnter(2, reduced)}>
        <SearchField
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar por nombre o nota privada..."
          accessibilityLabel="Buscar personas"
        />
      </Animated.View>

      {/* Contador informativo */}
      {!loading && !error && (
        <Animated.View entering={screenEnter(3, reduced)} style={{ gap: 2, paddingHorizontal: 4, marginTop: -6 }}>
          <AppText variant="lbl" tone="muted2">
            {people.length} {people.length === 1 ? 'persona registrada' : 'personas registradas'}
          </AppText>
          {searchQuery.length > 0 && (
            <AppText variant="lbl" tone="warm">
              Filtrado por: “{searchQuery}”
            </AppText>
          )}
        </Animated.View>
      )}
    </View>
  )

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.app }} edges={['top']}>
      <FlatList
        data={loading || error ? [] : people}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) =>
          animateIn && index < 6 && !reduced ? (
            <Animated.View entering={screenEnter(index + 2, reduced)}>
              <PersonCard person={item} />
            </Animated.View>
          ) : (
            <PersonCard person={item} />
          )
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, flexGrow: 1 }}
        ListHeaderComponent={header}
        ListHeaderComponentStyle={{ marginBottom: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={colors.warm} colors={[colors.warm]} progressBackgroundColor={colors.card2} />
        }
        ListEmptyComponent={
          loading && !refreshing ? (
            <View key="loading">
              <SkeletonCardList count={4} />
            </View>
          ) : error ? (
            <View key="error" style={{ alignItems: 'center', gap: 14, paddingTop: 24 }}>
              <ErrorMessage message={error} onRetry={reload} />
              <Button label="Reintentar" variant="ghost" onPress={reload} icon={<RefreshCw size={16} color={colors.warm} />} />
            </View>
          ) : (
            <EmptyState
              icon={<Users size={28} color={colors.warm} />}
              title={searchQuery.length > 0 ? 'Sin resultados' : 'Directorio vacío'}
              text={
                searchQuery.length > 0
                  ? `No se encontraron personas que coincidan con "${searchQuery}".`
                  : 'Aún no has registrado prestatarios en tu cartera privada.'
              }
              action={
                searchQuery.length > 0
                  ? { label: 'Limpiar búsqueda', variant: 'ghost', onPress: () => setSearchQuery('') }
                  : { label: '+ Nueva persona', onPress: () => router.push('/personas/crear') }
              }
            />
          )
        }
      />
    </SafeAreaView>
  )
}
