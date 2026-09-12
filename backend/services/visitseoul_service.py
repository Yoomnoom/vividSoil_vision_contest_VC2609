import os

import requests

CONTENTS_LIST_URL = "https://api-call.visitseoul.net/api/v1/contents/list"
CONTENTS_INFO_URL = "https://api-call.visitseoul.net/api/v1/contents/info"
DETAIL_URL_TEMPLATE = "https://korean.visitseoul.net/attractions/detail/{cid}"

# 프론트엔드 language 코드 -> 비짓서울 lang_code_id (중국어만 zh-CN으로 다름)
LANG_CODE_MAP = {"ko": "ko", "en": "en", "ja": "ja", "zh": "zh-CN"}

# 서울 25개 자치구. contents/info 응답의 traffic.adres/new_adres(한국어 주소)에서
# 이 이름 중 하나를 찾아 자치구를 판별한다(다른 언어 주소는 로마자/현지 표기라 이 목록으로
# 매칭할 수 없으므로, 자치구 판별은 항상 한국어 상세 조회 결과로 한다).
SEOUL_DISTRICTS = [
    "종로구", "중구", "용산구", "성동구", "광진구", "동대문구", "중랑구", "성북구",
    "강북구", "도봉구", "노원구", "은평구", "서대문구", "마포구", "양천구", "강서구",
    "구로구", "금천구", "영등포구", "동작구", "관악구", "서초구", "강남구", "송파구", "강동구",
]

# 비짓서울 콘텐츠 최상위 카테고리의 com_ctgry_sn 코드(언어와 무관하게 고정된 ID).
# contents/list가 이 값으로 서버단 카테고리 필터링을 지원하므로, 텍스트 키워드
# 검색이나 cate_depth 접두어 매칭보다 정확하다.
CATEGORY_IDS = {
    "문화관광": "Ca0o2d4",  # Culture
    "쇼핑": "Cu8e6t5",  # Shopping
    "숙박": "Ch4v8z7",  # Accommodations
    "역사관광": "Ca1z6p7",  # History
    "음식": "Cl9s3y9",  # Cuisine
    "자연관광": "Co6c2n2",  # Nature
    "체험관광": "Cc9i5o2",  # Experience Programs
    "축제": "Cv7s8m5",  # Festivals/Events/Performances
}

