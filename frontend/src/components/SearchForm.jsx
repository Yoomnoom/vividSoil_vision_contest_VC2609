import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { SEOUL_DISTRICTS, SEOUL_DISTRICT_AREAS, isSeoulRegion } from '../seoulDistricts'
import { getDistrictLabel, getAreaLabel } from '../seoulDistrictsI18n'
import { getStrings } from '../i18n'
import useIsMobile from '../useIsMobile'
import LocationToggle from './LocationToggle'

const MAX_FORECAST_DAYS = 16

function toDateInputValue(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const TODAY = new Date()
const MAX_DATE = new Date(TODAY)
MAX_DATE.setDate(MAX_DATE.getDate() + MAX_FORECAST_DAYS - 1)
const MIN_DATE_VALUE = toDateInputValue(TODAY)
const MAX_DATE_VALUE = toDateInputValue(MAX_DATE)

export default function SearchForm({
  region,
  onRegionChange,
  startDate,
  onStartDateChange,
  onSubmit,
  loading,
  presetRegion,
  onLocate,
  language = 'ko',
  compact = false,
}) {
  const t = getStrings(language)
  const isMobile = useIsMobile()
  const [showRegionSheet, setShowRegionSheet] = useState(false)
  const [showRegionList, setShowRegionList] = useState(false)
  const [regionReadOnly, setRegionReadOnly] = useState(true)
  const idPrefix = compact ? 'compact-' : ''
  const regionId = `${idPrefix}region`
  const dateId = `${idPrefix}date`

  useEffect(() => {
    if (presetRegion) onRegionChange(presetRegion)
  }, [presetRegion])

  function handleSubmit(e) {
    e?.preventDefault?.()
    if (!region.trim() || !startDate) return
    if (!isSeoulRegion(region)) {
      window.alert(t.seoulOnlyAlert)
      return
    }
    onSubmit({ region: region.trim(), date: startDate, endDate: startDate })
  }

  function isRegionSelected(r) {
    return region === '서울' ? false : region.startsWith(r)
  }

  function handleRegionKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      setShowRegionList(false)
      document.getElementById(dateId)?.focus()
    }
  }

  function openRegionPicker() {
    if (isMobile) setShowRegionSheet(true)
  }

  return (
    <div className={`search-form${compact ? ' search-form-compact' : ''}`}>
      <div className="field region-field">
        {!compact && (
          <div className="field-label-row">
            <label htmlFor={regionId}>{t.regionLabel}</label>
            <LocationToggle onLocate={onLocate} language={language} />
          </div>
        )}
        <div className="input-arrow-wrap">
          {isMobile ? (
            <input
              id={regionId}
              name="trip-region"
              type="text"
              autoComplete="off"
              readOnly
              value={region}
              onClick={openRegionPicker}
              placeholder={t.regionPlaceholder}
              required
            />
          ) : (
            <input
              id={regionId}
              name="trip-region"
              type="search"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              data-lpignore="true"
              data-1p-ignore="true"
              data-bwignore="true"
              readOnly={regionReadOnly}
              value={region}
              onChange={(e) => onRegionChange(e.target.value)}
              onMouseDown={() => setRegionReadOnly(false)}
              onFocus={(e) => {
                setRegionReadOnly(false)
                setShowRegionList(true)
                e.target.readOnly = false
              }}
              onBlur={() => {
                setRegionReadOnly(true)
                setTimeout(() => setShowRegionList(false), 100)
              }}
              onKeyDown={handleRegionKeyDown}
              placeholder={t.regionPlaceholder}
              required
            />
          )}
          {isMobile ? (
            <button
              type="button"
              className="field-arrow-btn"
              aria-label={t.regionLabel}
              onClick={openRegionPicker}
            >
              <svg className="field-arrow-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M5 7.5 10 12.5 15 7.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : (
            <svg className="field-arrow-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M5 7.5 10 12.5 15 7.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>

        {!isMobile && showRegionList && (
          <ul className="region-suggestions">
            <li>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onRegionChange('서울')
                  setShowRegionList(false)
                }}
              >
                {t.regionAllOption}
              </button>
            </li>
            {SEOUL_DISTRICTS.map((r) => (
              <li key={r}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onRegionChange(`${r}(${SEOUL_DISTRICT_AREAS[r].join(', ')})`)
                    setShowRegionList(false)
                  }}
                >
                  {getDistrictLabel(language, r)}
                  <span className="region-suggestion-areas">
                    {' '}
                    / {SEOUL_DISTRICT_AREAS[r].map((area) => getAreaLabel(language, area)).join(', ')}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isMobile &&
        showRegionSheet &&
        createPortal(
          <div className="region-sheet-overlay" onClick={() => setShowRegionSheet(false)}>
            <div className="region-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="region-sheet-header">
                <span>{t.regionSheetTitle}</span>
                <button type="button" className="region-sheet-close" onClick={() => setShowRegionSheet(false)}>
                  {t.regionSheetClose}
                </button>
              </div>
              <ul className="region-sheet-list">
                <li>
                  <button
                    type="button"
                    className="region-sheet-option"
                    onClick={() => {
                      onRegionChange('서울')
                      setShowRegionSheet(false)
                    }}
                  >
                    <span className={`region-radio${region === '서울' ? ' checked' : ''}`} aria-hidden="true" />
                    {t.regionAllOption}
                  </button>
                </li>
                {SEOUL_DISTRICTS.map((r) => (
                  <li key={r}>
                    <button
                      type="button"
                      className="region-sheet-option"
                      onClick={() => {
                        onRegionChange(`${r}(${SEOUL_DISTRICT_AREAS[r].join(', ')})`)
                        setShowRegionSheet(false)
                      }}
                    >
                      <span className={`region-radio${isRegionSelected(r) ? ' checked' : ''}`} aria-hidden="true" />
                      <span>
                        {getDistrictLabel(language, r)}
                        <span className="region-suggestion-areas">
                          {' '}
                          / {SEOUL_DISTRICT_AREAS[r].map((area) => getAreaLabel(language, area)).join(', ')}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>,
          document.body
        )}

      <div className="field">
        {!compact && (
          <div className="field-label-row">
            <label htmlFor={dateId}>{t.dateLabel}</label>
            <span className="hint">
              {t.dateHint(MAX_FORECAST_DAYS).split('\n').map((line, i) => (
                <span key={i}>
                  {i > 0 && <br />}
                  {line}
                </span>
              ))}
            </span>
          </div>
        )}
        <div className="input-arrow-wrap">
          <input
            id={dateId}
            type="date"
            className="date-input"
            value={startDate}
            min={MIN_DATE_VALUE}
            max={MAX_DATE_VALUE}
            onChange={(e) => onStartDateChange(e.target.value)}
            required
          />
          <svg className="field-arrow-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M5 7.5 10 12.5 15 7.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      <button type="button" disabled={loading} onClick={handleSubmit}>
        {loading ? t.submitLoading : t.submitIdle}
      </button>
    </div>
  )
}
