import React, { useState } from 'react'
import { ArrowRight, Search, FileText, CheckCircle, Loader, Sparkles, Database, Layers } from 'lucide-react'
import bgDark from '@/assets/images/image.webp'
import { getBookInfo } from 'turath-sdk'

type Step = 1 | 2 | 3 | 4 | 5

export default function DataIngestionAdmin({ onExit }: { onExit: () => void }) {
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [processingLogs, setProcessingLogs] = useState<string[]>([])
  
  // API Config
  const API_URL = 'http://127.0.0.1:8001/api/v1/data-ingestion'
  
  // States
  const [source, setSource] = useState<'shamela' | 'turath'>('shamela')
  const [customShamelaId, setCustomShamelaId] = useState('')
  const [previewBook, setPreviewBook] = useState<{title: string, author: string, url: string} | null>(null)
  const [lastProcessedBookId, setLastProcessedBookId] = useState<number | null>(null)
  const [turathPageText, setTurathPageText] = useState<{mainText: string, footnotes: string} | null>(null)
  const [turathPreviewPageNum, setTurathPreviewPageNum] = useState<number>(15)

  // Custom Metadata States
  const [metaAuthor, setMetaAuthor] = useState('')
  const [metaAuthorDeath, setMetaAuthorDeath] = useState('')
  const [metaHijriCentury, setMetaHijriCentury] = useState('')
  const [metaDomain, setMetaDomain] = useState('عام')
  const [metaMadhhab, setMetaMadhhab] = useState('عام')

  // Available Domains and their subcategories
  const availableDomains = [
    "عام",
    "الفقه",
    "العقيدة",
    "السيرة",
    "التفسير",
    "النحو والصرف",
    "التاريخ",
    "اعراب القرآن",
    "البلاغه والشعر",
    "الحديث",
    "الرقاق والآداب والأذكار"
  ];

  const domainSubcategories: Record<string, string[]> = {
    "الفقه": ["حنبلي", "شافعي", "مالكي", "حنفي", "عام", "مقارن", "أصول الفقه", "القواعد الفقهيه"],
    "السيرة": ["السيرة الشاملة", "المغازي والسرايا", "الشمائل والصفات", "دلائل النبوة", "الخصائص النبوية", "جوامع السيرة", "عام"],
    "التفسير": ["التفسر بالمأثور", "التفسر بالرأي", "الجامع بين فني الرواية والدراية", "عام"],
    "النحو والصرف": ["نحو", "صرف", "نحو وصرف", "عام"],
    "التاريخ": ["التاريخ العام", "التراجم والطبقات", "تواريخ المدن والبلدان", "الأنساب والقبائل", "تاريخ الخلفاء", "تاريخ الدول", "ثقافة عامة وتاريخ", "عام"],
    "الحديث": ["المسانيد", "المعجمات", "الموطآت والمصنفات", "الصحاح", "السنن", "المستدركات", "المستخرجات", "المجامع", "التخريج", "الأطراف", "العلل والسؤالات", "الضعيف", "الموضوعة", "مصطلح الحديث", "شروح الحديث", "أحاديث الأحكام", "الترغيب والترهيب", "عام"],
    "الرقاق والآداب والأذكار": ["الرقائق", "الآداب", "الأذكار", "عام"],
  };

  const handleDomainChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDomain = e.target.value;
    setMetaDomain(newDomain);
    const subcats = domainSubcategories[newDomain];
    if (subcats && subcats.length > 0) {
        setMetaMadhhab(subcats[0]);
    } else {
        setMetaMadhhab("عام");
    }
  };

  // 1. Search & Preview
  const handlePreviewBook = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!customShamelaId) return
      setLoading(true)
      setMessage(`جاري البحث عن الكتاب في ${source === 'shamela' ? 'الشاملة' : 'منصة تراث'}...`)
      setPreviewBook(null)
      try {
          if (source === 'shamela') {
              const res = await fetch(`${API_URL}/shamela-book-preview/${customShamelaId}`)
              if (res.ok) {
                  const data = await res.json()
                  setPreviewBook(data)
                  setMetaAuthor(data.author || '')
                  setMetaDomain('عام')
                  setMetaMadhhab('عام')
                  setMessage('تم العثور على الكتاب بنجاح!')
              } else {
                  const err = await res.json()
                  setMessage(`خطأ: ${err.detail || 'لم يتم العثور على الكتاب'}`)
              }
          } else {
              // Turath Preview via Backend to avoid CORS
              const res = await fetch(`${API_URL}/turath-book-preview/${customShamelaId}`)
              if (res.ok) {
                  const data = await res.json()
                  setPreviewBook(data)
                  setMetaAuthor(data.author || '')
                  setMetaDomain('عام')
                  setMetaMadhhab('عام')
                  setMessage('تم العثور على الكتاب بنجاح في منصة تراث!')
              } else {
                  const err = await res.json()
                  setMessage(`خطأ: ${err.detail || 'لم يتم العثور على الكتاب في منصة تراث'}`)
              }
          }
      } catch (err: any) {
          setMessage(`خطأ في الاتصال: ${err.message}`)
      } finally {
          setLoading(false)
      }
  }

  const handlePreviewTurathPage = async (e: React.MouseEvent) => {
      e.preventDefault();
      if (!customShamelaId) return;
      setLoading(true);
      setMessage('جاري جلب صفحة لمعاينتها...');
      try {
          // Fetching specific page via our Python backend proxy to avoid CORS
          const res = await fetch(`${API_URL}/turath-page-preview/${customShamelaId}/${turathPreviewPageNum}`);
          if (!res.ok) {
              throw new Error(`لم نتمكن من جلب الصفحة. ربما لا يوجد صفحة ${turathPreviewPageNum} في هذا الكتاب.`);
          }
          const page = await res.json();
          if (!page.text) {
              throw new Error('لم نجد نص في هذه الصفحة.');
          }
          const parts = page.text.split('\n_________\n');
          setTurathPageText({
              mainText: parts[0],
              footnotes: parts[1] || ''
          });
          setMessage('تم جلب الصفحة بنجاح.');
      } catch (err: any) {
          setMessage(`خطأ في جلب الصفحة: ${err.message}`);
      } finally {
          setLoading(false);
      }
  }

  // 2. Extraction
  const handleExtractBook = async () => {
      if (!customShamelaId) return
      setLoading(true)
      setMessage(`جاري الاستخراج... سيتم تحويل الكتاب رقم ${customShamelaId} إلى صيغة JSON.`)
      setProcessingLogs([`[النظام] بدء استخراج الكتاب رقم ${customShamelaId} من ${source === 'shamela' ? 'الشاملة' : 'تراث'}...`])
      try {
          const endpoint = source === 'shamela' ? 'extract-shamela' : 'extract-turath'
          const url = new URL(`${API_URL}/${endpoint}`)
          url.searchParams.append('book_id', customShamelaId)
          if (metaDomain) url.searchParams.append('domain', metaDomain)
          if (metaMadhhab) url.searchParams.append('madhhab', metaMadhhab)
          if (metaAuthor) url.searchParams.append('author', metaAuthor)
          if (metaAuthorDeath) url.searchParams.append('author_death', metaAuthorDeath)
          if (metaHijriCentury) url.searchParams.append('hijri_century', metaHijriCentury)
          
          const res = await fetch(url.toString(), { method: 'POST' })
          const result = await res.json()
          
          if (res.ok) {
              setLastProcessedBookId(Number(customShamelaId))
              setMessage('تم الاستخراج بنجاح!')
              setProcessingLogs(prev => [...prev, '[مرحلة 1] تم استخراج الكتاب وحفظه في مسار 02_extracted ✔️'])
              setTimeout(() => setCurrentStep(3), 1500) // Go to Cleaning
          } else {
              setMessage(`خطأ: ${result.detail}`)
              setProcessingLogs(prev => [...prev, `[خطأ] ${result.detail} ❌`])
          }
      } catch (err: any) {
          setMessage(`خطأ في الاتصال: ${err.message}`)
          setProcessingLogs(prev => [...prev, `[خطأ] ${err.message} ❌`])
      } finally {
          setLoading(false)
      }
  }

  // 3. Cleaning
  const handleClean = async () => {
      if (!lastProcessedBookId) return
      setLoading(true)
      setMessage('جاري التنظيف... إزالة التشكيل والشوائب وتجهيز النص.')
      setProcessingLogs(prev => [...prev, '[النظام] بدء عملية التنظيف (Cleaning)...'])
      try {
          const res = await fetch(`${API_URL}/run-preprocessing`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ stages: ["clean"], book_id: lastProcessedBookId })
          })
          
          if (res.ok) {
              setMessage('تم تنظيف الكتاب بنجاح!')
              setProcessingLogs(prev => [...prev, '[مرحلة 2] تم التنظيف وحفظ الملف في مسار 02_cleaned ✔️'])
              setTimeout(() => setCurrentStep(4), 1500) // Go to Chunking
          } else {
              const err = await res.json()
              setMessage(`خطأ في التنظيف: ${err.detail}`)
              setProcessingLogs(prev => [...prev, `[خطأ] ${err.detail} ❌`])
          }
      } catch (err: any) {
          setMessage(`خطأ: ${err.message}`)
          setProcessingLogs(prev => [...prev, `[خطأ] ${err.message} ❌`])
      } finally {
          setLoading(false)
      }
  }

  // 4. Chunking
  const handleChunking = async () => {
      if (!lastProcessedBookId) return
      setLoading(true)
      setMessage('جاري التقسيم... بناء Parent & Child Chunks.')
      setProcessingLogs(prev => [...prev, '[النظام] بدء التقسيم الذكي (Parent-Child Chunking)...'])
      try {
          const res = await fetch(`${API_URL}/run-preprocessing`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ stages: ["chunk"], book_id: lastProcessedBookId })
          })
          
          if (res.ok) {
              setMessage('اكتملت جميع العمليات بنجاح!')
              setProcessingLogs(prev => [...prev, '[مرحلة 3] تم التقسيم وحفظ الملفات في 04_parent_child_document ✔️', '[النظام] الكتاب جاهز الآن 🚀'])
              setTimeout(() => setCurrentStep(5), 1500) // Done
          } else {
              const err = await res.json()
              setMessage(`خطأ في التقسيم: ${err.detail}`)
              setProcessingLogs(prev => [...prev, `[خطأ] ${err.detail} ❌`])
          }
      } catch (err: any) {
          setMessage(`خطأ: ${err.message}`)
          setProcessingLogs(prev => [...prev, `[خطأ] ${err.message} ❌`])
      } finally {
          setLoading(false)
      }
  }

  const stepsInfo = [
    { id: 1, title: 'البحث', icon: Search },
    { id: 2, title: 'الاستخراج', icon: Database },
    { id: 3, title: 'التنظيف', icon: Sparkles },
    { id: 4, title: 'التقسيم', icon: Layers },
  ]

  return (
    <div dir="rtl" className="relative flex h-screen w-full flex-col overflow-hidden text-foreground bg-[#0a0211]">
      {/* Background with Glassmorphism Overlay */}
      <img
        src={bgDark}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#12041f]/95 via-[#0a0211]/95 to-[#0a0211] backdrop-blur-xl" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Back Button */}
      <div className="absolute top-6 right-6 z-50">
          <button
            onClick={onExit}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/70 transition-all hover:bg-white/10 hover:text-white border border-white/10 shadow-lg backdrop-blur-md"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col gap-5 p-6 overflow-y-auto [&::-webkit-scrollbar]:hidden">
        
        {/* Stepper Component */}
        <div className="w-full shrink-0 bg-[#0f0418] border border-white/5 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.4)] relative">
            <div className="flex items-center justify-between relative px-8 max-w-3xl mx-auto">
                {/* Progress Bar Background */}
                <div className="absolute left-14 right-14 top-5 h-[2px] bg-white/5 rounded-full z-0"></div>
                {/* Progress Bar Fill */}
                <div 
                    className="absolute right-14 top-5 h-[2px] bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full z-0 transition-all duration-700 ease-out"
                    style={{ width: `calc(${((Math.min(currentStep, 4) - 1) / 3) * 100}% - 3.5rem)` }}
                ></div>
                
                {stepsInfo.map((step) => {
                    const Icon = step.icon;
                    const isActive = currentStep === step.id;
                    const isPassed = currentStep > step.id;
                    
                    return (
                        <div key={step.id} className="relative z-10 flex flex-col items-center gap-3">
                            <div 
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 relative ${
                                    isPassed 
                                        ? 'bg-emerald-500 text-[#0f0418] shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                                        : isActive 
                                        ? 'bg-[#0f0418] border-2 border-emerald-400 text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.2)] scale-110'
                                        : 'bg-[#150624] border border-white/10 text-white/20'
                                }`}
                            >
                                {/* Hide line behind icon by ensuring solid background */}
                                {isActive && (
                                    <div className="absolute inset-0 rounded-full bg-emerald-400/10 animate-ping opacity-50"></div>
                                )}
                                {isPassed ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-4 h-4 relative z-10" />}
                            </div>
                            <span className={`text-xs font-semibold tracking-wide transition-colors duration-300 ${isActive ? 'text-emerald-400' : isPassed ? 'text-white/80' : 'text-white/30'}`}>
                                {step.title}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>

        {/* Global Message Alert */}
        {message && (
            <div className={`p-3.5 shrink-0 rounded-xl flex items-center gap-3 transition-all duration-300 border backdrop-blur-md ${
                message.includes('خطأ') 
                    ? 'bg-red-900/20 border-red-500/30 text-red-300 shadow-[0_0_10px_rgba(239,68,68,0.1)]' 
                    : loading 
                    ? 'bg-blue-900/20 border-blue-500/30 text-blue-300'
                    : 'bg-emerald-900/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.05)]'
            }`}>
                {loading ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                <p className="text-sm font-medium">{message}</p>
            </div>
        )}

        {/* Step Content Area */}
        <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl p-6 shadow-xl backdrop-blur-xl flex flex-col justify-start overflow-y-auto min-h-[300px] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent">
            
            {/* Step 1: Search */}
            {currentStep === 1 && (
                <div className="w-full max-w-md mx-auto flex flex-col items-center animate-in fade-in zoom-in duration-500 mt-2 pb-4">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
                        <Search className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">البحث عن كتاب</h2>
                    <p className="text-white/40 mb-6 text-sm text-center">أدخل رقم الكتاب (ID) من المكتبة لجلب بياناته ومعاينتها.</p>
                    
                    <div className="w-full flex bg-black/40 rounded-xl p-1 mb-4 border border-white/10">
                        <button 
                            type="button"
                            onClick={() => setSource('shamela')}
                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${source === 'shamela' ? 'bg-emerald-500 text-white shadow-lg' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
                        >
                            المكتبة الشاملة
                        </button>
                        <button 
                            type="button"
                            onClick={() => setSource('turath')}
                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${source === 'turath' ? 'bg-blue-500 text-white shadow-lg' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
                        >
                            منصة تراث
                        </button>
                    </div>

                    <form onSubmit={handlePreviewBook} className="w-full flex flex-col gap-3">
                        <div className="relative">
                            <input 
                                type="number" 
                                value={customShamelaId}
                                onChange={(e) => setCustomShamelaId(e.target.value)}
                                placeholder="مثال: 4851"
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all text-center placeholder:text-white/20"
                                required 
                            />
                        </div>
                        
                        <button 
                            type="submit"
                            disabled={loading || !customShamelaId}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-semibold text-sm hover:from-emerald-500 hover:to-teal-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                        >
                            {loading && !previewBook ? <Loader className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            بحث ومعاينة
                        </button>
                    </form>

                    {/* Preview Card */}
                    {previewBook && (
                        <div className="w-full mt-6 p-5 bg-white/[0.03] border border-emerald-500/20 rounded-xl flex flex-col gap-4 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="flex flex-col items-center text-center gap-1.5">
                                <h4 className="text-lg font-bold text-emerald-400">{previewBook.title}</h4>
                                <p className="text-white/60 text-sm">المؤلف: {previewBook.author}</p>
                                <a href={previewBook.url} target="_blank" rel="noopener noreferrer" className="text-emerald-400/60 hover:text-emerald-400 text-xs underline mt-1 transition-colors flex items-center gap-1">
                                    فتح الكتاب في الموقع
                                </a>
                            </div>
                            
                            <button 
                                onClick={() => setCurrentStep(2)}
                                className="mt-2 w-full py-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-black font-semibold text-sm transition-all flex items-center justify-center gap-2"
                            >
                                <CheckCircle className="w-4 h-4" />
                                تأكيد وبدء المعالجة
                            </button>

                            {source === 'turath' && (
                                <div className="mt-2 flex gap-2">
                                    <input 
                                        type="number"
                                        value={turathPreviewPageNum}
                                        onChange={(e) => setTurathPreviewPageNum(Number(e.target.value))}
                                        className="w-20 bg-black/40 border border-blue-500/30 rounded-lg text-center text-sm text-white outline-none focus:border-blue-500 transition-all placeholder:text-white/20"
                                        min="1"
                                        title="رقم الصفحة"
                                    />
                                    <button 
                                        onClick={handlePreviewTurathPage}
                                        className="flex-1 py-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500 hover:text-white font-semibold text-sm transition-all flex items-center justify-center gap-2"
                                    >
                                        <FileText className="w-4 h-4" />
                                        تجربة النص
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {turathPageText && (
                        <div className="w-full mt-4 p-5 bg-[#0a0211] border border-blue-500/30 rounded-xl flex flex-col gap-4 max-h-[400px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-blue-500/30 [&::-webkit-scrollbar-track]:bg-transparent animate-in slide-in-from-bottom-4 duration-500">
                            <h3 className="text-lg font-bold text-blue-400 mb-2 border-b border-blue-500/30 pb-2">معاينة صفحة {turathPreviewPageNum} من منصة تراث</h3>
                            <div 
                                className="text-lg leading-loose text-white/90 text-right"
                                dangerouslySetInnerHTML={{ __html: turathPageText.mainText }} 
                            />
                            {turathPageText.footnotes && (
                                <div className="mt-6 pt-4 border-t border-gray-600/50">
                                    <h4 className="text-sm font-bold text-gray-400 mb-2 text-right">الحواشي:</h4>
                                    <div className="text-sm leading-relaxed text-gray-500 text-right whitespace-pre-line">
                                        {turathPageText.footnotes}
                                    </div>
                                </div>
                            )}
                            <button onClick={() => setTurathPageText(null)} className="mt-4 text-xs text-red-400 hover:text-red-300 font-semibold self-start">
                                إغلاق المعاينة
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Step 2: Extraction */}
            {currentStep === 2 && (
                <div className="w-full max-w-xl mx-auto flex flex-col items-center animate-in fade-in zoom-in duration-500 mt-2">
                    <div className="w-14 h-14 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                        <Database className="w-6 h-6 text-blue-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">إعدادات الكتاب واستخراجه</h2>
                    <p className="text-white/50 mb-6 text-sm leading-relaxed text-center">
                        الكتاب: <span className="text-emerald-400 font-semibold">{previewBook?.title}</span>.<br/>
                        يرجى مراجعة وتعديل بيانات الكتاب (Metadata) قبل بدء الاستخراج.
                    </p>
                    
                    <div className="w-full grid grid-cols-2 gap-4 mb-6 text-right">
                        <div className="col-span-2">
                            <label className="block text-white/70 text-xs mb-1.5 ml-1">اسم المؤلف (Author)</label>
                            <input 
                                type="text" value={metaAuthor} onChange={(e) => setMetaAuthor(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                placeholder="مثال: ابن تيمية"
                            />
                        </div>
                        <div>
                            <label className="block text-white/70 text-xs mb-1.5 ml-1">سنة الوفاة (Author Death)</label>
                            <input 
                                type="text" value={metaAuthorDeath} onChange={(e) => setMetaAuthorDeath(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                placeholder="مثال: 728 أو معاصر"
                            />
                        </div>
                        <div>
                            <label className="block text-white/70 text-xs mb-1.5 ml-1">القرن الهجري (Hijri Century)</label>
                            <input 
                                type="number" value={metaHijriCentury} onChange={(e) => setMetaHijriCentury(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                placeholder="مثال: 8"
                            />
                        </div>
                        <div>
                            <label className="block text-white/70 text-xs mb-1.5 ml-1">المجال (Domain)</label>
                            <div className="relative">
                                <select 
                                    value={metaDomain} onChange={handleDomainChange}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all appearance-none cursor-pointer"
                                >
                                    {availableDomains.map(domain => (
                                        <option key={domain} value={domain} className="bg-[#150624] text-white">
                                            {domain}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/50">
                                    ▼
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-white/70 text-xs mb-1.5 ml-1">المذهب / التخصص (Madhhab)</label>
                            {domainSubcategories[metaDomain] ? (
                                <div className="relative">
                                    <select 
                                        value={metaMadhhab} onChange={(e) => setMetaMadhhab(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all appearance-none cursor-pointer"
                                    >
                                        {domainSubcategories[metaDomain].map(subcat => (
                                            <option key={subcat} value={subcat} className="bg-[#150624] text-white">
                                                {subcat}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/50">
                                        ▼
                                    </div>
                                </div>
                            ) : (
                                <input 
                                    type="text" value={metaMadhhab} onChange={(e) => setMetaMadhhab(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                    placeholder="مثال: عام"
                                />
                            )}
                        </div>
                    </div>

                    <button 
                        onClick={handleExtractBook}
                        disabled={loading}
                        className="w-full max-w-sm py-3 rounded-xl bg-blue-600/90 text-white font-semibold text-sm hover:bg-blue-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                    >
                        {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                        {loading ? 'جاري الاستخراج...' : 'حفظ البيانات وبدء الاستخراج'}
                    </button>
                </div>
            )}

            {/* Step 3: Cleaning */}
            {currentStep === 3 && (
                <div className="w-full max-w-md mx-auto flex flex-col items-center animate-in fade-in zoom-in duration-500 text-center mt-6">
                    <div className="w-14 h-14 bg-amber-500/10 rounded-full flex items-center justify-center mb-4">
                        <Sparkles className="w-6 h-6 text-amber-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">تنظيف النص</h2>
                    <p className="text-white/50 mb-6 text-sm leading-relaxed">
                        جاري إزالة التشكيل والشوائب وتجهيز النص للذكاء الاصطناعي.
                    </p>
                    
                    <button 
                        onClick={handleClean}
                        disabled={loading}
                        className="w-full py-3 rounded-xl bg-amber-600/90 text-white font-semibold text-sm hover:bg-amber-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_0_15px_rgba(217,119,6,0.2)]"
                    >
                        {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {loading ? 'جاري التنظيف...' : 'بدء التنظيف'}
                    </button>
                </div>
            )}

            {/* Step 4: Chunking */}
            {currentStep === 4 && (
                <div className="w-full max-w-md mx-auto flex flex-col items-center animate-in fade-in zoom-in duration-500 text-center mt-6">
                    <div className="w-14 h-14 bg-purple-500/10 rounded-full flex items-center justify-center mb-4">
                        <Layers className="w-6 h-6 text-purple-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">التقسيم الذكي</h2>
                    <p className="text-white/50 mb-6 text-sm leading-relaxed">
                        تقسيم الكتاب إلى مقاطع (Parent/Child) لتحسين البحث الدلالي.
                    </p>
                    
                    <button 
                        onClick={handleChunking}
                        disabled={loading}
                        className="w-full py-3 rounded-xl bg-purple-600/90 text-white font-semibold text-sm hover:bg-purple-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_0_15px_rgba(147,51,234,0.2)]"
                    >
                        {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                        {loading ? 'جاري التقسيم...' : 'بدء التقسيم'}
                    </button>
                </div>
            )}

            {/* Step 5: Done */}
            {currentStep === 5 && (
                <div className="w-full max-w-md mx-auto flex flex-col items-center animate-in fade-in zoom-in duration-500 text-center mt-6">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                        <CheckCircle className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-emerald-400 mb-2">اكتملت المعالجة بنجاح!</h2>
                    <p className="text-white/50 mb-6 text-sm">
                        أصبح الكتاب الآن جاهزاً للاستخدام في محرك الـ RAG.
                    </p>
                    
                    <button 
                        onClick={() => {
                            setCurrentStep(1);
                            setCustomShamelaId('');
                            setPreviewBook(null);
                            setLastProcessedBookId(null);
                            setProcessingLogs([]);
                        }}
                        className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm transition-all"
                    >
                        إضافة كتاب جديد
                    </button>
                </div>
            )}
        </div>

        {/* Real-time Tracking Terminal UI */}
        {processingLogs.length > 0 && (
            <div className="w-full shrink-0 bg-black/60 border border-white/5 rounded-2xl p-4 font-mono text-xs shadow-inner backdrop-blur-md h-36 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-1.5 mb-2.5 pb-2 border-b border-white/5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                    <span className="text-white/30 ml-3 font-sans text-[10px] uppercase tracking-wider">System Logs</span>
                </div>
                {processingLogs.map((log, i) => (
                    <div key={i} className={`py-1 transition-all duration-300 animate-in fade-in ${log.includes('[خطأ]') ? 'text-red-400/90' : log.includes('✔️') || log.includes('🚀') ? 'text-emerald-400/90' : 'text-blue-300/80'}`}>
                        <span className="text-white/20 mr-1.5 select-none">&gt;</span> {log}
                    </div>
                ))}
                {loading && (
                    <div className="py-1 text-white/40 animate-pulse">
                        <span className="text-white/20 mr-1.5 select-none">&gt;</span> يرجى الانتظار...
                    </div>
                )}
            </div>
        )}

      </div>
    </div>
  )
}

