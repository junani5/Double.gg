'use client'; 

import { WeatherApiResponse } from '@/types/weather';
import { NextPage } from 'next';
import styles from './page.module.css';
import { useState, useEffect } from 'react';

// 타입 안전성을 위해 추천 아이템의 구조를 명시
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

    // 로딩 화면 (새로운 디자인 배경색 유지)
    if (isLoading || !userId) {
        return (
            <div className={styles.container} style={{ justifyContent: 'center', height: '100vh' }}>
                <h1 style={{ color: '#fff', fontSize: '30px' }}>로딩 중...</h1>
                <p style={{ color: '#fff' }}>날씨 데이터를 가져오고 있습니다.</p>
            </div>
        );
    }

    // 에러 화면
    if (!weatherData) {
        return (
            <div className={styles.container} style={{ justifyContent: 'center', height: '100vh', background: '#e74c3c' }}>
                <h1 style={{ color: '#fff' }}>❌ API 연결 오류</h1>
                <p style={{ color: '#fff' }}>백엔드 서버 또는 기상청/ML 서버 연동을 확인해 주세요.</p>
            </div>
        );
    }

    // ML 보정값 색상 스타일 (기존 로직 유지)
    const offsetColor = weatherData.offset < 0 ? '#3498db' : weatherData.offset > 0 ? '#e67e22' : '#000';

    return (
        <div className={styles.container}>
            
            {/* 1. 타이틀 섹션 */}
            <div className={styles.title}>
                <h1 className={styles['title-text']}>WeatherFit 개인화 추천 결과</h1>
                <div className={styles['title-line']}></div>
            </div>

            {/* 2. 컨텐츠 섹션 (날씨, 추천, 피드백을 감싸는 래퍼) */}
            <div className={styles.content}>
                
                {/* 2-1. 날씨 정보 섹션 (오늘 날씨 + 개인화 기온) */}
                <div className={styles['weather-section']}>
                    {/* 왼쪽: 오늘 날씨 */}
                    <div className={styles['weather-today']}>
                        <div className={styles['weather-today-top']}>오늘 날씨 정보</div>
                        <div className={styles['weather-today-bot']}>
                            지역: {weatherData.region}<br />
                            실제 기온: {weatherData.currentTemperature.toFixed(1)}°C
                        </div>
                    </div>

                    {/* 오른쪽: 개인화 기온 */}
                    <div className={styles['weather-personal']}>
                        <div className={styles['weather-personal-top']}>맞춤 적용 기온</div>
                        <div className={styles['weather-personal-top']}>
                            {weatherData.adjustedTemperature.toFixed(1)}°C<br />
                            <span style={{ fontSize: '24px', color: offsetColor }}>
                                (ML 보정: {weatherData.offset > 0 ? '+' : ''}{weatherData.offset.toFixed(1)}°C)
                            </span>
                        </div>
                    </div>
                </div>

                {/* 2-2. 옷차림 추천 섹션 */}
                <div className={styles['fit-section']}>
                    <div className={styles['fit-text']}>추천 옷차림 (맞춤형)</div>
                    
                    <div className={styles['fit-images']}>
                        {weatherData.recommendation.map((item: RecommendationItem, index: number) => (
                            <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '150px' }}>
                                <div style={{ 
                                    width: '120px', 
                                    height: '120px', 
                                    marginBottom: '15px', 
                                    overflow: 'hidden', 
                                    borderRadius: '20px', 
                                    backgroundColor: '#f0f0f0',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}>
                                    <img 
                                        src={item.img} 
                                        alt={item.name} 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                </div>
                                <span style={{ 
                                    color: '#000', 
                                    fontSize: '24px', 
                                    fontWeight: '500',
                                    fontFamily: 'Pretendard' 
                                }}>
                                    {item.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2-3. 피드백 섹션 */}
                <div className={styles['feedback-section']}>
                    <div className={styles['feedback-top']}>💬 오늘 옷차림은 어땠나요?</div>
                    
                    {!feedbackSent ? (
                        <div className={styles['feedback-bot']}>
                            {/* 더웠어요 버튼 */}
                            <button 
                                onClick={() => handleFeedback('hot')}
                                className={styles['feedback-hot']}
                                style={{ background: 'none', cursor: 'pointer' }} // 버튼 기본 스타일 초기화
                            >
                                <span className={styles['feedback-text']}>🔥 더웠어요</span>
                            </button>

                            {/* 딱 좋았어요 버튼 */}
                            <button 
                                onClick={() => handleFeedback('just_right')}
                                className={styles['feedback-good']}
                                style={{ background: 'none', cursor: 'pointer' }}
                            >
                                <span className={styles['feedback-text']}>👍 딱 좋았어요</span>
                            </button>

                            {/* 추웠어요 버튼 */}
                            <button 
                                onClick={() => handleFeedback('cold')}
                                className={styles['feedback-cold']}
                                style={{ background: 'none', cursor: 'pointer' }}
                            >
                                <span className={styles['feedback-text']}>🥶 추웠어요</span>
                            </button>
                        </div>
                    ) : (
                        <div className={styles['feedback-bot']}>
                            <p className={styles['feedback-text']} style={{ color: '#2ecc71', fontWeight: 'bold' }}>
                                소중한 피드백이 반영되었습니다. 감사합니다!
                            </p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default HomePage;