import { useEffect } from 'react'
import { pickWeatherKey } from './WeatherIcon'
import { SCENES, SCENE_COLORS } from '../weatherScenes'

// 실제 날씨(weatherCode/condition)에 맞춰 배경에 해/구름/비 같은 파츠를 띄우고
// 배경색도 같이 바꾼다. weather_parts_seoul_pastel/preview.html에서 검토한 내용을
// 그대로 붙인 것 - 날씨 데이터가 아직 없으면(검색 전/로딩 중) 아무것도 띄우지 않고
// 기존 기본 배경색을 그대로 둔다.
export default function WeatherBackdrop({ weatherCode, condition }) {
  // weatherCode/condition이 둘 다 없으면(검색 전) 날씨를 아직 모르는 것이지 "흐림"이
  // 아니므로, pickWeatherKey의 기본값(cloud)으로 빠지지 않게 여기서 먼저 걸러낸다.
  const hasWeatherData = weatherCode != null || Boolean(condition)
  const key = hasWeatherData ? pickWeatherKey(weatherCode, condition) : null

  useEffect(() => {
    if (!key) return undefined
    const [bg, bg2] = SCENE_COLORS[key]
    const root = document.documentElement
    const prevBg = root.style.getPropertyValue('--bg')
    const prevBg2 = root.style.getPropertyValue('--bg-2')
    root.style.setProperty('--bg', bg)
    root.style.setProperty('--bg-2', bg2)
    return () => {
      root.style.setProperty('--bg', prevBg)
      root.style.setProperty('--bg-2', prevBg2)
    }
  }, [key])

  if (!key) return null

  return (
    <div className="weather-layer" aria-hidden="true">
      {SCENES[key].parts.map((part, i) => (
        <img key={i} src={part.src} className={part.cls} style={cssTextToObject(part.style)} />
      ))}
    </div>
  )
}

// SCENES의 style은 preview.html과 그대로 공유하는 CSS 문자열이라, React의
// style prop(객체) 형태로 한 번만 변환해준다.
function cssTextToObject(cssText) {
  if (!cssText) return undefined
  const style = {}
  for (const decl of cssText.split(';')) {
    const [prop, value] = decl.split(':')
    if (!prop || value == null) continue
    const camelProp = prop.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase())
    style[camelProp] = value.trim()
  }
  return style
}
