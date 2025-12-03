// src/app/page.tsx
'use client'; 

import { WeatherApiResponse, FeedbackRequest, FeedbackType } from '@/types/weather';
import { NextPage } from 'next';
import styles from './page.module.css';
import { useState, useEffect } from 'react';

// 로컬 안전 타입 (API에서 img 또는 imagePath 둘 다 올 수 있으니 처리)
interface RecommendationItemSafe {
    name: string;
    img: string;
}

// 피드백 전송 함수
async function sendFeedback(data: FeedbackRequest) {
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

        return true;
    } catch (error) {
        console.error("피드백 전송 중 오류:", error);
        alert('피드백 전송 중 오류가 발생했습니다.');
        return false;
    }
}

const HomePage: NextPage = () => {
    const [weatherData, setWeatherData] = useState<WeatherApiResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [userId, setUserId] = useState('');
    const [feedbackSent, setFeedbackSent] = useState(false); 

    useEffect(() => {
        let currentUserId = localStorage.getItem('weatherFitUserId');
        if (!currentUserId) {
            currentUserId = 'user_' + Math.random().toString(36).substring(2, 9);
            localStorage.setItem('weatherFitUserId', currentUserId);
        }
        setUserId(currentUserId);
    }, []);

    useEffect(() => {
        async function fetchWeather() {
            if (!userId) return; 

            const response = await fetch(`/api/weather?userId=${userId}`, { cache: 'no-store' });
            if (response.ok) {
                const data: WeatherApiResponse = await response.json();
                setWeatherData(data);
            } else {
                setWeatherData(null);
            }
            setIsLoading(false);
        }

        fetchWeather();
    }, [userId, feedbackSent]);

    const handleFeedback = async (feedback: FeedbackType) => {
        if (!weatherData || feedbackSent) return;

        const success = await sendFeedback({
            userId: userId,
            temp: weatherData.currentTemperature,
            offset: weatherData.offset,
            feedback: feedback,
        });

        if (success) {
            setFeedbackSent(true); 
            setTimeout(() => setFeedbackSent(false), 1000);
        }
    };

    if (isLoading || !userId) {
        return (
            <div className={styles.container} style={{ justifyContent: 'center', height: '100vh' }}>
                <h1 style={{ color: '#fff', fontSize: '30px' }}>로딩 중...</h1>
                <p style={{ color: '#fff' }}>날씨 데이터를 가져오고 있습니다.</p>
            </div>
        );
    }

    if (!weatherData) {
        return (
            <div className={styles.container} style={{ justifyContent: 'center', height: '100vh', background: '#e74c3c' }}>
                <h1 style={{ color: '#fff' }}>❌ API 연결 오류</h1>
                <p style={{ color: '#fff' }}>백엔드 서버 또는 기상청/ML 서버 연동을 확인해 주세요.</p>
            </div>
        );
    }

    const offsetColor = weatherData.offset < 0 ? '#3498db' : weatherData.offset > 0 ? '#e67e22' : '#000';

    // 안전하게 recommendation 항목 정리 (API가 name+img 또는 name+imagePath 등 다양한 스키마를 줄 수 있음)
    const recommendations: RecommendationItemSafe[] = (() => {
        const raw = (weatherData as any).recommendation;
        if (!raw) return [];
        if (Array.isArray(raw)) {
            return raw.map((it: any) => {
                if (!it) return { name: '추천 없음', img: '/images/clothing/placeholder.png' };
                const name = it.name ?? it.label ?? '이름 없음';
                const img = it.img ?? it.imagePath ?? it.image ?? '/images/clothing/placeholder.png';
                // public 폴더 기준 경로 보정(앞에 슬래시 없을 경우 추가)
                const normalizedImg = img.startsWith('/') ? img : '/' + img;
                return { name, img: normalizedImg };
            });
        }
        // 단일 객체 또는 문자열
        if (typeof raw === 'string') return [{ name: raw, img: '/images/clothing/placeholder.png' }];
        if (typeof raw === 'object') {
            const name = raw.name ?? raw.label ?? '이름 없음';
            const img = raw.img ?? raw.imagePath ?? raw.image ?? '/images/clothing/placeholder.png';
            return [{ name, img: img.startsWith('/') ? img : '/' + img }];
        }
        return [];
    })();

    return (
        <div className={styles.container}>
            <div className={styles.title}>
                <h1 className={styles['title-text']}>WeatherFit</h1>
                <div className={styles['title-line']}></div>
            </div>

            <div className={styles.content}>
                <div className={styles['spacer']}>
                <div className={styles['weather-section']}>
                    <div className={styles['weather-today']}>
                        <div className={styles['weather-today-top']}>오늘 날씨 정보</div>
                        <div className={styles['weather-today-bot']}>
                            지역: {weatherData.region}<br />
                            실제 기온: {weatherData.currentTemperature.toFixed(1)}°C
                        </div>
                    </div>

                    <div className={styles['weather-personal']}>
                        <div className={styles['weather-personal-top']}>개인별 체감 온도</div>
                        <div className={styles['weather-personal-top']}>
                            {weatherData.adjustedTemperature.toFixed(1)}°C<br />
                            <span className={styles['weather-personal-bot']}>
                                (사용자 보정: {weatherData.offset > 0 ? '+' : ''}{weatherData.offset.toFixed(1)}°C)
                            </span>
                        </div>
                    </div>
                </div>

                <div className={styles['fit-section']}>
                    <div className={styles['fit-text']}>추천 옷차림</div>
                    
                    <div className={styles['fit-images']}>
                        {recommendations.length === 0 ? (
                            <div style={{ color: '#000' }}>추천 정보가 없습니다.</div>
                        ) : (
                            recommendations.map((item, idx) => (
                                <div key={`${idx}-${item.name}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '150px' }}>
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
                                                (e.target as HTMLImageElement).src = '/images/clothing/placeholder.png';
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
                            ))
                        )}
                    </div>
                </div>
                </div>
                <div className={styles['feedback-section']}>
                    <div className={styles['feedback-top']}>오늘 옷차림은 어땠나요?</div>
                    
                    {!feedbackSent ? (
                        <div className={styles['feedback-bot']}>
                                <button 
                                    onClick={() => handleFeedback('hot')}
                                    className={styles['feedback-box']}
                                >
                                    <span className={styles['feedback-text']}>더웠어요</span>
                                </button>

                                <button 
                                    onClick={() => handleFeedback('just_right')}
                                    className={styles['feedback-box']}
                                >
                                    <span className={styles['feedback-text']}>좋았어요</span>
                                </button>

                                <button 
                                    onClick={() => handleFeedback('cold')}
                                    className={styles['feedback-box']}
                                >
                                    <span className={styles['feedback-text']}>추웠어요</span>
                                </button>      
                        </div>
                    ) : (
                        <div className={styles['feedback-bot']}>
                            <p className={styles['feedback-text']} style={{ color: '#2ecc71', fontWeight: 'bold' }}>
                                소중한 피드백이 반영되었습니다!<br /> 감사합니다!
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HomePage;