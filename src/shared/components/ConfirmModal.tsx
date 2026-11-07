import React from 'react'
import { View, Text, Modal, Pressable, ActivityIndicator } from 'react-native'
import { AlertTriangle, Info } from 'lucide-react-native'

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

/**
 * Modal de confirmación con el estilo de la app. Sin `onConfirm` funciona como
 * aviso informativo con un solo botón.
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
  const accent = destructive ? '#FB3758' : '#FF7854'

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={loading ? undefined : onCancel}>
      <View className="flex-1 bg-black/75 justify-center items-center px-4">
        <Pressable onPress={loading ? undefined : onCancel} className="absolute inset-0" />

        <View className="bg-[#12131A] border border-[#1E2030] rounded-3xl w-full max-w-sm p-5 shadow-2xl shadow-black z-10">
          <View className="flex-row items-center gap-2 mb-3">
            {destructive ? <AlertTriangle size={18} color={accent} /> : <Info size={18} color={accent} />}
            <Text className="text-white text-base font-bold tracking-tight flex-1">{title}</Text>
          </View>

          <Text className="text-zinc-400 text-sm leading-5">{message}</Text>

          {error && (
            <View className="mt-3 bg-rose-500/10 border border-rose-500/25 p-2.5 rounded-xl">
              <Text className="text-rose-400 text-xs">{error}</Text>
            </View>
          )}

          <View className="flex-row gap-2 mt-5">
            <Pressable
              onPress={onCancel}
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-[#161722] border border-[#232433] items-center justify-center active:bg-[#202234]"
            >
              <Text className="text-zinc-300 text-xs font-semibold">
                {onConfirm ? cancelLabel : 'Entendido'}
              </Text>
            </Pressable>

            {onConfirm && (
              <Pressable
                onPress={onConfirm}
                disabled={loading}
                className={`flex-1 py-3 rounded-xl items-center justify-center ${
                  destructive ? 'bg-[#E11D48] active:bg-[#F43F5E]' : 'bg-[#D34524] active:bg-[#E54F2C]'
                } ${loading ? 'opacity-60' : ''}`}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-xs font-bold">{confirmLabel}</Text>
                )}
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  )
}
