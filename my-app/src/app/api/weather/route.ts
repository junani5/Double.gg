// src/app/api/weather/route.ts

import { NextResponse } from 'next/server';

// 1. (필수) 온도별 옷차림 규칙 데이터
// ------------------------------------
// 실제로는 clothingRules.json 등의 외부 파일에서 가져와야 하지만, 예시를 위해 여기에 정의합니다.
// 이 데이터는 앞에서 정의하신 이미지 기반입니다.
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

// 2. (필수) 기상청 API는 위경도가 아닌 격자 좌표(x, y)를 사용합니다.
//    실제 구현에서는 복잡한 변환 함수가 필요하지만, 예시를 위해 서울(강남역 주변)의 좌표를 사용합니다.
const SEOUL_GRID_X = 60;
const SEOUL_GRID_Y = 127;

// 3. 기상청 API 호출 및 데이터 처리 함수
async function getKMAWeatherData() {
    const apiKey = process.env.KMA_API_KEY;
    if (!apiKey) {
        throw new Error("KMA_API_KEY is not set in environment variables.");
    }

    // API 요청 시간 및 날짜 설정 (가장 최근의 단기 예보를 가져오기 위한 처리)
    const now = new Date();
    const base_date = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    // 단기 예보 base_time (예: 0500, 0800 등 3시간 간격) 중 가장 가까운 시간
    const base_time = '1100'; 

    const url = `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?serviceKey=${apiKey}&pageNo=1&numOfRows=100&dataType=JSON&base_date=${base_date}&base_time=${base_time}&nx=${SEOUL_GRID_X}&ny=${SEOUL_GRID_Y}`;

    const response = await fetch(url, { cache: 'no-store' }); // 매번 최신 데이터를 가져오도록 설정
    const data = await response.json();
    
    // API 응답에서 기온(T1H: 1시간 기온) 항목만 추출
    const items = data.response?.body?.items?.item || [];
    const tempItem = items.find((item: any) => item.category === 'TMP'); 
    
    // 기온을 찾지 못했거나 데이터가 없는 경우 처리
    if (!tempItem) {
        console.error("Failed to find temperature data in KMA response:", data);
        return { temperature: null, weatherStatus: "데이터 오류" };
    }

    return {
        temperature: parseFloat(tempItem.fcstValue), // 현재 기온
        weatherStatus: "맑음 (예시)", // 실제로는 API에서 SKY(하늘 상태) 등을 분석해야 함
    };
}

// 4. 옷차림 추천 함수 (규칙 기반)
function recommendClothing(temp: number) {
    const rule = CLOTHING_RULES.find(rule => temp >= rule.min && temp <= rule.max);
    
    return rule ? rule.recommendations : ["온도 범위를 벗어났습니다."];
}


// 5. Next.js GET 요청 핸들러
export async function GET(request: Request) {
    try {
        // 실제로는 request.url.searchParams를 통해 사용자의 요청 지역 정보를 받습니다.
        
        // 1. 날씨 데이터 가져오기
        const weatherData = await getKMAWeatherData();
        const currentTemp = weatherData.temperature;

        if (currentTemp === null) {
             return NextResponse.json({ error: "날씨 데이터를 가져올 수 없습니다." }, { status: 500 });
        }

        // 2. (ML 단계에서 추가될 부분): ML 서버에서 온도 보정 값 가져오기
        //    const userId = request.headers.get('X-User-ID') || 'anonymous';
        //    const offset = await getMLOffset(userId, currentTemp);
        //    const adjustedTemp = currentTemp + offset;
        //    const finalTempToUse = adjustedTemp;

        // 3. (초기 단계) 규칙 기반 추천 실행
        const recommendedClothes = recommendClothing(currentTemp);

        return NextResponse.json({
            region: "서울 (예시)",
            currentTemperature: currentTemp,
            weatherStatus: weatherData.weatherStatus,
            recommendation: recommendedClothes,
            // adjustedTemperature: finalTempToUse // ML 적용 시
        });

    } catch (error) {
        console.error("API Processing Error:", error);
        return NextResponse.json({ error: "내부 서버 오류 발생" }, { status: 500 });
    }
}