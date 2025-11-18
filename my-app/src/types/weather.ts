// src/types/weather.ts

export interface WeatherApiResponse {
    region: string;
    currentTemperature: number;     // 실제 기온
    adjustedTemperature: number;    // ✨ ML 보정 기온
    offset: number;                 // ✨ 보정 값
    weatherStatus: string;
    recommendation: string[];
}