# 비짓서울 "축제/공연/행사" 카테고리에는 위치 필드가 없어 서울 외 지역 축제도 섞여 나온다.
# 제목·요약에 타 지역 지명이 포함되면 서울 축제가 아닌 것으로 보고 걸러낸다(언어별 표기 포함).
# 서울 25개 자치구와 이름이 겹치는 지명(중구, 강남 등 광역시 구 이름)은 오탐을 막기 위해 제외했다.
NON_SEOUL_LOCATION_KEYWORDS = [
    # 한국어 - 광역자치단체
    "부산", "대구", "인천", "광주", "대전", "울산", "세종",
    "경기도", "강원", "충북", "충청북도", "충남", "충청남도",
    "전북", "전라북도", "전남", "전라남도", "경북", "경상북도", "경남", "경상남도", "제주",
    # 한국어 - 시/군 (서울 자치구와 이름이 겹치지 않는 기초자치단체)
    "수원", "성남", "의정부", "안양", "부천", "광명", "평택", "동두천", "안산", "고양",
    "과천", "구리", "남양주", "오산", "시흥", "군포", "의왕", "하남", "용인", "파주",
    "이천", "안성", "김포", "화성", "광주시", "여주", "양평", "동두천", "포천", "연천",
    "가평", "양주",
    "춘천", "원주", "강릉", "동해", "태백", "속초", "삼척", "홍천", "횡성", "영월",
    "평창", "정선", "철원", "화천", "양구", "인제", "고성", "양양",
    "청주", "충주", "제천", "보은", "옥천", "영동", "증평", "진천", "괴산", "음성", "단양",
    "천안", "공주", "보령", "아산", "서산", "논산", "계룡", "당진", "금산", "부여",
    "서천", "청양", "홍성", "예산", "태안",
    "전주", "군산", "익산", "정읍", "남원", "김제", "완주", "진안", "무주", "장수",
    "임실", "순창", "고창", "부안",
    "목포", "여수", "순천", "나주", "광양", "담양", "곡성", "구례", "고흥", "보성",
    "화순", "장흥", "강진", "해남", "영암", "무안", "함평", "영광", "장성", "완도",
    "진도", "신안",
    "포항", "경주", "김천", "안동", "구미", "영주", "영천", "상주", "문경", "경산",
    "군위", "의성", "청송", "영양", "영덕", "청도", "고령", "성주", "칠곡", "예천",
    "봉화", "울진", "울릉",
    "창원", "진주", "통영", "사천", "김해", "밀양", "거제", "양산", "의령", "함안",
    "창녕", "고성군", "남해", "하동", "산청", "함양", "거창", "합천",
    "제주시", "서귀포",
    "명량",
    # 영어
    "Busan", "Daegu", "Incheon", "Gwangju", "Daejeon", "Ulsan", "Sejong",
    "Gyeonggi", "Gangwon", "Chungbuk", "Chungnam", "Jeonbuk", "Jeonnam",
    "Gyeongbuk", "Gyeongnam", "Jeju",
    "Suwon", "Seongnam", "Uijeongbu", "Anyang", "Bucheon", "Gwangmyeong", "Pyeongtaek",
    "Dongducheon", "Ansan", "Goyang", "Gwacheon", "Guri", "Namyangju", "Osan", "Siheung",
    "Gunpo", "Uiwang", "Hanam", "Yongin", "Paju", "Icheon", "Anseong", "Gimpo", "Hwaseong",
    "Yeoju", "Yangpyeong", "Pocheon", "Yeoncheon", "Gapyeong", "Yangju",
    "Chuncheon", "Wonju", "Gangneung", "Donghae", "Taebaek", "Sokcho", "Samcheok",
    "Hongcheon", "Hoengseong", "Yeongwol", "Pyeongchang", "Jeongseon", "Cheorwon",
    "Hwacheon", "Yanggu", "Inje", "Goseong", "Yangyang",
    "Cheongju", "Chungju", "Jecheon", "Boeun", "Okcheon", "Yeongdong", "Jeungpyeong",
    "Jincheon", "Goesan", "Eumseong", "Danyang",
    "Cheonan", "Gongju", "Boryeong", "Asan", "Seosan", "Nonsan", "Gyeryong", "Dangjin",
    "Geumsan", "Buyeo", "Seocheon", "Cheongyang", "Hongseong", "Yesan", "Taean",
    "Jeonju", "Gunsan", "Iksan", "Jeongeup", "Namwon", "Gimje", "Wanju", "Jinan",
    "Muju", "Jangsu", "Imsil", "Sunchang", "Gochang", "Buan",
    "Mokpo", "Yeosu", "Suncheon", "Naju", "Gwangyang", "Damyang", "Gokseong", "Gurye",
    "Goheung", "Boseong", "Hwasun", "Jangheung", "Gangjin", "Haenam", "Yeongam",
    "Muan", "Hampyeong", "Yeonggwang", "Jangseong", "Wando", "Jindo", "Sinan",
    "Pohang", "Gyeongju", "Gimcheon", "Andong", "Gumi", "Yeongju", "Yeongcheon",
    "Sangju", "Mungyeong", "Gyeongsan", "Gunwi", "Uiseong", "Cheongsong", "Yeongyang",
    "Yeongdeok", "Cheongdo", "Goryeong", "Seongju", "Chilgok", "Yecheon", "Bonghwa",
    "Uljin", "Ulleung",
    "Changwon", "Jinju", "Tongyeong", "Sacheon", "Gimhae", "Miryang", "Geoje", "Yangsan",
    "Uiryeong", "Haman", "Changnyeong", "Namhae", "Hadong", "Sancheong", "Hamyang",
    "Geochang", "Hapcheon",
    "Jeju City", "Seogwipo", "Myeongnyang",
    # 일본어
    "釜山", "大邱", "仁川", "光州", "大田", "蔚山", "世宗",
    "京畿道", "江原", "忠北", "忠南", "全北", "全南", "慶北", "慶南", "済州",
    "水原", "城南", "議政府", "安養", "富川", "光明", "平澤", "安山", "高陽",
    "龍仁", "坡州", "金浦", "華城",
    "春川", "原州", "江陵", "束草",
    "清州", "忠州",
    "天安", "公州", "牙山", "瑞山",
    "全州", "群山", "益山",
    "木浦", "麗水", "順天",
    "浦項", "慶州", "亀尾", "安東",
    "昌原", "晋州", "統営", "金海", "巨済", "梁山",
    "済州市", "西帰浦",
    # 중국어
    "釜山", "大邱", "仁川", "光州", "大田", "蔚山", "世宗",
    "京畿道", "江原", "忠北", "忠南", "全北", "全南", "庆北", "庆南", "济州",
    "水原", "城南", "议政府", "安养", "富川", "光明", "平泽", "安山", "高阳",
    "龙仁", "坡州", "金浦", "华城",
    "春川", "原州", "江陵", "束草",
    "清州", "忠州",
    "天安", "公州", "牙山", "瑞山",
    "全州", "群山", "益山",
    "木浦", "丽水", "顺天",
    "浦项", "庆州", "龟尾", "安东",
    "昌原", "晋州", "统营", "金海", "巨济", "梁山",
    "济州市", "西归浦",
]


