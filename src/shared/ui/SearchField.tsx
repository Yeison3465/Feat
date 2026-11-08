import React, { useState } from 'react'
import { TextInput, View } from 'react-native'
import { Search, X } from 'lucide-react-native'
import { AnimatedPressable } from '../components/AnimatedPressable'
import { colors, fonts } from '../theme/tokens'

interface SearchFieldProps {
  readonly value: string
  readonly onChangeText: (text: string) => void
  readonly placeholder: string
  readonly accessibilityLabel: string
  readonly autoFocus?: boolean
}

// Buscador en píldora de 52 px con botón para limpiar; el borde se aclara al enfocar
export const SearchField: React.FC<SearchFieldProps> = ({ value, onChangeText, placeholder, accessibilityLabel, autoFocus }) => {
  const [focused, setFocused] = useState(false)
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        height: 52,
        paddingLeft: 18,
        paddingRight: 6,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: focused ? '#6E6E74' : colors.line,
        borderRadius: 999,
      }}
    >
      <Search size={16} color={colors.muted2} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        placeholderTextColor={colors.muted2}
        selectionColor={colors.warm}
        accessibilityLabel={accessibilityLabel}
        returnKeyType="search"
        autoFocus={autoFocus}
        style={{ flex: 1, minWidth: 0, height: 50, color: colors.warm, fontFamily: fonts.regular, fontSize: 14 }}
      />
      {value.length > 0 && (
        <AnimatedPressable
          onPress={() => onChangeText('')}
          accessibilityRole="button"
          accessibilityLabel="Limpiar búsqueda"
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card2, alignItems: 'center', justifyContent: 'center' }}
        >
          <X size={16} color={colors.warm} />
        </AnimatedPressable>
      )}
    </View>
  )
}
