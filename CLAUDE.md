# CLAUDE.md

이 파일은 이 저장소에서 코드 작업을 할 때 Claude Code(claude.ai/code)에게 제공되는 안내 문서입니다.

## 프로젝트 현황

- `PRD.md` — 제품 요구사항 문서
- `backend/` — Flask 앱(`app.py`)으로 감싸진 추천 파이프라인. `pipeline.py`를 콘솔에서 직접 실행할 수도 있습니다.
- `frontend/` — React + Vite로 스캐폴딩 완료 (`SearchForm`, `ResultView`, `Toolbar` 등 구현됨).

### backend 실행 방법

```
cd backend
pip install -r requirements.txt
cp .env.example .env   # KAKAO_REST_API_KEY, GEMINI_API_KEY 등 채워넣기
python app.py          # http://localhost:5000, POST /api/recommend 외 아래 엔드포인트 참고
```

`pipeline.py`의 `get_travel_recommendation(region, start_date, end_date=None, interests=None, language="ko")`이 카카오맵 geocoding(캐시됨) → Open-Meteo 날씨 조회 → Gemini 추천 생성 → 비짓서울 사진/상세URL 첨부(병렬) → 시간대별 날씨 조회를 순서대로 호출하는 진입점입니다. Open-Meteo는 API 키 없이 오늘부터 최대 16일 이내 예보를 제공합니다. 콘솔 단독 실행은 `python pipeline.py "제주도" "2026-08-01"` (인자로 넘긴 지역은 서울 외 지역도 동작하지만, 프론트엔드는 서울 자치구만 허용하도록 제한돼 있습니다).

`interests` 파라미터는 하위 호환을 위해 남아있으나 **현재 프론트엔드는 이 값을 보내지 않습니다** — 검색 폼에는 지역·날짜만 있고, 관심사(카테고리) 선택 UI는 폼에서 결과 화면의 탭으로 옮겨졌습니다. 따라서 백엔드는 항상 8개 카테고리 전체(`gemini_service.DEFAULT_INTERESTS`)에 대한 추천을 생성하고, 프론트가 탭 클릭에 따라 클라이언트에서 필터링합니다.

`app.py`가 노출하는 엔드포인트:
- `POST /api/recommend` — body `{region, date, endDate?, interests?, language?}` → 지역/날짜 기반 추천 (핵심 기능)
- `GET /api/exchange-rate` — 한국수출입은행 API 기반 JPY/USD/CNY 환율 (`services/exim_service.py`)
- `GET /api/reverse-geocode?lat=&lon=` — 좌표 → "시/도 시/군/구 동" 주소 (카카오맵, 현위치 버튼에서 사용)
- `GET /api/seoul-contents?keyword=&lang=&page=` — 비짓서울 API로 관광 콘텐츠 목록 조회. `keyword`가 8개 카테고리(문화관광/쇼핑/숙박/역사관광/음식/자연관광/체험관광/축제) 중 하나면 `com_ctgry_sn`으로 서버단 카테고리 필터링된 `get_category_contents`로 라우팅되고, 그 외 값은 기존 텍스트 키워드 검색(`get_contents`)으로 처리됨 (`services/visitseoul_service.py`). "축제" 카테고리에만 서울 외 지역 지명 키워드 필터를 추가로 적용함(다른 카테고리, 특히 "음식"은 "안동갈비"처럼 요리명 자체에 지역명이 들어가는 경우가 많아 같은 필터를 적용하면 서울 콘텐츠까지 걸러지기 때문)

### frontend 실행 방법

```
cd frontend
npm install
npm run dev   # http://localhost:5173, 기본적으로 http://localhost:5000 백엔드를 호출
```

아직 린트/테스트 도구는 구성돼 있지 않습니다(프론트엔드에 `oxlint`만 설정됨). CI가 추가되면 이 섹션을 업데이트해야 합니다.

## 제품: VividSoul

사용자가 서울 자치구와 여행 날짜를 선택하면, 날씨를 고려한 추천 결과 — 오늘 날씨에 가장 맞는 장소, 관심사 카테고리별 명소·맛집 — 를 보여주는 반응형 웹앱입니다. **"숨은 명소를 찾는" 서비스가 아니라 "잘 알려진 곳이든 숨은 곳이든, 날씨에 가장 잘 맞는 곳을 찾고 그중에 숨은 명소가 있으면 함께 보여주는" 서비스입니다** — 숨은 명소가 없다고 Gemini가 억지로 지어내지 않도록 프롬프트(`gemini_service.py`)가 명시적으로 안내합니다. 한국어/영어/일본어/중국어 4개 언어를 완전히 지원합니다. 전체 스펙은 `PRD.md`에 있습니다.

## 아키텍처 (구현 완료 기준)

