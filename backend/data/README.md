# seoulContentsFull.csv 필드 참고 문서

이 폴더에는 비짓서울 CSV가 세 가지 버전으로 있습니다.

| 파일 | 필드 수 | 용도 |
|---|---|---|
| `seoulContentsFull.csv` | 33개(전체) | 원본 스냅샷, 손실 없이 보존. 프론트 번들에는 넣지 않음(`post_desc` 등 무거운 미사용 필드 포함) |
| `seoulContentsNeeded.csv` | 10개(아래 "현재 사용 중인 필드" 표와 동일) | `seoulContentsFull.csv`에서 지금 코드가 실제로 쓰는 필드만 추려낸 버전 |
| `frontend/src/data/seoulContentsPlaceholder.csv` | 5개(keyword/lang/cid/main_img/post_sj/sumry) | `seoulContentsNeeded.csv`보다 더 줄여 프론트 번들에 넣은 버전(카드 표시에 필요한 필드만) |

세 파일 모두 비짓서울 API(`contents/list`, `contents/info`)에서 8개 카테고리 × 4개 언어로 수집한 같은 원본 데이터를 필드만 다르게 추린 것입니다.

이 문서는 33개 필드 각각이 (1) 어느 API 응답에서 오는지, (2) 지금 코드에서 쓰이는지, (3) `PRD.md` 3-2절(v3.1 재검색 방식 전환)에 필요한지를 정리해, 다음에 이 데이터를 건드릴 때 다시 API 문서를 뒤지지 않아도 되게 하는 것이 목적입니다.

## 현재 사용 중인 필드

| 필드 | 출처 | 의미 | 사용처 |
|---|---|---|---|
| `keyword` | 수집 시 지정한 검색 카테고리(한국어) | 8개 카테고리 중 어떤 키워드로 수집했는지 | [placeholderData.js](../../frontend/src/placeholderData.js), [SeoulEvents.jsx](../../frontend/src/components/SeoulEvents.jsx)에서 `row.keyword === keyword`로 카테고리 필터링 |
| `lang` | 수집 시 지정한 언어 코드 | ko/en/ja/zh 중 어떤 언어로 수집했는지 | 위 두 파일에서 `row.lang === language`로 언어 필터링 |
| `cid` | `contents/list`, `contents/info` 공통 | 콘텐츠 고유 ID | 상세페이지 링크(`https://korean.visitseoul.net/attractions/detail/{cid}`) 조립, React 리스트 `key` |
| `main_img` | `contents/list` | 대표 사진 URL | 카드 썸네일 |
| `post_sj` | `contents/list` | 장소/콘텐츠 제목 | 카드 제목 |
| `sumry` | `contents/list` | 한 줄 요약 설명 | 카드 본문 |
| `com_ctgry_sn` | `contents/list` | 최상위 카테고리 코드(언어 무관 고정 ID) | 백엔드 `backend/services/visitseoul_service.py`의 `CATEGORY_IDS`가 이 값 기준으로 서버단 카테고리 필터링(`get_category_contents`) — CSV 자체보다는 실시간 API 호출에서 이 필드를 씀 |
| `lang_code_id` | `contents/list`, `contents/info` | 콘텐츠가 속한 언어 코드 | API 요청 시 `lang_code_id` 파라미터로 사용(응답 필드 자체를 화면에 노출하진 않음) |
| `traffic_adres` | `contents/info`만 제공(`contents/list`에는 없음) | 지번 주소 | `visitseoul_service.extract_district()`가 이 필드에서 자치구명을 추출(상세 조회 결과 필요) |
| `traffic_new_adres` | `contents/info`만 제공 | 도로명 주소 | 위와 동일, 지번 주소에 없으면 도로명 주소로 보조 매칭 |

## CSV에는 있지만 지금은 안 쓰는 필드

