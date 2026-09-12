import { useEffect, useState } from 'react'
import { API_BASE } from '../apiBase'
import { getStrings } from '../i18n'

const FLAGS = { JPY: '🇯🇵', USD: '🇺🇸', CNY: '🇨🇳' }
const ROTATE_INTERVAL_MS = 3000

export default function ExchangeRateTicker({ language = 'ko' }) {
  const t = getStrings(language)
  const [rates, setRates] = useState([])
  const [index, setIndex] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/exchange-rate`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        if (!cancelled) setRates(data.rates || [])
      } catch {
        // 환율 조회 실패 시 티커를 표시하지 않는다.
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (rates.length === 0) return undefined
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % rates.length)
    }, ROTATE_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [rates])

  if (rates.length === 0) return null

  const current = rates[index]

  return (
    <div className="exchange-rate-ticker" aria-live="polite">
      <span className="exchange-rate-flag">{FLAGS[current.code]}</span>
      <span className="exchange-rate-text">
        1 {current.code} = {current.rate.toLocaleString('ko-KR')}
        {language === 'ko' ? t.krwUnit : ` ${t.krwUnit}`}
      </span>
    </div>
  )
}
