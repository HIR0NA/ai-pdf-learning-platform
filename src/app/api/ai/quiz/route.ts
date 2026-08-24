import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { sanitizeInput } from '@/lib/sanitize';
import { generateAIText } from '@/lib/ai-provider';

const SYSTEM_INSTRUCTION = "คุณคือ AI Study Companion ผู้ช่วยเรียนรู้ของนักเรียน หน้าที่ของคุณคือสรุปเนื้อหา สร้างข้อสอบ และทำ Flashcard ให้ตอบเฉพาะเรื่องที่เกี่ยวกับการศึกษา ห้ามให้ข้อมูลที่เป็นอันตรายหรือผิดกฎหมาย";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { topic, amount = 5, provider } = await req.json();
    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const sanitizedTopic = sanitizeInput(topic, 5000);

    const prompt = `${SYSTEM_INSTRUCTION}\n\nสร้างคำถามปรนัย (Quiz) จำนวน ${amount} ข้อ ในหัวข้อต่อไปนี้:\n${sanitizedTopic}\n\nให้ตอบกลับมาเป็น JSON array โดยแต่ละข้อมีโครงสร้างดังนี้: { "question": "...", "options": ["...", "...", "...", "..."], "answer": "..." }`;
    const result = await generateAIText(prompt, { json: true, provider });
    
    // Parse JSON just to validate format before sending
    const jsonParsed = JSON.parse(result.text);

    return NextResponse.json({ quiz: jsonParsed, provider: result.provider, model: result.model });

  } catch (error: unknown) {
    console.error('Quiz API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error or Invalid JSON' }, { status: 500 });
  }
}
