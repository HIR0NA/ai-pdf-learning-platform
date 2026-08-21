import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { sanitizeInput } from '@/lib/sanitize';

const SYSTEM_INSTRUCTION = "คุณคือ AI Study Companion ผู้ช่วยเรียนรู้ของนักเรียน หน้าที่ของคุณคือสรุปเนื้อหา สร้างข้อสอบ และทำ Flashcard ให้ตอบเฉพาะเรื่องที่เกี่ยวกับการศึกษา ห้ามให้ข้อมูลที่เป็นอันตรายหรือผิดกฎหมาย";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text } = await req.json();
    if (!text) {
      return NextResponse.json({ error: 'Text content is required' }, { status: 400 });
    }

    const sanitizedText = sanitizeInput(text, 50000);

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `สร้าง Flashcard จากเนื้อหาต่อไปนี้เพื่อช่วยให้จำได้ง่ายขึ้น:\n\n${sanitizedText}\n\nให้ตอบกลับมาเป็น JSON array โดยแต่ละข้อมีโครงสร้างดังนี้: { "term": "คำศัพท์/หัวข้อย่อย", "definition": "คำอธิบายสั้นๆ ให้จำง่าย" }`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Validate JSON structure
    const jsonParsed = JSON.parse(responseText);

    return NextResponse.json({ flashcards: jsonParsed });

  } catch (error: any) {
    console.error('Flashcard API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error or Invalid JSON' }, { status: 500 });
  }
}
