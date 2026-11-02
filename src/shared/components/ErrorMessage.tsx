import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { AlertCircle, RefreshCw } from 'lucide-react-native'

interface ErrorMessageProps {
  readonly message: string
  readonly onRetry?: () => void
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <View className="w-full bg-[#FB3758]/10 border border-[#FB3758]/40 rounded-xl p-3 flex-row items-center justify-between my-2">
      <View className="flex-row items-center flex-1 mr-2">
        <AlertCircle size={18} color="#FB3758" />
        <Text className="text-[#FB3758] text-xs font-medium ml-2 flex-1">
          {message}
        </Text>
      </View>
      {onRetry && (
        <Pressable
          onPress={onRetry}
          className="p-1 rounded-lg bg-[#FB3758]/20 active:opacity-70"
        >
          <RefreshCw size={14} color="#FB3758" />
        </Pressable>
      )}
    </View>
  )
}