- **프론트엔드**: React + Vite (`frontend/`)
- **백엔드**: Python 3.11 + Flask (`backend/app.py`가 여러 REST 엔드포인트로 `pipeline.py`/각 서비스 모듈을 노출)
- **AI 추천**: Gemini — 반드시 `google-genai` SDK를 사용해야 합니다. 구버전 `google-generativeai` 패키지는 **사용 금지**입니다.
- **외부 API**:
  - 위경도 변환·역지오코딩: 카카오맵 API (`backend/services/kakao_service.py`, 지오코딩 결과 30일 캐시)
  - 날씨 조회: Open-Meteo (`backend/services/weather_service.py`, API 키 불필요) — 일별 예보와 3시간 간격 시간별 예보(`get_hourly_weather`) 둘 다 제공
  - 장소 후보 구성(자치구·카테고리 기준): 비짓서울 API (`backend/services/candidate_service.py`). Gemini가 장소명을 먼저 지어내던 과거 방식(v3.0 이전, 매칭률 약 19%)을 폐기하고(PRD 3-2/7절, v3.1), 카테고리(`com_ctgry_sn`)로 목록을 조회한 뒤 항목별로 공식 상세 조회 API(`visitseoul_service.get_content_detail`, `POST contents/info`)를 호출해 주소(`traffic.adres`/`new_adres`)에서 자치구를 판별 → 선택한 자치구 콘텐츠를 우선 채우고 부족하면 같은 카테고리의 다른 서울 콘텐츠로 채운 후보 풀(카테고리당 최대 10곳)을 만듭니다. `contents/info`가 건당 2~3초로 느리고 500/연결 오류도 잦아 재시도(3회, 누적 백오프)로 흡수하되, 응답 시간을 상한선 안에 묶기 위해 카테고리당 목록 1페이지(최대 50건)까지만 훑습니다 — 상세 조회 결과는 6시간 캐시되므로 카테고리당 최초 1회(캐시 미스)만 느리고 이후 재검색은 빠릅니다. 언어가 한국어가 아니면 후보의 `multi_lang_list`로 해당 언어의 cid를 찾아 그 언어 상세를 다시 조회해 이름/설명/사진을 그 언어 그대로 씁니다(비짓서울 자체 번역, Gemini 번역 아님).
  - 추천 생성(AI): Gemini(`backend/services/gemini_service.py`)는 위 후보(cid 목록)만 보고 오늘 날씨에 맞는 곳을 고르며, 후보에 없는 장소를 새로 만들어내지 않습니다 — 이름·설명·사진·링크는 전부 후보 데이터를 그대로 쓰고, Gemini는 `why_this_weather`(그리고 카테고리 요약 `section_title`/`weather_desc`/`spot_reason`)만 씁니다. 후보에 없는 cid를 응답하면 그 항목은 결과에서 제외됩니다.
  - 관광 콘텐츠(카테고리별 명소/축제 등): 비짓서울 API (`backend/services/visitseoul_service.py`) — 8개 최상위 카테고리의 `com_ctgry_sn` 코드를 `CATEGORY_IDS`에 고정해두고 서버단 카테고리 필터로 조회
  - 환율: 한국수출입은행 API (`backend/services/exim_service.py`)
  - 인메모리 캐시: `backend/services/cache.py`의 `cached(key, ttl_seconds, compute)` — 프로세스 메모리 캐시라 여러 워커로 배포하면 워커마다 별도로 채워짐

핵심 흐름: 서울 자치구 + 날짜 입력 → 해당 지역의 날짜별/시간별 날씨 조회 → 자치구 + 8개 카테고리별로 비짓서울 실제 콘텐츠 후보 풀 조회(병렬, `candidate_service.py`) → 첫날 날씨와 후보 풀을 Gemini에 전달해 (1) 카테고리 무관 "오늘 날씨 맞춤 추천" 6곳(`weather_picks`)과 (2) 8개 관심사 카테고리별 각 6곳을 후보 중에서 고르게 함(이름/사진/링크는 후보 데이터 그대로, Gemini는 이유만 작성) → React UI에서 날씨 카드 + weather_picks 캐러셀 + 카테고리 탭(전체 포함 9개)으로 렌더링. "전체" 탭에서는 카테고리마다 3곳 미리보기만, 개별 카테고리 탭에서는 6곳(더보기로 추가 확장 가능)을 보여줍니다. 각 카테고리 탭(축제/공연/행사 포함 8종 전체)을 선택하면 `SeoulEvents.jsx`가 `/api/seoul-contents?keyword=<카테고리>`로 조회한 비짓서울 콘텐츠 카드 섹션도 탭별로 별도 노출됩니다(축제 탭만 서울 외 지역 필터링 추가 적용).

