from dotenv import load_dotenv

load_dotenv()

from flask import Flask, jsonify, request
from flask_cors import CORS

from pipeline import get_travel_recommendation
from services.candidate_service import get_category_candidates, resolve_district
from services.exim_service import get_exchange_rates
from services.kakao_service import reverse_geocode
from services.visitseoul_service import CATEGORY_IDS, get_contents

app = Flask(__name__)
CORS(app)


@app.route("/api/exchange-rate", methods=["GET"])
def exchange_rate_endpoint():
    try:
        rates = get_exchange_rates()
        return jsonify({"rates": rates})
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "환율 조회 중 오류가 발생했습니다.", "detail": str(e)}), 500


@app.route("/api/reverse-geocode", methods=["GET"])
def reverse_geocode_endpoint():
    try:
        lat = float(request.args.get("lat", ""))
        lon = float(request.args.get("lon", ""))
    except ValueError:
        return jsonify({"error": "lat, lon은 필수 숫자 파라미터입니다."}), 400

    try:
        address = reverse_geocode(lat, lon)
        return jsonify({"address": address})
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "주소 조회 중 오류가 발생했습니다.", "detail": str(e)}), 500


@app.route("/api/seoul-contents", methods=["GET"])
def seoul_contents_endpoint():
    keyword = request.args.get("keyword", "")
    lang_code_id = request.args.get("lang", "ko")
    region = request.args.get("region", "")
    try:
        page_no = int(request.args.get("page", "1"))
    except ValueError:
        page_no = 1

    try:
        if keyword in CATEGORY_IDS:
            # region이 넘어오면(검색으로 선택된 자치구) 그 자치구 콘텐츠만 후보로 채운다 -
            # /api/recommend와 같은 candidate_service를 써서, 매칭이 부족해도 다른
            # 자치구로 대체하지 않는다(get_category_candidates 참고).
            district = resolve_district(region) if region else None
            items = get_category_candidates(keyword, district, lang_code_id)
            return jsonify({"result_code": 200, "data": items})
        result = get_contents(keyword=keyword, lang_code_id=lang_code_id, page_no=page_no)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": "관광 콘텐츠 조회 중 오류가 발생했습니다.", "detail": str(e)}), 500


@app.route("/api/recommend", methods=["POST"])
def recommend():
    data = request.get_json(silent=True) or {}
    region = (data.get("region") or "").strip()
    date = (data.get("date") or "").strip()
    end_date = (data.get("endDate") or "").strip() or None
    interests = [i for i in (data.get("interests") or []) if isinstance(i, str) and i.strip()]
    language = (data.get("language") or "ko").strip()

    if not region or not date:
        return jsonify({"error": "region과 date는 필수입니다."}), 400

    try:
        result = get_travel_recommendation(region, date, end_date, interests, language)
        return jsonify(result)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "추천 생성 중 오류가 발생했습니다.", "detail": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
