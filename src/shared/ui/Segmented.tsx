import React from 'react'
import { StyleProp, Text, View, ViewStyle } from 'react-native'
import { AnimatedPressable } from '../components/AnimatedPressable'
import { colors, fonts } from '../theme/tokens'

export interface SegmentedOption<T extends string> {
  readonly id: T
  readonly label: string
}

interface SegmentedProps<T extends string> {
  readonly options: ReadonlyArray<SegmentedOption<T>>
  readonly value: T
  readonly onChange: (id: T) => void
  // Versión compacta (38 px) para selectores de vista; la normal mide 44 px
  readonly compact?: boolean
  readonly style?: StyleProp<ViewStyle>
}

// Control segmentado en píldora: el segmento activo se rellena de blanco cálido.
export function Segmented<T extends string>({ options, value, onChange, compact = false, style }: SegmentedProps<T>) {
  return (
    <View
      accessibilityRole="tablist"
      style={[
        {
          flexDirection: 'row',
          gap: compact ? 2 : 4,
          padding: compact ? 3 : 4,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.line,
          borderRadius: 999,
        },
        style,
      ]}
    >
      {options.map((o) => {
        const on = o.id === value
        return (
          <AnimatedPressable
            key={o.id}
            onPress={() => !on && onChange(o.id)}
            haptic="selection"
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            containerClassName={compact ? undefined : 'flex-1'}
            style={{
              height: compact ? 38 : 44,
              paddingHorizontal: compact ? 14 : 8,
              borderRadius: 999,
              backgroundColor: on ? colors.warm : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                color: on ? colors.onLight : colors.muted,
                fontFamily: fonts.medium,
                fontSize: compact ? 12 : 14,
              }}
            >
              {o.label}
            </Text>
          </AnimatedPressable>
        )
      })}
    </View>
  )
}