**Gemini 요청 그룹화**: 8개 카테고리를 한 번에 요청하면 응답이 느려지고(실측 22초+), 그렇다고 카테고리마다 완전히 개별 요청하면 무료 티어의 분당 요청 제한(모델당 15회)에 바로 걸립니다. 절충안으로 `gemini_service.CATEGORY_GROUP_COUNT = 3`개씩 묶어 그룹 단위로 병렬 요청하며, 요약(weather_desc/spot_reason)과 weather_picks도 별도 요청으로 병렬 실행됩니다 — 검색 1회당 Gemini 요청은 총 5회(그룹 3 + 요약 1 + weather_picks 1). 이 제한 때문에 짧은 시간에 검색을 여러 번 연속 실행하면 429(rate limit) 에러가 날 수 있습니다.

관심사(카테고리) 8종: 문화관광, 쇼핑, 숙박, 역사관광, 음식, 자연관광, 체험관광, 축제/공연/행사(비짓서울 카테고리 키는 "축제"). 모든 카테고리가 같은 스키마를 씁니다 — "음식"도 후보의 비짓서울 요약(`sumry`)을 그대로 보여줄 뿐 별도 메뉴 필드는 없습니다.

지역 입력은 서울 25개 자치구로 제한되며(`frontend/src/seoulDistricts.js`), 서울 외 지역을 입력하거나 현위치가 서울이 아니면 알림을 띄우고 막습니다. 자치구/동네명의 다국어 표시는 `frontend/src/seoulDistrictsI18n.js`에서 처리하지만, 실제 검색/API 요청값은 항상 한국어를 사용합니다(카카오맵·구글맵이 한국어 지명 기준으로 동작하므로).

다국어(`language`: ko/en/ja/zh)는 UI 문자열(`frontend/src/i18n.js`)뿐 아니라 Gemini 생성 텍스트, 날씨 상태/여행지수, 비짓서울 콘텐츠(축제 카드)까지 전부 실제로 번역되어 나옵니다 — 표시만 되는 장식이 아닙니다.

지도/상세 링크: 비짓서울에 등록된 장소는 상세페이지 링크(`detail_url`, `https://korean.visitseoul.net/attractions/detail/{cid}`)를, 없는 장소는 구글 지도 검색 링크로 폴백합니다(카카오맵이 아님).

**지역 선택 UI(반응형)**: `useIsMobile.js`(공유 훅, `(max-width: 560px)` 미디어쿼리)로 화면 너비를 판별해 `SearchForm.jsx`가 PC에서는 드롭다운형 자동완성 입력을, 모바일에서는 바텀시트를 보여줍니다. 검색 결과 화면에서 아래로 스크롤하면 상단에 재검색 바가 고정 표시되는데(`App.jsx`의 `showSearchBar`), PC에서는 `SearchForm`을 `compact` 모드(레이블·힌트를 생략하고 지역+날짜 입력만 남긴 축약형)로 인라인 렌더링해 그 자리에서 바로 재검색할 수 있고, 모바일에서는 지역·날짜 요약 텍스트와 수정 버튼만 보여주고 탭하면 원래 검색 폼 위치로 스크롤됩니다.

**검색 결과 즉시 미리보기(체감 속도 개선)**: 검색을 제출하면 `/api/recommend` 응답(Gemini+비짓서울까지 완료, 수십 초 소요 가능)을 기다리는 동안, `frontend/src/data/seoulContentsPlaceholder.csv`(비짓서울에서 미리 수집해 둔 8카테고리×4언어 스냅샷, 320행)로 결과 화면 카테고리 카드를 먼저 채워 보여줍니다(`frontend/src/placeholderData.js`의 `getPlaceholderRecommendation`이 파싱·매핑해 `/api/recommend` 응답과 동일한 `{weather_desc, spot_reason, weather_picks, categories}` 형태로 반환, `App.jsx`가 `isPreview: true`로 표시하다가 실제 응답 도착 시 교체). 날씨 기반 `weather_picks`는 CSV로 흉내낼 근거가 없어 미리보기 동안 빈 배열로 두고, 날씨 카드 자체는 `t.weatherLoading` 문구의 별도 로딩 상태로, 카테고리 카드 쪽은 `t.previewBadge` 문구로 미리보기임을 표시합니다. CSV 파싱은 `frontend/src/csv.js`(의존성 없는 최소 RFC4180 파서). 같은 CSV는 `SeoulEvents.jsx`(카테고리 탭의 비짓서울 콘텐츠 섹션)에서도 동일한 용도로 재사용됩니다. 이 CSV는 자치구(`district`) 컬럼도 포함하지만 지금은 필터링에 쓰이진 않습니다(수집된 87곳이 25개 자치구에 고르게 분포하지 않아 구별로 엄격히 필터링하면 대부분 비게 됨). 원본 데이터를 손실 없이 보존한 33개 필드짜리 전체 버전은 `backend/data/seoulContentsFull.csv`에 있습니다(프론트 번들에는 넣지 않음 — `post_desc` 같은 무거운 미사용 필드 포함).

배포는 Vercel(`vercel.json`)로 프론트엔드 정적 빌드와 백엔드(`backend/`, `backend/pyproject.toml` 기준)를 한 프로젝트에서 함께 서빙하도록 구성되어 있습니다.
