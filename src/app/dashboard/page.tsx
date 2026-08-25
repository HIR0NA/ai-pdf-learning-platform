'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './dashboard.module.css';
import { useLanguage } from '@/context/LanguageContext';
import QuizApp from '@/components/QuizApp';
import FlashcardApp from '@/components/FlashcardApp';
import StudySchedule from '@/components/StudySchedule';
import DocumentSummary from '@/components/DocumentSummary';
import { CalendarDays, ChevronLeft, ChevronRight, Cpu, FileText, Layers, LayoutDashboard, ListChecks, MessageSquare, Upload, MoreVertical, Edit2, Share2, Trash2, Volume2, VolumeX, FolderOpen, LockKeyhole, RotateCcw, X } from 'lucide-react';
import Link from 'next/link';
import { isAcceptedPdf, MAX_PDF_FILE_SIZE, MAX_PDF_FILE_SIZE_MB } from '@/lib/upload-policy';

type ProviderId = 'gemini' | 'groq' | 'bazaarlink';
type ProviderOption = {
  id: ProviderId;
  name: string;
  model: string;
  configured: boolean;
};

type MobilePane = 'files' | 'pdf' | 'ai';
type UploadPhase = 'idle' | 'validating' | 'uploading' | 'processing' | 'success' | 'error';

const learningTabs = [
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'summary', label: 'Summary', icon: FileText },
  { id: 'quiz', label: 'Quiz', icon: ListChecks },
  { id: 'flashcard', label: 'Flashcard', icon: Layers },
  { id: 'schedule', label: 'Schedule', icon: CalendarDays },
] as const;

