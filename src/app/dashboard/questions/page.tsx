'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, CircleHelp, Clock3, Pencil, Play, Plus, Trash2 } from 'lucide-react';
import QuizApp from '@/components/QuizApp';
import styles from './questions.module.css';

type Course = { id: string; title: string; code: string | null };
type Question = { id: string; prompt: string; options: string[]; answerIndex: number; explanation: string | null; course: Course | null };
type QuizQuestion = { question: string; options: string[]; answerIndex: number; explanation: string };
const emptyOptions = () => ['', '', '', ''];

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [prompt, setPrompt] = useState('');
  const [options, setOptions] = useState(emptyOptions);
  const [answerIndex, setAnswerIndex] = useState(0);
  const [explanation, setExplanation] = useState('');
  const [courseId, setCourseId] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [quizCourseId, setQuizCourseId] = useState('');
  const [quizData, setQuizData] = useState<QuizQuestion[] | null>(null);
  const [quizKey, setQuizKey] = useState(0);
  const [quizStatus, setQuizStatus] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [showQuizSetup, setShowQuizSetup] = useState(false);

  useEffect(() => {
    let active = true;
    void Promise.all([fetch('/api/questions'), fetch('/api/courses')])
      .then(([questionsResponse, coursesResponse]) => Promise.all([questionsResponse.ok ? questionsResponse.json() : null, coursesResponse.ok ? coursesResponse.json() : null]))
      .then(([questionData, courseData]) => {
        if (!active) return;
        setQuestions(questionData?.questions ?? []);
        setCourses(courseData?.courses ?? []);
      });
    return () => { active = false; };
  }, []);

  const resetForm = () => {
    setPrompt(''); setOptions(emptyOptions()); setAnswerIndex(0); setExplanation(''); setCourseId(''); setEditingId(null); setError('');
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const response = await fetch(editingId ? `/api/questions/${editingId}` : '/api/questions', {
        method: editingId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, options, answerIndex, explanation, courseId: courseId || null }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'ไม่สามารถบันทึกคำถามได้');
      setQuestions((current) => editingId ? current.map((question) => question.id === editingId ? data.question : question) : [data.question, ...current]);
      resetForm();
      setShowEditor(false);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'ไม่สามารถบันทึกคำถามได้'); }
    finally { setSaving(false); }
  };

  const edit = (question: Question) => {
    setEditingId(question.id); setPrompt(question.prompt); setOptions(question.options); setAnswerIndex(question.answerIndex);
    setExplanation(question.explanation || ''); setCourseId(question.course?.id || ''); setError(''); setShowEditor(true); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openEditor = () => { resetForm(); setShowEditor(true); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const remove = async (id: string) => {
    if (!window.confirm('ลบคำถามนี้หรือไม่?')) return;
    const response = await fetch(`/api/questions/${id}`, { method: 'DELETE' });
    if (response.ok) { setQuestions((current) => current.filter((question) => question.id !== id)); if (editingId === id) resetForm(); }
  };

  const startQuiz = () => {
    const candidates = questions.filter((question) => !quizCourseId || question.course?.id === quizCourseId);
    if (candidates.length === 0) { setQuizStatus(quizCourseId ? 'รายวิชานี้ยังไม่มีคำถามสำหรับทำ Quiz' : 'ยังไม่มีคำถามสำหรับทำ Quiz'); setQuizData(null); return; }
    const shuffled = [...candidates].sort(() => Math.random() - 0.5).slice(0, Math.min(10, candidates.length));
    setQuizData(shuffled.map((question) => ({ question: question.prompt, options: question.options, answerIndex: question.answerIndex, explanation: question.explanation || 'ไม่มีคำอธิบายเพิ่มเติม' })));
    setQuizKey((current) => current + 1); setQuizStatus(`เริ่ม Quiz ${shuffled.length} ข้อแล้ว`);
  };

  const saveManualQuiz = async (score: number, total: number) => {
    setQuizStatus('กำลังบันทึกผล Quiz...');
    try {
      const response = await fetch('/api/quiz-attempts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ score, total, source: 'MANUAL', courseId: quizCourseId || null }) });
      if (!response.ok) throw new Error();
      setQuizStatus('บันทึกผลแล้ว ดูคะแนนย้อนหลังได้ที่ประวัติ Quiz');
    } catch { setQuizStatus('แสดงผลคะแนนแล้ว แต่ไม่สามารถบันทึกประวัติได้ กรุณาลองใหม่'); }
  };

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <div><Link href="/dashboard" className={styles.back}>&larr; กลับไป Dashboard</Link><p className={styles.eyebrow}><CircleHelp size={16} /> Learning workspace</p><h1>คลังคำถาม</h1><p>สร้างคำถามสำหรับทบทวน แล้วสุ่มทำ Quiz เพื่อวัดความเข้าใจของคุณ</p></div>
        <div className={styles.summary}><strong>{questions.length}</strong><span>คำถามที่บันทึกไว้</span></div>
      </header>

      <div className={styles.actionBar}>
        <button className={styles.primaryButton} type="button" onClick={openEditor}><Plus size={17} /> เพิ่มคำถาม</button>
        <button className={styles.secondaryButton} type="button" disabled={questions.length === 0} onClick={() => { setShowQuizSetup(true); setQuizData(null); setQuizStatus(''); }}><Play size={17} /> เริ่ม Quiz</button>
        <span>{questions.length === 0 ? 'เริ่มจากเพิ่มคำถามข้อแรกของคุณ' : 'สุ่มคำถามได้สูงสุด 10 ข้อ'}</span>
      </div>

      {showQuizSetup && <section className={styles.quizPanel} aria-labelledby="quiz-heading">
        <div className={styles.panelHeading}><span className={styles.iconCircle}><Play size={20} /></span><div><h2 id="quiz-heading">ตั้งค่า Quiz</h2><p><Clock3 size={15} /> เลือกรายวิชาก่อนเริ่มทำแบบทดสอบ</p></div><button className={styles.closeButton} type="button" onClick={() => { setShowQuizSetup(false); setQuizData(null); }}>ปิด</button></div>
        <div className={styles.quizControls}><label>เลือกรายวิชา<select className={styles.select} value={quizCourseId} onChange={(event) => { setQuizCourseId(event.target.value); setQuizData(null); setQuizStatus(''); }}><option value="">ทุกคำถาม ({questions.length})</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.code ? `${course.code} — ` : ''}{course.title} ({questions.filter((question) => question.course?.id === course.id).length})</option>)}</select></label><button className={styles.primaryButton} type="button" onClick={startQuiz}><Play size={17} /> สุ่มคำถาม</button></div>
        {quizStatus && <p className={styles.status} role="status">{quizStatus}</p>}
        {quizData && <div className={styles.quizArea}><QuizApp key={quizKey} data={quizData} onComplete={saveManualQuiz} showTimer /></div>}
      </section>}

      {showEditor && <section className={styles.formCard} aria-labelledby="question-form-heading">
        <div className={styles.sectionHeading}><div><p className={styles.eyebrow}><Plus size={16} /> Question builder</p><h2 id="question-form-heading">{editingId ? 'แก้ไขคำถาม' : 'เพิ่มคำถามใหม่'}</h2></div><button className={styles.textButton} type="button" onClick={() => { resetForm(); setShowEditor(false); }}>ปิดฟอร์ม</button></div>
        <form onSubmit={submit} className={styles.form}>
          <div className={styles.twoColumns}><label>รายวิชา <span>ไม่บังคับ</span><select className={styles.select} value={courseId} onChange={(event) => setCourseId(event.target.value)}><option value="">ไม่ระบุรายวิชา</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.code ? `${course.code} — ` : ''}{course.title}</option>)}</select></label><label>คำตอบที่ถูก<select className={styles.select} value={answerIndex} onChange={(event) => setAnswerIndex(Number(event.target.value))}>{options.map((_, index) => <option key={index} value={index}>ตัวเลือก {index + 1}</option>)}</select></label></div>
          <label>คำถาม<textarea className={styles.textarea} value={prompt} onChange={(event) => setPrompt(event.target.value)} required maxLength={2000} placeholder="พิมพ์คำถามที่ต้องการทบทวน" /></label>
          <div className={styles.optionsGrid}>{options.map((option, index) => <label key={index}>ตัวเลือก {index + 1}<input className={styles.input} value={option} onChange={(event) => setOptions((current) => current.map((value, itemIndex) => itemIndex === index ? event.target.value : value))} required maxLength={500} placeholder={`คำตอบตัวเลือก ${index + 1}`} /></label>)}</div>
          <label>คำอธิบายเฉลย <span>ไม่บังคับ</span><textarea className={styles.textareaSmall} value={explanation} onChange={(event) => setExplanation(event.target.value)} maxLength={4000} placeholder="อธิบายว่าทำไมคำตอบนี้จึงถูกต้อง" /></label>
          <div className={styles.formActions}><button className={styles.primaryButton} disabled={saving} type="submit"><Plus size={17} /> {saving ? 'กำลังบันทึก...' : editingId ? 'บันทึกการแก้ไข' : 'เพิ่มคำถาม'}</button>{error && <p className={styles.error} role="alert">{error}</p>}</div>
        </form>
      </section>}

      <section className={styles.library} aria-live="polite"><div className={styles.sectionHeading}><div><p className={styles.eyebrow}><BookOpen size={16} /> Saved questions</p><h2>คำถามของฉัน</h2></div><span className={styles.count}>{questions.length} ข้อ</span></div>
        {questions.length === 0 ? <div className={styles.empty}><CircleHelp size={32} /><h3>ยังไม่มีคำถาม</h3><p>เพิ่มคำถามแรกเพื่อเริ่มสร้าง Quiz สำหรับทบทวน</p><button className={styles.primaryButton} type="button" onClick={openEditor}><Plus size={17} /> เพิ่มคำถามแรก</button></div> : <div className={styles.questionList}>{questions.map((question, index) => <article className={styles.questionCard} key={question.id}><div className={styles.questionNumber}>{index + 1}</div><div className={styles.questionContent}><div className={styles.questionTop}><h3>{question.prompt}</h3>{question.course && <span className={styles.courseBadge}>{question.course.code || question.course.title}</span>}</div><ol className={styles.answers}>{question.options.map((option, optionIndex) => <li key={optionIndex} className={optionIndex === question.answerIndex ? styles.correct : undefined}>{option}{optionIndex === question.answerIndex && <span>คำตอบที่ถูก</span>}</li>)}</ol>{question.explanation && <p className={styles.explanation}>เฉลย: {question.explanation}</p>}<div className={styles.cardActions}><button type="button" onClick={() => edit(question)}><Pencil size={15} /> แก้ไข</button><button className={styles.deleteButton} type="button" onClick={() => void remove(question.id)}><Trash2 size={15} /> ลบ</button></div></div></article>)}</div>}
      </section>
    </main>
  );
}
