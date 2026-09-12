import { useState } from 'react'
import { API_BASE } from '../apiBase'
import { isSeoulRegion, toCanonicalRegion } from '../seoulDistricts'
import { getStrings } from '../i18n'

async function reverseGeocode(latitude, longitude, fallbackError) {
  const res = await fetch(`${API_BASE}/api/reverse-geocode?lat=${latitude}&lon=${longitude}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || fallbackError)
  return data.address
}

export default function LocationToggle({ onLocate, language = 'ko' }) {
  const t = getStrings(language)
  const [active, setActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function handleToggle() {
    if (active) {
      setActive(false)
      setError(null)
      return
    }

    if (!navigator.geolocation) {
      setError(t.locationUnsupported)
      return
    }

    setLoading(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        try {
          const place = await reverseGeocode(latitude, longitude, t.locationAddressError)
          if (!isSeoulRegion(place)) {
            window.alert(t.seoulOnlyAlert)
            return
          }
          onLocate?.(toCanonicalRegion(place))
          setActive(true)
        } catch (err) {
          setError(err.message)
        } finally {
          setLoading(false)
        }
      },
      () => {
        setError(t.locationPermissionDenied)
        setLoading(false)
      },
      { enableHighAccuracy: false, timeout: 8000 }
    )
  }

  return (
    <div className="location-toggle-wrap">
      <button
        type="button"
        className={`location-toggle${active ? ' is-active' : ''}`}
        onClick={handleToggle}
        disabled={loading}
        aria-pressed={active}
      >
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="10" cy="10" r="7.25" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="10" cy="10" r="2" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M10 1.5v3M10 15.5v3M1.5 10h3M15.5 10h3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        {loading ? t.locationLoading : t.locationLabel}
      </button>
      {error && <p className="location-error">{error}</p>}
    </div>
  )
}
