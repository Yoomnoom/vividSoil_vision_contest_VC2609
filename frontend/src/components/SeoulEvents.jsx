import { useEffect, useMemo, useState } from 'react'
import { API_BASE } from '../apiBase'
import { parseCsv } from '../csv'
import { SEOUL_DISTRICTS } from '../seoulDistricts'
import placeholderCsv from '../data/seoulContentsPlaceholder.csv?raw'

const VISITSEOUL_LANG_CODES = { ko: 'ko', en: 'en', ja: 'ja', zh: 'zh-CN' }
const DETAIL_URL_TEMPLATE = 'https://korean.visitseoul.net/attractions/detail/{cid}'

// 비짓서울 API 응답 지연 동안 결과 화면이 비어 보이지 않도록, 최근에 수집해 둔 CSV
// 데이터를 우선 보여주고 실제 API 응답이 도착하면 조용히 교체한다(placeholder는 즉시,
// 네트워크 요청 없이 번들에서 읽어온다). 자치구는 검색된 자치구와 일치하는 행만 보여준다
// (다른 자치구로 대체하지 않음 - placeholderData.js와 같은 원칙).
const PLACEHOLDER_ITEMS = parseCsv(placeholderCsv)

function resolveDistrict(region) {
  return SEOUL_DISTRICTS.find((district) => (region || '').includes(district)) || null
}

function getPlaceholderItems(keyword, language, region) {
  const district = resolveDistrict(region)
  return PLACEHOLDER_ITEMS.filter(
    (item) =>
      item.keyword === keyword &&
      item.lang === language &&
      (district === null || item.district === district)
  ).map(normalizeItem)
}

function detailUrl(cid) {
  return DETAIL_URL_TEMPLATE.replace('{cid}', cid)
}

// /api/seoul-contents는 region이 넘어가면 candidate_service의 결과(name/description/photo_url/
// detail_url 형태)를 그대로 돌려주므로, placeholder CSV 행(post_sj/sumry/main_img 등 비짓서울
// 원본 필드명)과 형태를 맞춰 이 컴포넌트의 렌더링 로직을 하나로 유지한다.
function normalizeItem(item) {
  return {
    cid: item.cid,
    main_img: item.photo_url ?? item.main_img,
    post_sj: item.name ?? item.post_sj,
    sumry: item.description ?? item.sumry,
    detail_url: item.detail_url || (item.cid ? detailUrl(item.cid) : null),
  }
}

export default function SeoulEvents({ language = 'ko', region, keyword, title, moreLink, fetchError }) {
  const placeholderItems = useMemo(
    () => getPlaceholderItems(keyword, language, region),
    [keyword, language, region]
  )
  const [items, setItems] = useState(placeholderItems)
  const [loading, setLoading] = useState(placeholderItems.length === 0)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setItems(placeholderItems)
    setLoading(placeholderItems.length === 0)
    setError(null)

    async function load() {
      try {
        const langCode = VISITSEOUL_LANG_CODES[language] || 'ko'
        const params = new URLSearchParams({ keyword, lang: langCode, region: region || '' })
        const res = await fetch(`${API_BASE}/api/seoul-contents?${params}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || fetchError)
        if (!cancelled) setItems((data.data || []).map(normalizeItem))
      } catch (err) {
        // 이미 placeholder 데이터를 보여주고 있다면 그대로 유지하고, 없을 때만 에러를 표시한다.
        if (!cancelled && placeholderItems.length === 0) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [language, region, keyword, fetchError, placeholderItems])

  if (loading || error || items.length === 0) return null

  return (
    <section className="rec-section seoul-events">
      <h3>{title}</h3>
      <div className="card-grid">
        {items.slice(0, 10).map((item) => (
          <article className="rec-card" key={item.cid}>
            {item.main_img && (
              <img className="rec-card-photo" src={item.main_img} alt={item.post_sj} loading="lazy" />
            )}
            <div className="rec-card-body">
              <h4>{item.post_sj}</h4>
              <p>{item.sumry}</p>
            </div>
            <div className="rec-card-links">
              <a className="map-link" href={item.detail_url} target="_blank" rel="noreferrer">
                {moreLink}
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
