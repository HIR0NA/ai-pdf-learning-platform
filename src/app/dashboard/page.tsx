'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './dashboard.module.css';
import { useLanguage } from '@/context/LanguageContext';
import QuizApp from '@/components/QuizApp';
import FlashcardApp from '@/components/FlashcardApp';
import StudySchedule from '@/components/StudySchedule';
import DocumentSummary from '@/components/DocumentSummary';
import { CalendarDays, ChevronLeft, ChevronRight, FileText, Layers, LayoutDashboard, ListChecks, MessageSquare, Upload, MoreVertical, Edit2, Share2, Trash2, Volume2, VolumeX } from 'lucide-react';
import Link from 'next/link';

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setStatus('ERR: INVALID_FORMAT (PDF ONLY)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setStatus('ERR: SIZE_LIMIT_EXCEEDED (MAX 10MB)');
      return;
    }

    setStatus('UPLOADING...');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('UPLOAD_SUCCESS');
        await fetchDocuments();
        // Set the new file as active
        const newFile = { filename: data.filename, title: file.name };
        setActiveFile(newFile);
        setMessages([{ role: 'ai', content: `อ่าน PDF "${file.name}" เรียบร้อยแล้ว คุณสามารถถามข้อมูลจากเอกสารได้` }]);
        await loadTool('summary', data.filename);
        setTimeout(() => setStatus(''), 3000);
      } else {
        setStatus(`ERR: ${data.error || 'UPLOAD_FAILED'}`);
      }
    } catch (error) {
      setStatus('ERR: NETWORK_ERROR');
    }
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
        body: JSON.stringify({ query: userMessage.content, filename: activeFile.filename }),
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
        body: JSON.stringify({ type, filename: targetFilename })
      });
      const json = await res.json();
      if (res.ok) {
        setToolData(json.data);
      } else {
        alert(json.error || 'Failed to generate tool data');
        setActiveTab('chat');
      }
    } catch (e) {
      alert('Error fetching tool data');
      setActiveTab('chat');
    } finally {
      setIsToolLoading(false);
    }
  };

  const selectDocument = async (doc: any) => {
    setActiveFile(doc);
    setActiveTab('chat');
    setToolData(null);
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
    return <span style={{whiteSpace: 'pre-wrap'}}>{content}</span>;
  };

  return (
    <div className={styles.container}>
      <aside className={`${styles.sidebar} ${isSidebarExpanded ? styles.expanded : styles.collapsed}`}>
        <button 
          className={styles.toggleBtn} 
          onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
        >
          {isSidebarExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
        <h2 className={styles.sidebarTitle}>[ ประวัติแชท & ไฟล์ ]</h2>
        
        {isSidebarExpanded && (
          <div style={{ padding: '0 1rem 1rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Link href="/dashboard/overview" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', color: 'white', textDecoration: 'none' }}>
              <LayoutDashboard size={18} /> Dashboard
            </Link>
          </div>
        )}

        <div className={styles.uploadArea}>
          <label htmlFor="file-upload" className={styles.uploadLabel} title={!isSidebarExpanded ? String(t('dash_new_upload')) : undefined}>
            {isSidebarExpanded ? t('dash_new_upload') : <Upload size={16} />}
          </label>
          <input 
            type="file" 
            accept="application/pdf" 
            onChange={handleFileChange}
            id="file-upload"
            className={styles.fileInput}
          />
          {isSidebarExpanded && status && <span className={styles.status} style={{ color: status.startsWith('ERR') ? '#ff003c' : 'var(--primary-color)' }}>{status}</span>}
        </div>

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
          {documents.length === 0 && isSidebarExpanded && <p style={{color: 'var(--text-secondary)', fontSize: '0.8rem', padding: '1rem'}}>{t('dash_no_files')}</p>}
        </div>
      </aside>

      <main className={styles.workspace}>
        <section className={styles.pdfPane}>
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
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)'}}>
              {t('dash_select_preview')}
            </div>
          )}
        </section>

        <section className={styles.chatPane}>
          <div className={styles.paneHeader}>
            {t('dash_ai_interface')} {activeFile ? `[ ${t('dash_connected')} ${activeFile.filename.substring(0,8)}... ]` : `[ ${t('dash_standby')} ]`}
          </div>
          
          {activeFile && (
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(0, 255, 255, 0.2)', background: 'rgba(0,0,0,0.2)' }}>
              {learningTabs.map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => tab.id === 'chat' ? setActiveTab('chat') : loadTool(tab.id)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: activeTab === tab.id ? 'rgba(0, 255, 255, 0.1)' : 'transparent',
                      border: 'none',
                      borderBottom: activeTab === tab.id ? '2px solid var(--primary-color)' : '2px solid transparent',
                      color: activeTab === tab.id ? 'var(--primary-color)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <TabIcon size={16} aria-hidden="true" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          )}
          
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {activeTab === 'chat' ? (
              <>
                <div className={styles.chatHistory} ref={chatHistoryRef}>
                  {messages.length === 0 ? (
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)'}}>
              <h3>{t('dash_select_or_upload' as any)}</h3>
              <p>{t('dash_welcome' as any)}</p>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className={styles.loadingSpinner}></div>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontStyle: 'italic' }}>
                          {loadingSteps[loadingStepIdx]}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className={styles.chatInputArea}>
                  <form onSubmit={handleAskAI} className={styles.chatForm}>
                    <input 
                      type="text" 
                      className={styles.queryInput} 
                      placeholder={activeFile ? t('dash_enter_query') : t('dash_select_first')}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      disabled={!activeFile || isTyping}
                    />
                    <button type="submit" className={styles.sendBtn} disabled={!activeFile || !query.trim() || isTyping}>
                      &gt; {t('dash_send')}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
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
