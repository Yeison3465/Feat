import React, { useState, useEffect } from 'react'
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native'
import { Percent, Calendar, Check, AlertCircle } from 'lucide-react-native'
import { LoanSettings, UpdateSettingsDTO } from '../types'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated'
import { AnimatedPressable } from '../../../shared/components/AnimatedPressable'

interface InterestSettingsCardProps {
  readonly settings: LoanSettings | null
  readonly onSave: (dto: UpdateSettingsDTO) => Promise<void>
  readonly loading: boolean
}

export const InterestSettingsCard: React.FC<InterestSettingsCardProps> = ({
  settings,
  onSave,
  loading,
}) => {
  const reducedMotion = useReducedMotion()
  const [tasaMensual, setTasaMensual] = useState('20')
  const [diasGracia, setDiasGracia] = useState('3')
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (settings) {
      setTasaMensual(settings.tasa_mensual_defecto.toString())
      setDiasGracia(settings.dias_gracia_defecto.toString())
    }
  }, [settings])

  const handleSave = async () => {
    setError(null)
    setSavedSuccess(false)

    const tasaNum = parseFloat(tasaMensual)
    const graciaNum = parseInt(diasGracia, 10)

    if (isNaN(tasaNum) || tasaNum < 0 || tasaNum > 100) {
      setError('La tasa mensual debe ser un porcentaje válido entre 0% y 100%.')
      return
    }

    if (isNaN(graciaNum) || graciaNum < 0) {
      setError('Los días de gracia deben ser un número entero mayor o igual a 0.')
      return
    }

    try {
      await onSave({
        tasa_mensual_defecto: tasaNum,
        dias_gracia_defecto: graciaNum,
      })
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Error al guardar la configuración.')
    }
  }

  return (
    <Animated.View
      entering={reducedMotion ? undefined : FadeInDown.duration(420).springify().damping(18).stiffness(160)}
      className="bg-[#12131C] border border-[#232433] rounded-[24px] p-5 mb-5 shadow-xl shadow-black"
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-white text-base font-bold">
          Condiciones predeterminadas
        </Text>
        <Text className="text-stone-500 text-[10px] font-mono uppercase">SCR-19</Text>
      </View>

      <Text className="text-stone-400 text-xs leading-4 mb-4">
        Estas condiciones se precargarán automáticamente al otorgar nuevos préstamos.
      </Text>

      {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}

      {/* Input: Tasa Mensual */}
      <View className="mb-4">
        <Text className="text-stone-300 text-xs font-medium mb-1.5 ml-1">
          Tasa ordinaria mensual (%)
        </Text>
        <View className="flex-row items-center px-4 h-12 bg-[#08080E] rounded-xl border border-[#232433] focus:border-[#FF7854]">
          <Percent size={16} color="#FF7854" />
          <TextInput
            value={tasaMensual}
            onChangeText={(text) => {
              setTasaMensual(text)
              if (error) setError(null)
            }}
            keyboardType="numeric"
            placeholder="20"
            placeholderTextColor="#4B5563"
            className="flex-1 ml-3 text-white text-sm font-mono"
          />
          <Text className="text-stone-400 text-xs font-mono">% mes</Text>
        </View>
      </View>

      {/* Input: Días de gracia */}
      <View className="mb-4">
        <Text className="text-stone-300 text-xs font-medium mb-1.5 ml-1">
          Días de gracia por defecto
        </Text>
        <View className="flex-row items-center px-4 h-12 bg-[#08080E] rounded-xl border border-[#232433] focus:border-[#FF7854]">
          <Calendar size={16} color="#9CA3AF" />
          <TextInput
            value={diasGracia}
            onChangeText={(text) => {
              setDiasGracia(text)
              if (error) setError(null)
            }}
            keyboardType="number-pad"
            placeholder="3"
            placeholderTextColor="#4B5563"
            className="flex-1 ml-3 text-white text-sm font-mono"
          />
          <Text className="text-stone-400 text-xs font-mono">días</Text>
        </View>
      </View>

      {/* Aviso de consistencia financiera */}
      <View className="bg-[#0A0B12] border border-[#1E2030] rounded-xl p-3 mb-4 flex-row items-start">
        <AlertCircle size={15} color="#9CA3AF" className="mt-0.5" />
        <Text className="text-stone-400 text-[11px] ml-2 leading-4 flex-1">
          Modificar estos valores no alterará los préstamos creados anteriormente, conservando sus condiciones pactadas originales.
        </Text>
      </View>

      {/* Botón Guardar */}
      <AnimatedPressable
        onPress={handleSave}
        disabled={loading}
        className={`w-full h-11 rounded-xl items-center justify-center flex-row active:opacity-80 ${
          savedSuccess
            ? 'bg-emerald-600'
            : loading
            ? 'bg-[#C94422]/60'
            : 'bg-[#D34524]'
        }`}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : savedSuccess ? (
          <View className="flex-row items-center">
            <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
            <Text className="text-white text-xs font-bold ml-1.5">
              Configuración guardada
            </Text>
          </View>
        ) : (
          <Text className="text-white text-xs font-bold tracking-wide">
            Guardar condiciones
          </Text>
        )}
      </AnimatedPressable>
    </Animated.View>
  )
}

