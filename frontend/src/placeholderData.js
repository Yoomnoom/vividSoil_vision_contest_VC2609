import { CATEGORIES } from './categories'
import { parseCsv } from './csv'
import { SEOUL_DISTRICTS } from './seoulDistricts'
import placeholderCsv from './data/seoulContentsPlaceholder.csv?raw'

// 검색 직후 Gemini 추천이 완성되기 전까지 결과 화면이 비어 보이지 않도록, 미리 수집해 둔
// 비짓서울 CSV 데이터로 카테고리 카드를 즉시 채운다. Gemini 응답이 도착하면 App.jsx가
// 이 값을 실제 추천 결과로 교체한다. 날씨 기반 weather_picks는 CSV로 흉내낼 근거가 없으므로
// 비워두고, 날씨 카드 자체는 ResultView가 별도 로딩 상태로 표시한다.
//
// 자치구는 실제 검색된 자치구와 일치하는 행만 보여준다(백엔드 candidate_service와 같은 원칙 -
// 다른 자치구 콘텐츠로 대체하지 않음). CSV 수집량이 자치구별로 고르지 않아, 수집이 적은 자치구는
// 카테고리 대부분이 미리보기 단계에서 비어 있을 수 있다 - 실제 추천이 도착하면 채워진다.
const DETAIL_URL_TEMPLATE = 'https://korean.visitseoul.net/attractions/detail/{cid}'
const PLACEHOLDER_ROWS = parseCsv(placeholderCsv)
const PLACEHOLDER_CATEGORY_COUNT = 6

function toCsvKeyword(category) {
  return category === '축제/공연/행사' ? '축제' : category
}

function resolveDistrict(region) {
  return SEOUL_DISTRICTS.find((district) => (region || '').includes(district)) || null
}

function toCategoryItem(row) {
  return {
    name: row.post_sj,
    description: row.sumry,
    why_this_weather: '',
    photo_url: row.main_img || null,
    detail_url: row.cid ? DETAIL_URL_TEMPLATE.replace('{cid}', row.cid) : null,
  }
}

export function getPlaceholderRecommendation(region, language) {
  const district = resolveDistrict(region)
  const categories = {}
  for (const category of CATEGORIES) {
    const keyword = toCsvKeyword(category)
    const items = PLACEHOLDER_ROWS.filter(
      (row) =>
        row.keyword === keyword &&
        row.lang === language &&
        (district === null || row.district === district)
    )
      .slice(0, PLACEHOLDER_CATEGORY_COUNT)
      .map(toCategoryItem)
    if (items.length > 0) categories[category] = { section_title: '', items }
  }
  return { weather_desc: '', spot_reason: '', weather_picks: [], categories }
}
