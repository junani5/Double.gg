from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app, resources={r"/predict_offset": {"origins": "http://localhost:3000"}})

# -------------------------------------------------------------------
# 경로 설정
# -------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FEEDBACK_DB_PATH = os.path.join(BASE_DIR, '..', 'feedback_db.json')

# 학습률 설정 (0.2 = 한 번 피드백에 목표치와의 차이의 20%만큼 이동)
# 예: 현재 0도, 목표 3도일 때 -> 첫 피드백 후 0.6도 증가
LEARNING_RATE = 0.2

# 최대/최소 보정 범위 설정 (±3도)
MAX_OFFSET = 3.0
MIN_OFFSET = -3.0

# -------------------------------------------------------------------
# 1. 데이터베이스 읽기
# -------------------------------------------------------------------
def read_feedback_db():
    try:
        if not os.path.exists(FEEDBACK_DB_PATH):
            return []
            
        with open(FEEDBACK_DB_PATH, 'r', encoding='utf-8') as f:
            content = f.read().strip()
            if not content:
                return []
            return json.loads(content)
            
    except Exception as e:
        print(f"❌ DB 읽기 오류 발생: {e}")
        return []

# -------------------------------------------------------------------
# 2. 개인 맞춤 보정 값 계산 로직 (±3도 범위)
# -------------------------------------------------------------------
def calculate_personal_offset(user_id: str):
    feedback_data = read_feedback_db()
    
    # 해당 사용자의 피드백만 필터링
    user_feedback = [entry for entry in feedback_data if entry.get('userId') == user_id]
    
    # 타임스탬프 기준 정렬 (과거 -> 최신)
    user_feedback.sort(key=lambda x: x.get('timestamp', 0))
    
    if not user_feedback:
        return 0.0

    # ✨ 목표 점수 매핑 (±3도 범위로 확장)
    # Hot: 더우니까 온도를 높게 인식시켜서 얇은 옷 추천 유도 (+3.0 목표)
    # Cold: 추우니까 온도를 낮게 인식시켜서 두꺼운 옷 추천 유도 (-3.0 목표)
    score_map = {'hot': 3.0, 'just_right': 0.0, 'cold': -3.0}

    # 초기값 설정
    cumulative_offset = 0.0
    
    # 피드백 이력을 순회하며 학습 (Exponential Moving Average 방식)
    for entry in user_feedback:
        feedback_type = entry.get('feedback')
        target_score = score_map.get(feedback_type, 0.0)

        # 공식: 새 보정값 = 이전 보정값 + 학습률 * (목표점수 - 이전 보정값)
        # 피드백이 쌓일수록 사용자의 성향(±3도)에 수렴하게 됨
        cumulative_offset += LEARNING_RATE * (target_score - cumulative_offset)

    # ✨ 최종 값을 ±3도 사이로 강제 고정 (Clamping)
    cumulative_offset = max(MIN_OFFSET, min(MAX_OFFSET, cumulative_offset))

    print(f"✅ [ML 로그] 사용자({user_id}) 피드백 {len(user_feedback)}건 -> 최종 보정값: {cumulative_offset:.2f}°C")
    return round(cumulative_offset, 2)

# -------------------------------------------------------------------
# 3. 예측 API 엔드포인트
# -------------------------------------------------------------------
@app.route('/predict_offset', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data received'}), 400

        user_id = data.get('userId', 'anonymous')
        temp = data.get('currentTemp')
        
        if temp is None:
            return jsonify({'error': 'currentTemp is required'}), 400

        # 보정 값 계산 호출
        offset = calculate_personal_offset(user_id)
        
        return jsonify({
            'userId': user_id,
            'temperatureOffset': offset 
        })
        
    except Exception as e:
        print(f"❌ 서버 내부 오류: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("========================================")
    print(f"💡 ML 서버가 실행 중입니다.")
    print(f"   - 보정 범위: {MIN_OFFSET}°C ~ +{MAX_OFFSET}°C")
    print(f"   - DB 경로: {FEEDBACK_DB_PATH}")
    print("========================================")
    app.run(host='0.0.0.0', port=5000, debug=True)