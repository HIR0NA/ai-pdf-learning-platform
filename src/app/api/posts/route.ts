import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: 'desc' }
    });

    if (posts.length === 0) {
      const defaultPosts = [
        {
          id: '1',
          slug: 'how-ai-changes-learning',
          title: 'AI จะเปลี่ยนวิธีการเรียนรู้ของนักศึกษาอย่างไรในปี 2026',
          content: 'ปัญญาประดิษฐ์ (AI) ไม่ใช่เรื่องไกลตัวอีกต่อไป... (เนื้อหาจำลอง)',
          excerpt: 'เรียนรู้วิธีที่นักศึกษาทั่วโลกใช้ AI ในการสรุปชีทเรียนและทำข้อสอบ',
          authorName: 'AgentAI Team',
          authorImage: null,
          imageUrl: '/images/blog_ai_learning.png',
          readTime: 5,
          category: 'Technology',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          slug: '5-tips-for-reading-pdf',
          title: '5 เทคนิคการอ่านเปเปอร์วิจัย PDF ให้เข้าใจใน 10 นาที',
          content: 'การอ่านเปเปอร์เป็นเรื่องที่ท้าทาย แต่ถ้าคุณมีเครื่องมือที่ถูกต้อง... (เนื้อหาจำลอง)',
          excerpt: 'เทคนิคสำหรับนักวิจัยและนักศึกษาปริญญาโท ในการสรุปเปเปอร์อย่างรวดเร็ว',
          authorName: 'AgentAI Team',
          authorImage: null,
          imageUrl: '/images/blog_pdf_reading.png',
          readTime: 3,
          category: 'Education',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];
      return NextResponse.json({ posts: defaultPosts });
    }

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}
