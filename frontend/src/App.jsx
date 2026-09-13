import { useEffect, useRef, useState } from 'react'
import SearchForm from './components/SearchForm'
import ResultView from './components/ResultView'
import Toolbar from './components/Toolbar'
import SeoulEvents from './components/SeoulEvents'
import WeatherBackdrop from './components/WeatherBackdrop'
import { API_BASE } from './apiBase'
import { ALL_TAB, CATEGORIES } from './categories'
import { getStrings, getContentsTitle, getContentsFetchError } from './i18n'
import { getPlaceholderRecommendation } from './placeholderData'
import { getRegionDisplayLabel } from './seoulDistrictsI18n'
import useIsMobile from './useIsMobile'
import './App.css'

// 비짓서울 상세조회 캐시가 비어있는 첫 검색(서버리스 콜드스타트)은 실측상 3분 가까이
// 걸릴 수 있다 - 40초로 짧게 잡아뒀더니 정상적으로 응답이 오고 있는 요청까지 "실패"로
// 오판했다. 여유를 두고 이 시간을 넘겨야만 요청을 끊고 "불러오지 못했습니다 · 다시 시도"
// 상태로 전환한다.
const RECOMMEND_TIMEOUT_MS = 180000

// 실제 응답의 카테고리가 비어있으면(예: Gemini 실패, 비짓서울 후보 없음) 미리보기 때
// 보여주던 CSV 플레이스홀더로 그 카테고리만 채운다 - 이미 화면에 떠 있던 정보가 실제
// 응답이 도착했다고 해서 갑자기 사라지는 것을 막기 위함이다.
function fillEmptyCategories(recommendation, searchRegion, language) {
  const placeholder = getPlaceholderRecommendation(searchRegion, language)
  const categories = { ...recommendation.categories }
  for (const category of CATEGORIES) {
    const real = categories[category]
    if ((!real || real.items.length === 0) && placeholder.categories[category]) {
      categories[category] = placeholder.categories[category]
    }
  }
  return { ...recommendation, categories }
}

