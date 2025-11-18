// src/app/api/weather/route.ts

import { NextResponse } from 'next/server';

// 1. (생략) CLOTHING_RULES 는 그대로 유지
// ... (이전 코드) ...
const CLOTHING_RULES = [
    { min: 28, max: 100, recommendations: ["민소매", "반팔", "반바지"] },
    { min: 23, max: 27, recommendations: ["반팔", "얇은 셔츠", "면바지"] },
    { min: 20, max: 22, recommendations: ["블라우스", "긴팔 티", "슬랙스"] },
    { min: 17, max: 19, recommendations: ["얇은 가디건", "맨투맨", "후드"] },
    { min: 12, max: 16, recommendations: ["자켓", "가디건", "청자켓", "니트"] },
    { min: 9, max: 11, recommendations: ["트렌치 코트", "야상", "점퍼"] },
    { min: 5, max: 8, recommendations: ["울 코트", "히트텍", "가죽 옷"] },
    { min: -100, max: 4, recommendations: ["패딩", "두꺼운 코트", "목도리"] }
];

// 2. (생략) 격자 좌표는 그대로 유지
// ... (이전 코드) ...
const SEOUL_GRID_X = 60;
const SEOUL_GRID_Y = 127;

// 3. (생략) getKMAWeatherData 함수는 그대로 유지
// ... (이전 코드) ...
async function getKMAWeatherData() {
    const apiKey = process.env.KMA_API_KEY;
    // ... (함수 내용) ...
    // base_time을 유동적으로 설정 (예: 현재 시간 기준 가장 가까운 시간)
    // 간단한 테스트를 위해 '1100' 또는 '1400' 등 유효한 시간 사용
    const base_date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const base_time = '1100'; // 이 부분은 실제 서비스 시 동적으로 계산해야 합니다.

    const url = `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?serviceKey=${apiKey}&pageNo=1&numOfRows=100&dataType=JSON&base_date=${base_date}&base_time=${base_time}&nx=${SEOUL_GRID_X}&ny=${SEOUL_GRID_Y}`;

    const response = await fetch(url, { cache: 'no-store' });
    const data = await response.json();
    
    const items = data.response?.body?.items?.item || [];
    const tempItem = items.find((item: any) => item.category === 'TMP'); 
    
    if (!tempItem) {
        console.error("Failed to find temperature data in KMA response:", data.response?.header || data);
        return { temperature: null, weatherStatus: "데이터 오류" };
    }

    return {
        temperature: parseFloat(tempItem.fcstValue),
        weatherStatus: "맑음 (예시)",
    };
}


// ----------------------------------------------------
// 4. ✨ 새로 추가: ML 서버에서 온도 보정 값(Offset) 가져오기
// ----------------------------------------------------
async function getMLOffset(userId: string, currentTemp: number): Promise<number> {
    // .env.local 파일에서 ML 서버 주소 읽기
    const mlServerUrl = process.env.ML_SERVER_URL;
    if (!mlServerUrl) {
        console.warn("ML_SERVER_URL is not set. Returning 0 offset.");
        return 0;
    }
    
    const endpoint = `${mlServerUrl}/predict_offset`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: userId,
                currentTemp: currentTemp,
            }),
            cache: 'no-store', // 매번 새로운 예측을 받도록 캐시 사용 안 함
        });

        if (!response.ok) {
            console.error(`ML Server Error: ${response.status} ${response.statusText}`);
            // ML 서버 오류 시 보정 값 0 반환
            return 0; 
        }

        const data = await response.json();
        // 예측된 온도 보정 값 (예: -2.0, 1.5)
        return parseFloat(data.temperatureOffset || 0);

    } catch (error) {
        console.error("ML 서버 연결 실패:", error);
        // 연결 오류 시 보정 값 0 반환
        return 0; 
    }
}

// 5. 옷차림 추천 함수 (규칙 기반)는 그대로 유지
// ... (이전 코드) ...
function recommendClothing(temp: number) {
    const rule = CLOTHING_RULES.find(rule => temp >= rule.min && temp <= rule.max);
    return rule ? rule.recommendations : ["온도 범위를 벗어났습니다."];
}

// ----------------------------------------------------
// 6. ✨ 수정된 Next.js GET 요청 핸들러
// ----------------------------------------------------
export async function GET(request: Request) {
    try {
        // [임시] 사용자 ID 하드코딩 (ML 서버 테스트용)
        // 'cold_sensitive_user' 또는 'hot_sensitive_user'로 변경하며 테스트
        const userId = 'cold_sensitive_user'; 

        // 1. 기상청에서 실제 날씨 데이터 가져오기
        const weatherData = await getKMAWeatherData();
        const currentTemp = weatherData.temperature;

        if (currentTemp === null) {
             return NextResponse.json({ error: "날씨 데이터를 가져올 수 없습니다." }, { status: 500 });
        }
        
        // 2. ✨ ML 서버에서 개인 맞춤 온도 보정 값 가져오기
        const offset = await getMLOffset(userId, currentTemp);
        
        // 3. ✨ 보정된 최종 온도 계산
        const adjustedTemp = currentTemp + offset;

        // 4. 보정된 온도를 사용하여 옷차림 추천
        const recommendedClothes = recommendClothing(adjustedTemp); 

        // 5. 프론트엔드로 모든 정보 반환
        return NextResponse.json({
            region: "서울 (예시)",
            currentTemperature: currentTemp,       // 실제 기온
            adjustedTemperature: adjustedTemp,     // ML 보정 기온
            offset: offset,                        // 보정 값
            weatherStatus: weatherData.weatherStatus,
            recommendation: recommendedClothes,
        });

    } catch (error) {
        console.error("API Processing Error:", error);
        return NextResponse.json({ error: "내부 서버 오류 발생" }, { status: 500 });
    }
}