const EMOJI_BASE = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg'

const EMOJI_PATHS = {
  sun: `${EMOJI_BASE}/2600.svg`,
  cloudSun: `${EMOJI_BASE}/1f324.svg`,
  cloud: `${EMOJI_BASE}/2601.svg`,
  fog: `${EMOJI_BASE}/1f32b.svg`,
  rain: `${EMOJI_BASE}/1f327.svg`,
  snow: `${EMOJI_BASE}/2744.svg`,
  storm: `${EMOJI_BASE}/26c8.svg`,
}

// WMO Weather interpretation codes (https://open-meteo.com/en/docs) 기준.
// condition 텍스트는 언어별로 번역되어 오므로, 아이콘은 언어 무관한 코드로 결정한다.
export function pickIconKeyFromCode(code) {
  if (code == null) return null
  if (code === 95 || code === 96 || code === 99) return 'storm'
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow'
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain'
  if (code === 45 || code === 48) return 'fog'
  if (code === 1 || code === 2) return 'cloudSun'
  if (code === 3) return 'cloud'
  if (code === 0) return 'sun'
  return null
}

export function pickIconKeyFromText(condition = '') {
  if (condition.includes('뇌우')) return 'storm'
  if (condition.includes('눈')) return 'snow'
  if (condition.includes('비') || condition.includes('이슬비') || condition.includes('소나기')) return 'rain'
  if (condition.includes('안개')) return 'fog'
  if (condition.includes('대체로 맑') || condition.includes('구름 조금')) return 'cloudSun'
  if (condition.includes('흐림') || condition.includes('구름')) return 'cloud'
  if (condition.includes('맑음')) return 'sun'
  return 'cloud'
}

export function pickWeatherKey(weatherCode, condition) {
  return pickIconKeyFromCode(weatherCode) || pickIconKeyFromText(condition)
}

export default function WeatherIcon({ condition, weatherCode, className }) {
  const key = pickWeatherKey(weatherCode, condition)
  return (
    <img
      className={className}
      src={EMOJI_PATHS[key]}
      alt={condition || ''}
      loading="lazy"
    />
  )
}
