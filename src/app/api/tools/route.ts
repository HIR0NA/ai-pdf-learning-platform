import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs/promises';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, filename, forceRegenerate } = await req.json();

    if (!type || !filename) {
      return NextResponse.json({ error: 'Missing type or filename' }, { status: 400 });
    }

    const userId = (session.user as any).id;

    // Check if tool data already exists
    if (!forceRegenerate) {
      const existingTool = await prisma.learningTool.findFirst({
        where: { type, filename, userId },
        orderBy: { createdAt: 'desc' }
      });

      if (existingTool) {
        return NextResponse.json({ data: JSON.parse(existingTool.data) });
      }
    }

    // Load document text
    let contextText = '';
    try {
      const textPath = path.join(process.cwd(), 'uploads', `${filename}.txt`);
      contextText = await fs.readFile(textPath, 'utf-8');
    } catch (err) {
      console.error('Failed to read document text:', err);
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Prepare Prompt based on tool type
    let schemaPrompt = '';
    if (type === 'quiz') {
      schemaPrompt = `
Generate a 5-question multiple choice quiz based strictly on the document content. 
Return ONLY a valid JSON array of objects with this exact structure:
[
  {
    "question": "Question text in Thai",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "answerIndex": 0, // integer index (0-3) of the correct option
    "explanation": "Detailed explanation of the correct answer in Thai"
  }
]
`;
    } else if (type === 'flashcard') {
      schemaPrompt = `
Generate 10 important flashcards based on the document content.
Return ONLY a valid JSON array of objects with this exact structure:
[
  {
    "front": "Term or Question in Thai",
    "back": "Definition or Answer in Thai"
  }
]
`;
    } else if (type === 'schedule') {
      schemaPrompt = `
Generate a 7-day study schedule to slowly cover the document's content.
Return ONLY a valid JSON object with this exact structure:
{
  "title": "Study Plan Title in Thai",
  "days": [
    {
      "day": 1,
      "topic": "Main topic for this day in Thai",
      "description": "What to study or focus on in Thai"
    }
    // ... up to day 7
  ]
}
`;
    } else {
      return NextResponse.json({ error: 'Invalid tool type' }, { status: 400 });
    }

    const fullPrompt = `You are an expert tutor. Read the following document and complete the task in Thai language.\n\n--- Document ---\n${contextText}\n-----------------\n\nTASK:\n${schemaPrompt}`;

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent(fullPrompt);
    const jsonString = result.response.text();
    
    // Parse to ensure it's valid JSON
    const parsedData = JSON.parse(jsonString);

    // Save to DB
    await prisma.learningTool.create({
      data: {
        type,
        data: JSON.stringify(parsedData),
        filename,
        userId
      }
    });

    return NextResponse.json({ data: parsedData });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