def _is_seoul_content(item: dict) -> bool:
    text = f"{item.get('post_sj', '')} {item.get('sumry', '')}"
    return not any(keyword in text for keyword in NON_SEOUL_LOCATION_KEYWORDS)


def get_contents(
    keyword: str = "", lang_code_id: str = "ko", page_no: int = 1, com_ctgry_sn: str | None = None
) -> dict:
    """비짓서울 API로 서울 관광 콘텐츠(명소/맛집/축제 등) 목록을 조회한다.

    com_ctgry_sn을 넘기면 해당 최상위 카테고리로 서버단 필터링된 결과만 받는다.
    """
    api_key = os.environ["VISIT_SEOUL_API_KEY"]
    headers = {
        "Accept": "application/json;charset=UTF-8",
        "Content-Type": "application/json;charset=UTF-8",
        "VISITSEOUL-API-KEY": api_key,
    }
    body = {"lang_code_id": lang_code_id, "sort_type": "latest", "page_no": str(page_no)}
    if keyword:
        body["keyword"] = keyword
    if com_ctgry_sn:
        body["com_ctgry_sn"] = com_ctgry_sn

    resp = requests.post(CONTENTS_LIST_URL, headers=headers, json=body, timeout=5)
    resp.raise_for_status()
    return resp.json()


def get_content_detail(cid: str, lang_code_id: str = "ko") -> dict | None:
    """cid 하나의 상세 정보(주소 등 contents/list에는 없는 필드 포함)를 조회한다.

    contents/list와 달리 이 API만 traffic.adres/new_adres(자치구 판별에 쓰는 주소)를 준다.
    """
    api_key = os.environ["VISIT_SEOUL_API_KEY"]
    headers = {
        "Accept": "application/json;charset=UTF-8",
        "Content-Type": "application/json;charset=UTF-8",
        "VISITSEOUL-API-KEY": api_key,
    }
    resp = requests.post(
        CONTENTS_INFO_URL, headers=headers, json={"cid": cid, "lang_code_id": lang_code_id}, timeout=5
    )
    resp.raise_for_status()
    result = resp.json()
    if result.get("result_code") != 200:
        return None
    return result.get("data")


def extract_district(detail: dict) -> str | None:
    """contents/info 응답(get_content_detail의 반환값)에서 자치구명을 추출한다."""
    traffic = (detail or {}).get("traffic") or {}
    address_text = f"{traffic.get('adres', '')} {traffic.get('new_adres', '')}"
    for district in SEOUL_DISTRICTS:
        if district in address_text:
            return district
    return None


def get_category_contents(category_key: str, lang_code_id: str = "ko", page_no: int = 1) -> dict:
    """CATEGORY_IDS에 등록된 최상위 카테고리(예: '축제', '쇼핑') 콘텐츠만 조회한다.

    "축제/공연/행사" 카테고리에는 위치 필드가 없어 서울 외 지역 콘텐츠도 함께 나오므로,
    카테고리 필터링과 별개로 지명 키워드 기반 필터를 한 번 더 거친다.
    다른 카테고리(특히 "음식")는 "안동갈비", "전주비빔밥"처럼 요리명 자체에 지역명이
    관용적으로 들어가는 경우가 많아 같은 필터를 적용하면 서울 콘텐츠까지 대량으로
    걸러지므로 적용하지 않는다.
    """
    result = get_contents(lang_code_id=lang_code_id, page_no=page_no, com_ctgry_sn=CATEGORY_IDS[category_key])
    if result.get("result_code") != 200:
        return result

    if category_key != "축제":
        return result

    items = [item for item in result.get("data", []) if _is_seoul_content(item)]
    return {**result, "data": items}


def get_festival_contents(lang_code_id: str = "ko", page_no: int = 1) -> dict:
    """"축제/공연/행사" 카테고리 콘텐츠만 조회한다."""
    return get_category_contents("축제", lang_code_id, page_no)
