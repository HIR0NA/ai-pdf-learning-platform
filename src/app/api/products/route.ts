import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function normalizeUploadLimit(featuresJson: string) {
  const features = JSON.parse(featuresJson || '[]') as string[];
  const withoutUploadClaim = features.filter((feature) => !feature.includes('อัปโหลดไฟล์'));
  return JSON.stringify(['อัปโหลดไฟล์ PDF สูงสุด 10MB', ...withoutUploadClaim]);
}

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { price: 'asc' }
    });

    if (products.length === 0) {
      // Return default products if DB is empty
      const defaultProducts = [
        {
          id: '1',
          name: 'Basic (ฟรี)',
          description: 'สำหรับผู้เริ่มต้นใช้งานและทดลองระบบ',
          price: 0,
          features: JSON.stringify(['อัปโหลดไฟล์ PDF สูงสุด 10MB', 'สรุปเนื้อหาเบื้องต้น', 'แชทกับเอกสาร 10 ข้อความ/วัน']),
          imageUrl: null,
        },
        {
          id: '2',
          name: 'Pro (รายเดือน)',
          description: 'สำหรับนักศึกษาและคนทำงานที่ต้องการผู้ช่วย',
          price: 199,
          features: JSON.stringify(['อัปโหลดไฟล์ PDF สูงสุด 10MB', 'สร้าง Flashcard อัตโนมัติ', 'แชทกับเอกสารไม่จำกัด', 'สรุปเนื้อหาเชิงลึก']),
          imageUrl: null,
        },
        {
          id: '3',
          name: 'Premium (รายปี)',
          description: 'ครบจบทุกฟีเจอร์ ประหยัดกว่า 30%',
          price: 1990,
          features: JSON.stringify(['อัปโหลดไฟล์ PDF สูงสุด 10MB', 'สร้างแผนการเรียนอัตโนมัติ (Schedule)', 'ทดสอบความรู้ (Quiz)', 'รองรับการอ่านออกเสียง (TTS)', 'อัปเดตฟีเจอร์ใหม่ก่อนใคร']),
          imageUrl: null,
        }
      ];
      return NextResponse.json({ products: defaultProducts });
    }

    return NextResponse.json({
      products: products.map((product) => ({
        ...product,
        features: normalizeUploadLimit(product.features),
      })),
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
