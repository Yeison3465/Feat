import React from 'react'
import { Segmented } from '../../../shared/ui/Segmented'
import { DashboardPeriod } from '../types'

interface DashboardPeriodSelectorProps {
  readonly selectedPeriod: DashboardPeriod
  readonly onSelectPeriod: (period: DashboardPeriod) => void
}

const OPTIONS: { id: DashboardPeriod; label: string }[] = [
  { id: 'mes_actual', label: 'Mes actual' },
  { id: 'ultimos_30d', label: 'Últimos 30d' },
  { id: 'historico', label: 'Histórico' },
]

export const DashboardPeriodSelector: React.FC<DashboardPeriodSelectorProps> = ({
  selectedPeriod,
  onSelectPeriod,
}) => {
  return <Segmented options={OPTIONS} value={selectedPeriod} onChange={onSelectPeriod} />
}
