// 자치구/동네명은 카카오맵 지오코딩·구글 지도 링크에 그대로 쓰이므로
// 실제 검색값은 항상 한국어로 유지하고, 이 사전은 드롭다운 표시 전용으로만 쓴다.
export const DISTRICT_NAMES = {
  en: {
    강남구: 'Gangnam-gu', 강동구: 'Gangdong-gu', 강북구: 'Gangbuk-gu', 강서구: 'Gangseo-gu',
    관악구: 'Gwanak-gu', 광진구: 'Gwangjin-gu', 구로구: 'Guro-gu', 금천구: 'Geumcheon-gu',
    노원구: 'Nowon-gu', 도봉구: 'Dobong-gu', 동대문구: 'Dongdaemun-gu', 동작구: 'Dongjak-gu',
    마포구: 'Mapo-gu', 서대문구: 'Seodaemun-gu', 서초구: 'Seocho-gu', 성동구: 'Seongdong-gu',
    성북구: 'Seongbuk-gu', 송파구: 'Songpa-gu', 양천구: 'Yangcheon-gu', 영등포구: 'Yeongdeungpo-gu',
    용산구: 'Yongsan-gu', 은평구: 'Eunpyeong-gu', 종로구: 'Jongno-gu', 중구: 'Jung-gu', 중랑구: 'Jungnang-gu',
  },
  ja: {
    강남구: 'カンナム区', 강동구: 'カンドン区', 강북구: 'カンブク区', 강서구: 'カンソ区',
    관악구: 'クァナク区', 광진구: 'クァンジン区', 구로구: 'クロ区', 금천구: 'クムチョン区',
    노원구: 'ノウォン区', 도봉구: 'トボン区', 동대문구: 'トンデムン区', 동작구: 'トンジャク区',
    마포구: 'マポ区', 서대문구: 'ソデムン区', 서초구: 'ソチョ区', 성동구: 'ソンドン区',
    성북구: 'ソンブク区', 송파구: 'ソンパ区', 양천구: 'ヤンチョン区', 영등포구: 'ヨンドゥンポ区',
    용산구: 'ヨンサン区', 은평구: 'ウンピョン区', 종로구: 'チョンノ区', 중구: 'チュング区', 중랑구: 'チュンナン区',
  },
  zh: {
    강남구: '江南区', 강동구: '江东区', 강북구: '江北区', 강서구: '江西区',
    관악구: '冠岳区', 광진구: '广津区', 구로구: '九老区', 금천구: '衿川区',
    노원구: '芦原区', 도봉구: '道峰区', 동대문구: '东大门区', 동작구: '铜雀区',
    마포구: '麻浦区', 서대문구: '西大门区', 서초구: '瑞草区', 성동구: '城东区',
    성북구: '城北区', 송파구: '松坡区', 양천구: '阳川区', 영등포구: '永登浦区',
    용산구: '龙山区', 은평구: '恩平区', 종로구: '钟路区', 중구: '中区', 중랑구: '中浪区',
  },
}

