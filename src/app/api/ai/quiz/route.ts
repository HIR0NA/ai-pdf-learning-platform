import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { sanitizeInput } from '@/lib/sanitize';
import { GEMINI_MODEL, withGeminiRetry } from '@/lib/gemini';

const SYSTEM_INSTRUCTION = "คุณคือ AI Study Companion ผู้ช่วยเรียนรู้ของนักเรียน หน้าที่ของคุณคือสรุปเนื้อหา สร้างข้อสอบ และทำ Flashcard ให้ตอบเฉพาะเรื่องที่เกี่ยวกับการศึกษา ห้ามให้ข้อมูลที่เป็นอันตรายหรือผิดกฎหมาย";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { topic, amount = 5 } = await req.json();
    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const sanitizedTopic = sanitizeInput(topic, 5000);

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ 
      model: GEMINI_MODEL,
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `สร้างคำถามปรนัย (Quiz) จำนวน ${amount} ข้อ ในหัวข้อต่อไปนี้:\n${sanitizedTopic}\n\nให้ตอบกลับมาเป็น JSON array โดยแต่ละข้อมีโครงสร้างดังนี้: { "question": "...", "options": ["...", "...", "...", "..."], "answer": "..." }`;

    const result = await withGeminiRetry(() => model.generateContent(prompt));
    const responseText = result.response.text();
    
    // Parse JSON just to validate format before sending
    const jsonParsed = JSON.parse(responseText);

    return NextResponse.json({ quiz: jsonParsed });

  } catch (error: any) {
    console.error('Quiz API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error or Invalid JSON' }, { status: 500 });
  }
}
