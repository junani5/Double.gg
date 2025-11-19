// src/app/api/feedback/route.ts

import { NextResponse } from 'next/server';
import * as fs from 'fs/promises';
import * as path from 'path';

// 피드백 데이터를 저장할 JSON 파일 경로 설정
// Next.js 프로젝트의 루트 디렉토리에 저장됩니다.
const FEEDBACK_DB_PATH = path.join(process.cwd(), 'feedback_db.json');

// 피드백 데이터 타입 정의
interface FeedbackEntry {
    userId: string;
    temp: number;
    offset: number;
    feedback: 'hot' | 'cold' | 'just_right';
    timestamp: number;
}

// ----------------------------------------------------
// 1. 데이터베이스 파일 관리 함수 (JSON 파일 읽기)
// ----------------------------------------------------

async function readDb(): Promise<FeedbackEntry[]> {
    try {
        // 파일을 읽고 JSON으로 파싱합니다.
        const data = await fs.readFile(FEEDBACK_DB_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error: any) {
        // ENOENT (Error NO ENTry)는 파일이 없다는 뜻입니다.
        // 파일이 없으면 빈 배열을 반환하고, 다른 에러는 로그를 출력합니다.
        if (error.code !== 'ENOENT') {
            console.error(`[DB Error] Failed to read ${FEEDBACK_DB_PATH}:`, error);
        }
        return [];
    }
}

async function writeDb(data: FeedbackEntry[]): Promise<void> {
    // JSON 데이터를 예쁘게 포맷팅하여 파일에 씁니다.
    await fs.writeFile(FEEDBACK_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}


// ----------------------------------------------------
// 2. 피드백 POST 핸들러
// ----------------------------------------------------
export async function POST(request: Request) {
    try {
        // 클라이언트에서 보낸 데이터 파싱
        const { userId, temp, offset, feedback } = await request.json();

        if (!userId || temp === undefined || offset === undefined || !feedback) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. 기존 데이터 읽기
        const db = await readDb();

        // 2. 새로운 피드백 항목 생성
        const newEntry: FeedbackEntry = {
            userId,
            temp,
            offset,
            feedback,
            timestamp: Date.now(),
        };

        // 3. 데이터 추가 및 저장
        db.push(newEntry);
        await writeDb(db);
        
        console.log(`[FEEDBACK] New feedback received from ${userId}: ${feedback} at ${temp}°C`);

        return NextResponse.json({ message: "Feedback recorded successfully" });

    } catch (error) {
        console.error("Feedback API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}