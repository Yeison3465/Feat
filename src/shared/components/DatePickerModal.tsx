import React, { useState, useMemo, useEffect } from 'react'
import { View, Text } from 'react-native'
import { ChevronLeft, ChevronRight } from 'lucide-react-native'
import { addDaysISO, addMonthsISO, todayISO, toISODate, parseISODate } from '../utils/dates'
import { Dialog } from '../ui/Overlay'
import { Button } from '../ui/Button'
import { AnimatedPressable } from './AnimatedPressable'
import { colors, fonts } from '../theme/tokens'

interface DatePickerModalProps {
  readonly visible: boolean
  readonly onClose: () => void
  readonly selectedDate: string // Formato YYYY-MM-DD
  readonly onSelectDate: (dateStr: string) => void
  readonly title?: string
  readonly minDate?: string // Formato YYYY-MM-DD
}

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

const DAY_LABELS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá']

// Ancho de cada columna: 7 columnas fijas para que la última semana no se descuadre
const CELL_WIDTH = '14.2857%'

// Helper para parsear string YYYY-MM-DD de forma segura sin sesgo de huso horario
function parseDateParts(dateStr: string): { year: number; month: number; day: number } {
  const parsed = parseISODate(dateStr)
  if (parsed) return parsed
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() }
}

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  onClose,
  selectedDate,
  onSelectDate,
  title = 'Seleccionar fecha',
  minDate,
}) => {
  const initial = useMemo(() => parseDateParts(selectedDate), [selectedDate])

  const [currentYear, setCurrentYear] = useState<number>(initial.year)
  const [currentMonth, setCurrentMonth] = useState<number>(initial.month)
  const [tempSelectedDate, setTempSelectedDate] = useState<string>(selectedDate)

  // Sincronizar estado interno cuando se abre el modal
  useEffect(() => {
    if (visible) {
      const parts = parseDateParts(selectedDate)
      setCurrentYear(parts.year)
      setCurrentMonth(parts.month)
      setTempSelectedDate(selectedDate)
    }
  }, [visible, selectedDate])

  const todayStr = useMemo(() => todayISO(), [])

  // Atajos calculados desde hoy; se deshabilitan si quedan antes de la fecha mínima
  const shortcuts = useMemo(
    () =>
      [
        { key: 'hoy', label: 'Hoy', dateStr: todayStr },
        { key: '15d', label: '+15 días (Quincena)', dateStr: addDaysISO(todayStr, 15) },
        { key: '1m', label: '+1 mes', dateStr: addMonthsISO(todayStr, 1) },
        { key: '2m', label: '+2 meses', dateStr: addMonthsISO(todayStr, 2) },
      ].map((s) => ({ ...s, disabled: minDate ? s.dateStr < minDate : false })),
    [todayStr, minDate]
  )

  // Semanas del mes actual (filas de 7 celdas)
  const calendarWeeks = useMemo(() => {
    // Primer día de la semana del mes (0 = Domingo, 1 = Lunes, ...)
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay()
    // Cantidad total de días en el mes
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

    const cells: Array<{ day: number | null; dateStr: string | null; isPast: boolean }> = []

    // Espacios vacíos antes del 1
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push({ day: null, dateStr: null, isPast: false })
    }

    // Días válidos del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = toISODate(currentYear, currentMonth, day)
      const isPast = minDate ? dateStr < minDate : false
      cells.push({ day, dateStr, isPast })
    }

    // Completar la última semana con celdas vacías
    while (cells.length % 7 !== 0) {
      cells.push({ day: null, dateStr: null, isPast: false })
    }

    const weeks: (typeof cells)[] = []
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7))
    }
    return weeks
  }, [currentYear, currentMonth, minDate])

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear((y) => y - 1)
    } else {
      setCurrentMonth((m) => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear((y) => y + 1)
    } else {
      setCurrentMonth((m) => m + 1)
    }
  }

  const handleQuickSelect = (dateStr: string) => {
    const parts = parseDateParts(dateStr)
    setCurrentYear(parts.year)
    setCurrentMonth(parts.month)
    setTempSelectedDate(dateStr)
  }

  const handleConfirm = () => {
    onSelectDate(tempSelectedDate)
    onClose()
  }

  return (
    <Dialog visible={visible} onClose={onClose}>
      <Text style={{ color: colors.warm, fontFamily: fonts.medium, fontSize: 18, lineHeight: 24 }}>{title}</Text>

      {/* Atajos rápidos */}
      <View style={{ gap: 8 }}>
        <Text style={{ color: colors.muted, fontFamily: fonts.regular, fontSize: 12 }}>Atajos frecuentes</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {shortcuts.map((s) => {
            const isActive = tempSelectedDate === s.dateStr
            return (
              <AnimatedPressable
                key={s.key}
                disabled={s.disabled}
                onPress={() => handleQuickSelect(s.dateStr)}
                haptic="selection"
                accessibilityRole="button"
                accessibilityState={{ selected: isActive, disabled: s.disabled }}
                style={{
                  height: 44,
                  paddingHorizontal: 14,
                  borderRadius: 999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isActive ? colors.warm : colors.card2,
                  borderWidth: 1,
                  borderColor: isActive ? colors.warm : colors.line,
                  opacity: s.disabled ? 0.35 : 1,
                }}
              >
                <Text
                  style={{
                    color: isActive ? colors.onLight : colors.warm,
                    fontFamily: fonts.medium,
                    fontSize: 12,
                  }}
                >
                  {s.label}
                </Text>
              </AnimatedPressable>
            )
          })}
        </View>
      </View>

      {/* Navegación de mes */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <AnimatedPressable
          onPress={handlePrevMonth}
          accessibilityRole="button"
          accessibilityLabel="Mes anterior"
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card2, alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronLeft size={16} color={colors.warm} />
        </AnimatedPressable>
        <Text
          accessibilityLiveRegion="polite"
          style={{ color: colors.warm, fontFamily: fonts.medium, fontSize: 16 }}
        >
          {MONTH_NAMES[currentMonth]} {currentYear}
        </Text>
        <AnimatedPressable
          onPress={handleNextMonth}
          accessibilityRole="button"
          accessibilityLabel="Mes siguiente"
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card2, alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronRight size={16} color={colors.warm} />
        </AnimatedPressable>
      </View>

      {/* Días de la semana */}
      <View style={{ flexDirection: 'row' }}>
        {DAY_LABELS.map((day) => (
          <View key={day} style={{ width: CELL_WIDTH, height: 28, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: colors.muted2, fontFamily: fonts.medium, fontSize: 11 }}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Matriz de días del mes (una fila por semana) */}
      <View style={{ gap: 2 }}>
        {calendarWeeks.map((week, weekIdx) => (
          <View key={`week-${weekIdx}`} style={{ flexDirection: 'row' }}>
            {week.map((cell, idx) => {
              if (cell.day === null || !cell.dateStr) {
                return <View key={`empty-${weekIdx}-${idx}`} style={{ width: CELL_WIDTH, height: 44 }} />
              }

              const isSelected = cell.dateStr === tempSelectedDate
              const isToday = cell.dateStr === todayStr
              const isDisabled = cell.isPast

              return (
                <View key={cell.dateStr} style={{ width: CELL_WIDTH, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                  <AnimatedPressable
                    disabled={isDisabled}
                    onPress={() => setTempSelectedDate(cell.dateStr!)}
                    accessibilityRole="button"
                    accessibilityLabel={cell.dateStr}
                    accessibilityState={{ selected: isSelected, disabled: isDisabled }}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isSelected ? colors.warm : 'transparent',
                      borderWidth: isToday && !isSelected ? 1 : 0,
                      borderColor: '#6C6C72',
                    }}
                  >
                    <Text
                      style={{
                        color: isSelected ? colors.onLight : isDisabled ? '#4A4A50' : colors.warm,
                        fontFamily: isSelected ? fonts.semibold : fonts.regular,
                        fontSize: 14,
                      }}
                    >
                      {cell.day}
                    </Text>
                  </AnimatedPressable>
                </View>
              )
            })}
          </View>
        ))}
      </View>

      <Text style={{ color: colors.muted2, fontFamily: fonts.regular, fontSize: 12 }}>
        Fecha elegida: {tempSelectedDate}
      </Text>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button label="Cancelar" variant="ghost" onPress={onClose} style={{ flex: 1, height: 52 }} />
        <Button label="Confirmar" variant="solid" onPress={handleConfirm} style={{ flex: 1, height: 52 }} />
      </View>
    </Dialog>
  )
}
