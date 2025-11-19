// src/app/page.tsx
'use client'; // ✨ 클라이언트 컴포넌트로 전환

import { WeatherApiResponse } from '@/types/weather';
import { NextPage } from 'next';
import styles from './page.module.css';
import { useState, useEffect } from 'react'; // ✨ React Hooks 임포트

// 1. (getWeatherData 함수는 그대로 유지하되, 클라이언트 컴포넌트 내에서는 useEffect 내부에서 호출)

// 2. 피드백 전송 API (서버 액션 대신 클라이언트 fetch 사용)
async function sendFeedback(data: { userId: string, temp: number, offset: number, feedback: 'hot' | 'cold' | 'just_right' }) {
    try {
        const response = await fetch('/api/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            console.error('Feedback API failed:', response.status);
            alert('피드백 전송에 실패했습니다.'); // 사용자에게 메시지 표시
            return false;
        }

        alert('피드백이 성공적으로 반영되었습니다! 다음 추천에 적용됩니다.');
        return true;
    } catch (error) {
        console.error("피드백 전송 중 오류:", error);
        alert('피드백 전송 중 오류가 발생했습니다.');
        return false;
    }
}


const HomePage: NextPage = () => {
    // 상태 관리
    const [weatherData, setWeatherData] = useState<WeatherApiResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [userId, setUserId] = useState('');
    const [feedbackSent, setFeedbackSent] = useState(false); // 피드백 전송 상태

    // 💡 임시 사용자 ID 관리 (localStorage 사용)
    useEffect(() => {
        let currentUserId = localStorage.getItem('weatherFitUserId');
        if (!currentUserId) {
            currentUserId = 'user_' + Math.random().toString(36).substring(2, 9);
            localStorage.setItem('weatherFitUserId', currentUserId);
        }
        setUserId(currentUserId);
    }, []);

    // 💡 날씨 데이터 가져오기 (클라이언트에서 fetch 호출)
    useEffect(() => {
        // 서버 컴포넌트 함수를 클라이언트에서 재정의
        async function fetchWeather() {
            if (!userId) return; // ID가 있어야만 실행

            const response = await fetch(`/api/weather?userId=${userId}`, { cache: 'no-store' });
            if (response.ok) {
                const data: WeatherApiResponse = await response.json();
                setWeatherData(data);
            }
            setIsLoading(false);
        }

        fetchWeather();
    }, [userId, feedbackSent]); // userId 또는 피드백 전송 후 재요청

    // 💡 피드백 버튼 핸들러
    const handleFeedback = async (feedback: 'hot' | 'cold' | 'just_right') => {
        if (!weatherData || feedbackSent) return;

        const success = await sendFeedback({
            userId: userId,
            temp: weatherData.currentTemperature,
            offset: weatherData.offset,
            feedback: feedback,
        });

        if (success) {
            setFeedbackSent(true); // 버튼 비활성화
        }
    };

    if (isLoading || !userId) {
        return (
            <div className={styles.container} style={{ textAlign: 'center' }}>
                <h1 className={styles.header}>로딩 중...</h1>
                <p>날씨 데이터를 가져오고 있습니다.</p>
            </div>
        );
    }

    if (!weatherData) {
        // ... (오류 처리 부분은 그대로 유지)
        return (
            <div className={styles.container} style={{ textAlign: 'center', backgroundColor: '#fff0f0' }}>
                <h1 style={{ color: '#d9534f' }}>❌ API 연결 오류</h1>
                <p>백엔드 서버 또는 기상청/ML 서버 연동을 확인해 주세요.</p>
            </div>
        );
    }

    // ✨ 스타일 적용 및 UI 렌더링
    const offsetStyle = weatherData.offset < 0 ? 
        { color: '#3498db', fontWeight: 'bold' } : 
        weatherData.offset > 0 ?
        { color: '#e67e22', fontWeight: 'bold' } : 
        {};

    return (
        <div className={styles.container}> 
            <h1 className={styles.header}>WeatherFit 개인화 추천 결과</h1>
            
            <h2 className={styles.sectionTitle}>📍 내 정보</h2>
            <p style={{ fontSize: '10px', color: '#888' }}>
                **내 ID (ML 학습 키):** {userId}
            </p>

            <h2 className={styles.sectionTitle}>☀️ 오늘 날씨 정보</h2>
            {/* ... (날씨 정보 표시 부분은 그대로 유지) ... */}
            <p><strong>지역:</strong> {weatherData.region}</p>
            <p>
                <strong>실제 기온:</strong> 
                <span className={styles.temperature} style={{ color: '#555', textDecoration: 'line-through' }}>
                    {weatherData.currentTemperature.toFixed(1)}°C
                </span>
            </p>
            <p>
                <strong>🤖 맞춤 적용 기온:</strong> 
                <span className={styles.temperature}>
                    {weatherData.adjustedTemperature.toFixed(1)}°C
                </span>
            </p>
            <p style={offsetStyle}>
                (ML 보정 값: {weatherData.offset.toFixed(1)}°C)
            </p>
            <p><strong>날씨 상태:</strong> {weatherData.weatherStatus}</p>

            <h2 className={styles.sectionTitle}>🧥 추천 옷차림 (맞춤형)</h2>
            <ul className={styles.recommendationList}>
                {weatherData.recommendation.map((item, index) => (
                    <li key={index}>{item}</li>
                ))}
            </ul>

            <h2 className={styles.sectionTitle}>💬 오늘 옷차림은 어땠나요?</h2>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '15px' }}>
                <button 
                    onClick={() => handleFeedback('hot')} 
                    disabled={feedbackSent}
                    className={styles.feedbackButton} 
                    style={{ backgroundColor: '#f39c12' }}
                >
                    🔥 더웠어요
                </button>
                <button 
                    onClick={() => handleFeedback('just_right')} 
                    disabled={feedbackSent}
                    className={styles.feedbackButton}
                    style={{ backgroundColor: '#2ecc71' }}
                >
                    👍 딱 좋았어요
                </button>
                <button 
                    onClick={() => handleFeedback('cold')} 
                    disabled={feedbackSent}
                    className={styles.feedbackButton}
                    style={{ backgroundColor: '#3498db' }}
                >
                    🥶 추웠어요
                </button>
            </div>
            {feedbackSent && <p style={{ textAlign: 'center', color: '#2ecc71', marginTop: '10px' }}>오늘 피드백 완료. 감사합니다!</p>}
        </div>
    );
};

export default HomePage;