| 필드 | 의미 | 왜 안 쓰는지 |
|---|---|---|
| `district` | 수집 시 `extract_district()`로 미리 태깅해 둔 자치구명 | `CLAUDE.md`에 적힌 대로, 수집된 87곳이 25개 자치구에 고르게 분포하지 않아 구 단위로 엄격히 필터링하면 대부분 비게 됨. v3.1에서 자치구 필터를 실제로 쓰려면 이 컬럼을 재사용하기보다 실시간 상세 조회 결과 기준으로 다시 판별하는 편이 정확함(수집 시점과 실제 서비스 시점 사이 콘텐츠가 갱신될 수 있음) |
| `cate_depth` | 카테고리 전체 경로 텍스트(예: "문화관광 > 전시시설") | `com_ctgry_sn` 코드가 더 정확한 카테고리 판별 기준이라 텍스트 매칭이 불필요 |
| `multi_lang_list` | 언어별 cid 매핑(ko/en/ja/zh-CN/zh-TW/ru) | 현재는 언어별로 별도 수집(`keyword`+`lang` 조합)하므로 굳이 이 매핑을 안 써도 됨 |
| `schdul_info_bgnde` / `schdul_info_endde` | 행사 시작일/종료일 | 화면에 기간을 표시하지 않음. 축제 카드에 기간 표시를 추가하게 되면 이 필드가 필요해짐 |
| `creat_dt_text` / `updt_dt_text` | 콘텐츠 등록일/수정일 | 화면에 노출 안 함 |
| `post_desc` | 상세 설명(원본 에디터 HTML 그대로, 스타일 태그 포함) | 용량이 크고(행마다 수 KB) 화면엔 `sumry` 요약만 씀 — 그래서 프론트 번들용 축약 CSV(`seoulContentsPlaceholder.csv`)에서는 아예 제외 |
| `place` | 장소명(제목 `post_sj`과 별개로 붙는 장소/시설명) | 카드에 별도 표시 안 함 |
| `relate_img` | 추가 사진 URL 목록(세미콜론 구분) | 카드에는 대표 사진(`main_img`) 1장만 씀 |
| `tag` | 태그 목록 | 화면에 태그 UI 없음 |
| `extra_disabled_facility` | 장애인 편의시설 정보 | 화면에 편의시설 정보 섹션 없음 |
| `extra_cmmn_telno` | 전화번호 | 카드에 연락처 표시 안 함 |
| `extra_cmmn_hmpg_url` | 홈페이지 URL | 상세페이지 링크는 비짓서울 자체 URL만 씀(외부 홈페이지 링크 없음) |
| `extra_cmmn_use_time` | 이용 시간 | 화면에 영업시간 표시 안 함 |
| `extra_cmmn_important` | 유의사항 | 화면에 노출 안 함 |
| `extra_closed_days` | 휴무일 | 화면에 노출 안 함 |
| `traffic_new_zip_code` | 우편번호 | 주소 표시 자체를 안 함(자치구 판별에만 주소 사용) |
| `traffic_map_position_x` / `traffic_map_position_y` | 좌표 | 행정동 경계 데이터 없이는 좌표만으로 정확한 자치구 판정이 불가능해 제외(`PRD.md` 3-2절) |
| `traffic_subway_info` | 최인접 지하철역 정보 | 화면에 노출 안 함 |
| `tourist_guidance_service` / `tourist_safe_mng` | 관광안내/안전관리 여부 플래그 | 화면에 노출 안 함 |

## 참고

- 필드 사용 여부에 대한 제품 관점의 근거는 `PRD.md` 3-2절("검색 결과 소스") 표와 동일하게 유지해야 합니다 — 이 문서는 그 표를 코드 파일 기준으로 한 번 더 풀어쓴 것입니다. 둘 중 하나를 바꾸면 다른 쪽도 같이 갱신하세요.
- `contents/list`는 자치구 단위 서버측 필터를 지원하지 않으므로, 자치구로 걸러야 하는 상황(v3.1)에서는 `traffic_adres`/`traffic_new_adres`를 가진 `contents/info`(상세 조회)를 콘텐츠별로 추가 호출해야 합니다(`backend/services/visitseoul_service.py`의 `get_content_detail`/`extract_district` 참고).