function App() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showTopBtn, setShowTopBtn] = useState(false)
  const [language, setLanguage] = useState('ko')
  const [presetRegion, setPresetRegion] = useState('')
  const [activeTab, setActiveTab] = useState(ALL_TAB)
  const [region, setRegion] = useState('')
  const [startDate, setStartDate] = useState('')
  const [showSearchBar, setShowSearchBar] = useState(false)
  const t = getStrings(language)
  const isMobile = useIsMobile()
  const resultRef = useRef(null)
  const searchSectionRef = useRef(null)

  useEffect(() => {
    function handleScroll() {
      setShowTopBtn(window.scrollY > 400)
      if (searchSectionRef.current) {
        const { bottom } = searchSectionRef.current.getBoundingClientRect()
        setShowSearchBar(!!result && bottom < 0)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [result])

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [result])

  useEffect(() => {
    // <html lang>을 앱 언어와 맞춰줘야 브라우저 기본 날짜 선택기(연도-월-일 입력)의
    // 요일·오늘/삭제 버튼 표기도 같이 바뀐다(이 부분은 CSS/JS로 직접 못 바꾸는 OS 네이티브 UI).
    document.documentElement.lang = language
  }, [language])

  async function runSearch(searchRegion, date, endDate, { resetTab = true } = {}) {
    setLoading(true)
    setError(null)
    if (resetTab) setActiveTab(ALL_TAB)
    // Gemini 추천이 완성되길 기다리는 동안, 비짓서울 CSV로 미리 채운 미리보기를 먼저 보여준다.
    setResult({
      region: searchRegion,
      date,
      endDate,
      weather: null,
      weather_by_day: null,
      hourly_weather: null,
      recommendation: getPlaceholderRecommendation(searchRegion, language),
      isPreview: true,
      loadFailed: false,
    })
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), RECOMMEND_TIMEOUT_MS)
    try {
      const res = await fetch(`${API_BASE}/api/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ region: searchRegion, date, endDate, language }),
        signal: controller.signal,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || t.fetchError)
      setResult({
        ...data,
        recommendation: fillEmptyCategories(data.recommendation, searchRegion, language),
        date,
        endDate,
      })
    } catch (err) {
      if (err.name === 'AbortError') {
        setResult((prev) => (prev ? { ...prev, isPreview: false, loadFailed: true } : prev))
      } else {
        setError(err.message)
        setResult(null)
      }
    } finally {
      clearTimeout(timeoutId)
      setLoading(false)
    }
  }

  function handleSearch({ region: searchRegion, date, endDate }) {
    return runSearch(searchRegion, date, endDate)
  }

  const isFirstLanguageRender = useRef(true)
  useEffect(() => {
    if (isFirstLanguageRender.current) {
      isFirstLanguageRender.current = false
      return
    }
    // 이미 결과가 나와있는 상태에서 언어만 바꾸면, 같은 지역/날짜로 그 언어 기준
    // 추천을 다시 받아온다(탭 선택은 유지).
    if (!result || result.isPreview) return
    runSearch(result.region, result.date, result.endDate, { resetTab: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language])

  function handleRefresh() {
    if (!result) return
    runSearch(result.region, result.date, result.endDate, { resetTab: false })
  }

  function scrollToSearchForm() {
    searchSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="app">
      <WeatherBackdrop weatherCode={result?.weather?.weather_code} condition={result?.weather?.condition} />
      {result && (
        <div className={`sticky-search-bar${showSearchBar ? ' is-visible' : ''}`}>
          <div className="sticky-search-bar-inner">
            {isMobile ? (
              <button type="button" className="sticky-search-summary" onClick={scrollToSearchForm}>
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2C7.86 2 4.5 5.36 4.5 9.5c0 5.25 6.32 11.5 7.02 12.2a.68.68 0 0 0 .96 0c.7-.7 7.02-6.95 7.02-12.2C19.5 5.36 16.14 2 12 2Zm0 10.25a2.75 2.75 0 1 1 0-5.5 2.75 2.75 0 0 1 0 5.5Z" />
                </svg>
                <span className="sticky-search-text">
                  {getRegionDisplayLabel(language, region)} · {startDate}
                </span>
              </button>
            ) : (
              <SearchForm
                compact
                region={region}
                onRegionChange={setRegion}
                startDate={startDate}
                onStartDateChange={setStartDate}
                onSubmit={handleSearch}
                loading={loading}
                presetRegion={presetRegion}
                onLocate={setPresetRegion}
                language={language}
              />
            )}
          </div>
        </div>
      )}

      <header className="app-header">
        <h1>{t.appTitle}</h1>
        <p>{t.appSubtitle}</p>
      </header>

      <div className="search-section" ref={searchSectionRef}>
        <Toolbar language={language} onLanguageChange={setLanguage} />
        <SearchForm
          region={region}
          onRegionChange={setRegion}
          startDate={startDate}
          onStartDateChange={setStartDate}
          onSubmit={handleSearch}
          loading={loading}
          presetRegion={presetRegion}
          onLocate={setPresetRegion}
          language={language}
        />
      </div>

      {error && <p className="error">{error}</p>}
      {result && (
        <div ref={resultRef}>
          <ResultView
            result={result}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onRefresh={handleRefresh}
            language={language}
          />
        </div>
      )}

      {result && activeTab === '축제/공연/행사' && (
        <SeoulEvents
          language={language}
          region={result.region}
          keyword="축제"
          title={t.festivalsTitle}
          moreLink={t.festivalMoreLink}
          fetchError={t.festivalsFetchError}
        />
      )}
      {result && activeTab === '쇼핑' && (
        <SeoulEvents
          language={language}
          region={result.region}
          keyword="쇼핑"
          title={t.shoppingContentsTitle}
          moreLink={t.festivalMoreLink}
          fetchError={t.shoppingContentsFetchError}
        />
      )}
      {result &&
        CATEGORIES.filter((c) => c !== '쇼핑' && c !== '축제/공연/행사').includes(activeTab) && (
          <SeoulEvents
            language={language}
            region={result.region}
            keyword={activeTab}
            title={getContentsTitle(language, activeTab)}
            moreLink={t.festivalMoreLink}
            fetchError={getContentsFetchError(language, activeTab)}
          />
        )}

      <footer className="app-footer">
        <p>{t.footer}</p>
      </footer>

      {showTopBtn && (
        <button
          type="button"
          className="scroll-top-btn"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label={t.scrollTop}
        >
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M5 12 10 7 15 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  )
}

export default App
