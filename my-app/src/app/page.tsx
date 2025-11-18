// src/app/page.tsx

import { WeatherApiResponse } from '@/types/weather';
import { NextPage } from 'next';
import styles from './page.module.css'; // 추가

// 1. API 호출 함수 (서버 컴포넌트에서 직접 호출)
async function getWeatherData(): Promise<WeatherApiResponse | null> {
    try {
        // 내부 API Route 경로 호출
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/weather`, {
            cache: 'no-store' // 최신 데이터 유지
        });

        if (!response.ok) {
            console.error(`API 호출 실패: ${response.status} ${response.statusText}`);
            return null;
        }

        const data: WeatherApiResponse = await response.json();
        return data;
    } catch (error) {
        console.error("데이터 패치 중 오류 발생:", error);
        return null;
    }
}

// 2. 메인 페이지 컴포넌트
const HomePage: NextPage = async () => {
    const weatherData = await getWeatherData();

    if (!weatherData) {
        return (
            <div className={styles.errorContainer}>
                <h1>❌ API 연결 오류</h1>
                <p>백엔드 서버 또는 기상청 API 연동을 확인해 주세요.</p>
            </div>
        );
    }

    return (
        <div className={styles.card}>
            <h1 className={styles.title}>WeatherFit 기본 테스트 결과</h1>
            <hr className={styles.hr} />

            <h2 className={styles.sectionTitle}>📍 지역 및 현재 날씨</h2>
            <p><strong>지역:</strong> <span className={styles.region}>{weatherData.region}</span></p>
            <p>
                <strong>현재 기온:</strong>{' '}
                <span className={styles.temperature}>{weatherData.currentTemperature}°C</span>
            </p>
            <p><strong>날씨 상태:</strong> {weatherData.weatherStatus}</p>

            <h2 className={styles.sectionTitle} style={{ marginTop: '30px' }}>🧥 옷차림 추천</h2>
            {weatherData.recommendation.length > 0 ? (
                <ul className={styles.recommendList}>
                    {weatherData.recommendation.map((item, index) => (
                        <li key={index} className={styles.recommendItem}>{item}</li>
                    ))}
                </ul>
            ) : (
                <p className={styles.empty}>추천된 옷차림이 없습니다. 규칙 정의를 확인해주세요.</p>
            )}

            <hr className={styles.hr} />
            <p className={styles.note}>* 이 페이지는 `route.ts`의 기본 기능 테스트용입니다. 디자인은 적용되지 않았습니다.</p>
        </div>
    );
};

export default HomePage;