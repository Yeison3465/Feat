import React, { useState, useMemo, useEffect } from 'react'
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Check, X, Clock } from 'lucide-react-native'

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

// Helper para parsear string YYYY-MM-DD de forma segura sin sesgo de huso horario
function parseDateParts(dateStr: string): { year: number; month: number; day: number } {
  try {
    const parts = dateStr.split('-').map((p) => parseInt(p, 10))
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return { year: parts[0], month: parts[1] - 1, day: parts[2] }
    }
  } catch {
    // fallback a hoy
  }
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() }
}

function formatDateString(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${year}-${m}-${d}`
}

function addDaysToToday(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return formatDateString(d.getFullYear(), d.getMonth(), d.getDate())
}

function addMonthsToToday(months: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() + months)
  return formatDateString(d.getFullYear(), d.getMonth(), d.getDate())
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

  const todayStr = useMemo(() => {
    const now = new Date()
    return formatDateString(now.getFullYear(), now.getMonth(), now.getDate())
  }, [])

  // Días del mes actual
  const calendarGrid = useMemo(() => {
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
      const dateStr = formatDateString(currentYear, currentMonth, day)
      const isPast = minDate ? dateStr < minDate : false
      cells.push({ day, dateStr, isPast })
    }

    return cells
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
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/75 justify-center items-center px-4">
        <Pressable onPress={onClose} className="absolute inset-0" />

        <View className="bg-[#12131A] border border-[#1E2030] rounded-3xl w-full max-w-sm p-5 shadow-2xl shadow-black z-10">
          {/* Header del Modal */}
          <View className="flex-row items-center justify-between pb-3 border-b border-[#1C1E2B] mb-3">
            <View className="flex-row items-center gap-2">
              <CalendarIcon size={18} color="#FF7854" />
              <Text className="text-white text-base font-bold tracking-tight">
                {title}
              </Text>
            </View>

            <Pressable onPress={onClose} hitSlop={10} className="p-1 rounded-lg active:bg-[#1E2030]">
              <X size={18} color="#9CA3AF" />
            </Pressable>
          </View>

          {/* Atajos Rápidos */}
          <Text className="text-zinc-500 text-[11px] font-semibold uppercase tracking-wider mb-2">
            Atajos frecuentes
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row mb-4"
            contentContainerStyle={{ gap: 8 }}
          >
            <Pressable
              onPress={() => handleQuickSelect(todayStr)}
              className={`px-3 py-1.5 rounded-xl border flex-row items-center gap-1.5 ${
                tempSelectedDate === todayStr
                  ? 'bg-[#D34524]/20 border-[#D34524]'
                  : 'bg-[#181924] border-[#252738]'
              }`}
            >
              <Clock size={12} color={tempSelectedDate === todayStr ? '#FF7854' : '#9CA3AF'} />
              <Text
                className={`text-xs font-medium ${
                  tempSelectedDate === todayStr ? 'text-[#FF7854] font-bold' : 'text-zinc-300'
                }`}
              >
                Hoy
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleQuickSelect(addDaysToToday(15))}
              className={`px-3 py-1.5 rounded-xl border ${
                tempSelectedDate === addDaysToToday(15)
                  ? 'bg-[#D34524]/20 border-[#D34524]'
                  : 'bg-[#181924] border-[#252738]'
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  tempSelectedDate === addDaysToToday(15) ? 'text-[#FF7854] font-bold' : 'text-zinc-300'
                }`}
              >
                +15 días (Quincena)
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleQuickSelect(addMonthsToToday(1))}
              className={`px-3 py-1.5 rounded-xl border ${
                tempSelectedDate === addMonthsToToday(1)
                  ? 'bg-[#D34524]/20 border-[#D34524]'
                  : 'bg-[#181924] border-[#252738]'
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  tempSelectedDate === addMonthsToToday(1) ? 'text-[#FF7854] font-bold' : 'text-zinc-300'
                }`}
              >
                +30 días (1 mes)
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleQuickSelect(addMonthsToToday(2))}
              className={`px-3 py-1.5 rounded-xl border ${
                tempSelectedDate === addMonthsToToday(2)
                  ? 'bg-[#D34524]/20 border-[#D34524]'
                  : 'bg-[#181924] border-[#252738]'
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  tempSelectedDate === addMonthsToToday(2) ? 'text-[#FF7854] font-bold' : 'text-zinc-300'
                }`}
              >
                +60 días (2 meses)
              </Text>
            </Pressable>
          </ScrollView>

          {/* Navegación Mes / Año */}
          <View className="flex-row items-center justify-between bg-[#0A0B10] border border-[#1E2030] rounded-2xl px-3 py-2.5 mb-3">
            <Pressable
              onPress={handlePrevMonth}
              className="p-1.5 rounded-xl bg-[#151622] active:bg-[#202234]"
              hitSlop={8}
            >
              <ChevronLeft size={18} color="#D1D5DB" />
            </Pressable>

            <View className="items-center">
              <Text className="text-white text-sm font-bold tracking-tight">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </Text>
            </View>

            <Pressable
              onPress={handleNextMonth}
              className="p-1.5 rounded-xl bg-[#151622] active:bg-[#202234]"
              hitSlop={8}
            >
              <ChevronRight size={18} color="#D1D5DB" />
            </Pressable>
          </View>

          {/* Días de la Semana */}
          <View className="flex-row justify-between mb-2 px-1">
            {DAY_LABELS.map((day) => (
              <View key={day} className="w-9 items-center">
                <Text className="text-zinc-500 text-[11px] font-semibold">
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* Matriz de Días del Mes */}
          <View className="flex-row flex-wrap justify-between">
            {calendarGrid.map((cell, idx) => {
              if (cell.day === null || !cell.dateStr) {
                return <View key={`empty-${idx}`} className="w-9 h-9 m-0.5" />
              }

              const isSelected = cell.dateStr === tempSelectedDate
              const isToday = cell.dateStr === todayStr
              const isDisabled = cell.isPast

              return (
                <Pressable
                  key={cell.dateStr}
                  disabled={isDisabled}
                  onPress={() => setTempSelectedDate(cell.dateStr!)}
                  className={`w-9 h-9 m-0.5 rounded-xl items-center justify-center ${
                    isSelected
                      ? 'bg-[#D34524] shadow-md shadow-[#D34524]/40'
                      : isToday
                      ? 'border border-[#FF7854]/60 bg-[#1A1820]'
                      : isDisabled
                      ? 'opacity-30'
                      : 'active:bg-[#1C1E2B]'
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      isSelected
                        ? 'text-white font-bold'
                        : isToday
                        ? 'text-[#FF7854]'
                        : isDisabled
                        ? 'text-zinc-600'
                        : 'text-zinc-200'
                    }`}
                  >
                    {cell.day}
                  </Text>
                </Pressable>
              )
            })}
          </View>

          {/* Fecha seleccionada previa y Botones de Acción */}
          <View className="mt-4 pt-3 border-t border-[#1C1E2B]">
            <View className="flex-row items-center justify-between mb-3 px-1">
              <Text className="text-zinc-400 text-xs">Fecha elegida:</Text>
              <Text className="text-white text-xs font-mono font-bold">
                {tempSelectedDate}
              </Text>
            </View>

            <View className="flex-row gap-2">
              <Pressable
                onPress={onClose}
                className="flex-1 py-3 rounded-xl bg-[#161722] border border-[#232433] items-center justify-center active:bg-[#202234]"
              >
                <Text className="text-zinc-400 text-xs font-semibold">Cancelar</Text>
              </Pressable>

              <Pressable
                onPress={handleConfirm}
                className="flex-1 py-3 rounded-xl bg-[#D34524] active:bg-[#E54F2C] items-center justify-center flex-row gap-1.5 shadow-md shadow-[#D34524]/20"
              >
                <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
                <Text className="text-white text-xs font-bold">Confirmar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  )
}

