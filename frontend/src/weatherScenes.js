import sun from './assets/weather/sun.png'
import birds from './assets/weather/birds.png'
import cloudClear from './assets/weather/cloud_clear.png'
import cloudOvercast from './assets/weather/cloud_overcast.png'
import cloudStorm from './assets/weather/cloud_storm.png'
import fogBands from './assets/weather/fog_bands.png'
import rainStreaks from './assets/weather/rain_streaks.png'
import snowflake from './assets/weather/snowflake.png'
import lightning from './assets/weather/lightning.png'

// 날씨마다 배경 그라데이션 색을 다르게 줘서 한눈에 구분되게 한다.
// (배경그림 자체(bg.png/skyline.png)는 그대로 두고, index.css의 --bg/--bg-2 값만 바꾼다.)
export const SCENE_COLORS = {
  sun: ['#fff4de', '#ffe0a3'],
  cloudSun: ['#f3f2fb', '#e3ddf3'],
  cloud: ['#e7e9f2', '#c9cee0'],
  fog: ['#eef0f2', '#dcdfe3'],
  rain: ['#dde3f0', '#aab8d6'],
  snow: ['#f2f6fb', '#dbe6f2'],
  storm: ['#c9c5db', '#8b84ab'],
}

// WeatherIcon.jsx의 pickWeatherKey()와 같은 7가지 분류 기준으로 구성.
// weather_parts_seoul_pastel/preview.html에서 검토·확정한 구성을 그대로 옮긴 것이다.
export const SCENES = {
  sun: {
    parts: [
      { src: sun, cls: 'part-sun' },
      { src: birds, cls: 'part-birds', style: 'animation-duration:22s; animation-delay:1s;' },
    ],
  },
  cloudSun: {
    parts: [
      { src: sun, cls: 'part-sun', style: 'opacity:0.9;' },
      ...Array.from({ length: 4 }, (_, i) => ({
        src: cloudClear, cls: 'part-cloud',
        style: `top:${12 + i * 6}%; width:${170 + i * 15}px; animation-duration:${34 + i * 6}s; animation-delay:-${i * 9}s; opacity:${0.95 - i * 0.05};`,
      })),
    ],
  },
  cloud: {
    parts: [
      { src: cloudOvercast, cls: 'part-cloud', style: 'top:10%; animation-duration:32s;' },
      { src: cloudOvercast, cls: 'part-cloud c2', style: 'top:26%; animation-duration:46s; animation-delay:-10s;' },
    ],
  },
  fog: {
    parts: [
      { src: fogBands, cls: 'part-fog', style: 'top:30%; animation-duration:50s;' },
      { src: fogBands, cls: 'part-fog', style: 'top:45%; animation-duration:65s; animation-delay:-20s; opacity:0.35;' },
      { src: fogBands, cls: 'part-fog', style: 'top:60%; animation-duration:40s; animation-delay:-5s;' },
    ],
  },
  rain: {
    parts: [
      ...Array.from({ length: 24 }, (_, i) => ({
        src: rainStreaks, cls: 'part-rain',
        style: `left:${i * 4 + 1}%; animation-duration:${0.9 + (i % 3) * 0.15}s; animation-delay:-${i * 0.25}s;`,
      })),
    ],
  },
  snow: {
    parts: [
      { src: cloudOvercast, cls: 'part-cloud', style: 'top:8%; animation-duration:44s; opacity:0.9;' },
      ...Array.from({ length: 7 }, (_, i) => ({
        src: snowflake, cls: 'part-snow',
        style: `left:${i * 14 + 3}%; width:${28 + (i % 3) * 10}px; animation-duration:${6 + (i % 4)}s; animation-delay:-${i * 1.1}s;`,
      })),
    ],
  },
  storm: {
    parts: [
      { src: cloudStorm, cls: 'part-cloud', style: 'top:6%; animation-duration:40s; width:260px;' },
      { src: lightning, cls: 'part-lightning', style: 'left:20%;' },
      { src: lightning, cls: 'part-lightning', style: 'left:60%; animation-delay:-3s;' },
      ...Array.from({ length: 6 }, (_, i) => ({
        src: rainStreaks, cls: 'part-rain',
        style: `left:${i * 17 + 4}%; animation-duration:${0.9 + (i % 3) * 0.15}s; animation-delay:-${i * 0.25}s;`,
      })),
    ],
  },
}
