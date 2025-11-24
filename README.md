# 🧥 WeatherFit: 개인 맞춤형 날씨 기반 옷차림 추천 서비스

## 🌟 프로젝트 소개

**WeatherFit**은 단순히 기온에 따른 일반적인 옷차림 정보를 제공하는 것을 넘어, **사용자의 개인적인 추위/더위 민감도를 학습**하여 가장 적절하고 만족도 높은 옷차림을 추천해주는 **개인 맞춤형 웹 애플리케이션**입니다.

이 프로젝트는 오픈소스 소프트웨어의 철학을 바탕으로, 공공 데이터를 활용하고 사용자 피드백을 통해 머신러닝 모델을 지속적으로 개선하는 구조를 갖추고 있습니다.

### 🔑 오픈소스 및 공공 데이터 활용 (Open Source & Open Data)

본 프로젝트는 **'오픈소스 소프트웨어'** 교과목의 일환으로, 개방형 기술과 데이터를 적극적으로 활용하여 구현되었습니다.

* **기상청 공공 데이터 활용:** **기상청(KMA)**에서 제공하는 **단기/중기 예보 오픈 API**를 사용하여, 신뢰도 높은 실시간 날씨 정보를 무료로 제공받아 처리합니다.
* **오픈소스 기술 스택:** 전체 시스템은 **Next.js**, **React**, **TypeScript**, **Python (Scikit-learn)** 등 전 세계적으로 널리 사용되는 강력한 오픈소스 라이브러리와 프레임워크 위에 구축되었습니다.

### 🚀 주요 기능

* **📍 위치 기반 날씨 조회:** 기상청 API와 연동하여 현재 사용자가 위치한 곳의 실시간 기온, 습도, 풍속 등 상세 날씨 정보를 제공합니다.
* **👕 규칙 기반(Rule-Based) 초기 추천:** 기상학적 데이터에 기반한 일반적인 온도별 옷차림 규칙을 적용하여 초기 추천 목록을 보여줍니다.
* **🧠 개인 맞춤형 보정 (ML 적용):** 사용자의 과거 피드백(따뜻함/추움/적당함) 데이터를 머신러닝 모델이 학습하여, 개인의 체감 온도를 반영한 **맞춤형 추천**을 제공합니다.
* **💬 피드백 시스템:** 추천 결과에 대한 사용자 만족도를 수집하여, 이를 다시 ML 모델의 학습 데이터로 활용하는 선순환 구조를 가집니다.
* **📈 시간대별 예보 시각화:** 시간 흐름에 따른 기온 변화와 추천 옷차림의 변화를 직관적으로 보여줍니다.

---

## 🛠️ 기술 스택 (Tech Stack)

| 구분 | 기술 | 역할 |
| :--- | :--- | :--- |
| **프론트엔드** | **Next.js (App Router), TypeScript** | 고성능 SSR/CSR, 타입 안전성 확보, 컴포넌트 기반 UI |
| **백엔드 (API)** | **Next.js API Routes** | 기상청 API 프록시 호출, 데이터 전처리, ML 서버 통신 |
| **머신러닝** | **Python (Flask/FastAPI), Scikit-learn** | 사용자 피드백 데이터 학습 및 개인화 예측 모델 서빙 |
| **데이터** | **기상청 단기/중기 예보 API** | 공공 날씨 데이터 수집 (Open API) |
| **상태 관리** | **Zustand** (또는 Context API) | 효율적인 전역 상태 관리 |

### 🖼️ 이미지 소스 및 저작권 (Asset & Copyright Status)

이 프로젝트에서 사용된 옷차림 예시 이미지는 저작권 보호를 받는 자료입니다.

* **소스:** **무신사(MUSINSA) 웹사이트**
* **목적:** 개인 포트폴리오 및 **교육/비영리 목적**으로만 사용되었으며, 상업적 이용을 엄격히 금지합니다.
* **저작권:** 모든 이미지의 저작권은 무신사 및 해당 브랜드에 귀속됩니다.

---

## 🏃 프로젝트 실행 방법 (Getting Started)

### 1. 환경 설정

1.  **레포지토리 클론:**
    ```bash
    git clone [프로젝트_레포지토리_URL]
    cd weather-fit
    ```

2.  **의존성 설치 (Frontend):**
    ```bash
    # Next.js/TypeScript 환경
    npm install 
    # 또는
    yarn install
    ```

3.  **Python 환경 설정 (ML Server):**
    별도의 Python 가상환경을 권장합니다.
    ```bash
    cd ml-server
    # 가상환경 생성 및 실행 (선택 사항)
    python -m venv venv
    source venv/bin/activate  # Mac/Linux
    # venv\Scripts\activate  # Windows

    # 라이브러리 설치
    pip install -r requirements.txt
    ```

4.  **환경 변수 설정 (.env):**
    프로젝트 루트 경로에 `.env.local` 파일을 생성하고, 다음 정보를 입력합니다.
    ```env
    # 기상청 공공 데이터 포털에서 발급받은 API 키 (Decoding Key 권장)
    KMA_API_KEY="your_kma_api_key_here"

    # 로컬 ML 서버 주소
    ML_SERVER_URL="[http://127.0.0.1:5000](http://127.0.0.1:5000)"
    ```

### 2. 프로젝트 구동

1.  **Python ML 서버 구동 (터미널 1):**
    ```bash
    cd ml-server
    python app.py
    ```

2.  **Next.js 웹 서버 구동 (터미널 2):**
    ```bash
    npm run dev
    # 또는
    yarn dev
    ```

웹 브라우저에서 `http://localhost:3000`으로 접속하여 서비스를 확인합니다.

---

## 💡 기여 방법 (Contributing)

이 프로젝트는 오픈소스 생태계에 기여하고자 하는 모든 분들을 환영합니다.

1.  이 레포지토리를 **Fork** 합니다.
2.  새로운 Feature 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`).
3.  변경 사항을 커밋합니다 (`git commit -m 'Add some amazing feature'`).
4.  브랜치에 푸시합니다 (`git push origin feature/amazing-feature`).
5.  **Pull Request**를 생성하여 리뷰를 요청합니다.

---

## 📜 라이선스 (License)

이 프로젝트는 **MIT License**를 따릅니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.