export const AREA_NAMES = {
  en: {
    강남역: 'Gangnam Station', 압구정: 'Apgujeong', 청담: 'Cheongdam',
    천호: 'Cheonho', 길동: 'Gil-dong', 암사: 'Amsa',
    미아: 'Mia', 수유: 'Suyu', 우이동: 'Ui-dong',
    화곡: 'Hwagok', 발산: 'Balsan', 마곡: 'Magok',
    신림: 'Sillim', 봉천: 'Bongcheon', 서울대입구: 'Seoul Nat’l Univ.',
    건대입구: 'Konkuk Univ.', 자양: 'Jayang', 구의: 'Guui',
    구로디지털단지: 'Guro Digital Complex', 신도림: 'Sindorim', 고척: 'Gocheok',
    가산디지털단지: 'Gasan Digital Complex', 독산: 'Doksan', 시흥: 'Siheung',
    노원: 'Nowon', 상계: 'Sanggye', 중계: 'Junggye',
    도봉산: 'Dobongsan', 창동: 'Chang-dong', 방학: 'Banghak',
    청량리: 'Cheongnyangni', 회기: 'Hoegi', 경동시장: 'Gyeongdong Market',
    노량진: 'Noryangjin', 사당: 'Sadang', 이수: 'Isu',
    홍대: 'Hongdae', 합정: 'Hapjeong', 연남동: 'Yeonnam-dong',
    신촌: 'Sinchon', 이대: 'Ewha Womans Univ.', 연희동: 'Yeonhui-dong',
    서초: 'Seocho', 반포: 'Banpo', 방배: 'Bangbae',
    성수: 'Seongsu', 왕십리: 'Wangsimni', 뚝섬: 'Ttukseom',
    성신여대: 'Sungshin Women’s Univ.', 길음: 'Gireum', 정릉: 'Jeongneung',
    잠실: 'Jamsil', 석촌호수: 'Seokchon Lake', 가락시장: 'Garak Market',
    목동: 'Mok-dong', 신정: 'Sinjeong', 오목교: 'Omokgyo',
    여의도: 'Yeouido', 영등포: 'Yeongdeungpo', 문래: 'Mullae',
    이태원: 'Itaewon', 한남동: 'Hannam-dong', 용산역: 'Yongsan Station',
    연신내: 'Yeonsinnae', 불광: 'Bulgwang', 녹번: 'Nokbeon',
    인사동: 'Insadong', 광화문: 'Gwanghwamun', 북촌: 'Bukchon',
    명동: 'Myeongdong', 동대문: 'Dongdaemun', 을지로: 'Euljiro',
    상봉: 'Sangbong', 망우: 'Mangu', 면목: 'Myeonmok',
  },
  ja: {
    강남역: 'カンナム駅', 압구정: '狎鴎亭', 청담: '清潭',
    천호: 'チョノ', 길동: 'キルトン', 암사: 'アムサ',
    미아: 'ミア', 수유: 'スユ', 우이동: 'ウイドン',
    화곡: 'ファゴク', 발산: 'パルサン', 마곡: 'マゴク',
    신림: 'シンリム', 봉천: 'ポンチョン', 서울대입구: 'ソウル大入口',
    건대입구: '建大入口', 자양: 'チャヤン', 구의: 'クイ',
    구로디지털단지: 'コロデジタル団地', 신도림: 'シンドリム', 고척: 'コチョク',
    가산디지털단지: 'カサンデジタル団地', 독산: 'トクサン', 시흥: 'シフン',
    노원: 'ノウォン', 상계: 'サンゲ', 중계: 'チュンゲ',
    도봉산: 'トボンサン', 창동: 'チャンドン', 방학: 'パンハク',
    청량리: 'チョンニャンニ', 회기: 'フェギ', 경동시장: '京東市場',
    노량진: 'ノリャンジン', 사당: 'サダン', 이수: 'イス',
    홍대: '弘大', 합정: 'ハプチョン', 연남동: 'ヨンナムドン',
    신촌: '新村', 이대: '梨大', 연희동: 'ヨンヒドン',
    서초: 'ソチョ', 반포: '盤浦', 방배: 'パンベ',
    성수: 'ソンス', 왕십리: '往十里', 뚝섬: 'トゥクソム',
    성신여대: '誠信女大', 길음: 'キルム', 정릉: 'チョンヌン',
    잠실: '蚕室', 석촌호수: '石村湖水', 가락시장: '可楽市場',
    목동: '木洞', 신정: 'シンジョン', 오목교: 'オモッキョ',
    여의도: '汝矣島', 영등포: '永登浦', 문래: 'ムンレ',
    이태원: '梨泰院', 한남동: '漢南洞', 용산역: '龍山駅',
    연신내: 'ヨンシンネ', 불광: 'プルグァン', 녹번: 'ノクポン',
    인사동: '仁寺洞', 광화문: '光化門', 북촌: '北村',
    명동: '明洞', 동대문: '東大門', 을지로: '乙支路',
    상봉: 'サンボン', 망우: 'マンウ', 면목: 'ミョンモク',
  },
  zh: {
    강남역: '江南站', 압구정: '狎鸥亭', 청담: '清潭',
    천호: '千户', 길동: '吉洞', 암사: '岩寺',
    미아: '弥阿', 수유: '水逾', 우이동: '牛耳洞',
    화곡: '禾谷', 발산: '鉢山', 마곡: '麻谷',
    신림: '新林', 봉천: '奉天', 서울대입구: '首尔大入口',
    건대입구: '建大入口', 자양: '紫阳', 구의: '九宜',
    구로디지털단지: '九老数码园区', 신도림: '新道林', 고척: '高尺',
    가산디지털단지: '加山数码园区', 독산: '禿山', 시흥: '始兴',
    노원: '芦原', 상계: '上溪', 중계: '中溪',
    도봉산: '道峰山', 창동: '仓洞', 방학: '放鹤',
    청량리: '清凉里', 회기: '回基', 경동시장: '京东市场',
    노량진: '鹭梁津', 사당: '舍堂', 이수: '梨水',
    홍대: '弘大', 합정: '合井', 연남동: '延南洞',
    신촌: '新村', 이대: '梨大', 연희동: '延禧洞',
    서초: '瑞草', 반포: '盘浦', 방배: '方背',
    성수: '圣水', 왕십리: '往十里', 뚝섬: '纛岛',
    성신여대: '诚信女大', 길음: '吉音', 정릉: '贞陵',
    잠실: '蚕室', 석촌호수: '石村湖', 가락시장: '可乐市场',
    목동: '木洞', 신정: '新亭', 오목교: '梧木桥',
    여의도: '汝矣岛', 영등포: '永登浦', 문래: '文来',
    이태원: '梨泰院', 한남동: '汉南洞', 용산역: '龙山站',
    연신내: '延信内', 불광: '佛光', 녹번: '绿蕃',
    인사동: '仁寺洞', 광화문: '光化门', 북촌: '北村',
    명동: '明洞', 동대문: '东大门', 을지로: '乙支路',
    상봉: '上凤', 망우: '忘忧', 면목: '面牧',
  },
}

export function getDistrictLabel(language, district) {
  return DISTRICT_NAMES[language]?.[district] || district
}

export function getAreaLabel(language, area) {
  return AREA_NAMES[language]?.[area] || area
}

// 검색창에 이미 선택된 지역("중구(명동, 동대문, 을지로)")을 표시할 때 쓴다.
// 실제 검색/API 요청값(region 상태)은 항상 이 함수를 거치지 않은 한국어 원문을 그대로 쓴다.
export function getRegionDisplayLabel(language, region) {
  if (!region || language === 'ko') return region
  const match = region.match(/^(.+?)\((.+)\)$/)
  if (!match) return getDistrictLabel(language, region)
  const [, district, areasStr] = match
  const areas = areasStr.split(',').map((area) => area.trim())
  return `${getDistrictLabel(language, district)}(${areas.map((area) => getAreaLabel(language, area)).join(', ')})`
}
