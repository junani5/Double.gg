// src/types/weather.ts

export interface WeatherApiResponse {
    region: string;
    currentTemperature: number;
    weatherStatus: string;
    recommendation: string[]; // 옷차림 목록
}