import * as jalaali from 'jalaali-js'
import React, { useEffect, useRef, useState } from 'react'

interface PersianDatePickerProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
}

const persianMonths = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
]

const persianWeekDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']

const PersianDatePicker: React.FC<PersianDatePickerProps> = ({
  value,
  onChange,
  placeholder = 'انتخاب تاریخ',
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      const [y, m, d] = value.split('/').map(Number)
      return { year: y, month: m, day: d }
    }
    const today = jalaali.toJalaali(new Date())
    return { year: today.jy, month: today.jm, day: today.jd }
  })
  const [selectedDate, setSelectedDate] = useState<string>(value || '')
  const containerRef = useRef<HTMLDivElement>(null)

  // بستن با کلیک بیرون
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getDaysInMonth = (year: number, month: number) => {
    return jalaali.jalaaliMonthLength(year, month)
  }

  const getFirstDayOfMonth = (year: number, month: number) => {
    const gDate = jalaali.toGregorian(year, month, 1)
    const date = new Date(gDate.gy, gDate.gm - 1, gDate.gd)
    return (date.getDay() + 1) % 7 // 0 = شنبه
  }

  const goToPrevMonth = () => {
    setViewDate((prev) => {
      if (prev.month === 1) {
        return { year: prev.year - 1, month: 12, day: 1 }
      }
      return { ...prev, month: prev.month - 1 }
    })
  }

  const goToNextMonth = () => {
    setViewDate((prev) => {
      if (prev.month === 12) {
        return { year: prev.year + 1, month: 1, day: 1 }
      }
      return { ...prev, month: prev.month + 1 }
    })
  }

  const goToPrevYear = () => {
    setViewDate((prev) => ({ ...prev, year: prev.year - 1 }))
  }

  const goToNextYear = () => {
    setViewDate((prev) => ({ ...prev, year: prev.year + 1 }))
  }

  const selectDay = (day: number) => {
    const dateStr = `${viewDate.year}/${String(viewDate.month).padStart(2, '0')}/${String(day).padStart(2, '0')}`
    setSelectedDate(dateStr)
    if (onChange) {
      onChange(dateStr)
    }
    setIsOpen(false)
  }

  const today = jalaali.toJalaali(new Date())
  const isToday = (day: number) =>
    viewDate.year === today.jy &&
    viewDate.month === today.jm &&
    day === today.jd

  const isSelected = (day: number) => {
    if (!selectedDate) return false
    const [y, m, d] = selectedDate.split('/').map(Number)
    return viewDate.year === y && viewDate.month === m && day === d
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(viewDate.year, viewDate.month)
    const firstDay = getFirstDayOfMonth(viewDate.year, viewDate.month)
    const days = []

    // خانه‌های خالی قبل از اولین روز
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-9" />)
    }

    // روزهای ماه
    for (let day = 1; day <= daysInMonth; day++) {
      const isTodayDay = isToday(day)
      const isSelectedDay = isSelected(day)

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => selectDay(day)}
          className={`h-9 w-9 rounded-lg text-sm font-medium transition-all
            ${
              isSelectedDay
                ? 'bg-blue-600 text-white shadow-md'
                : isTodayDay
                  ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                  : 'text-gray-700 hover:bg-blue-50'
            }`}
        >
          {day}
        </button>
      )
    }

    return days
  }

  return (
    <div className="relative" ref={containerRef}>
      <input
        type="text"
        value={selectedDate}
        readOnly
        onClick={() => setIsOpen(!isOpen)}
        placeholder={placeholder}
        className="input-field cursor-pointer"
      />

      {isOpen && (
        <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl p-4 w-72">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-3">
            {/* سمت راست: به عقب (قبل) */}
            <button
              type="button"
              onClick={goToPrevMonth}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title="ماه قبل"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={goToPrevYear}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title="سال قبل"
            >
              «
            </button>
            {/* وسط: ماه و سال */}
            <div className="text-center">
              <div className="font-bold text-sm">
                {persianMonths[viewDate.month - 1]} {viewDate.year}
              </div>
            </div>
            {/* سمت چپ: به جلو (بعد) */}
            <button
              type="button"
              onClick={goToNextYear}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title="سال بعد"
            >
              »
            </button>
            <button
              type="button"
              onClick={goToNextMonth}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title="ماه بعد"
            >
              ›
            </button>
          </div>

          {/* Week Days */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {persianWeekDays.map((day) => (
              <div
                key={day}
                className="h-9 flex items-center justify-center text-xs font-bold text-gray-500"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>

          {/* Today Button */}
          <button
            type="button"
            onClick={() => {
              const today = jalaali.toJalaali(new Date())
              setViewDate({ year: today.jy, month: today.jm, day: today.jd })
              selectDay(today.jd)
            }}
            className="w-full mt-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            امروز
          </button>
        </div>
      )}
    </div>
  )
}

export default PersianDatePicker
