import { useEffect, useRef, useState } from 'react'
import { getStrings, getWeekdays } from '../i18n'

const LOCALE_TAGS = { ko: 'ko-KR', en: 'en-US', ja: 'ja-JP', zh: 'zh-CN' }

function toDateInputValue(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseDateValue(value) {
  if (!value) return null
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function buildMonthGrid(year, month) {
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()
  const cells = []
  for (let i = firstWeekday - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, daysInPrevMonth - i), inMonth: false })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), inMonth: true })
  }
  while (cells.length % 7 !== 0) {
    const next = new Date(cells[cells.length - 1].date)
    next.setDate(next.getDate() + 1)
    cells.push({ date: next, inMonth: false })
  }
  return cells
}

export default function DatePicker({ id, value, onChange, min, max, language = 'ko' }) {
  const t = getStrings(language)
  const [open, setOpen] = useState(false)
  const initial = parseDateValue(value) || parseDateValue(min) || new Date()
  const [viewYear, setViewYear] = useState(initial.getFullYear())
  const [viewMonth, setViewMonth] = useState(initial.getMonth())
  const wrapRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const parsed = parseDateValue(value)
    if (parsed) {
      setViewYear(parsed.getFullYear())
      setViewMonth(parsed.getMonth())
    }
  }, [value])

  const locale = LOCALE_TAGS[language] || LOCALE_TAGS.ko
  const monthLabel = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long' }).format(
    new Date(viewYear, viewMonth, 1)
  )
  const weekdays = getWeekdays(language)
  const cells = buildMonthGrid(viewYear, viewMonth)

  const minKey = viewYear * 12 + viewMonth
  const canGoPrev = !min || minKey > parseDateValue(min).getFullYear() * 12 + parseDateValue(min).getMonth()
  const canGoNext = !max || minKey < parseDateValue(max).getFullYear() * 12 + parseDateValue(max).getMonth()

  function changeMonth(delta) {
    const total = viewYear * 12 + viewMonth + delta
    setViewYear(Math.floor(total / 12))
    setViewMonth(((total % 12) + 12) % 12)
  }

  function selectDate(date) {
    const key = toDateInputValue(date)
    if (min && key < min) return
    if (max && key > max) return
    onChange(key)
    setOpen(false)
  }

  const displayValue = value ? value.replace(/-/g, '.') : ''

  return (
    <div className="date-picker-wrap" ref={wrapRef}>
      <button
        type="button"
        id={id}
        className="date-picker-trigger"
        onClick={() => setOpen((prev) => !prev)}
      >
        {displayValue || <span className="date-picker-placeholder">{t.datePlaceholder}</span>}
      </button>

      {open && (
        <div className="date-picker-popup" role="dialog">
          <div className="date-picker-header">
            <button
              type="button"
              className="date-picker-nav"
              onClick={() => changeMonth(-1)}
              disabled={!canGoPrev}
              aria-label={t.datePickerPrevMonth}
            >
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M12.5 5 7.5 10l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <span className="date-picker-month-label">{monthLabel}</span>
            <button
              type="button"
              className="date-picker-nav"
              onClick={() => changeMonth(1)}
              disabled={!canGoNext}
              aria-label={t.datePickerNextMonth}
            >
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M7.5 5 12.5 10l-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <div className="date-picker-weekdays">
            {weekdays.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>

          <div className="date-picker-grid">
            {cells.map(({ date, inMonth }) => {
              const key = toDateInputValue(date)
              const disabled = (min && key < min) || (max && key > max)
              const isSelected = key === value
              const classNames = ['date-picker-day']
              if (!inMonth) classNames.push('is-outside')
              if (isSelected) classNames.push('is-selected')
              return (
                <button
                  type="button"
                  key={key}
                  className={classNames.join(' ')}
                  disabled={disabled}
                  onClick={() => selectDate(date)}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>

          <div className="date-picker-footer">
            <button type="button" className="date-picker-text-btn" onClick={() => { onChange(''); setOpen(false) }}>
              {t.datePickerClear}
            </button>
            <button type="button" className="date-picker-text-btn" onClick={() => selectDate(new Date())}>
              {t.datePickerToday}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
