import json
import sys

from dotenv import load_dotenv

from services.candidate_service import get_candidates_by_interest, resolve_district
from services.gemini_service import DEFAULT_INTERESTS, generate_recommendations
from services.kakao_service import geocode_region
from services.visitseoul_service import LANG_CODE_MAP
from services.weather_service import get_hourly_weather, get_weather_for_period

CATEGORY_SPOT_COUNT = 6


def get_travel_recommendation(
    region: str,
    start_date: str,
    end_date: str | None = None,
    interests: list[str] | None = None,
    language: str = "ko",
) -> dict:
    """region의 start_date~end_date(생략 시 start_date와 동일한 하루) 기간에 대한
    날씨와 추천을 반환한다. 추천은 첫날 날씨를 기준으로 생성한다.

    노출되는 모든 장소는 비짓서울 API가 실제로 보유한 콘텐츠 중에서만 고른다(PRD 3-2/7절) -
    Gemini는 이 콘텐츠 후보 중에서 오늘 날씨에 맞는 곳을 고르고 이유만 작성할 뿐, 장소 자체를
    새로 만들어내지 않는다.
    """
    end_date = end_date or start_date
    interests = interests or DEFAULT_INTERESTS

    location = geocode_region(region)
    weather_by_day_ko = get_weather_for_period(location["lat"], location["lon"], start_date, end_date)

    district = resolve_district(region)
    lang_code_id = LANG_CODE_MAP.get(language, "ko")
    candidates_by_interest = get_candidates_by_interest(interests, district, lang_code_id)

    recommendation = generate_recommendations(
        region, weather_by_day_ko[0], candidates_by_interest, CATEGORY_SPOT_COUNT, interests, language
    )

    weather_by_day = (
        weather_by_day_ko
        if language == "ko"
        else get_weather_for_period(location["lat"], location["lon"], start_date, end_date, language)
    )
    hourly_weather = get_hourly_weather(location["lat"], location["lon"], start_date, language)
    return {
        "region": region,
        "location": location,
        "weather": weather_by_day[0],
        "weather_by_day": weather_by_day,
        "hourly_weather": hourly_weather,
        "recommendation": recommendation,
    }


if __name__ == "__main__":
    load_dotenv()

    region = sys.argv[1] if len(sys.argv) > 1 else "제주도"
    start_date = sys.argv[2] if len(sys.argv) > 2 else "2026-08-01"
    end_date = sys.argv[3] if len(sys.argv) > 3 else None

    result = get_travel_recommendation(region, start_date, end_date)
    sys.stdout.reconfigure(encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, indent=2))
