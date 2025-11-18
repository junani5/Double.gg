// src/app/page.tsx

// ✨ 수정된 타입 임포트
import { WeatherApiResponse } from '../types/weather'; 
import { NextPage } from 'next';
import styles from './page.module.css'; // CSS 모듈 임포트

// 1. API 호출 함수 (서버 컴포넌트)
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
            <div className={styles.container} style={{ textAlign: 'center', backgroundColor: '#fff0f0' }}>
                <h1 style={{ color: '#d9534f' }}>❌ API 연결 오류</h1>
                <p>백엔드 서버 또는 기상청/ML 서버 연동을 확인해 주세요.</p>
                <p>두 개의 터미널(Next.js, Flask)이 모두 실행 중인지 확인하세요.</p>
            </div>
        );
    }

    // ✨ ML 보정 값에 따라 스타일 변경
    const offsetStyle = weatherData.offset < 0 ? 
        { color: '#3498db', fontWeight: 'bold' } : // 추위 타는 분 (파란색)
        weatherData.offset > 0 ?
        { color: '#e67e22', fontWeight: 'bold' } : // 더위 타는 분 (주황색)
        {}; // 기본

    return (
        <div className={styles.container}> 
            <h1 className={styles.header}>WeatherFit 개인화 추천 결과</h1>
            
            <h2 className={styles.sectionTitle}>📍 지역 및 현재 날씨</h2>
            <p><strong>지역:</strong> {weatherData.region}</p>
            <p>
                <strong>현재 기온:</strong> 
                <span className={styles.temperature} style={{ color: '#555', textDecoration: 'line-through' }}>
                    {weatherData.currentTemperature.toFixed(1)}°C
                </span>
            </p>
            <p>
                <strong>🤖 개인 맞춤 기온:</strong> 
                <span className={styles.temperature}>
                    {weatherData.adjustedTemperature.toFixed(1)}°C
                </span>
            </p>
            <p style={offsetStyle}>
                (보정 값: {weatherData.offset.toFixed(1)}°C)
            </p>
            <p><strong>날씨 상태:</strong> {weatherData.weatherStatus}</p>

            <h2 className={styles.sectionTitle}>🧥 추천 옷차림 (맞춤형)</h2>
            {weatherData.recommendation.length > 0 ? (
                <ul className={styles.recommendationList}>
                    {weatherData.recommendation.map((item, index) => (
                        <li key={index}>{item}</li>
                    ))}
                </ul>
            ) : (
                <p>추천된 옷차림이 없습니다. 규칙 정의를 확인해주세요.</p>
            )}
        </div>
    );
};

export default HomePage;