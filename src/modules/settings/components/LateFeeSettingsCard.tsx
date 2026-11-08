import React, { useState, useEffect } from 'react'
import { View, Text } from 'react-native'
import Animated, { FadeInDown, FadeOutUp, useReducedMotion } from 'react-native-reanimated'
import { Calendar, Check, Info, Percent, ShieldAlert } from 'lucide-react-native'
import { LoanSettings, UpdateSettingsDTO } from '../types'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { AnimatedPressable } from '../../../shared/components/AnimatedPressable'
import { AppText } from '../../../shared/ui/AppText'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { Field } from '../../../shared/ui/Field'
import { DURATION, EASE_OUT, screenEnter } from '../../../shared/motion'
import { haptic } from '../../../shared/haptics'
import { colors, fonts } from '../../../shared/theme/tokens'

interface LateFeeSettingsCardProps {
  readonly settings: LoanSettings | null
  readonly onSave: (dto: UpdateSettingsDTO) => Promise<void>
  readonly loading: boolean
}

type BaseCalculo = 'SOLO_CAPITAL' | 'TOTAL_VENCIDO'

const BASES: ReadonlyArray<{ id: BaseCalculo; label: string; desc: string }> = [
  { id: 'SOLO_CAPITAL', label: 'Solo capital', desc: 'Calcula sobre el saldo de capital pendiente.' },
  { id: 'TOTAL_VENCIDO', label: 'Total vencido', desc: 'Calcula sobre capital + interés vencido de la cuota.' },
]

export const LateFeeSettingsCard: React.FC<LateFeeSettingsCardProps> = ({
  settings,
  onSave,
  loading,
}) => {
  const reduced = useReducedMotion()
  const [moraEnabled, setMoraEnabled] = useState(false)
  const [tasaMora, setTasaMora] = useState('0')
  const [diasGracia, setDiasGracia] = useState('3')
  const [baseCalculo, setBaseCalculo] = useState<BaseCalculo>('SOLO_CAPITAL')
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
      haptic('success')
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Error al guardar la configuración de mora.')
    }
  }

  return (
    <Animated.View entering={screenEnter(3, reduced)}>
      <Card variant="ink" style={{ padding: 20, gap: 18 }}>
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 }}>
              <ShieldAlert size={18} color={colors.dangerSoft} />
              <AppText variant="sec" style={{ fontSize: 20, flexShrink: 1 }}>
                Configuración de mora
              </AppText>
            </View>
            <Text style={{ color: colors.muted2, fontFamily: fonts.regular, fontSize: 10, letterSpacing: 0.8 }}>SCR-20</Text>
          </View>
          <Text style={{ color: '#B4B4B9', fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 }}>
            Define si los atrasos generan recargos monetarios automáticos o solo alertas de seguimiento en cartera.
          </Text>
        </View>

        {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}

        {/* Activación del recargo por mora */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, padding: 16, borderRadius: 22, backgroundColor: colors.card2 }}>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={{ color: colors.warm, fontFamily: fonts.semibold, fontSize: 15 }}>Recargo monetario por mora</Text>
            <Text style={{ color: '#B4B4B9', fontFamily: fonts.regular, fontSize: 12, lineHeight: 17 }}>
              {moraEnabled
                ? 'Se liquidará recargo proporcional tras vencer los días de gracia.'
                : 'Desactivado (0%): las cuotas vencidas se marcan como Atrasadas sin recargo adicional.'}
            </Text>
          </View>
          <AnimatedPressable
            onPress={() => {
              haptic('selection')
              setMoraEnabled((prev) => !prev)
              setError(null)
            }}
            accessibilityRole="switch"
            accessibilityState={{ checked: moraEnabled }}
            accessibilityLabel="Recargo monetario por mora"
            style={{
              minHeight: 44,
              paddingHorizontal: 16,
              borderRadius: 999,
              justifyContent: 'center',
              backgroundColor: moraEnabled ? colors.warm : colors.card,
              borderWidth: 1,
              borderColor: moraEnabled ? colors.warm : colors.line2,
            }}
          >
            <Text style={{ color: moraEnabled ? colors.onLight : colors.muted, fontFamily: fonts.medium, fontSize: 13 }}>
              {moraEnabled ? 'Activo' : '0% (Solo alerta)'}
            </Text>
          </AnimatedPressable>
        </View>

        {/* Con mora activa: tasa y base de cálculo */}
        {moraEnabled && (
          <Animated.View
            entering={reduced ? undefined : FadeInDown.duration(DURATION.control).easing(EASE_OUT)}
            exiting={reduced ? undefined : FadeOutUp.duration(DURATION.dialogOut)}
            style={{ gap: 18 }}
          >
            <Field
              compact
              label="Tasa de mora mensual por defecto (%)"
              value={tasaMora}
              onChangeText={(text) => {
                setTasaMora(text)
                if (error) setError(null)
              }}
              keyboardType="numeric"
              placeholder="5"
              suffix="% mes"
              prefix={({ focused }) => <Percent size={16} color={focused ? colors.warm : colors.dangerSoft} />}
            />

            <View style={{ gap: 8 }}>
              <Text style={{ color: colors.muted, fontFamily: fonts.medium, fontSize: 12 }}>Base de cálculo de mora</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {BASES.map((b) => {
                  const on = baseCalculo === b.id
                  return (
                    <AnimatedPressable
                      key={b.id}
                      onPress={() => {
                        haptic('selection')
                        setBaseCalculo(b.id)
                      }}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: on }}
                      containerStyle={{ flex: 1 }}
                      style={{
                        gap: 4,
                        padding: 14,
                        borderRadius: 20,
                        backgroundColor: on ? colors.warm : colors.card,
                        borderWidth: 1,
                        borderColor: on ? colors.warm : colors.line,
                      }}
                    >
                      <Text style={{ color: on ? colors.onLight : colors.warm, fontFamily: fonts.semibold, fontSize: 13 }}>{b.label}</Text>
                      <Text style={{ color: on ? colors.onLightMuted : colors.muted2, fontFamily: fonts.regular, fontSize: 11, lineHeight: 15 }}>
                        {b.desc}
                      </Text>
                    </AnimatedPressable>
                  )
                })}
              </View>
            </View>
          </Animated.View>
        )}

        {/* Días de gracia */}
        <Field
          compact
          label="Días de gracia antes de devengar mora"
          value={diasGracia}
          onChangeText={(text) => {
            setDiasGracia(text)
            if (error) setError(null)
          }}
          keyboardType="number-pad"
          placeholder="3"
          suffix="días de tolerancia"
          prefix={({ focused }) => <Calendar size={16} color={focused ? colors.warm : colors.muted2} />}
        />

        {/* Nota de la regla financiera */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 18, backgroundColor: colors.card2 }}>
          <Info size={15} color={colors.warn} style={{ marginTop: 2 }} />
          <Text style={{ flex: 1, color: colors.muted, fontFamily: fonts.regular, fontSize: 12, lineHeight: 18 }}>
            Durante los días de gracia, la cuota vencida figurará en seguimiento pero no generará recargos. Al superarse la gracia, el motor sincroniza la mora sin duplicar cargos previos.
          </Text>
        </View>

        <Button
          label={savedSuccess ? 'Reglas de mora guardadas' : 'Guardar configuración de mora'}
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
