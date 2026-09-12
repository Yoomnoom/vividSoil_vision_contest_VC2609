import os
import threading
import time
from concurrent.futures import ThreadPoolExecutor

import requests

from services.cache import cached
from services.visitseoul_service import (
    CATEGORY_IDS,
    SEOUL_DISTRICTS,
    build_detail_url,
    extract_district,
    get_category_contents,
    get_content_detail,
)

# 관심사 라벨(프론트/Gemini 기준) -> 비짓서울 CATEGORY_IDS 키. "축제/공연/행사"만 이름이 다르다.
CATEGORY_KEY_BY_INTEREST = {"축제/공연/행사": "축제"}

POOL_SIZE = 10  # 카테고리별로 Gemini에게 넘길 후보 풀 크기
# 자치구 매칭 후보를 찾기 위해 훑어볼 목록 페이지 수(페이지당 최대 50건). contents/info(상세) 호출이
# 건당 2~3초로 느려서(실측), 자치구에 매칭이 적어도 페이지를 더 훑지 않고 1페이지(최대 50건 상세
# 조회)로 응답 시간을 상한선 안에 묶는다 - 그 안에서 못 찾으면 다른 자치구로 채우지 않고 그만큼
# 적게(또는 0개) 반환한다.
MAX_SCAN_PAGES = 1
DETAIL_CACHE_TTL_SECONDS = 6 * 60 * 60  # 장소 상세(주소·번역) 정보는 자주 바뀌지 않으므로 6시간 캐시
RETRY_COUNT = 3
RETRY_BACKOFF_SECONDS = 0.4

# 비짓서울 API는 동시 요청에 취약해 500이 잦으므로 동시성을 과하게 올리지 않는다(재시도로 흡수).
_VISITSEOUL_CONCURRENCY = threading.Semaphore(6)


def _category_key(interest: str) -> str:
    return CATEGORY_KEY_BY_INTEREST.get(interest, interest)


def resolve_district(region: str) -> str | None:
    """region 입력 문자열(예: '종로구(인사동, 광화문, 북촌)')에서 자치구명을 뽑는다.
    '서울'(전체) 등 특정 자치구가 없으면 None을 반환한다(이 경우 자치구로 거르지 않는다).
    """
    for district in SEOUL_DISTRICTS:
        if district in region:
            return district
    return None


def _with_retry(call):
    """call()을 실행하되, 비짓서울 API의 잦은 500을 재시도(누적 백오프)로 흡수한다.
    재시도로도 안 되거나 다른 요청 예외면 None을 반환해 호출부가 계속 진행할 수 있게 한다.
    """
    for attempt in range(RETRY_COUNT + 1):
        try:
            with _VISITSEOUL_CONCURRENCY:
                return call()
        except requests.HTTPError as e:
            is_server_error = e.response is not None and e.response.status_code >= 500
            if not is_server_error or attempt == RETRY_COUNT:
                return None
            time.sleep(RETRY_BACKOFF_SECONDS * (attempt + 1))
        except requests.RequestException:
            # 연결 재설정/타임아웃 등도 500과 마찬가지로 일시적인 경우가 많아 재시도한다.
            if attempt == RETRY_COUNT:
                return None
            time.sleep(RETRY_BACKOFF_SECONDS * (attempt + 1))
    return None


def _detail_with_retry(cid: str, lang_code_id: str) -> dict | None:
    return _with_retry(lambda: get_content_detail(cid, lang_code_id))


def _list_page_with_retry(category_key: str, page_no: int) -> list[dict]:
    result = _with_retry(lambda: get_category_contents(category_key, lang_code_id="ko", page_no=page_no))
    if not result or result.get("result_code") != 200:
        return []
    return result.get("data", [])


def _cached_detail(cid: str, lang_code_id: str) -> dict | None:
    if not os.environ.get("VISIT_SEOUL_API_KEY"):
        return None
    return cached(
        f"visitseoul_detail:{cid}:{lang_code_id}",
        DETAIL_CACHE_TTL_SECONDS,
        lambda: _detail_with_retry(cid, lang_code_id),
    )


def _multi_lang_cid(multi_lang_list: str, lang_code_id: str) -> str | None:
    """"ko:KOxxx,en:ENxxx,..." 형태 문자열에서 lang_code_id에 해당하는 cid를 찾는다."""
    for pair in (multi_lang_list or "").split(","):
        if ":" not in pair:
            continue
        lang, cid = pair.split(":", 1)
        if lang.strip() == lang_code_id:
            return cid.strip()
    return None


