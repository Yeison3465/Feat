import React from 'react'
import { Text, View } from 'react-native'
import { useAuth } from '../../modules/auth/hooks/useAuth'
import { Avatar } from './Avatar'
import { AppText } from './AppText'
import { colors, fonts } from '../theme/tokens'

// Barra superior en píldora de las pantallas principales: «P», marca FEAT y tus iniciales.
export const TopBar: React.FC = () => {
  const { user } = useAuth()
  const profileName = (user?.email ?? 'Perfil').split('@')[0]

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: 6,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.line,
        borderRadius: 999,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.warm, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.onLight, fontFamily: fonts.semibold, fontSize: 17, letterSpacing: -0.7 }}>P</Text>
        </View>
        <AppText variant="h">FEAT</AppText>
      </View>
      <Avatar name={profileName} size={44} />
    </View>
  )
}
