import type { Metadata } from 'next';
import Link from 'next/link';
import { Database, KeyRound, ServerCog, Trash2 } from 'lucide-react';
import styles from './privacy.module.css';

export const metadata: Metadata = {
  title: 'นโยบายเอกสารและความเป็นส่วนตัว | AgentAI',
  description: 'วิธีจัดเก็บ ส่งต่อ และลบเอกสาร PDF และประวัติการสนทนาใน AgentAI',
};

const items = [
  { icon: Database, title: 'การจัดเก็บ', text: 'PDF และข้อความที่สกัดได้ถูกจัดเก็บนอก Public Directory แยกตามบัญชี และตั้งชื่อไฟล์ใหม่ด้วย UUID' },
  { icon: ServerCog, title: 'การประมวลผลด้วย AI', text: 'ระบบส่งข้อความจากเอกสารไปยังผู้ให้บริการ AI ที่คุณเลือก เฉพาะเมื่อคุณสั่งแชทหรือสร้างเครื่องมือการเรียนรู้ การเก็บรักษาและการใช้ข้อมูลหลังส่งขึ้นอยู่กับเงื่อนไข API และการตั้งค่าของผู้ให้บริการนั้น' },
  { icon: KeyRound, title: 'API Key', text: 'API Key ของผู้ให้บริการอยู่ฝั่งเซิร์ฟเวอร์และไม่ถูกส่งไปยังเบราว์เซอร์หรือบันทึกไว้ในข้อความสนทนา' },
  { icon: Trash2, title: 'การลบข้อมูล', text: 'เมื่อคุณลบเอกสาร ระบบจะลบรายการเอกสาร ประวัติการสนทนา ผลลัพธ์การเรียนรู้ PDF และข้อความที่สกัดจากระบบหลัก' },
];

export default function PrivacyPage() {
  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <span>DOCUMENT PRIVACY</span>
        <h1>ไฟล์ของคุณถูกใช้อย่างไร</h1>
        <p>ข้อมูลตรงไปตรงมาเกี่ยวกับการจัดเก็บ PDF การส่งข้อมูลไปยัง AI และสิทธิ์ในการลบข้อมูลของคุณ</p>
      </div>
      <div className={styles.grid}>
        {items.map(({ icon: Icon, title, text }) => (
          <section key={title} className={styles.card}>
            <Icon size={22} aria-hidden="true" />
            <h2>{title}</h2>
            <p>{text}</p>
          </section>
        ))}
      </div>
      <aside className={styles.notice}>
        ไม่ควรอัปโหลดรหัสผ่าน Secret ข้อมูลสุขภาพ ข้อมูลทางการเงิน หรือเอกสารที่คุณไม่มีสิทธิ์นำมาประมวลผล
      </aside>
      <Link href="/dashboard" className="btn btn-primary">กลับไปยังพื้นที่เรียนรู้</Link>
    </main>
  );
}
