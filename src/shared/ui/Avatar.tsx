import React from 'react'
import { StyleProp, Text, View, ViewStyle } from 'react-native'
import { getInitials } from '../utils/initials'
import { colors, fonts } from '../theme/tokens'

interface AvatarProps {
  readonly name: string
  // 44 a 88 px (la app no guarda fotos de personas: se muestran las iniciales)
  readonly size?: number
  // Anillo dorado (tarjetas de vencimiento sobre blanco)
  readonly ring?: boolean
  readonly style?: StyleProp<ViewStyle>
}

export const Avatar: React.FC<AvatarProps> = ({ name, size = 44, ring = false, style }) => (
  <View
    accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants"
    style={[
      {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: ring ? '#F2F2EF' : colors.card2,
        borderWidth: ring ? 0 : 1,
        borderColor: colors.line,
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: ring ? '0 0 0 2px #FFFFFF, 0 0 0 3.5px rgba(166,130,74,0.75)' : undefined,
      },
      style,
    ]}
  >
    <Text style={{ color: ring ? colors.onLight : colors.warm, fontFamily: fonts.medium, fontSize: size >= 80 ? 26 : size > 48 ? 18 : 15 }}>
      {getInitials(name)}
    </Text>
  </View>
)
