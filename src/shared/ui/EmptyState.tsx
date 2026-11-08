import React from 'react'
import { View } from 'react-native'
import { AppText } from './AppText'
import { Button } from './Button'
import { colors } from '../theme/tokens'

interface EmptyStateProps {
  readonly icon: React.ReactNode
  readonly title: string
  readonly text: string
  readonly action?: { label: string; onPress: () => void; variant?: 'solid' | 'ghost' }
}

// Estado vacío: ícono en círculo, título, texto y una acción opcional
export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, text, action }) => (
  <View style={{ alignItems: 'center', gap: 10, paddingHorizontal: 24, paddingVertical: 56 }}>
    <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.card2, alignItems: 'center', justifyContent: 'center' }}>
      {icon}
    </View>
    <AppText variant="sec" style={{ fontSize: 20, textAlign: 'center' }}>
      {title}
    </AppText>
    <AppText variant="lbl" style={{ textAlign: 'center', lineHeight: 18, maxWidth: 280 }}>
      {text}
    </AppText>
    {action && <Button label={action.label} variant={action.variant ?? 'solid'} onPress={action.onPress} style={{ marginTop: 6 }} />}
  </View>
)
