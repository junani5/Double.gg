export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

// 1. (생략) CLOTHING_RULES 는 그대로 유지
const CLOTHING_RULES = [
    // ... (CLOTHING_RULES 내용 그대로 유지) ...
    { min: 28, max: 100, recommendations: [
        { name: "민소매", img: "/images/clothing/tank_top.webp" },
        { name: "반팔", img: "/images/clothing/tshirt.webp" },
        { name: "반바지", img: "/images/clothing/shorts.webp" },
    ]},
    { min: 23, max: 28, recommendations: [
        { name: "반팔", img: "/images/clothing/tshirt.webp" },
        { name: "얇은 셔츠", img: "/images/clothing/shirt_light.webp" },
        { name: "면바지", img: "/images/clothing/cotton_pants.webp" },
    ]},
    { min: 20, max: 23, recommendations: [
        { name: "블라우스", img: "/images/clothing/blouse.webp" },
        { name: "긴팔 티", img: "/images/clothing/longsleeve.webp" },
        { name: "슬랙스", img: "/images/clothing/slacks.webp" },
    ]},
    { min: 17, max: 20, recommendations: [
        { name: "바람막이", img: "/images/clothing/windbreaker.webp" },
        { name: "맨투맨", img: "/images/clothing/sweatshirt.webp" },
        { name: "후드", img: "/images/clothing/hoodie.webp" },
    ]},
    { min: 12, max: 17, recommendations: [
        { name: "야구점퍼", img: "/images/clothing/baseball_jumper.webp" },
        { name: "가디건", img: "/images/clothing/cardigan.webp" },
        { name: "니트", img: "/images/clothing/knit.webp" },
    ]},
    { min: 9, max: 12, recommendations: [
        { name: "트렌치 코트", img: "/images/clothing/trench.webp" },
        { name: "야상", img: "/images/clothing/field_jacket.webp" },
        { name: "점퍼", img: "/images/clothing/jumper.webp" },
    ]},
    { min: 5, max: 9, recommendations: [
        { name: "울 코트", img: "/images/clothing/wool_coat.webp" },
        { name: "히트텍", img: "/images/clothing/heattech.webp" },
        { name: "가죽 옷", img: "/images/clothing/leather.webp" },
    ]},
    { min: -100, max: 5, recommendations: [
        { name: "패딩", img: "/images/clothing/padding.webp" },
        { name: "두꺼운 코트", img: "/images/clothing/thick_coat.webp" },
        { name: "목도리", img: "/images/clothing/scarf.webp" },
    ]}
];

// 2. (생략) 격자 좌표는 그대로 유지
const SEOUL_GRID_X = 60;
const SEOUL_GRID_Y = 127;

// 3. (생략) getKMAWeatherData 함수는 그대로 유지
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


// 4. ML 서버에서 온도 보정 값(Offset) 가져오기
async function getMLOffset(userId: string, currentTemp: number): Promise<number> {
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
            return 0; 
        }

        const data = await response.json();
        return parseFloat(data.temperatureOffset || 0);

    } catch (error) {
        console.error("ML 서버 연결 실패:", error);
        return 0; 
    }
}

// 5. 옷차림 추천 함수 (규칙 기반)는 그대로 유지
function recommendClothing(temp: number) {
    const rule = CLOTHING_RULES.find(rule => temp >= rule.min && temp <= rule.max);
    return rule ? rule.recommendations : [{ name: "온도 범위를 벗어났습니다.", img: "/images/clothing/placeholder.png" }];
}

// ----------------------------------------------------
// 6. ✨ 수정된 Next.js GET 요청 핸들러 (userId를 쿼리에서 가져옴)
// ----------------------------------------------------
export async function GET(request: Request) {
    try {
        // ✨ 쿼리 파라미터에서 userId 가져오기
        const url = new URL(request.url);
        const userId = url.searchParams.get('userId');

        // userId가 없으면 처리 불가
        if (!userId) {
             return NextResponse.json({ error: "userId query parameter is missing." }, { status: 400 });
        }

        // 1. 기상청에서 실제 날씨 데이터 가져오기
        const weatherData = await getKMAWeatherData();
        const currentTemp = weatherData.temperature;

        if (currentTemp === null) {
            return NextResponse.json({ error: "날씨 데이터를 가져올 수 없습니다." }, { status: 500 });
        }
        
        // 2. ✨ ML 서버에서 개인 맞춤 온도 보정 값 가져오기 (사용자 ID 사용)
        const offset = await getMLOffset(userId, currentTemp);
        
        // 3. 보정된 최종 온도 계산
        const adjustedTemp = currentTemp + offset;

        // 4. 보정된 온도를 사용하여 옷차림 추천
        const recommendedClothes = recommendClothing(adjustedTemp); 

        // 5. 프론트엔드로 모든 정보 반환
        return NextResponse.json({
            region: "서울특별시", // 예시로 서울 고정
            currentTemperature: currentTemp, 
            adjustedTemperature: adjustedTemp, 
            offset: offset, // 보정 값
            weatherStatus: weatherData.weatherStatus,
            recommendation: recommendedClothes,
        });

    } catch (error) {
        console.error("API Processing Error:", error);
        return NextResponse.json({ error: "내부 서버 오류 발생" }, { status: 500 });
    }
}