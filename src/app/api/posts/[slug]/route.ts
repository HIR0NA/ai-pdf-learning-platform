import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request, props: { params: Promise<{ slug: string }> }) {
  try {
    const params = await props.params;
    const post = await prisma.post.findUnique({
      where: { slug: params.slug }
    });

    if (!post) {
      // Mock data fallback
      const defaultPosts = [
        {
          id: '1',
          slug: 'how-ai-changes-learning',
          title: 'AI จะเปลี่ยนวิธีการเรียนรู้ของนักศึกษาอย่างไรในปี 2026',
          content: `ปัญญาประดิษฐ์ (AI) ไม่ใช่เรื่องไกลตัวอีกต่อไป ในปี 2026 เราเห็นการเปลี่ยนแปลงอย่างมหาศาลในแวดวงการศึกษา...
          
## การเรียนรู้แบบเฉพาะบุคคล (Personalized Learning)
AI สามารถปรับเนื้อหาให้เข้ากับความเร็วในการเรียนรู้ของแต่ละคน...

## บทสรุป
การปรับตัวเข้าหาเทคโนโลยีเป็นสิ่งที่หลีกเลี่ยงไม่ได้...`,
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
          content: `การอ่านเปเปอร์เป็นเรื่องที่ท้าทาย แต่ถ้าคุณมีเครื่องมือที่ถูกต้อง...
          
1. **อ่าน Abstract ก่อนเสมอ**
2. **ข้ามไปอ่าน Conclusion**
3. **ใช้ AgentAI สรุป Methodology**...`,
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

      const foundMock = defaultPosts.find(p => p.slug === params.slug);
      if (foundMock) return NextResponse.json({ post: foundMock });

      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}
