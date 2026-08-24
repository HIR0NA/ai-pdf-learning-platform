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

    const { text, provider } = await req.json();
    if (!text) {
      return NextResponse.json({ error: 'Text content is required' }, { status: 400 });
    }

    const sanitizedText = sanitizeInput(text, 100000); // 100k limit for large docs

    const prompt = `${SYSTEM_INSTRUCTION}\n\nช่วยสรุปเนื้อหาต่อไปนี้ให้เข้าใจง่าย สั้นกระชับ และดึงใจความสำคัญออกมา:\n\n${sanitizedText}`;
    const result = await generateAIText(prompt, { provider });

    return NextResponse.json({ summary: result.text, provider: result.provider, model: result.model });

  } catch (error: unknown) {
    console.error('Summarize API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