def _localize(item: dict, lang_code_id: str) -> dict | None:
    """item(비짓서울 목록 항목, 한국어)을 lang_code_id 언어의 카드 표시용 정보로 바꾼다.
    번역 콘텐츠를 못 찾으면(다국어 매핑 실패) None을 반환해 후보에서 제외한다.
    """
    if lang_code_id == "ko":
        return {
            "cid": item["cid"],
            "name": item.get("post_sj"),
            "description": item.get("sumry"),
            "photo_url": item.get("main_img"),
        }

    target_cid = _multi_lang_cid(item.get("multi_lang_list", ""), lang_code_id)
    if not target_cid:
        return None
    detail = _cached_detail(target_cid, lang_code_id)
    if not detail:
        return None
    return {
        "cid": target_cid,
        "name": detail.get("post_sj"),
        "description": detail.get("sumry"),
        "photo_url": detail.get("main_img"),
    }


def _collect_items(category_key: str, pool_size: int) -> list[dict]:
    """자치구 제약이 없을 때(region='서울' 등) 목록 앞부분에서 그대로 pool_size개를 채운다."""
    items: list[dict] = []
    for page in range(1, MAX_SCAN_PAGES + 1):
        if len(items) >= pool_size:
            break
        page_items = _list_page_with_retry(category_key, page)
        if not page_items:
            break
        items.extend(page_items)
    return items[:pool_size]


def _collect_district_filtered_items(category_key: str, district: str, pool_size: int) -> list[dict]:
    """목록을 훑으며 항목별 상세 조회로 자치구를 판별해, district에 맞는 항목만 채운다.
    검색한 자치구에 해당 카테고리 콘텐츠가 없거나 적으면, 다른 자치구 콘텐츠로 채우지 않고
    그만큼 적게(또는 비어) 반환한다 - 사용자가 고른 자치구가 아닌 곳을 그 자치구 추천인 것처럼
    보여주지 않기 위함.
    """
    matched: list[dict] = []
    seen_cids: set[str] = set()

    for page in range(1, MAX_SCAN_PAGES + 1):
        if len(matched) >= pool_size:
            break
        page_items = _list_page_with_retry(category_key, page)
        if not page_items:
            break

        with ThreadPoolExecutor(max_workers=min(8, len(page_items))) as executor:
            details = list(executor.map(lambda item: _cached_detail(item["cid"], "ko"), page_items))

        for item, detail in zip(page_items, details):
            cid = item["cid"]
            if cid in seen_cids or detail is None:
                continue
            seen_cids.add(cid)
            if extract_district(detail) == district:
                matched.append(item)

    return matched[:pool_size]


def get_category_candidates(
    category_key: str, district: str | None, lang_code_id: str, pool_size: int = POOL_SIZE
) -> list[dict]:
    """category_key 카테고리에서 district(자치구)에 해당하는 비짓서울 콘텐츠만 채운
    후보 목록(최대 pool_size개, district가 None이면 자치구 구분 없이 채움)을 반환한다.
    district를 지정했는데 매칭되는 콘텐츠가 적으면 다른 자치구로 채우지 않고 그만큼 적게(0개 포함)
    반환한다 - 검색한 자치구가 아닌 곳을 그 자치구 추천으로 보여주지 않기 위함.
    각 항목은 {cid, name, description, photo_url, detail_url} 형태다.
    """
    if not os.environ.get("VISIT_SEOUL_API_KEY") or category_key not in CATEGORY_IDS:
        return []

    items = (
        _collect_items(category_key, pool_size)
        if district is None
        else _collect_district_filtered_items(category_key, district, pool_size)
    )
    if not items:
        return []

    with ThreadPoolExecutor(max_workers=min(8, len(items))) as executor:
        localized = list(executor.map(lambda item: _localize(item, lang_code_id), items))

    return [
        {**loc, "detail_url": build_detail_url(loc["cid"], lang_code_id)}
        for loc in localized
        if loc and loc.get("name")
    ]


def get_candidates_by_interest(interests: list[str], district: str | None, lang_code_id: str) -> dict[str, list[dict]]:
    """관심사(카테고리) 각각에 대해 get_category_candidates를 병렬로 호출한다."""
    with ThreadPoolExecutor(max_workers=len(interests) or 1) as executor:
        futures = {
            interest: executor.submit(get_category_candidates, _category_key(interest), district, lang_code_id)
            for interest in interests
        }
        return {interest: future.result() for interest, future in futures.items()}
