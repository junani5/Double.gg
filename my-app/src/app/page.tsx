// src/app/page.tsx

'use client'; // <-- 맨 위에 이 줄을 추가해야 합니다! (중요)

import { useState } from 'react';

export default function Home() {
  const [name, setName] = useState(''); // 검색할 이름
  const [data, setData] = useState<any>(null); // Riot API 결과
  const [loading, setLoading] = useState(false);

  const getTftData = async () => {
    if (!name) {
      alert('소환사 이름을 입력하세요.');
      return;
    }

    setLoading(true);
    setData(null);

    try {
      // 3단계에서 만든 '내 백엔드 API'를 호출합니다.
      const response = await fetch(`/api/getSummoner?name=${name}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '데이터를 가져오는데 실패했습니다.');
      }

      setData(result); // 성공하면 데이터를 state에 저장
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>내 롤토체스 통계 사이트</h1>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="소환사 이름 입력"
      />
      <button onClick={getTftData} disabled={loading}>
        {loading ? '검색 중...' : '전적 검색'}
      </button>

      {/* 데이터가 있으면 JSON 형태로 예쁘게 보여주기 */}
      {data && (
        <pre style={{ backgroundColor: '#eee', padding: '10px' }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}