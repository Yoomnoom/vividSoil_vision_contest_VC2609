import json
import os
from concurrent.futures import ThreadPoolExecutor

from google import genai
from google.genai import types

_client = None

DEFAULT_INTERESTS = ["문화관광", "쇼핑", "숙박", "역사관광", "음식", "자연관광", "체험관광", "축제/공연/행사"]

LANGUAGE_NAMES = {
    "ko": "한국어",
    "en": "English",
    "ja": "日本語",
    "zh": "简体中文",
}

# Gemini는 주어진 후보(비짓서울 실제 콘텐츠) 중에서만 골라 cid로 응답한다 - 장소 자체를
# 새로 만들어내지 않는다(PRD 3-2/7절). name/description/사진/링크는 후보 데이터를 그대로 쓴다.
_SELECTION_ITEM_SCHEMA = {
    "type": "object",
    "properties": {
        "cid": {"type": "string"},
        "why_this_weather": {"type": "string"},
    },
    "required": ["cid", "why_this_weather"],
}

WEATHER_PICKS_COUNT = 6

# Gemini 무료 티어는 분당 요청 수가 제한되어 있어(모델당 15회), 카테고리를 이 그룹 수로
# 묶어서 호출한다. 검색 1회당 요청 수 = 그룹 수 + 2(요약, weather_picks).
CATEGORY_GROUP_COUNT = 3

_SUMMARY_SCHEMA = {
    "type": "object",
    "properties": {
        "weather_desc": {"type": "string"},
        "spot_reason": {"type": "string"},
    },
    "required": ["weather_desc", "spot_reason"],
}

_WEATHER_PICKS_SCHEMA = {
    "type": "object",
    "properties": {"items": {"type": "array", "items": _SELECTION_ITEM_SCHEMA}},
    "required": ["items"],
}


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    return _client


def _weather_context(region: str, weather: dict) -> str:
    return (
        f"여행 지역: {region}\n"
        f"날씨: {weather['condition']}, 최저 {weather['temp_min']}도 / 최고 {weather['temp_max']}도, "
        f"강수확률 {weather['pop']}%"
    )


def _language_instruction(language: str) -> str:
    if language == "ko":
        return ""
    language_name = LANGUAGE_NAMES.get(language, LANGUAGE_NAMES["ko"])
    return f"\n중요: why_this_weather를 포함한 모든 응답 텍스트를 {language_name}로 작성하세요.\n"


GEMINI_TIMEOUT_MS = 30_000  # Gemini 장애 시 무한 대기하지 않도록 요청당 타임아웃(30초)을 둔다


def _generate(model: str, prompt: str, schema: dict) -> dict:
    client = _get_client()
    response = client.models.generate_content(
        model=model,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=schema,
            http_options=types.HttpOptions(timeout=GEMINI_TIMEOUT_MS),
        ),
    )
    return json.loads(response.text)


def _generate_summary(model: str, region: str, weather: dict, language: str) -> dict:
    prompt = f"""당신은 국내 지역 여행 전문가입니다.

{_weather_context(region, weather)}
{_language_instruction(language)}
요구사항:
- weather_desc: 위 날씨 조건을 한 문장으로 요약하세요.
- spot_reason: 이 날씨에서 어떤 장소들을 추천하는지 한 문장으로 요약하세요 (예: 실내 활동 위주 추천, 야외 활동 위주 추천).
"""
    return _generate(model, prompt, _SUMMARY_SCHEMA)


def _format_candidates(candidates: list[dict]) -> str:
    lines = []
    for c in candidates:
        description = (c.get("description") or "").strip().replace("\n", " ")
        if len(description) > 80:
            description = description[:80] + "..."
        lines.append(f'- cid="{c["cid"]}" name="{c["name"]}" description="{description}"')
    return "\n".join(lines)


_SELECTION_GUIDE = (
    "아래 후보 목록에 있는 cid만 사용하세요. 후보에 없는 cid를 만들어내거나 이름만 보고 다른 곳을 "
    "추천하지 마세요. 후보 수가 요청한 곳 수보다 적으면 있는 만큼만 고르세요."
)


def _generate_weather_picks(
    model: str, region: str, weather: dict, language: str, candidates: list[dict]
) -> list:
    if not candidates:
        return []

    prompt = f"""당신은 국내 지역 여행 전문가입니다.

{_weather_context(region, weather)}
{_language_instruction(language)}
아래는 이 지역에서 고를 수 있는 실제 장소 후보 목록입니다:
{_format_candidates(candidates)}

요구사항:
- 관심사 카테고리 구분 없이, 위 후보 중 오늘 날씨에 가장 적합한 장소를 최대 {WEATHER_PICKS_COUNT}곳 고르세요.
  예를 들어 비가 오거나 폭염·한파면 실내 위주로, 맑고 선선하면 야외 위주로 고르세요.
- 각 선택마다 why_this_weather에 위 날씨 조건에서 왜 그 장소가 적합한지 이유를 제시하세요.
- {_SELECTION_GUIDE}
"""
    result = _generate(model, prompt, _WEATHER_PICKS_SCHEMA)["items"]
    return _resolve_selection(result, {c["cid"]: c for c in candidates})


