import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { Calendar, ChevronDown } from 'lucide-react-native'
import { DashboardPeriod } from '../types'

interface DashboardPeriodSelectorProps {
  readonly selectedPeriod: DashboardPeriod
  readonly onSelectPeriod: (period: DashboardPeriod) => void
}

export const DashboardPeriodSelector: React.FC<DashboardPeriodSelectorProps> = ({
  selectedPeriod,
  onSelectPeriod,
}) => {
  const options: { id: DashboardPeriod; label: string }[] = [
    { id: 'mes_actual', label: 'Mes actual' },
    { id: 'ultimos_30d', label: 'Últimos 30d' },
    { id: 'historico', label: 'Histórico' },
  ]

  return (
    <View className="flex-row items-center justify-between mb-4 bg-[#11121A] border border-[#1E2030] rounded-2xl p-1">
      {options.map((opt) => {
        const isSelected = selectedPeriod === opt.id
        return (
          <Pressable
            key={opt.id}
            onPress={() => onSelectPeriod(opt.id)}
            style={{ backgroundColor: isSelected ? '#FF7854' : 'transparent' }}
            className="flex-1 py-2 rounded-xl items-center justify-center"
          >
            <Text
              style={{ color: isSelected ? '#FFFFFF' : '#A1A1AA' }}
              className="text-xs font-bold"
            >
              {opt.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

