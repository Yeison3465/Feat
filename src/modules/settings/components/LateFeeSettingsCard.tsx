import React, { useState, useEffect } from 'react'
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native'
import { AlertTriangle, Calendar, Check, Info, Percent, ShieldAlert } from 'lucide-react-native'
import { LoanSettings, UpdateSettingsDTO } from '../types'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import Animated, { FadeInDown, FadeOutUp, useReducedMotion } from 'react-native-reanimated'
import { AnimatedPressable } from '../../../shared/components/AnimatedPressable'

interface LateFeeSettingsCardProps {
  readonly settings: LoanSettings | null
  readonly onSave: (dto: UpdateSettingsDTO) => Promise<void>
  readonly loading: boolean
}

export const LateFeeSettingsCard: React.FC<LateFeeSettingsCardProps> = ({
  settings,
  onSave,
  loading,
}) => {
  const reducedMotion = useReducedMotion()
  const [moraEnabled, setMoraEnabled] = useState(false)
  const [tasaMora, setTasaMora] = useState('0')
  const [diasGracia, setDiasGracia] = useState('3')
  const [baseCalculo, setBaseCalculo] = useState<'SOLO_CAPITAL' | 'TOTAL_VENCIDO'>('SOLO_CAPITAL')
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (settings) {
      const rate = settings.tasa_mora_defecto ?? 0
      setMoraEnabled(rate > 0)
      setTasaMora(rate > 0 ? rate.toString() : '5')
      setDiasGracia((settings.dias_gracia_defecto ?? 3).toString())
      setBaseCalculo(
        settings.base_calculo_mora === 'TOTAL_VENCIDO' ? 'TOTAL_VENCIDO' : 'SOLO_CAPITAL'
      )
    }
  }, [settings])

  const handleSave = async () => {
    setError(null)
    setSavedSuccess(false)

    const effectiveRate = moraEnabled ? parseFloat(tasaMora) : 0
    const graciaNum = parseInt(diasGracia, 10)

    if (moraEnabled && (isNaN(effectiveRate) || effectiveRate <= 0 || effectiveRate > 100)) {
      setError('Al activar cobro de mora, la tasa debe ser un porcentaje válido entre 0.1% y 100%.')
      return
    }

    if (isNaN(graciaNum) || graciaNum < 0 || graciaNum > 90) {
      setError('Los días de gracia deben ser un número entero entre 0 y 90 días.')
      return
    }

    try {
      await onSave({
        tasa_mora_defecto: effectiveRate,
        dias_gracia_defecto: graciaNum,
        base_calculo_mora: baseCalculo,
      })
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Error al guardar la configuración de mora.')
    }
  }

  return (
    <Animated.View
      entering={reducedMotion ? undefined : FadeInDown.delay(70).duration(420).springify().damping(18).stiffness(160)}
      className="bg-[#12131C] border border-[#232433] rounded-[24px] p-5 mb-5 shadow-xl shadow-black"
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center">
          <ShieldAlert size={18} color="#FB3758" />
          <Text className="text-white text-base font-bold ml-2">
            Configuración de mora
          </Text>
        </View>
        <Text className="text-stone-500 text-[10px] font-mono uppercase">SCR-20</Text>
      </View>

      <Text className="text-stone-400 text-xs leading-4 mb-4">
        Define si los atrasos generan recargos monetarios automáticos o solo alertas de seguimiento en cartera.
      </Text>

      {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}

      {/* Selector de Activación de Recargo por Mora */}
      <View className="bg-[#0A0B12] border border-[#1E2030] rounded-2xl p-3.5 mb-4">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-1 pr-3">
            <Text className="text-white text-xs font-bold">
              Recargo monetario por mora
            </Text>
            <Text className="text-stone-400 text-[11px] mt-0.5 leading-4">
              {moraEnabled
                ? 'Se liquidará recargo proporcional tras vencer los días de gracia.'
                : 'Desactivado (0%): las cuotas vencidas se marcan como Atrasadas sin recargo adicional.'}
            </Text>
          </View>

          <Pressable
            onPress={() => {
              setMoraEnabled((prev) => !prev)
              setError(null)
            }}
            className={`px-3.5 py-2 rounded-xl border ${
              moraEnabled
                ? 'bg-[#FB3758]/15 border-[#FB3758]/50'
                : 'bg-[#181926] border-[#282A3E]'
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                moraEnabled ? 'text-[#FB3758]' : 'text-stone-400'
              }`}
            >
              {moraEnabled ? 'Activo' : '0% (Solo alerta)'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Si está activa la mora: Tasa de mora y Base de cálculo */}
      {moraEnabled && (
        <Animated.View
          entering={reducedMotion ? undefined : FadeInDown.duration(340).springify()}
          exiting={reducedMotion ? undefined : FadeOutUp.duration(240)}
        >
          <View className="mb-4">
            <Text className="text-stone-300 text-xs font-medium mb-1.5 ml-1">
              Tasa de mora mensual por defecto (%)
            </Text>
            <View className="flex-row items-center px-4 h-12 bg-[#08080E] rounded-xl border border-[#232433]">
              <Percent size={16} color="#FB3758" />
              <TextInput
                value={tasaMora}
                onChangeText={(text) => {
                  setTasaMora(text)
                  if (error) setError(null)
                }}
                keyboardType="numeric"
                placeholder="5"
                placeholderTextColor="#4B5563"
                className="flex-1 ml-3 text-white text-sm font-mono"
              />
              <Text className="text-stone-400 text-xs font-mono">% mes</Text>
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-stone-300 text-xs font-medium mb-1.5 ml-1">
              Base de cálculo de mora
            </Text>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setBaseCalculo('SOLO_CAPITAL')}
                className={`flex-1 p-3 rounded-xl border ${
                  baseCalculo === 'SOLO_CAPITAL'
                    ? 'bg-[#FB3758]/15 border-[#FB3758]'
                    : 'bg-[#08080E] border-[#232433]'
                }`}
              >
                <Text
                  className={`text-xs font-bold mb-0.5 ${
                    baseCalculo === 'SOLO_CAPITAL' ? 'text-white' : 'text-stone-400'
                  }`}
                >
                  Solo capital
                </Text>
                <Text className="text-stone-500 text-[10px] leading-3.5">
                  Calcula sobre el saldo de capital pendiente.
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setBaseCalculo('TOTAL_VENCIDO')}
                className={`flex-1 p-3 rounded-xl border ${
                  baseCalculo === 'TOTAL_VENCIDO'
                    ? 'bg-[#FB3758]/15 border-[#FB3758]'
                    : 'bg-[#08080E] border-[#232433]'
                }`}
              >
                <Text
                  className={`text-xs font-bold mb-0.5 ${
                    baseCalculo === 'TOTAL_VENCIDO' ? 'text-white' : 'text-stone-400'
                  }`}
                >
                  Total vencido
                </Text>
                <Text className="text-stone-500 text-[10px] leading-3.5">
                  Calcula sobre capital + interés vencido de la cuota.
                </Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Días de tolerancia / gracia */}
      <View className="mb-4">
        <Text className="text-stone-300 text-xs font-medium mb-1.5 ml-1">
          Días de gracia antes de devengar mora
        </Text>
        <View className="flex-row items-center px-4 h-12 bg-[#08080E] rounded-xl border border-[#232433]">
          <Calendar size={16} color="#F59E0B" />
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
          <Text className="text-stone-400 text-xs font-mono">días de tolerancia</Text>
        </View>
      </View>

      {/* Nota explicativa de regla financiera */}
      <View className="bg-[#0A0B12] border border-[#1E2030] rounded-xl p-3 mb-4 flex-row items-start">
        <Info size={15} color="#F59E0B" className="mt-0.5" />
        <Text className="text-stone-400 text-[11px] ml-2 leading-4 flex-1">
          Durante los días de gracia, la cuota vencida figurará en seguimiento pero no generará recargos. Al superarse la gracia, el motor sincroniza la mora sin duplicar cargos previos.
        </Text>
      </View>

      {/* Botón Guardar */}
      <AnimatedPressable
        onPress={handleSave}
        disabled={loading}
        className={`w-full h-11 rounded-xl items-center justify-center flex-row ${
          savedSuccess
            ? 'bg-emerald-600'
            : loading
            ? 'bg-[#C94422]/60'
            : 'bg-[#D34524] active:bg-[#E54F2C]'
        }`}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : savedSuccess ? (
          <View className="flex-row items-center">
            <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
            <Text className="text-white text-xs font-bold ml-1.5">
              Reglas de mora guardadas
            </Text>
          </View>
        ) : (
          <Text className="text-white text-xs font-bold tracking-wide">
            Guardar configuración de mora
          </Text>
        )}
      </AnimatedPressable>
    </Animated.View>
  )
}

