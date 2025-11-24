'use client'; 

import { WeatherApiResponse } from '@/types/weather';
import { NextPage } from 'next';
import styles from './page.module.css';
import { useState, useEffect } from 'react';

// 타입 안전성을 위해 추천 아이템의 구조를 명시 (임시 정의)
interface RecommendationItem {
    name: string;
    img: string;
}

// 피드백 전송 함수
async function sendFeedback(data: { userId: string, temp: number, offset: number, feedback: 'hot' | 'cold' | 'just_right' }) {
    try {
        const response = await fetch('/api/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        
        if (!response.ok) {
            console.error('Feedback API failed:', response.status);
            alert('피드백 전송에 실패했습니다.');
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
    const [feedbackSent, setFeedbackSent] = useState(false); 

    // 사용자 ID 관리
    useEffect(() => {
        let currentUserId = localStorage.getItem('weatherFitUserId');
        if (!currentUserId) {
            currentUserId = 'user_' + Math.random().toString(36).substring(2, 9);
            localStorage.setItem('weatherFitUserId', currentUserId);
        }
        setUserId(currentUserId);
    }, []);

    // 날씨 데이터 가져오기
    useEffect(() => {
        async function fetchWeather() {
            if (!userId) return; 

            const response = await fetch(`/api/weather?userId=${userId}`, { cache: 'no-store' });
            if (response.ok) {
                const data: WeatherApiResponse = await response.json();
                setWeatherData(data);
            }
            setIsLoading(false);
        }

        fetchWeather();
    }, [userId, feedbackSent]);

    // 피드백 버튼 핸들러
    const handleFeedback = async (feedback: 'hot' | 'cold' | 'just_right') => {
        if (!weatherData || feedbackSent) return;

        const success = await sendFeedback({
            userId: userId,
            temp: weatherData.currentTemperature,
            offset: weatherData.offset,
            feedback: feedback,
        });

        if (success) {
            setFeedbackSent(true); 
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
        return (
            <div className={styles.container} style={{ textAlign: 'center', backgroundColor: '#fff0f0' }}>
                <h1 style={{ color: '#d9534f' }}>❌ API 연결 오류</h1>
                <p>백엔드 서버 또는 기상청/ML 서버 연동을 확인해 주세요.</p>
            </div>
        );
    }

    // 스타일 적용
    const offsetStyle = weatherData.offset < 0 ? 
        { color: '#3498db', fontWeight: 'bold' } : 
        weatherData.offset > 0 ?
        { color: '#e67e22', fontWeight: 'bold' } : 
        {};

    return (
        <div className={styles.container}> 
            <h1 className={styles.header}>WeatherFit 개인화 추천 결과</h1>
            
            <h2 className={styles.sectionTitle}>☀️ 오늘 날씨 정보</h2>
            <p><strong>지역:</strong> {weatherData.region}</p>
            <p>
                <strong>실제 기온:</strong> 
                <span className={styles.temperature} style={{ color: '#555', textDecoration: 'line-through', marginLeft: '5px' }}>
                    {weatherData.currentTemperature.toFixed(1)}°C
                </span>
            </p>
            <p>
                <strong>🤖 맞춤 적용 기온:</strong> 
                <span className={styles.temperature} style={{ marginLeft: '5px' }}>
                    {weatherData.adjustedTemperature.toFixed(1)}°C
                </span>
            </p>
            <p style={offsetStyle}>
                (ML 보정 값: {weatherData.offset.toFixed(1)}°C)
            </p>

            <h2 className={styles.sectionTitle}>🧥 추천 옷차림 (맞춤형)</h2>
            
            {/* 이미지 크기 살짝 확대: 80px -> 100px, li 너비 조정 */}
            <ul className={styles.recommendationList} style={{ listStyle: 'none', padding: 0, display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {weatherData.recommendation.map((item: any, index: number) => (
                    <li key={index} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '120px' }}>
                        {/* 이미지 렌더링 (크기 증가) */}
                        <div style={{ width: '100px', height: '100px', marginBottom: '8px', overflow: 'hidden', borderRadius: '10px', backgroundColor: '#f0f0f0' }}>
                            <img 
                                src={item.img} 
                                alt={item.name} 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{item.name}</span>
                    </li>
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