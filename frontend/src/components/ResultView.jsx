import { useRef, useState } from 'react'
import WeatherIcon from './WeatherIcon'
import StatIcon from './StatIcon'
import CategoryIcon from './CategoryIcon'
import aiSparkleIcon from '../assets/ai-sparkle.png'
import { CATEGORIES, ALL_TAB } from '../categories'
import { getStrings, getCategoryLabel, getWeekdays } from '../i18n'

const TABS = [ALL_TAB, ...CATEGORIES]
const PREVIEW_SIZE = 3
const PAGE_SIZE = 6

function googleMapSearchUrl(region, name) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${region} ${name}`)}`
}

function splitRegionLabel(region) {
  const match = region.match(/^(.+?)(\(.+\))$/)
  if (!match) return { main: region, detail: '' }
  return { main: match[1], detail: match[2] }
}

function formatDateWithWeekday(dateStr, language) {
  const d = new Date(`${dateStr}T00:00:00`)
  const formatted = dateStr.replace(/-/g, '.')
  return `${formatted} (${getWeekdays(language)[d.getDay()]})`
}

function RecommendationCard({ region, item, t }) {
  return (
    <article className="rec-card">
      {item.photo_url && (
        <img className="rec-card-photo" src={item.photo_url} alt={item.name} loading="lazy" />
      )}
      <div className="rec-card-body">
        <h4>{item.name}</h4>
        <p>{item.menu || item.description}</p>
        <p className="why">{item.why_this_weather}</p>
      </div>
      <div className="rec-card-links">
        {item.detail_url ? (
          <a className="map-link" href={item.detail_url} target="_blank" rel="noreferrer">
            {t.detailLink}
          </a>
        ) : (
          <a
            className="map-link"
            href={googleMapSearchUrl(region, item.name)}
            target="_blank"
            rel="noreferrer"
          >
            {t.mapLink}
          </a>
        )}
      </div>
    </article>
  )
}

// 무한 스크롤처럼 보이게 카드를 3배 복제하는 기법이라, 한 화면에 보이는 카드 수보다
// items가 적으면 복제본끼리 바로 옆에서 겹쳐 보여 "같은 장소가 중복으로 나온다"처럼
// 보인다. 그 정도로 적을 때는 복제하지 않고 실제 개수만큼만 그대로 보여준다.
const MIN_ITEMS_TO_LOOP = 4

function WeatherPicksCarousel({ title, region, items, t }) {
  const scrollRef = useRef(null)
  const isJumping = useRef(false)
  const shouldLoop = items.length >= MIN_ITEMS_TO_LOOP

  function getCardStep(el) {
    const card = el.querySelector('.rec-card-slide')
    return card ? card.getBoundingClientRect().width + 16 : el.clientWidth * 0.8
  }

  function handleScroll() {
    const el = scrollRef.current
    if (!shouldLoop || !el || isJumping.current) return

    const cardStep = getCardStep(el)
    const loopWidth = cardStep * items.length
    const { scrollLeft } = el

    if (scrollLeft >= loopWidth * 2 - 1) {
      isJumping.current = true
      el.scrollLeft = scrollLeft - loopWidth
      isJumping.current = false
    } else if (scrollLeft <= 1) {
      isJumping.current = true
      el.scrollLeft = scrollLeft + loopWidth
      isJumping.current = false
    }
  }

  function scrollByCards(direction) {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: direction * getCardStep(el), behavior: 'smooth' })
  }

  const loopedItems = shouldLoop ? [...items, ...items, ...items] : items

  return (
    <section className="rec-section">
      <div className="carousel-heading">
        <h3>{title}</h3>
        <div className="carousel-arrows">
          <button
            type="button"
            className="carousel-arrow"
            onClick={() => scrollByCards(-1)}
            aria-label={t.prevSlide}
          >
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M12.5 5 7.5 10l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            className="carousel-arrow"
            onClick={() => scrollByCards(1)}
            aria-label={t.nextSlide}
          >
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M7.5 5 12.5 10l-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
      <div
        className="carousel-track"
        ref={(el) => {
          scrollRef.current = el
          if (el && !el.dataset.initialized) {
            el.dataset.initialized = 'true'
            if (shouldLoop) {
              requestAnimationFrame(() => {
                el.scrollLeft = getCardStep(el) * items.length
              })
            }
          }
        }}
        onScroll={handleScroll}
      >
        {loopedItems.map((item, index) => (
          <div className="rec-card-slide" key={`${item.name}-${index}`}>
            <RecommendationCard region={region} item={item} t={t} />
          </div>
        ))}
      </div>
    </section>
  )
}

