export const SEOUL_DISTRICT_AREAS = {
  강남구: ['강남역', '압구정', '청담'],
  강동구: ['천호', '길동', '암사'],
  강북구: ['미아', '수유', '우이동'],
  강서구: ['화곡', '발산', '마곡'],
  관악구: ['신림', '봉천', '서울대입구'],
  광진구: ['건대입구', '자양', '구의'],
  구로구: ['구로디지털단지', '신도림', '고척'],
  금천구: ['가산디지털단지', '독산', '시흥'],
  노원구: ['노원', '상계', '중계'],
  도봉구: ['도봉산', '창동', '방학'],
  동대문구: ['청량리', '회기', '경동시장'],
  동작구: ['노량진', '사당', '이수'],
  마포구: ['홍대', '합정', '연남동'],
  서대문구: ['신촌', '이대', '연희동'],
  서초구: ['서초', '반포', '방배'],
  성동구: ['성수', '왕십리', '뚝섬'],
  성북구: ['성신여대', '길음', '정릉'],
  송파구: ['잠실', '석촌호수', '가락시장'],
  양천구: ['목동', '신정', '오목교'],
  영등포구: ['여의도', '영등포', '문래'],
  용산구: ['이태원', '한남동', '용산역'],
  은평구: ['연신내', '불광', '녹번'],
  종로구: ['인사동', '광화문', '북촌'],
  중구: ['명동', '동대문', '을지로'],
  중랑구: ['상봉', '망우', '면목'],
}

export const SEOUL_DISTRICTS = Object.keys(SEOUL_DISTRICT_AREAS)

export function isSeoulRegion(value) {
  const trimmed = (value || '').trim()
  if (!trimmed) return false
  if (trimmed.includes('서울')) return true
  return SEOUL_DISTRICTS.some((district) => trimmed.includes(district))
}

// 카카오맵 역지오코딩 주소("서울특별시 강남구 역삼동")는 드롭다운에서 자치구를 직접
// 선택했을 때와 형식이 달라서, region 표시 다국어 처리(getRegionDisplayLabel)가 못
// 알아본다. 같은 "구(동1, 동2, 동3)" 형식으로 맞춰서 현위치로 찾을 때도 드롭다운
// 선택과 동일하게 취급되도록 한다.
export function toCanonicalRegion(address) {
  const trimmed = (address || '').trim()
  const district = SEOUL_DISTRICTS.find((d) => trimmed.includes(d))
  if (!district) return trimmed
  return `${district}(${SEOUL_DISTRICT_AREAS[district].join(', ')})`
}
