import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs/promises';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define Cosine Similarity
function cosineSimilarity(a: number[], b: number[]) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function POST(req: Request) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query, filename } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API Key missing' }, { status: 500 });
    }

    const userId = (session.user as any).id;

    // Save user message to database
    if (filename) {
      await prisma.message.create({
        data: {
          role: 'user',
          content: query,
          filename: filename,
          userId: userId
        }
      });
    }

    let contextText = '';

    if (filename) {
      try {
        const textPath = path.join(process.cwd(), 'uploads', `${filename}.txt`);
        contextText = await fs.readFile(textPath, 'utf-8');
      } catch (err) {
        console.error('Failed to read document text:', err);
      }
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    let prompt = `You are a helpful AI assistant in a Cyberpunk-themed learning platform. Answer the user's question politely and concisely in Thai language.\n\n`;
    
    if (contextText) {
      prompt += `--- Extracted Context from Document ---\n${contextText}\n--------------------------------------\n\n`;
      prompt += `Based ONLY on the document context above, answer the question. If the answer is not in the context, just answer from your general knowledge but mention that it is not explicitly stated in the document.\n\n`;
    }

    // Fetch past messages
    if (filename) {
      const pastMessages = await prisma.message.findMany({
        where: { filename, userId },
        orderBy: { createdAt: 'desc' },
        take: 10
      });
      pastMessages.reverse();
      
      if (pastMessages.length > 1) { // more than just the current user message
        prompt += `--- Chat History ---\n`;
        pastMessages.slice(0, -1).forEach(m => {
          prompt += `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}\n`;
        });
        prompt += `--------------------\n\n`;
      }
    }

    prompt += `Question: ${query}`;
    
    // Use streaming
    const resultStream = await model.generateContentStream(prompt);
    
    // Create a custom ReadableStream to send text chunks
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullResponse = '';
          for await (const chunk of resultStream.stream) {
            const chunkText = chunk.text();
            fullResponse += chunkText;
            controller.enqueue(new TextEncoder().encode(chunkText));
          }
          
          if (filename) {
            await prisma.message.create({
              data: {
                role: 'ai',
                content: fullResponse,
                filename: filename,
                userId: userId
              }
            });
          }
          
          controller.close();
        } catch (e) {
          controller.error(e);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked'
      }
    });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