export default function Dashboard() {
  const { t } = useLanguage();
  const [documents, setDocuments] = useState<any[]>([]);
  const [activeFile, setActiveFile] = useState<any>(null);
  const [status, setStatus] = useState<string>('');
  const [mobilePane, setMobilePane] = useState<MobilePane>('files');
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const uploadRequestRef = useRef<XMLHttpRequest | null>(null);
  const lastUploadRef = useRef<File | null>(null);
  
  // Chat state
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{role: 'user'|'ai', content: string}[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);
  const chatHistoryRef = useRef<HTMLDivElement>(null);

  // Tools state
  const [activeTab, setActiveTab] = useState<'chat' | 'summary' | 'quiz' | 'flashcard' | 'schedule'>('chat');
  const [toolData, setToolData] = useState<any>(null);
  const [isToolLoading, setIsToolLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ProviderId>('gemini');
  const [providerOptions, setProviderOptions] = useState<ProviderOption[]>([]);

  // Sidebar state
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // TTS state
  const [playingMessageIndex, setPlayingMessageIndex] = useState<number | null>(null);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      uploadRequestRef.current?.abort();
    };
  }, []);

  const loadingSteps = [
    "กำลังเชื่อมต่อกับ AI...",
    "กำลังอ่านข้อมูลจากเอกสาร...",
    "กำลังค้นหาเนื้อหาที่เกี่ยวข้อง...",
    "กำลังวิเคราะห์บริบทเชิงลึก...",
    "กำลังเรียบเรียงผลลัพธ์ให้เข้าใจง่าย..."
  ];

  useEffect(() => {
    let interval: any;
    if (isTyping) {
      interval = setInterval(() => {
        setLoadingStepIdx((prev) => (prev + 1) % loadingSteps.length);
      }, 2500);
    } else {
      setLoadingStepIdx(0);
    }
    return () => clearInterval(interval);
  }, [isTyping]);

  useEffect(() => {
    fetchDocuments();
    fetchAIProviders();
  }, []);

  useEffect(() => {
    if (activeTab === 'chat' && chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [messages, isTyping, activeTab]);

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/files');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents);
      }
    } catch (e) {
      console.error('Failed to fetch documents', e);
    }
  };

  const fetchAIProviders = async () => {
    try {
      const res = await fetch('/api/ai/providers');
      if (!res.ok) return;
      const data = await res.json();
      const options = data.providers as ProviderOption[];
      setProviderOptions(options);
      const fallback = options.find((option) => option.configured)?.id;
      setSelectedProvider((data.defaultProvider as ProviderId | null) || fallback || 'gemini');
    } catch (error) {
      console.error('Failed to fetch AI providers', error);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    lastUploadRef.current = file;
    setUploadPhase('validating');
    setUploadProgress(5);
    setUploadError('');

    if (!isAcceptedPdf(file)) {
      setStatus('รูปแบบไฟล์ไม่ถูกต้อง');
      setUploadError('รองรับเฉพาะไฟล์ PDF ที่มี MIME type และนามสกุลถูกต้อง');
      setUploadPhase('error');
      return;
    }
    if (file.size > MAX_PDF_FILE_SIZE) {
      setStatus('ไฟล์มีขนาดใหญ่เกินกำหนด');
      setUploadError(`ไฟล์ต้องมีขนาดไม่เกิน ${MAX_PDF_FILE_SIZE_MB}MB`);
      setUploadPhase('error');
      return;
    }

    setStatus('กำลังอัปโหลดไฟล์');
    setUploadPhase('uploading');
    setUploadProgress(10);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const data = await new Promise<{ filename: string; error?: string }>((resolve, reject) => {
        const request = new XMLHttpRequest();
        uploadRequestRef.current = request;
        request.open('POST', '/api/upload');
        request.responseType = 'json';
        request.upload.onprogress = (event) => {
          if (!event.lengthComputable) return;
          const percent = Math.round((event.loaded / event.total) * 65) + 10;
          setUploadProgress(Math.min(percent, 75));
          if (event.loaded === event.total) {
            setUploadPhase('processing');
            setStatus('กำลังตรวจสอบและอ่านข้อความจาก PDF');
          }
        };
        request.onload = () => {
          const response = request.response || {};
          if (request.status >= 200 && request.status < 300) resolve(response);
          else reject(new Error(response.error || 'อัปโหลดไฟล์ไม่สำเร็จ'));
        };
        request.onerror = () => reject(new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้'));
        request.onabort = () => reject(new DOMException('ยกเลิกการอัปโหลดแล้ว', 'AbortError'));
        request.send(formData);
      });

      setUploadProgress(90);
      setStatus('กำลังเตรียมพื้นที่เรียนรู้');
      await fetchDocuments();
      const newFile = { filename: data.filename, title: file.name };
      setActiveFile(newFile);
      setMessages([{ role: 'ai', content: `อ่าน PDF "${file.name}" เรียบร้อยแล้ว เลือกคำถามแนะนำหรือพิมพ์คำถามของคุณได้เลย` }]);
      setActiveTab('chat');
      setMobilePane('ai');
      setUploadProgress(100);
      setUploadPhase('success');
      setStatus('PDF พร้อมใช้งานแล้ว');
      setTimeout(() => {
        setUploadPhase('idle');
        setStatus('');
      }, 3500);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'อัปโหลดไฟล์ไม่สำเร็จ';
      if (error instanceof DOMException && error.name === 'AbortError') {
        setUploadError('ยกเลิกการอัปโหลดแล้ว คุณสามารถเลือกไฟล์ใหม่ได้');
      } else {
        setUploadError(message);
      }
      setUploadPhase('error');
      setStatus('อัปโหลดไม่สำเร็จ');
    } finally {
      uploadRequestRef.current = null;
    }
  };

  const cancelUpload = () => uploadRequestRef.current?.abort();

  const retryUpload = () => {
    if (lastUploadRef.current) uploadFile(lastUploadRef.current);
  };

  const handleDrop = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const submitQuery = async (queryText: string) => {
    if (!queryText.trim() || !activeFile) return;

    const userMessage = { role: 'user' as const, content: queryText };
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setIsTyping(true);
    setLoadingStepIdx(0);
    
    // Add empty AI message placeholder
    setMessages(prev => [...prev, { role: 'ai', content: '' }]);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMessage.content,
          filename: activeFile.filename,
          provider: selectedProvider,
        }),
      });
      
      if (!res.ok) {
        let errStr = 'Network error';
        try { const errData = await res.json(); errStr = errData.error || errStr; } catch(e){}
        throw new Error(errStr);
      }

      if (res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let done = false;
        let aiText = '';

        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          if (value) {
            const chunkValue = decoder.decode(value, { stream: true });
            aiText += chunkValue;
            
            // Update the last message
            setMessages(prev => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1] = { role: 'ai', content: aiText };
              return newMessages;
            });
          }
        }

        const finalText = decoder.decode();
        if (finalText) {
          aiText += finalText;
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = { role: 'ai', content: aiText };
            return newMessages;
          });
        }
      }
    } catch (error: any) {
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { role: 'ai', content: `ERR: ${error.message || 'CONNECTION_LOST'}` };
        return newMessages;
      });
    } finally {
      setIsTyping(false);
      setLoadingStepIdx(0);
    }
  };

  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    submitQuery(query);
  };

  const loadTool = async (
    type: 'summary' | 'quiz' | 'flashcard' | 'schedule',
    targetFilename = activeFile?.filename,
  ) => {
    if (!targetFilename) return;
    setActiveTab(type);
    setIsToolLoading(true);
    setToolData(null);
    try {
      const res = await fetch('/api/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, filename: targetFilename, provider: selectedProvider })
      });
      const json = await res.json();
      if (res.ok) {
        setToolData(json.data);
      } else {
        alert(json.error || 'Failed to generate tool data');
        setActiveTab('chat');
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error fetching tool data');
      setActiveTab('chat');
    } finally {
      setIsToolLoading(false);
    }
  };

  const selectDocument = async (doc: any) => {
    setActiveFile(doc);
    setActiveTab('chat');
    setToolData(null);
    setMobilePane('ai');
    setMessages([{ role: 'ai', content: `SYSTEM_MSG: Loading chat history for "${doc.title}"...` }]);
    
    try {
      const res = await fetch(`/api/messages?documentId=${doc.filename}`);
      if (res.ok) {
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages.map((m: any) => ({
            role: m.role,
            content: m.content
          })));
        } else {
          setMessages([{ role: 'ai', content: `SYSTEM_MSG: Switched to document "${doc.title}". No previous history.` }]);
        }
      }
    } catch (e) {
      setMessages([{ role: 'ai', content: `SYSTEM_MSG: Switched to document "${doc.title}". Failed to load history.` }]);
    }
  };

  const handleDeleteFile = async (filename: string) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบประวัติการแชทและไฟล์นี้ออกจากระบบ?')) return;
    
    try {
      const res = await fetch(`/api/files/${filename}`, { method: 'DELETE' });
      if (res.ok) {
        setDocuments(prev => prev.filter(d => d.filename !== filename));
        if (activeFile?.filename === filename) {
          setActiveFile(null);
          setMessages([]);
        }
      } else {
        alert('Failed to delete file');
      }
    } catch (e) {
      alert('Error deleting file');
    }
  };

  const handleRenameSubmit = async (filename: string) => {
    if (!editTitle.trim() || editTitle.trim() === documents.find(d => d.filename === filename)?.title) {
      setEditingFileId(null);
      return;
    }

    try {
      const newTitle = editTitle.trim();
      const res = await fetch(`/api/files/${filename}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      });
      if (res.ok) {
        setDocuments(prev => prev.map(d => d.filename === filename ? { ...d, title: newTitle } : d));
        if (activeFile?.filename === filename) {
          setActiveFile({ ...activeFile, title: newTitle });
        }
      } else {
        alert('Failed to rename file');
      }
    } catch (e) {
      alert('Error renaming file');
    } finally {
      setEditingFileId(null);
    }
  };

  const toggleSpeech = (text: string, index: number) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (playingMessageIndex === index) {
      window.speechSynthesis.cancel();
      setPlayingMessageIndex(null);
    } else {
      window.speechSynthesis.cancel(); // Stop any currently playing
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'th-TH'; // Support Thai
      utterance.onend = () => setPlayingMessageIndex(null);
      utterance.onerror = () => setPlayingMessageIndex(null);
      window.speechSynthesis.speak(utterance);
      setPlayingMessageIndex(index);
    }
  };

  const renderMessageContent = (content: string) => {
    return (
      <span className={styles.messageContent}>
        {content.split(/(\[หน้า\s+\d+\])/g).map((part, index) =>
          /^\[หน้า\s+\d+\]$/.test(part)
            ? <span className={styles.citation} key={`${part}-${index}`}>{part}</span>
            : part
        )}
      </span>
    );
  };

  const uploadIsBusy = uploadPhase === 'validating' || uploadPhase === 'uploading' || uploadPhase === 'processing';
  const uploadPhaseLabel = {
    idle: 'พร้อมรับไฟล์',
    validating: 'กำลังตรวจสอบไฟล์',
    uploading: 'กำลังอัปโหลด',
    processing: 'กำลังตรวจสอบและอ่านข้อความ',
    success: 'PDF พร้อมใช้งาน',
    error: 'อัปโหลดไม่สำเร็จ',
  }[uploadPhase];
  const promptSuggestions = [
    'สรุปเอกสารนี้เป็น 5 ข้อ',
    'อธิบายเนื้อหาเหมือนฉันเป็นผู้เริ่มต้น',
    'หัวข้อใดน่าจะออกสอบ',
    'สร้างคำถามทบทวน 10 ข้อ',
  ];

  return (
    <div className={styles.container} data-fullscreen-dashboard>
      <nav className={styles.mobileTabs} aria-label="เลือกพื้นที่ทำงาน" role="tablist">
        <button role="tab" aria-selected={mobilePane === 'files'} className={mobilePane === 'files' ? styles.mobileTabActive : ''} onClick={() => setMobilePane('files')}>
          <FolderOpen size={17} /> ไฟล์
        </button>
        <button role="tab" aria-selected={mobilePane === 'pdf'} className={mobilePane === 'pdf' ? styles.mobileTabActive : ''} onClick={() => setMobilePane('pdf')} disabled={!activeFile}>
          <FileText size={17} /> PDF
        </button>
        <button role="tab" aria-selected={mobilePane === 'ai'} className={mobilePane === 'ai' ? styles.mobileTabActive : ''} onClick={() => setMobilePane('ai')}>
          <MessageSquare size={17} /> AI
        </button>
      </nav>

      <aside className={`${styles.sidebar} ${isSidebarExpanded ? styles.expanded : styles.collapsed} ${mobilePane !== 'files' ? styles.mobileHidden : ''}`}>
        <button 
          className={styles.toggleBtn} 
          onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
          aria-label={isSidebarExpanded ? 'ย่อรายการไฟล์' : 'ขยายรายการไฟล์'}
        >
          {isSidebarExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
        <h2 className={styles.sidebarTitle}>เอกสารของฉัน</h2>
        
        {isSidebarExpanded && (
          <div className={styles.sidebarNav}>
            <Link href="/dashboard/overview" className={styles.dashboardLink}>
              <LayoutDashboard size={18} /> Dashboard
            </Link>
          </div>
        )}

        <div
          className={`${styles.uploadArea} ${isDragging ? styles.dragging : ''}`}
          onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          {isSidebarExpanded && <Upload size={24} className={styles.uploadIcon} aria-hidden="true" />}
          {isSidebarExpanded && <strong>ลาก PDF มาวางที่นี่</strong>}
          {isSidebarExpanded && <span className={styles.uploadHint}>PDF เท่านั้น · สูงสุด {MAX_PDF_FILE_SIZE_MB}MB</span>}
          <label htmlFor="file-upload" className={styles.uploadLabel} title={!isSidebarExpanded ? String(t('dash_new_upload')) : undefined}>
            {isSidebarExpanded ? 'เลือกไฟล์ PDF' : <Upload size={17} />}
          </label>
          <input 
            type="file" 
            accept="application/pdf" 
            onChange={handleFileChange}
            id="file-upload"
            className={styles.fileInput}
            disabled={uploadIsBusy}
          />
          {isSidebarExpanded && (
            <p className={styles.privacyHint}><LockKeyhole size={13} /> <span>ส่งข้อความไปยังผู้ให้บริการ AI ที่เลือกเมื่อคุณสั่งงานเท่านั้น · <Link href="/privacy">อ่านนโยบาย</Link></span></p>
          )}
        </div>

        {isSidebarExpanded && uploadPhase !== 'idle' && (
          <div className={`${styles.uploadStatus} ${uploadPhase === 'error' ? styles.uploadStatusError : ''}`} aria-live="polite">
            <div className={styles.uploadStatusRow}>
              <span>{status || uploadPhaseLabel}</span>
              {uploadIsBusy && <span>{uploadProgress}%</span>}
            </div>
            {uploadPhase !== 'error' && (
              <div className={styles.progressTrack} role="progressbar" aria-label={uploadPhaseLabel} aria-valuemin={0} aria-valuemax={100} aria-valuenow={uploadProgress}>
                <span style={{ width: `${uploadProgress}%` }} />
              </div>
            )}
            {uploadError && <p>{uploadError}</p>}
            <div className={styles.uploadActions}>
              {uploadIsBusy && <button type="button" onClick={cancelUpload}><X size={14} /> ยกเลิก</button>}
              {uploadPhase === 'error' && <button type="button" onClick={retryUpload}><RotateCcw size={14} /> ลองอีกครั้ง</button>}
            </div>
          </div>
        )}

        <div className={styles.fileList} style={{ marginTop: '1rem' }}>
          {documents.map((doc) => (
            <div 
              key={doc.id || doc.filename} 
              className={`${styles.fileItem} ${activeFile?.filename === doc.filename ? styles.active : ''}`}
            >
              <div 
                style={{ flex: 1, cursor: 'pointer', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }} 
                onClick={() => selectDocument(doc)}
                title={!isSidebarExpanded ? doc.title : undefined}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', minWidth: 0 }}>
                  <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={20} strokeWidth={activeFile?.filename === doc.filename ? 2.5 : 2} />
                  </span>
                  {isSidebarExpanded && (
                    editingFileId === doc.filename ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => handleRenameSubmit(doc.filename)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleRenameSubmit(doc.filename);
                          } else if (e.key === 'Escape') {
                            setEditingFileId(null);
                          }
                        }}
                        autoFocus
                        style={{ flex: 1, minWidth: 0, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--primary-color)', color: 'white', padding: '2px 4px', borderRadius: '4px', outline: 'none' }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className={styles.fileName} style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {doc.title}
                      </span>
                    )
                  )}
                </div>
                {isSidebarExpanded && doc.createdAt && <span className={styles.fileDate} style={{ display: 'block', paddingLeft: '28px' }}>{new Date(doc.createdAt).toLocaleDateString()}</span>}
              </div>
              {isSidebarExpanded && (
                <div style={{ position: 'relative' }}>
                  <button 
                    onClick={(e) => { 
                      e.preventDefault(); 
                      e.stopPropagation(); 
                      setOpenDropdownId(openDropdownId === doc.filename ? null : doc.filename); 
                    }}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 100 }}
                    title="More actions"
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <MoreVertical size={18} />
                  </button>
                  
                  {openDropdownId === doc.filename && (
                    <>
                      <div 
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 90 }} 
                        onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); }}
                      />
                      <div className={styles.dropdownMenu} style={{ zIndex: 100 }}>
                        <button className={styles.dropdownItem} onClick={(e) => { 
                          e.stopPropagation(); 
                          setEditingFileId(doc.filename);
                          setEditTitle(doc.title);
                          setOpenDropdownId(null); 
                        }}>
                          <Edit2 size={14} /> เปลี่ยนชื่อ
                        </button>
                        <button className={styles.dropdownItem} onClick={(e) => { e.stopPropagation(); alert('ฟีเจอร์แชร์กำลังพัฒนา'); setOpenDropdownId(null); }}>
                          <Share2 size={14} /> แชร์
                        </button>
                        <button className={`${styles.dropdownItem} ${styles.delete}`} onClick={(e) => { e.stopPropagation(); handleDeleteFile(doc.filename); setOpenDropdownId(null); }}>
                          <Trash2 size={14} /> ลบ
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
          {documents.length === 0 && isSidebarExpanded && <p className={styles.emptyFiles}>{t('dash_no_files')}</p>}
        </div>
      </aside>

      <main className={`${styles.workspace} ${mobilePane === 'files' ? styles.mobileHidden : ''}`}>
        <section className={`${styles.pdfPane} ${mobilePane !== 'pdf' ? styles.mobileHidden : ''}`}>
          <div className={styles.paneHeader}>
            {t('dash_pdf_viewer')} {activeFile ? `[ ${activeFile.title} ]` : ''}
          </div>
          {activeFile ? (
            <iframe 
              src={`/api/files/${activeFile.filename}`} 
              className={styles.pdfViewer}
              title="PDF Viewer"
            />
          ) : (
            <div
              className={`${styles.emptyUpload} ${isDragging ? styles.dragging : ''}`}
              onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <div className={styles.emptyUploadIcon}><Upload size={30} /></div>
              <h2>เริ่มเรียนรู้จาก PDF ของคุณ</h2>
              <p>ลากไฟล์มาวาง หรือเลือกไฟล์จากอุปกรณ์</p>
              <span>รองรับ PDF · สูงสุด {MAX_PDF_FILE_SIZE_MB}MB</span>
              <label htmlFor="file-upload" className={styles.primaryUploadButton}>เลือกไฟล์ PDF</label>
              <small><LockKeyhole size={13} /> ไฟล์เก็บแยกตามบัญชี ลบได้ทุกเมื่อ · <Link href="/privacy">นโยบายข้อมูล</Link></small>
            </div>
          )}
        </section>

        <section className={`${styles.chatPane} ${mobilePane !== 'ai' ? styles.mobileHidden : ''}`}>
          <div className={`${styles.paneHeader} ${styles.chatHeader}`}>
            <span>
              {t('dash_ai_interface')} {activeFile ? `[ ${t('dash_connected')} ${activeFile.filename.substring(0,8)}... ]` : `[ ${t('dash_standby')} ]`}
            </span>
            <label className={styles.providerLabel}>
              <Cpu size={16} aria-hidden="true" />
              <select
                value={selectedProvider}
                onChange={(event) => {
                  const provider = event.target.value as ProviderId;
                  setSelectedProvider(provider);
                  setToolData(null);
                  setActiveTab('chat');
                }}
                aria-label="เลือกโมเดล AI"
                className={styles.providerSelect}
              >
                {providerOptions.map((option) => (
                  <option key={option.id} value={option.id} disabled={!option.configured}>
                    {option.name} - {option.model}{option.configured ? '' : ' (ยังไม่มี API key)'}
                  </option>
                ))}
              </select>
            </label>
          </div>
          
          {activeFile && (
            <div className={styles.learningTabs} role="tablist" aria-label="เครื่องมือการเรียนรู้">
              {learningTabs.map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => tab.id === 'chat' ? setActiveTab('chat') : loadTool(tab.id)}
                    className={activeTab === tab.id ? styles.learningTabActive : ''}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                  >
                    <TabIcon size={16} aria-hidden="true" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          )}
          
          <div className={styles.chatBody}>
            {activeTab === 'chat' ? (
              <>
                <div className={styles.chatHistory} ref={chatHistoryRef}>
                  {messages.length === 0 ? (
                    <div className={styles.emptyChat}>
                      <MessageSquare size={30} />
                      <h3>{activeFile ? 'ถามอะไรก็ได้จากเอกสารนี้' : 'เลือกหรืออัปโหลด PDF เพื่อเริ่มสนทนา'}</h3>
                      <p>{activeFile ? 'AI จะตอบโดยยึดข้อมูลในเอกสารเป็นหลัก' : 'เมื่อ PDF พร้อมใช้งาน คุณจะสรุป ถามตอบ และสร้างสื่อทบทวนได้ที่นี่'}</p>
                    </div>
                  ) : (
            messages.map((msg, index) => (
              <div key={index} className={`${styles.message} ${msg.role === 'user' ? styles.userMessage : styles.aiMessage}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className={styles.role} style={{ marginBottom: 0 }}>
                    {msg.role === 'user' ? t('dash_user') : 'AI Assistant'}
                  </span>
                </div>
                {renderMessageContent(msg.content)}
                {msg.role !== 'user' && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <button 
                      onClick={() => toggleSpeech(msg.content, index)}
                      style={{ 
                        background: 'transparent', 
                        border: 'none', 
                        color: playingMessageIndex === index ? 'var(--primary-color)' : 'var(--text-secondary)', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '6px',
                        borderRadius: '50%',
                        transition: 'all 0.2s',
                        backgroundColor: playingMessageIndex === index ? 'rgba(255, 215, 0, 0.1)' : 'transparent'
                      }}
                      title={playingMessageIndex === index ? "หยุดอ่าน" : "ให้ AI อ่านข้อความ"}
                      onMouseOver={(e) => { if (playingMessageIndex !== index) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'; }}
                      onMouseOut={(e) => { if (playingMessageIndex !== index) e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      {playingMessageIndex === index ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
                  {isTyping && messages[messages.length - 1]?.content === '' && (
                    <div className={`${styles.message} ${styles.aiMessage}`}>
                      <span className={styles.role}>{t('dash_system')}</span>
                      <div className={styles.loadingRow} role="status" aria-live="polite">
                        <div className={styles.loadingSpinner}></div>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontStyle: 'italic' }}>
                          {loadingSteps[loadingStepIdx]}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {activeFile && !isTyping && (
                  <div className={styles.promptSuggestions} aria-label="คำถามแนะนำ">
                    {promptSuggestions.map((suggestion) => (
                      <button type="button" key={suggestion} onClick={() => submitQuery(suggestion)}>{suggestion}</button>
                    ))}
                  </div>
                )}

                <div className={styles.chatInputArea}>
                  <form onSubmit={handleAskAI} className={styles.chatForm}>
                    <input 
                      type="text"
                      className={styles.queryInput} 
                      placeholder={activeFile ? t('dash_enter_query') : t('dash_select_first')}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      disabled={!activeFile || isTyping}
                      aria-label="คำถามสำหรับ AI"
                    />
                    <button type="submit" className={styles.sendBtn} disabled={!activeFile || !query.trim() || isTyping}>
                      {t('dash_send')}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className={styles.toolPane}>
                {isToolLoading ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem' }}>
                    <div className={styles.loadingSpinner} style={{ margin: '0 auto 1rem auto' }}></div>
                    <p style={{ marginTop: '1rem' }}>AI is generating your {activeTab}... This might take a few seconds.</p>
                  </div>
                ) : toolData ? (
                  activeTab === 'summary' ? <DocumentSummary data={toolData} /> :
                  activeTab === 'quiz' ? <QuizApp data={toolData} /> :
                  activeTab === 'flashcard' ? <FlashcardApp data={toolData} /> :
                  activeTab === 'schedule' ? <StudySchedule data={toolData} /> : null
                ) : null}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
