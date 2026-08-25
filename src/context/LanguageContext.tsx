'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'th' | 'en';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: keyof typeof translations['en']) => string;
}

const translations = {
  en: {
    nav_home: 'Home',
    nav_about: 'About Us',
    nav_dashboard: 'Dashboard',
    nav_login: 'Sign In',

    // Landing Page
    home_badge: 'AI-Driven Platform',
    home_title_1: 'Turn PDFs into',
    home_title_highlight_new: 'Summaries, Quizzes',
    home_title_2: 'and Flashcards with AI',
    home_subtitle_new: 'Upload a PDF to summarize, ask questions, create quizzes and flashcards, and build a study schedule in minutes.',
    home_btn_start: 'Upload a PDF Free',
    home_btn_explore: 'Explore Features',

    stat_1_label: 'Maximum File Size',
    stat_1_val: '10MB',
    stat_1_sub: 'PDF files only',
    stat_2_label: 'Learning Tools',
    stat_2_val: '5',
    stat_2_sub: 'Chat, Summary, Quiz, Flashcard, Schedule',
    stat_3_label: 'AI Provider Choices',
    stat_3_val: '3',
    stat_3_sub: 'Choose the configured provider you prefer',
    stat_4_val: 'Anytime',
    stat_4_label: 'Delete Your Data',
    stat_4_sub: 'Remove files and chat history',

    statement_1: 'We ',
    statement_hl_1: 'extract',
    statement_2: ' and simplify complex documents with AI at the core, ensuring every ',
    statement_hl_2: 'student enhances',
    statement_3: ' their learning experiences.',

    bento_badge: 'Core Feature',
    bento_title_1: 'Advanced Vector RAG',
    bento_desc_1: 'Upload massive textbooks and get precise answers instantly.',
    bento_title_2: 'Powered by Next-Gen AI',
    bento_desc_2: 'Integration',
    testimonial_text: '"This tool saved me hours of reading before my finals. The AI explained complex concepts perfectly."',
    testimonial_role: 'Computer Science Student',

    // Dashboard
    dash_fs: 'FILESYSTEM',
    dash_new_upload: '+ NEW_UPLOAD',
    dash_no_files: '> NO_FILES_FOUND',
    dash_pdf_viewer: 'PDF_VIEWER',
    dash_select_preview: '> SELECT_OR_UPLOAD_FILE_TO_PREVIEW',
    dash_ai_interface: 'AI_INTERFACE',
    dash_connected: 'CONNECTED:',
    dash_standby: 'STANDBY',
    dash_awaiting: '> AWAITING_INPUT',
    dash_enter_query: 'Enter query...',
    dash_select_first: 'Please select a file first...',
    dash_send: 'SEND',
    dash_system: 'SYSTEM',
    dash_user: 'USER',

    // New Navs
    nav_product: 'Pricing',
    nav_blog: 'Blog',
    nav_contact: 'Contact Us',
    nav_dashboard_overview: 'Dashboard',
    nav_chatai: 'ChatAI',

    // Generic
    loading: 'Loading...',
    not_found: 'Not Found',
    back: 'Back',

    // Product Page
    prod_title: 'Our Pricing & Services',
    prod_subtitle: 'Choose the right package for you, whether for basic use or serious research.',
    prod_free: 'Free',
    prod_start_free: 'Start for Free',
    prod_popular: 'Most Popular',
    prod_select: 'Choose Package',
    prod_reviews: 'What Our Users Say',

    // Blog Page
    blog_title: 'Knowledge Hub',
    blog_subtitle: 'Updates, study techniques, and AI usage tips',
    blog_search: 'Search articles...',
    blog_read_time: 'mins read',
    blog_back: 'Back to Blog',

    // Contact Page
    contact_title: 'Contact Us',
    contact_subtitle: 'Have questions or need help? Our team is ready.',
    contact_address: 'Office Location',
    contact_email: 'Email',
    contact_phone: 'Phone',
    contact_send: 'Send Message',
    contact_form_title: 'Send us a message',
    contact_faq: 'Frequently Asked Questions (FAQ)',

    // Overview Page
    overview_welcome: 'Welcome,',
    overview_subtitle: 'Your usage and learning overview',
    overview_docs: 'Total Documents',
    overview_chats: 'AI Interactions',
    overview_time: 'Learning Time',
    overview_chart_chat: 'Conversation Stats (Last 7 Days)',
    overview_chart_doc: 'Document Uploads',
    overview_table_title: 'Your Recent Documents',
    overview_table_name: 'File Name',
    overview_table_date: 'Upload Date',
    overview_table_size: 'File Size',
    overview_table_status: 'Status',

    // Login Page
    login_title: 'Unlock Your\nLearning Potential',
    login_subtitle: 'Join over 10,000 users who use AgentAI to summarize, analyze, and understand documents 10x faster.',
    login_benefit_1: 'Accurate summaries with advanced AI',
    login_benefit_2: 'Automatic Flashcard and Quiz generation',
    login_benefit_3: 'Private account storage with user-controlled deletion',
    login_welcome: 'Welcome Back',
    login_welcome_sub: 'Please log in to continue',
    login_email: 'Email',
    login_password: 'Password',
    login_forgot: 'Forgot Password?',
    login_btn: 'Log In',
    login_or: 'or log in with',
    login_no_account: 'Don\'t have an account?',
    login_register: 'Sign up for free',
    login_terms: 'By logging in, you agree to our',
    login_tos: 'Terms of Service',
    login_and: 'and',
    login_privacy: 'Privacy Policy',
    login_err: 'Invalid email or password',

    // Register Page
    register_title: 'Create Your Account',
    register_subtitle: 'Start learning smarter today with AgentAI.',
    register_name: 'Full Name',
    register_email: 'Email',
    register_password: 'Password',
    register_confirm_password: 'Confirm Password',
    register_btn: 'Sign Up',
    register_already: 'Already have an account?',
    register_login: 'Log in here',
    register_err: 'Passwords do not match',

    // About Us Page
    about_title: 'About the Creators',
    about_subtitle_page: 'We are a team passionate about AI and Education.',
    about_mission_title: 'Our Mission',
    about_mission_desc: 'To bridge the gap between advanced artificial intelligence and everyday learning, making studying more efficient and accessible for everyone.',
    about_team_title: 'Meet the Team',
    about_team_dev: 'Lead Developer',
    about_team_design: 'UI/UX Designer',
    about_team_research: 'AI Researcher',

    // FAQ Section
    faq_title: 'Frequently Asked Questions',
    faq_q1: 'What formats of documents are supported?',
    faq_a1: 'The current system supports PDF files up to 10MB per file.',
    faq_q2: 'Can I use it on mobile?',
    faq_a2: 'Yes, our platform is fully responsive and optimized for mobile devices.',
    faq_q3: 'Is my data secure?',
    faq_a3: 'Files are private to your account and can be deleted at any time. Document text is sent to the AI provider you select only when you request a chat or learning tool.',
    faq_q4: 'How do I cancel my subscription?',
    faq_a4: 'You can cancel anytime from your dashboard under the Billing settings.',

    // Blog
    blog_filter_all: 'All Categories',

    // Checkout Page
    checkout_title: 'Complete Your Order',
    checkout_subtitle: 'Upgrade your account to unlock premium AI capabilities',
    checkout_summary_title: 'Order Summary',
    checkout_plan: 'Selected Plan',
    checkout_billing: 'Billing Cycle',
    checkout_monthly: 'Monthly',
    checkout_yearly: 'Yearly',
    checkout_total: 'Total to pay',
    checkout_payment_method: 'Payment Method',
    checkout_card: 'Credit / Debit Card',
    checkout_promptpay: 'PromptPay QR',
    checkout_bank: 'Bank Transfer',
    checkout_billing_info: 'Billing Information',
    checkout_name: 'Full Name',
    checkout_address: 'Billing Address',
    checkout_pay_now: 'Confirm Payment',
    checkout_processing: 'Processing...',
    checkout_success: 'Payment Successful! Redirecting...',

    about_subtitle: 'Secure AI-powered platform for modern learners and professionals.',

    // Navbar extras
    nav_admin_console: 'Admin Console',
    nav_student_overview: 'Student Overview',
    nav_logout: 'Logout',
    nav_register_free: 'Sign Up Free',

    // Dashboard - Learning tabs
    tab_chat: 'Chat',
    tab_summary: 'Summary',
    tab_quiz: 'Quiz',
    tab_flashcard: 'Flashcard',
    tab_schedule: 'Schedule',

    // Dashboard extras
    dash_my_docs: 'My Documents',
    dash_dashboard_link: 'Dashboard',
    dash_drag_pdf: 'Drag PDF / MD here',
    dash_pdf_only: 'PDF or Markdown only',
    dash_max_size: 'Max',
    dash_choose_pdf: 'Choose PDF / MD file',
    dash_privacy_hint: 'Text is sent to AI provider only when you request it',
    dash_privacy_link: 'Privacy Policy',
    dash_start_learning: 'Start learning from your PDF / MD',
    dash_drag_or_choose: 'Drag and drop, or choose a file',
    dash_supported_pdf: 'PDF / MD supported',
    dash_file_private: 'Files are private per account, delete anytime',
    dash_ask_anything: 'Ask anything about this document',
    dash_ai_answer_doc: 'AI answers based on document content',
    dash_choose_upload: 'Choose or upload a PDF to start chatting',
    dash_ai_ready_hint: 'Once PDF is ready, you can summarize, chat, and create study materials here',
    dash_ai_generating: 'AI is generating your',
    dash_ai_generating_wait: 'This might take a few seconds.',
    dash_rename: 'Rename',
    dash_share: 'Share',
    dash_delete: 'Delete',
    dash_confirm_delete: 'Are you sure you want to delete this file and its chat history?',

    // Landing Page Extra
    home_microcopy: 'PDF only · Max 10MB · Free to start',
    benefit_title_1: 'Lightning Fast Analysis',
    benefit_desc_1: 'Save hours of reading. Let AI summarize and extract key info in seconds.',
    benefit_title_2: 'Smart Personal Assistant',
    benefit_desc_2: 'Chat and interact with your docs as if an expert is right beside you.',
    benefit_title_3: 'Secure and Private',
    benefit_desc_3: 'Your docs are securely stored with utmost privacy.',
    benefit_why: 'Why choose AgentAI?',
    trust_title: 'Trusted Technology Stack',
    cta_closing_title: 'Ready to turn PDFs into your lessons?',
    cta_closing_desc: 'Summarize, Q&A, create Quizzes, Flashcards, and study plans all from one doc.',
    cta_closing_btn_1: 'Sign Up & Upload PDF Free',
    cta_closing_btn_2: 'View pricing',

    // Overview Extra
    overview_back_home: 'Back to Home',
    overview_docs_unit: 'Files',
    overview_trend_docs: '+3 files this week',
    overview_trend_chats: '+12% from last week',
    overview_time_unit: '12 hrs 30 mins',
    overview_trend_time: 'Excellent trend',
    overview_chart_queries: 'Number of Queries',
    overview_chart_files: 'Files',
    overview_status_done: 'Analysis Completed',

    // Mock Data
    mock_member_1: 'Karn Yodkwian',
    mock_member_2: 'Warisara Churuangsakul',
    mock_member_3: 'Siraphat Puaphao',
    mock_rev_role_1: 'University Student',
    mock_rev_desc_1: 'Saved me tons of time reading exam sheets. Summary is easy to understand and tests real knowledge.',
    mock_rev_role_2: 'Researcher',
    mock_rev_desc_2: 'Data extraction from PDF is very accurate. Massively reduced my literature review time.',
    mock_rev_role_3: 'Office Worker',
    mock_rev_desc_3: 'Summarize long meeting minutes in a few minutes. Totally worth the Pro package.',
  },
  th: {
    nav_home: 'หน้าหลัก',
    nav_about: 'เกี่ยวกับเรา',
    nav_dashboard: 'แดชบอร์ด',
    nav_login: 'เข้าสู่ระบบ',

    // Landing Page
    home_badge: 'แพลตฟอร์มขับเคลื่อนด้วย AI',
    home_title_1: 'เปลี่ยน PDF เป็น',
    home_title_highlight_new: 'สรุป Quiz และ Flashcard',
    home_title_2: 'ด้วย AI',
    home_subtitle_new: 'อัปโหลด PDF แล้วคุยกับเอกสาร สรุปเนื้อหา สร้างข้อสอบ Flashcard และตารางเรียนได้ในไม่กี่นาที',
    home_btn_start: 'อัปโหลด PDF ฟรี',
    home_btn_explore: 'ดูฟีเจอร์เพิ่มเติม',

    stat_1_label: 'ขนาดไฟล์สูงสุด',
    stat_1_val: '10MB',
    stat_1_sub: 'รองรับไฟล์ PDF หรือ MD เท่านั้น',
    stat_2_label: 'เครื่องมือการเรียนรู้',
    stat_2_val: '5',
    stat_2_sub: 'Chat, Summary, Quiz, Flashcard, Schedule',
    stat_3_label: 'ตัวเลือกผู้ให้บริการ AI',
    stat_3_val: '3',
    stat_3_sub: 'เลือกผู้ให้บริการที่ตั้งค่าไว้ได้ตามต้องการ',
    stat_4_val: 'ทุกเมื่อ',
    stat_4_label: 'ลบข้อมูลของคุณ',
    stat_4_sub: 'ลบไฟล์และประวัติการสนทนาได้',

    statement_1: 'เรา',
    statement_hl_1: 'สกัดเนื้อหา',
    statement_2: ' และย่อเอกสารที่ซับซ้อนด้วยหัวใจหลักที่เป็น AI เพื่อให้มั่นใจว่านักเรียนทุกคน',
    statement_hl_2: 'ได้รับประสบการณ์ที่ดีที่สุด',
    statement_3: ' ในการเรียนรู้',

    bento_badge: 'ฟีเจอร์หลัก',
    bento_title_1: 'ระบบ Vector RAG ขั้นสูง',
    bento_desc_1: 'อัปโหลดหนังสือเรียนเล่มหนา และได้คำตอบที่แม่นยำในทันที',
    bento_title_2: 'ขับเคลื่อนด้วย AI ยุคใหม่',
    bento_desc_2: 'ผสานการทำงานอย่างลงตัว',
    testimonial_text: '"เครื่องมือนี้ช่วยประหยัดเวลาอ่านหนังสือก่อนสอบไฟนอลได้หลายชั่วโมง AI อธิบายคอนเซปต์ยากๆ ได้อย่างสมบูรณ์แบบ"',
    testimonial_role: 'นักศึกษาวิทยาการคอมพิวเตอร์',

    // Dashboard
    dash_fs: 'ระบบจัดการไฟล์',
    dash_new_upload: '+ อัปโหลดไฟล์ใหม่',
    dash_no_files: '> ไม่พบไฟล์',
    dash_pdf_viewer: 'ดูไฟล์ PDF',
    dash_select_preview: '> เลือกหรืออัปโหลดไฟล์เพื่อดู',
    dash_ai_interface: 'อินเตอร์เฟส AI',
    dash_connected: 'เชื่อมต่อแล้ว:',
    dash_standby: 'รอสแตนด์บาย',
    dash_awaiting: '> รอรับคำสั่ง...',
    dash_enter_query: 'พิมพ์คำถามที่นี่...',
    dash_select_first: 'กรุณาเลือกไฟล์ก่อน...',
    dash_send: 'ส่ง',
    dash_system: 'ระบบ',
    dash_user: 'คุณ',

    // New Navs
    nav_product: 'บริการ/ราคา',
    nav_blog: 'บทความ',
    nav_contact: 'ติดต่อเรา',
    nav_dashboard_overview: 'Dashboard',
    nav_chatai: 'ChatAI',

    // Generic
    loading: 'กำลังโหลด...',
    not_found: 'ไม่พบข้อมูล',
    back: 'กลับ',

    // Product Page
    prod_title: 'บริการและราคาของเรา',
    prod_subtitle: 'เลือกแพ็กเกจที่เหมาะสมกับคุณ ไม่ว่าจะเป็นการใช้งานเบื้องต้น หรือเพื่อการเรียนและวิจัยอย่างจริงจัง',
    prod_free: 'ฟรี',
    prod_start_free: 'เริ่มต้นใช้งานฟรี',
    prod_popular: 'คุ้มค่าที่สุด',
    prod_select: 'เลือกแพ็กเกจนี้',
    prod_reviews: 'เสียงตอบรับจากผู้ใช้งาน',

    // Blog Page
    blog_title: 'บทความความรู้',
    blog_subtitle: 'อัปเดตข่าวสาร เทคนิคการเรียน และเคล็ดลับการใช้งาน AI',
    blog_search: 'ค้นหาบทความ...',
    blog_read_time: 'นาที',
    blog_back: 'กลับไปหน้าบทความ',

    // Contact Page
    contact_title: 'ติดต่อเรา',
    contact_subtitle: 'มีข้อสงสัยหรือต้องการสอบถามข้อมูลเพิ่มเติม? ทีมงานของเราพร้อมช่วยเหลือคุณ',
    contact_address: 'ที่ตั้งสำนักงาน',
    contact_email: 'อีเมล',
    contact_phone: 'เบอร์โทรศัพท์',
    contact_send: 'ส่งข้อความ',
    contact_form_title: 'ส่งข้อความถึงเรา',
    contact_faq: 'คำถามที่พบบ่อย (FAQ)',

    // Overview Page
    overview_welcome: 'ยินดีต้อนรับ,',
    overview_subtitle: 'ภาพรวมการใช้งานและการเรียนรู้ของคุณ',
    overview_docs: 'เอกสารทั้งหมด',
    overview_chats: 'ข้อความที่คุยกับ AI',
    overview_time: 'เวลาที่ใช้เรียนรู้',
    overview_chart_chat: 'สถิติการสนทนา (7 วันย้อนหลัง)',
    overview_chart_doc: 'อัปโหลดเอกสาร',
    overview_table_title: 'เอกสารล่าสุดของคุณ',
    overview_table_name: 'ชื่อไฟล์',
    overview_table_date: 'วันที่อัปโหลด',
    overview_table_size: 'ขนาดไฟล์',
    overview_table_status: 'สถานะ',

    // Login Page
    login_title: 'ปลดล็อกศักยภาพ\nการเรียนรู้ของคุณ',
    login_subtitle: 'เข้าร่วมกับผู้ใช้งานกว่าหมื่นคนที่ใช้ AgentAI ในการสรุป วิเคราะห์ และทำความเข้าใจเอกสารได้เร็วขึ้น 10 เท่า',
    login_benefit_1: 'สรุปเนื้อหาแม่นยำด้วย AI ขั้นสูง',
    login_benefit_2: 'สร้าง Flashcard และ Quiz อัตโนมัติ',
    login_benefit_3: 'จัดเก็บแยกตามบัญชีและควบคุมการลบข้อมูลได้',
    login_welcome: 'ยินดีต้อนรับกลับมา',
    login_welcome_sub: 'กรุณาเข้าสู่ระบบเพื่อใช้งานต่อ',
    login_email: 'อีเมล',
    login_password: 'รหัสผ่าน',
    login_forgot: 'ลืมรหัสผ่าน?',
    login_btn: 'เข้าสู่ระบบ',
    login_or: 'หรือเข้าสู่ระบบด้วย',
    login_no_account: 'ยังไม่มีบัญชี?',
    login_register: 'สมัครสมาชิกฟรี',
    login_terms: 'การเข้าสู่ระบบถือว่าคุณยอมรับ',
    login_tos: 'เงื่อนไขการให้บริการ',
    login_and: 'และ',
    login_privacy: 'นโยบายความเป็นส่วนตัว',
    login_err: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',

    // Register Page
    register_title: 'สร้างบัญชีผู้ใช้ใหม่',
    register_subtitle: 'เริ่มต้นเรียนรู้อย่างชาญฉลาดตั้งแต่วันนี้ด้วย AgentAI',
    register_name: 'ชื่อ-นามสกุล',
    register_email: 'อีเมล',
    register_password: 'รหัสผ่าน',
    register_confirm_password: 'ยืนยันรหัสผ่าน',
    register_btn: 'สมัครสมาชิก',
    register_already: 'มีบัญชีอยู่แล้ว?',
    register_login: 'เข้าสู่ระบบที่นี่',
    register_err: 'รหัสผ่านไม่ตรงกัน',

    // About Us Page
    about_title: 'เกี่ยวกับผู้จัดทำ',
    about_subtitle_page: 'พวกเราคือทีมที่หลงใหลในเทคโนโลยี AI และการศึกษา',
    about_mission_title: 'พันธกิจของเรา',
    about_mission_desc: 'เพื่อเชื่อมต่อช่องว่างระหว่างปัญญาประดิษฐ์ขั้นสูงและการเรียนรู้ในชีวิตประจำวัน ทำให้การเรียนมีประสิทธิภาพและเข้าถึงได้ง่ายขึ้นสำหรับทุกคน',
    about_team_title: 'ทีมงานของเรา',
    about_team_dev: 'นักพัฒนาซอฟต์แวร์หลัก',
    about_team_design: 'นักออกแบบ UI/UX',
    about_team_research: 'นักวิจัย AI',

    // FAQ Section
    faq_title: 'คำถามที่พบบ่อย',
    faq_q1: 'รองรับไฟล์เอกสารประเภทใดบ้าง?',
    faq_a1: 'ขณะนี้ระบบรองรับไฟล์ PDF ขนาดสูงสุด 10MB ต่อไฟล์',
    faq_q2: 'ใช้งานบนมือถือได้หรือไม่?',
    faq_a2: 'ได้ครับ แพลตฟอร์มของเรารองรับการใช้งานบนมือถือและแท็บเล็ตอย่างเต็มรูปแบบ',
    faq_q3: 'ข้อมูลของฉันปลอดภัยไหม?',
    faq_a3: 'ไฟล์เป็นส่วนตัวสำหรับบัญชีของคุณและลบได้ทุกเมื่อ ระบบจะส่งข้อความจากเอกสารไปยังผู้ให้บริการ AI ที่คุณเลือก เฉพาะเมื่อคุณสั่งแชทหรือสร้างเครื่องมือการเรียนรู้',
    faq_q4: 'วิธียกเลิกแพ็กเกจทำอย่างไร?',
    faq_a4: 'คุณสามารถยกเลิกได้ตลอดเวลาที่หน้าการตั้งค่าบิลในแดชบอร์ดของคุณ',

    // Blog
    blog_filter_all: 'หมวดหมู่ทั้งหมด',

    // Checkout Page
    checkout_title: 'ชำระเงิน',
    checkout_subtitle: 'อัปเกรดบัญชีของคุณเพื่อปลดล็อกความสามารถของ AI แบบพรีเมียม',
    checkout_summary_title: 'สรุปคำสั่งซื้อ',
    checkout_plan: 'แพ็กเกจที่เลือก',
    checkout_billing: 'รอบบิล',
    checkout_monthly: 'รายเดือน',
    checkout_yearly: 'รายปี',
    checkout_total: 'ยอดชำระทั้งหมด',
    checkout_payment_method: 'วิธีการชำระเงิน',
    checkout_card: 'บัตรเครดิต / เดบิต',
    checkout_promptpay: 'สแกนคิวอาร์โค้ด',
    checkout_bank: 'โอนเงินผ่านธนาคาร',
    checkout_billing_info: 'ข้อมูลการเรียกเก็บเงิน',
    checkout_name: 'ชื่อ-นามสกุล',
    checkout_address: 'ที่อยู่สำหรับออกใบเสร็จ',
    checkout_pay_now: 'ยืนยันการชำระเงิน',
    checkout_processing: 'กำลังดำเนินการ...',
    checkout_success: 'ชำระเงินสำเร็จ! กำลังพากลับ...',

    about_subtitle: 'แพลตฟอร์ม AI ที่ปลอดภัยสำหรับผู้เรียนและคนทำงานยุคใหม่',

    // Navbar extras
    nav_admin_console: 'แผงควบคุมแอดมิน',
    nav_student_overview: 'ภาพรวมนักเรียน',
    nav_logout: 'ออกจากระบบ',
    nav_register_free: 'สมัครฟรี',

    // Dashboard - Learning tabs
    tab_chat: 'แชท',
    tab_summary: 'สรุป',
    tab_quiz: 'แบบทดสอบ',
    tab_flashcard: 'บัตรคำศัพท์',
    tab_schedule: 'กำหนดการ',

    // Dashboard extras
    dash_my_docs: 'เอกสารของฉัน',
    dash_dashboard_link: 'แดชบอร์ด',
    dash_drag_pdf: 'ลาก PDF หรือ MD มาวางที่นี่',
    dash_pdf_only: 'PDF หรือ MD',
    dash_max_size: 'สูงสุด',
    dash_choose_pdf: 'เลือกไฟล์ PDF / MD',
    dash_privacy_hint: 'ส่งข้อความไปยังผู้ให้บริการ AI ที่เลือกเมื่อคุณสั่งงานเท่านั้น',
    dash_privacy_link: 'นโยบายข้อมูล',
    dash_start_learning: 'เริ่มเรียนรู้จาก PDF ของคุณ',
    dash_drag_or_choose: 'ลากไฟล์มาวาง หรือเลือกไฟล์จากอุปกรณ์',
    dash_supported_pdf: 'รองรับ PDF',
    dash_file_private: 'ไฟล์เก็บแยกตามบัญชี ลบได้ทุกเมื่อ',
    dash_ask_anything: 'ถามอะไรก็ได้จากเอกสารนี้',
    dash_ai_answer_doc: 'AI จะตอบโดยยึดข้อมูลในเอกสารเป็นหลัก',
    dash_choose_upload: 'เลือกหรืออัปโหลด PDF เพื่อเริ่มสนทนา',
    dash_ai_ready_hint: 'เมื่อ PDF พร้อมใช้งาน คุณจะสรุป ถามตอบ และสร้างสื่อทบทวนได้ที่นี่',
    dash_ai_generating: 'AI กำลังสร้าง',
    dash_ai_generating_wait: 'ขั้นตอนนี้อาจใช้เวลาสักครู่',
    dash_rename: 'เปลี่ยนชื่อ',
    dash_share: 'แชร์',
    dash_delete: 'ลบ',
    dash_confirm_delete: 'คุณแน่ใจหรือไม่ว่าต้องการลบประวัติการแชทและไฟล์นี้ออกจากระบบ?',

    // Landing Page Extra
    home_microcopy: 'PDF หรือ MD · สูงสุด 10MB · เริ่มใช้ฟรี',
    benefit_title_1: 'วิเคราะห์รวดเร็ว',
    benefit_desc_1: 'ประหยัดเวลาอ่านเอกสารเป็นชั่วโมง ให้ AI ช่วยสรุปใจความสำคัญและดึงข้อมูลที่คุณต้องการได้ในไม่กี่วินาที',
    benefit_title_2: 'ผู้ช่วยส่วนตัวอัจฉริยะ',
    benefit_desc_2: 'ไม่เพียงแค่สรุป แต่สามารถสนทนาและโต้ตอบกับเอกสารของคุณได้เสมือนมีผู้เชี่ยวชาญอยู่เคียงข้าง',
    benefit_title_3: 'ปลอดภัยและเป็นส่วนตัว',
    benefit_desc_3: 'ข้อมูลและเอกสารของคุณจะถูกจัดเก็บอย่างปลอดภัย เราให้ความสำคัญกับความเป็นส่วนตัวสูงสุด',
    benefit_why: 'ทำไมต้องเลือก AgentAI?',
    trust_title: 'ระบบเทคโนโลยีที่ได้รับความไว้วางใจ',
    cta_closing_title: 'พร้อมเปลี่ยน PDF ให้เป็นบทเรียนของคุณหรือยัง?',
    cta_closing_desc: 'สรุป ถามตอบ สร้าง Quiz, Flashcard และตารางเรียนได้จากเอกสารเดียว',
    cta_closing_btn_1: 'สมัครและอัปโหลด PDF ฟรี',
    cta_closing_btn_2: 'ดูแพ็กเกจ',

    // Overview Extra
    overview_back_home: 'กลับหน้าแรก',
    overview_docs_unit: 'ไฟล์',
    overview_trend_docs: '+3 ไฟล์สัปดาห์นี้',
    overview_trend_chats: '+12% จากสัปดาห์ก่อน',
    overview_time_unit: '12 ชม. 30 นาที',
    overview_trend_time: 'แนวโน้มดีมาก',
    overview_chart_queries: 'จำนวนข้อความ',
    overview_chart_files: 'ไฟล์',
    overview_status_done: 'วิเคราะห์เสร็จสิ้น',

    // Mock Data
    mock_member_1: 'นายกาณฑ์ ยอดเกวียน',
    mock_member_2: 'นางสาววริศรา ชูเรืองสกุล',
    mock_member_3: 'นายสิรภัทร พัวเผ่า',
    mock_rev_role_1: 'นักศึกษามหาวิทยาลัย',
    mock_rev_desc_1: 'ช่วยประหยัดเวลาอ่านชีทสอบได้เยอะมาก สรุปเข้าใจง่ายและทดสอบความรู้ได้จริง',
    mock_rev_role_2: 'นักวิจัย',
    mock_rev_desc_2: 'การดึงข้อมูลจากเอกสาร PDF ทำได้แม่นยำมาก ลดเวลาการทบทวนวรรณกรรมได้มหาศาล',
    mock_rev_role_3: 'พนักงานบริษัท',
    mock_rev_desc_3: 'สรุปรายงานการประชุมยาวๆ ได้ในไม่กี่นาที คุ้มค่ากับแพ็กเกจ Pro มากครับ',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguage] = useState<Language>('th');

  useEffect(() => {
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang && (savedLang === 'en' || savedLang === 'th')) {
      queueMicrotask(() => setLanguage(savedLang));
    }
  }, []);

  const toggleLanguage = () => {
    const newLang = language === 'th' ? 'en' : 'th';
    setLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  const t = (key: keyof typeof translations['en']) => {
    return translations[language][key] || translations['en'][key];
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