def _build_group_schema(interests: list[str]) -> dict:
    properties = {}
    for interest in interests:
        properties[interest] = {
            "type": "object",
            "properties": {
                "section_title": {"type": "string"},
                "items": {"type": "array", "items": _SELECTION_ITEM_SCHEMA},
            },
            "required": ["section_title", "items"],
        }
    return {"type": "object", "properties": properties, "required": interests}


def _generate_category_group(
    model: str,
    region: str,
    weather: dict,
    count: int,
    interests: list[str],
    language: str,
    candidates_by_interest: dict[str, list[dict]],
) -> dict:
    category_lines = "\n".join(
        f'- "{interest}" (section_title은 이 관심사가 드러나는 8자 내외 제목, 예: 역사관광이면 "역사가 숨쉬는 명소", '
        f'음식이면 "현지인이 인정한 맛집" / items는 아래 후보 중 최대 {count}곳):\n{_format_candidates(candidates_by_interest.get(interest, []))}'
        for interest in interests
    )
    interest_list = ", ".join(interests)

    prompt = f"""당신은 국내 지역 여행 전문가입니다.

{_weather_context(region, weather)}
사용자가 선택한 관심사: {interest_list}
{_language_instruction(language)}
관심사별 후보 목록:
{category_lines}

요구사항:
- 각 관심사 키마다 그 관심사의 후보 목록에서만 골라, 오늘 날씨에 가장 잘 맞는 곳을 고르세요.
  관심사 간 장소가 겹치지 않게 하세요.
- 각 선택마다 why_this_weather에 위 날씨 조건에서 왜 그 장소가 적합한지 이유를 제시하세요
  (예: 비/폭염이면 실내·그늘 위주, 맑고 선선하면 야외 위주).
- {_SELECTION_GUIDE}
"""
    result = _generate(model, prompt, _build_group_schema(interests))
    return {
        interest: {
            "section_title": result[interest]["section_title"],
            "items": _resolve_selection(
                result[interest]["items"], {c["cid"]: c for c in candidates_by_interest.get(interest, [])}
            ),
        }
        for interest in interests
    }


def _resolve_selection(selection: list[dict], candidates_by_cid: dict[str, dict]) -> list[dict]:
    """Gemini가 고른 {cid, why_this_weather} 목록을, 후보 데이터(name/description/사진/링크)와
    합쳐 최종 카드 데이터로 만든다. 후보에 없는 cid(환각 방지 실패)는 버린다.
    """
    resolved = []
    seen = set()
    for entry in selection:
        cid = entry.get("cid")
        candidate = candidates_by_cid.get(cid)
        if not candidate or cid in seen:
            continue
        seen.add(cid)
        resolved.append({**candidate, "why_this_weather": entry.get("why_this_weather", "")})
    return resolved


def _chunk(items: list, group_count: int) -> list:
    if group_count <= 0 or group_count >= len(items):
        return [[item] for item in items]
    size = -(-len(items) // group_count)  # 올림 분할
    return [items[i : i + size] for i in range(0, len(items), size)]


def generate_recommendations(
    region: str,
    weather: dict,
    candidates_by_interest: dict[str, list[dict]],
    count: int = 6,
    interests: list[str] | None = None,
    language: str = "ko",
) -> dict:
    """candidates_by_interest(관심사별 비짓서울 실제 콘텐츠 후보)에서 오늘 날씨에 맞는 곳을
    Gemini가 고르게 해 추천을 만든다. Gemini는 후보에 없는 장소를 만들어내지 않는다(PRD 3-2).
    """
    interests = interests or DEFAULT_INTERESTS
    if language not in LANGUAGE_NAMES:
        language = "ko"

    model = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
    groups = _chunk(interests, CATEGORY_GROUP_COUNT)
    all_candidates = list({
        c["cid"]: c for items in candidates_by_interest.values() for c in items
    }.values())

    with ThreadPoolExecutor(max_workers=len(groups) + 2) as executor:
        summary_future = executor.submit(_generate_summary, model, region, weather, language)
        weather_picks_future = executor.submit(
            _generate_weather_picks, model, region, weather, language, all_candidates
        )
        group_futures = [
            executor.submit(
                _generate_category_group, model, region, weather, count, group, language, candidates_by_interest
            )
            for group in groups
        ]

        summary = summary_future.result()
        weather_picks = weather_picks_future.result()
        categories = {}
        for future in group_futures:
            categories.update(future.result())

    return {
        "weather_desc": summary["weather_desc"],
        "spot_reason": summary["spot_reason"],
        "weather_picks": weather_picks,
        "categories": categories,
    }
