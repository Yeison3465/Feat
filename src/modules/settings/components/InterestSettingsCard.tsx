import React, { useState, useEffect } from 'react'
import { View, Text } from 'react-native'
import Animated, { useReducedMotion } from 'react-native-reanimated'
import { Percent, Calendar, Check, AlertCircle } from 'lucide-react-native'
import { LoanSettings, UpdateSettingsDTO } from '../types'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { AppText } from '../../../shared/ui/AppText'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { Field } from '../../../shared/ui/Field'
import { screenEnter } from '../../../shared/motion'
import { haptic } from '../../../shared/haptics'
import { colors, fonts } from '../../../shared/theme/tokens'

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
  const reduced = useReducedMotion()
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
      haptic('success')
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Error al guardar la configuración.')
    }
  }

  return (
    <Animated.View entering={screenEnter(2, reduced)}>
      <Card variant="ink" style={{ padding: 20, gap: 18 }}>
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <AppText variant="sec" style={{ fontSize: 20, flexShrink: 1 }}>
              Condiciones predeterminadas
            </AppText>
            <Text style={{ color: colors.muted2, fontFamily: fonts.regular, fontSize: 10, letterSpacing: 0.8 }}>SCR-19</Text>
          </View>
          <Text style={{ color: '#B4B4B9', fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 }}>
            Estas condiciones se precargarán automáticamente al otorgar nuevos préstamos.
          </Text>
        </View>

        {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}

        <Field
          compact
          label="Tasa ordinaria mensual (%)"
          value={tasaMensual}
          onChangeText={(text) => {
            setTasaMensual(text)
            if (error) setError(null)
          }}
          keyboardType="numeric"
          placeholder="20"
          suffix="% mes"
          prefix={({ focused }) => <Percent size={16} color={focused ? colors.warm : colors.muted2} />}
        />

        <Field
          compact
          label="Días de gracia por defecto"
          value={diasGracia}
          onChangeText={(text) => {
            setDiasGracia(text)
            if (error) setError(null)
          }}
          keyboardType="number-pad"
          placeholder="3"
          suffix="días"
          prefix={({ focused }) => <Calendar size={16} color={focused ? colors.warm : colors.muted2} />}
        />

        {/* Aviso de consistencia financiera */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 18, backgroundColor: colors.card2 }}>
          <AlertCircle size={15} color={colors.muted} style={{ marginTop: 2 }} />
          <Text style={{ flex: 1, color: colors.muted, fontFamily: fonts.regular, fontSize: 12, lineHeight: 18 }}>
            Modificar estos valores no alterará los préstamos creados anteriormente, conservando sus condiciones pactadas originales.
          </Text>
        </View>

        <Button
          label={savedSuccess ? 'Configuración guardada' : 'Guardar condiciones'}
          variant={savedSuccess ? 'success' : 'solid'}
          onPress={handleSave}
          loading={loading}
          disabled={savedSuccess}
          icon={savedSuccess ? <Check size={16} color="#06220F" strokeWidth={2.5} /> : undefined}
          style={{ width: '100%', ...(savedSuccess ? { opacity: 1 } : null) }}
        />
      </Card>
    </Animated.View>
  )
}
