import Link from 'next/link';
import { ShieldX } from 'lucide-react';
import styles from './admin.module.css';

export default function Forbidden() {
  return (
    <div className={styles.denied}>
      <ShieldX size={52} aria-hidden="true" />
      <h1>403 - Forbidden</h1>
      <p>บัญชีนี้ไม่มีสิทธิ์เข้าถึง Admin Console</p>
      <Link href="/dashboard" className={styles.secondaryAction}>กลับไป Dashboard</Link>
    </div>
  );
}
