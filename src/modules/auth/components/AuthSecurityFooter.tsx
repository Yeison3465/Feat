import React from 'react'
import { Text, View } from 'react-native'
import { ShieldCheck } from 'lucide-react-native'
import { Card } from '../../../shared/ui/Card'
import { colors, fonts } from '../../../shared/theme/tokens'

// Pie común de las pantallas de acceso: tarjeta de seguridad en negro laca y línea de versión.
export const AuthSecurityFooter: React.FC = () => (
  <View style={{ gap: 14 }}>
    <Card variant="ink" style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16 }}>
      <ShieldCheck size={20} color={colors.ok} style={{ marginTop: 1 }} />
      <Text style={{ flex: 1, color: '#B4B4B9', fontFamily: fonts.regular, fontSize: 12, lineHeight: 18 }}>
        Acceso exclusivo para el titular. Los prestatarios no tienen acceso a esta aplicación.
      </Text>
    </Card>
    <Text style={{ color: colors.muted2, fontFamily: fonts.regular, fontSize: 12, textAlign: 'center' }}>
      Sistema seguro · Moneda COP · v2.4
    </Text>
  </View>
)
