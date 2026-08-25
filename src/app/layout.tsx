import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { LanguageProvider } from "@/context/LanguageContext";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "AI สรุป PDF และคุยกับเอกสาร | AgentAI",
  description: "อัปโหลด PDF เพื่อสรุปเนื้อหา ถามตอบ สร้าง Quiz, Flashcard และตารางเรียนด้วย AI รองรับเอกสารภาษาไทย เริ่มใช้งานฟรี",
  keywords: ["AI สรุป PDF", "คุยกับไฟล์ PDF", "ถามตอบจากเอกสาร", "สร้างข้อสอบจาก PDF", "สร้าง Flashcard ด้วย AI"],
  alternates: { canonical: "/" },
  openGraph: {
    title: "AI สรุป PDF และคุยกับเอกสาร | AgentAI",
    description: "สรุป ถามตอบ สร้าง Quiz และ Flashcard จาก PDF ด้วย AI",
    type: "website",
    locale: "th_TH",
    images: [{ url: "/images/blog_ai_learning.png", width: 1200, height: 630, alt: "AgentAI ผู้ช่วยเรียนรู้จาก PDF" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI สรุป PDF และคุยกับเอกสาร | AgentAI",
    description: "สรุป ถามตอบ สร้าง Quiz และ Flashcard จาก PDF ด้วย AI",
    images: ["/images/blog_ai_learning.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          <LanguageProvider>
            <Navbar />
            <main>{children}</main>
            <Footer />
          </LanguageProvider>
        </Providers>
      </body>
    </html>
  );
}
