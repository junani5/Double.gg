// src/types/weather.ts

// ----------------------------------------------------
// 1. 추천 아이템 타입 (이미지 경로 포함)
// ----------------------------------------------------
export interface RecommendedItem {
    name: string;
    imagePath: string;
}

// ----------------------------------------------------
// 2. Next.js API가 프론트엔드로 반환하는 최종 응답 타입
// ----------------------------------------------------
export interface WeatherApiResponse {
    region: string;
    currentTemperature: number;     // 실제 기온
    adjustedTemperature: number;    // ML 보정 기온
    offset: number;                 // 보정 값
    weatherStatus: string;
    recommendation: RecommendedItem[];
}

// ----------------------------------------------------
// 3. 피드백 POST 요청 데이터 타입
// ----------------------------------------------------
export type FeedbackType = 'hot' | 'cold' | 'just_right';

export interface FeedbackRequest {
    userId: string;
    temp: number;
    offset: number;
    feedback: FeedbackType;
}

// ----------------------------------------------------
// 4. ML 서버 예측 요청 데이터 타입
// ----------------------------------------------------
export interface MLPredictRequest {
    userId: string;
    currentTemp: number;
}

// ----------------------------------------------------
// 5. ML 서버 예측 응답 데이터 타입
// ----------------------------------------------------
export interface MLPredictResponse {
    userId: string;
    temperatureOffset: number;
}