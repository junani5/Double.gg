// src/pages/api/getSummoner.ts

import type { NextApiRequest, NextApiResponse } from 'next';

// NextApiRequest: 프론트엔드에서 보낸 '요청' 정보 (예: ?name=Faker)
// NextApiResponse: 백엔드에서 프론트엔드로 보낼 '응답' 정보
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  
  // -------------------
  // 1. 프론트엔드로부터 '소환사 이름' 받기
  // -------------------
  // req.query.name은 http://.../api/getSummoner?name=Faker 에서 'Faker' 부분을 의미
  const summonerName = req.query.name as string; 

  // -------------------
  // 2. 숨겨둔 'API 키' 꺼내기
  // -------------------
  // .env.local에 저장했던 키를 '서버' 안에서만 안전하게 사용
  const apiKey = process.env.RIOT_API_KEY; 

  // -------------------
  // 3. 'Riot 서버'에 실제로 데이터 요청하기
  // -------------------
  // fetch는 '데이터를 가져오는' JavaScript 기본 명령어
  const response = await fetch(
    // 이 주소가 Riot이 정해둔 'TFT 소환사 정보' API 주소
    `https://kr.api.riotgames.com/tft/summoner/v1/summoners/by-name/${summonerName}` + 
    // Riot이 정한 규칙대로 주소 끝에 ?api_key=...를 붙여 '열쇠'를 전달
    `?api_key=${apiKey}`
  );

  // -------------------
  // 4. Riot 서버가 응답한 결과 처리하기
  // -------------------
  
  // 만약 response.ok가 false라면 (예: 404 Not Found, 403 Forbidden 등)
  if (!response.ok) {
    console.error("Riot API Error:", response.statusText);
    // 프론트엔드에 "에러 났어"라고 알려주기
    return res.status(response.status).json({ message: 'Riot API에서 에러가 발생했습니다.' });
  }

  // 에러가 없다면, Riot이 보낸 데이터(JSON)를 JavaScript 객체로 변환
  const data = await response.json();

  // -------------------
  // 5. '프론트엔드'에 최종 데이터 전달하기
  // -------------------
  // 200(성공) 상태 코드와 함께, 받아온 데이터를 프론트엔드로 전송
  res.status(200).json(data);
}