function RecommendationSection({ title, region, items, isPreview, t }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const visibleItems = isPreview ? items.slice(0, PREVIEW_SIZE) : items.slice(0, visibleCount)
  const hasMore = !isPreview && visibleCount < items.length

  return (
    <section className="rec-section">
      <h3>{title}</h3>
      <div className="card-grid">
        {visibleItems.map((item) => (
          <RecommendationCard key={item.name} region={region} item={item} t={t} />
        ))}
      </div>
      {hasMore && (
        <button
          type="button"
          className="load-more-btn"
          onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
        >
          {t.loadMore}
        </button>
      )}
    </section>
  )
}

export default function ResultView({ result, activeTab, onTabChange, onRefresh, language = 'ko' }) {
  const t = getStrings(language)
  const [showHourly, setShowHourly] = useState(false)
  const {
    region,
    weather,
    weather_by_day: weatherByDay,
    hourly_weather: hourlyWeather,
    recommendation,
    date,
    endDate,
    isPreview,
  } = result
  const tripDays = weatherByDay && weatherByDay.length > 1 ? weatherByDay : null
  const startDateLabel = weather ? weather.date : date
  const endDateLabel = tripDays ? tripDays[tripDays.length - 1].date : endDate
  const categoryEntries = Object.entries(recommendation.categories).filter(
    ([category, { items }]) => (activeTab === ALL_TAB || category === activeTab) && items.length > 0
  )
  const { main: regionMain, detail: regionDetail } = splitRegionLabel(region)

  return (
    <div className="result">
      <section className="weather-card">
        <div className="weather-heading">
          <svg className="weather-pin" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2C7.86 2 4.5 5.36 4.5 9.5c0 5.25 6.32 11.5 7.02 12.2a.68.68 0 0 0 .96 0c.7-.7 7.02-6.95 7.02-12.2C19.5 5.36 16.14 2 12 2Zm0 10.25a2.75 2.75 0 1 1 0-5.5 2.75 2.75 0 0 1 0 5.5Z" />
          </svg>
          <span className="weather-region">
            {regionMain}
            {regionDetail && <span className="weather-region-detail">{regionDetail}</span>}
          </span>
          <span className="weather-daterange">
            {formatDateWithWeekday(startDateLabel, language)}
            {endDateLabel && endDateLabel !== startDateLabel
              ? ` ~ ${formatDateWithWeekday(endDateLabel, language)}`
              : ''}
          </span>
          <button
            type="button"
            className={`refresh-btn${isPreview ? ' is-spinning' : ''}`}
            onClick={onRefresh}
            disabled={isPreview}
            aria-label={t.refresh}
            title={t.refresh}
          >
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M16.5 10a6.5 6.5 0 1 1-2.1-4.8M16.5 3v3.7h-3.7"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {isPreview && (
          <div className="preview-badge">
            <span className="preview-badge-dot" aria-hidden="true" />
            {t.previewBadge}
          </div>
        )}

        {weather ? (
          <>
            <div className="weather-top">
              <div className="weather-main">
                <div className="weather-main-icon">
                  <WeatherIcon condition={weather.condition} weatherCode={weather.weather_code} />
                </div>
                <div className="weather-main-info">
                  <p className="weather-temp">
                    {weather.temp_min}° ~ {weather.temp_max}°
                  </p>
                  <p className="weather-condition">{weather.condition}</p>
                </div>
              </div>

              <div className="weather-stats">
                <div className="weather-stat">
                  <span className="weather-stat-label">
                    <StatIcon type="umbrella" className="weather-stat-icon" /> {t.precipitation}
                  </span>
                  <span className="weather-stat-value">{weather.pop}%</span>
                </div>
                {weather.windspeed != null && (
                  <div className="weather-stat">
                    <span className="weather-stat-label">
                      <StatIcon type="wind" className="weather-stat-icon" /> {t.windspeed}
                    </span>
                    <span className="weather-stat-value">{weather.windspeed}m/s</span>
                  </div>
                )}
                {weather.humidity != null && (
                  <div className="weather-stat">
                    <span className="weather-stat-label">
                      <StatIcon type="drop" className="weather-stat-icon" /> {t.humidity}
                    </span>
                    <span className="weather-stat-value">{weather.humidity}%</span>
                  </div>
                )}
                {weather.travel_index && (
                  <div className="weather-stat">
                    <span className="weather-stat-label">
                      <StatIcon type="smile" className="weather-stat-icon" /> {t.travelIndex}
                    </span>
                    <span className="weather-stat-value">{weather.travel_index}</span>
                  </div>
                )}
              </div>
            </div>

            {recommendation.weather_desc && (
              <div className="weather-summary-box">
                <span className="weather-summary-icon">
                  <img src={aiSparkleIcon} alt="" />
                </span>
                <p className="weather-summary">
                  {recommendation.weather_desc}
                  <br />
                  {recommendation.spot_reason}
                </p>
              </div>
            )}

            {tripDays && (
              <>
                <div className="daily-forecast">
                  {tripDays.map((day) => (
                    <div className="daily-forecast-item" key={day.date}>
                      <p className="daily-forecast-date">{day.date}</p>
                      <div className="daily-forecast-icon">
                        <WeatherIcon condition={day.condition} weatherCode={day.weather_code} />
                      </div>
                      <p className="daily-forecast-condition">{day.condition}</p>
                      <p className="daily-forecast-temp">
                        <span className="daily-forecast-temp-range">
                          {day.temp_min}° ~ {day.temp_max}°C
                        </span>
                        <span className="daily-forecast-temp-pop">{t.precipitation} {day.pop}%</span>
                      </p>
                    </div>
                  ))}
                </div>
                <p className="hint">{t.weatherForecastNote(weather.date)}</p>
              </>
            )}

            {hourlyWeather && hourlyWeather.length > 0 && (
              <div className="hourly-forecast-wrap">
                <button
                  type="button"
                  className="hourly-forecast-toggle"
                  onClick={() => setShowHourly((prev) => !prev)}
                  aria-expanded={showHourly}
                >
                  <span className="hourly-forecast-title">{t.hourlyForecastTitle}</span>
                  <svg
                    className={`hourly-forecast-toggle-icon${showHourly ? ' is-open' : ''}`}
                    viewBox="0 0 20 20"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path d="M5 7.5 10 12.5 15 7.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {showHourly && (
                  <div className="hourly-forecast">
                    {hourlyWeather.map((hour) => (
                      <div className="hourly-forecast-item" key={hour.time}>
                        <p className="hourly-forecast-time">{hour.time}</p>
                        <div className="hourly-forecast-icon">
                          <WeatherIcon condition={hour.condition} weatherCode={hour.weather_code} />
                        </div>
                        <p className="hourly-forecast-temp">{hour.temp}°</p>
                        <p className="hourly-forecast-pop">{hour.pop}%</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="weather-loading">
            <span className="weather-loading-spinner" aria-hidden="true" />
            <p>{t.weatherLoading}</p>
          </div>
        )}
      </section>

      {recommendation.weather_picks && recommendation.weather_picks.length > 0 && (
        <WeatherPicksCarousel
          title={t.weatherPicksTitle}
          region={region}
          items={recommendation.weather_picks}
          t={t}
        />
      )}

      <div className="category-tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`category-tab${activeTab === tab ? ' is-active' : ''}`}
            onClick={() => onTabChange(tab)}
            aria-pressed={activeTab === tab}
          >
            <CategoryIcon category={tab} className="category-tab-icon" />
            {getCategoryLabel(language, tab)}
          </button>
        ))}
      </div>

      {categoryEntries.map(([category, { section_title: sectionTitle, items }]) => (
        <RecommendationSection
          key={category}
          title={sectionTitle || getCategoryLabel(language, category)}
          region={region}
          items={items}
          isPreview={activeTab === ALL_TAB}
          t={t}
        />
      ))}
    </div>
  )
}
