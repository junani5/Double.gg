// src/pages/api/getSummoner.ts

import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  
  // 1. VS Code 터미널에 API 키가 잘 찍히는지 다시 확인합니다.
  console.log("API 키 확인:", process.env.RIOT_API_KEY ? "로드됨" : "!!! undefined !!!");

  try {
    const summonerName = req.query.name as string;
    const apiKey = process.env.RIOT_API_KEY as string;

    // 2. 만약 API 키가 'undefined'면, Riot에 요청도 하기 전에 에러 처리
    if (!apiKey) {
      throw new Error("서버에 API 키가 설정되지 않았습니다. .env.local 파일을 확인하세요.");
    }

    const riotApiUrl = `https://kr.api.riotgames.com/tft/summoner/v1/summoners/by-name/${summonerName}`;

    // 3. Riot API에 헤더 방식으로 요청
    const response = await fetch(riotApiUrl, {
      method: 'GET',
      headers: {
        "X-Riot-Token": apiKey 
      }
    });

    // 4. Riot API가 에러를 보냈을 때 (더 안전한 에러 처리)
    if (!response.ok) {
      console.error("Riot API 에러 발생!", "Status:", response.status, response.statusText);
      
      // Riot이 보낸 에러 메시지 원본(text)을 우선 받습니다.
      const errorText = await response.text();
      console.error("Riot API 원본 에러:", errorText);

      let errorMessage = `Riot API Error (${response.status}): `;

      try {
        // JSON 형식이면 JSON으로 파싱해서 자세한 메시지 추가
        const errorData = JSON.parse(errorText);
        errorMessage += errorData.status.message;
      } catch (e) {
        // JSON 형식이 아니면 (예: "Forbidden") 그냥 텍스트를 추가
        errorMessage += errorText;
      }
      
      throw new Error(errorMessage);
    }

    // 5. 성공 시
    const data = await response.json();
    res.status(200).json(data);

  } catch (error) {
    // 6. 'getSummoner.ts' 내부에서 발생한 모든 에러를 잡아서 전송
    console.error("500 에러의 실제 원인:", (error as Error).message);
    res.status(500).json({ message: (error as Error).message });
  }
}