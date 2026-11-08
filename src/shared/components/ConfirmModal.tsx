import React from 'react'
import { View, Text } from 'react-native'
import { AlertTriangle, Info } from 'lucide-react-native'
import { Dialog } from '../ui/Overlay'
import { Button } from '../ui/Button'
import { colors, fonts } from '../theme/tokens'

interface ConfirmModalProps {
  readonly visible: boolean
  readonly title: string
  readonly message: string
  readonly onCancel: () => void
  readonly onConfirm?: () => void
  readonly confirmLabel?: string
  readonly cancelLabel?: string
  readonly destructive?: boolean
  readonly loading?: boolean
  readonly error?: string | null
}

const noop = () => {}

/**
 * Diálogo de confirmación. Sin `onConfirm` funciona como aviso informativo con un solo botón.
 * Entra con fundido y escala .95 → 1 (240 ms) y sale en 160 ms.
 */
export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  message,
  onCancel,
  onConfirm,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = false,
  loading = false,
  error,
}) => {
  return (
    <Dialog visible={visible} onClose={loading ? noop : onCancel}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: destructive ? 'rgba(255,107,94,0.14)' : colors.card2,
          }}
        >
          {destructive ? (
            <AlertTriangle size={16} color={colors.dangerSoft} />
          ) : (
            <Info size={16} color={colors.warm} />
          )}
        </View>
        <Text style={{ flex: 1, color: colors.warm, fontFamily: fonts.medium, fontSize: 18, lineHeight: 24 }}>
          {title}
        </Text>
      </View>

      <Text style={{ color: '#B4B4B9', fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 }}>{message}</Text>

      {error && (
        <View
          accessibilityRole="alert"
          style={{
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 16,
            backgroundColor: 'rgba(255,107,94,0.12)',
            borderWidth: 1,
            borderColor: 'rgba(255,107,94,0.4)',
          }}
        >
          <Text style={{ color: colors.dangerSoft, fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 }}>{error}</Text>
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button
          label={onConfirm ? cancelLabel : 'Entendido'}
          variant="ghost"
          onPress={onCancel}
          disabled={loading}
          style={{ flex: 1, height: 52 }}
        />
        {onConfirm && (
          <Button
            label={confirmLabel}
            variant={destructive ? 'danger' : 'solid'}
            onPress={onConfirm}
            loading={loading}
            haptic={destructive ? 'medium' : undefined}
            style={{ flex: 1, height: 52 }}
          />
        )}
      </View>
    </Dialog>
  )
}
