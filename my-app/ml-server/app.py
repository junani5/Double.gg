from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app, resources={r"/predict_offset": {"origins": "http://localhost:3000"}})

# -------------------------------------------------------------------
# 경로 설정: 절대 경로를 사용하여 파일을 확실하게 찾습니다.
# ml-server 폴더의 상위 폴더(my-app)에 있는 feedback_db.json을 참조합니다.
# -------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FEEDBACK_DB_PATH = os.path.join(BASE_DIR, '..', 'feedback_db.json')

# 학습률 설정 (0.25 = 피드백 한 번에 약 25%씩 반영)
LEARNING_RATE = 0.25

# -------------------------------------------------------------------
# 1. 데이터베이스 읽기 (안전하게 읽기)
# -------------------------------------------------------------------
def read_feedback_db():
    try:
        # 파일이 없으면 빈 리스트 반환
        if not os.path.exists(FEEDBACK_DB_PATH):
            # print(f"ℹ️ 알림: 아직 피드백 데이터 파일이 없습니다. ({FEEDBACK_DB_PATH})")
            return []
            
        with open(FEEDBACK_DB_PATH, 'r', encoding='utf-8') as f:
            content = f.read().strip()
            if not content: # 파일이 비어있는 경우 처리
                return []
            return json.loads(content)
            
    except json.JSONDecodeError:
        print("⚠️ 경고: JSON 파일 형식이 올바르지 않습니다. 빈 데이터로 시작합니다.")
        return []
    except Exception as e:
        print(f"❌ DB 읽기 오류 발생: {e}")
        return []

# -------------------------------------------------------------------
# 2. 개인 맞춤 보정 값 계산 로직 (점진적 조정)
# -------------------------------------------------------------------
def calculate_personal_offset(user_id: str):
    feedback_data = read_feedback_db()
    
    # 해당 사용자의 피드백만 필터링
    user_feedback = [entry for entry in feedback_data if entry.get('userId') == user_id]
    
    # 타임스탬프 기준 정렬 (과거 -> 최신)
    user_feedback.sort(key=lambda x: x.get('timestamp', 0))
    
    if not user_feedback:
        return 0.0

    # 피드백 점수 매핑
    score_map = {'hot': 1.0, 'just_right': 0.0, 'cold': -1.0}

    # 첫 번째 피드백으로 초기값 설정
    first_entry = user_feedback[0]
    cumulative_offset = score_map.get(first_entry.get('feedback'), 0.0) * LEARNING_RATE
    
    # 두 번째 피드백부터 점진적으로 값 조정
    for i in range(1, len(user_feedback)):
        feedback_type = user_feedback[i].get('feedback')
        target_score = score_map.get(feedback_type, 0.0)

        # 공식: 새 보정값 = 이전 보정값 + 학습률 * (목표점수 - 이전 보정값)
        cumulative_offset += LEARNING_RATE * (target_score - cumulative_offset)

    print(f"✅ [ML 로그] 사용자({user_id}) 피드백 {len(user_feedback)}건 분석 -> 보정값: {cumulative_offset:.2f}°C")
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
    print(f"   - DB 경로: {FEEDBACK_DB_PATH}")
    print(f"   - 주소: http://127.0.0.1:5000")
    print("========================================")
    app.run(host='0.0.0.0', port=5000, debug=True)