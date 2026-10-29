import React, { useState, useEffect } from 'react';
import {
  Zap,
  Database,
  ShieldCheck,
  Play,
  ArrowRight,
  RefreshCw,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Server,
  Layers,
  ChevronDown,
  ChevronUp,
  Cpu,
  Trophy,
  ExternalLink,
  BookOpen,
  Settings,
  FileText,
  Copy,
  Check,
  Plus,
  Trash2,
  Search,
  X,
  Target,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import {
  EngineMode,
  EngineStatusResponse,
  TestQueryResponse,
  CompareQueryResponse,
  ContextChunk,
  TurathCatalogBook,
  fetchEngineStatus,
  setEngineMode,
  setRerankerStatus,
  runTestQuery,
  runCompareQuery,
  fetchTurathCatalog,
  syncTurathCatalog,
  addTurathCatalogBook,
  deleteTurathCatalogBook,
  getAdminEngineBaseUrl,
  setAdminEngineBaseUrl
} from './engineControlApi';

interface EngineControlPageProps {
  onExit: () => void;
}

const RetrievedChunksViewer: React.FC<{
  chunks?: ContextChunk[];
  engineName: string;
  accentColor?: 'sky' | 'emerald' | 'purple';
}> = ({ chunks, engineName, accentColor = 'sky' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  if (!chunks || chunks.length === 0) return null;

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const colorStyles = {
    sky: {
      badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
      btn: 'text-sky-300 hover:text-sky-200 bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/30',
      card: 'bg-sky-950/30 border-sky-500/20',
      tag: 'bg-sky-500/10 text-sky-200 border-sky-500/20',
    },
    emerald: {
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      btn: 'text-emerald-300 hover:text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30',
      card: 'bg-emerald-950/30 border-emerald-500/20',
      tag: 'bg-emerald-500/10 text-emerald-200 border-emerald-500/20',
    },
    purple: {
      badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      btn: 'text-purple-300 hover:text-purple-200 bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30',
      card: 'bg-purple-950/30 border-purple-500/20',
      tag: 'bg-purple-500/10 text-purple-200 border-purple-500/20',
    },
  }[accentColor];

  return (
    <div className="pt-3 border-t border-white/10">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all border ${colorStyles.btn}`}
      >
        <div className="flex items-center gap-2">
          <FileText size={15} />
          <span>المقاطع التراثية المسندة للنموذج ({chunks.length} قطع زُوّد الموديل بها)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${colorStyles.badge}`}>
            {engineName}
          </span>
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {isOpen && (
        <div className="space-y-3 mt-3 animate-fadeIn">
          {chunks.map((chunk, idx) => {
            const hierarchyStr = Array.isArray(chunk.hierarchy)
              ? chunk.hierarchy.join(' > ')
              : chunk.hierarchy || '';

            return (
              <div
                key={chunk.parent_id || idx}
                className={`p-3.5 rounded-xl border text-xs space-y-2 transition-all ${colorStyles.card}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                  <div className="flex flex-wrap items-center gap-1.5 font-bold">
                    <span className={`px-2 py-0.5 rounded border text-[11px] ${colorStyles.tag}`}>
                      📖 {chunk.book_title || 'كتاب تراثي'}
                    </span>
                    {chunk.author && (
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/80 text-[11px]">
                        ✍️ {chunk.author}
                      </span>
                    )}
                    {chunk.chapter_title && (
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/70 text-[11px] truncate max-w-xs">
                        🔖 {chunk.chapter_title}
                      </span>
                    )}
                    {chunk.start_page && (
                      <span className="px-1.5 py-0.5 rounded bg-black/40 text-white/50 text-[10px] font-mono">
                        ص {chunk.start_page}{chunk.end_page && chunk.end_page !== chunk.start_page ? `-${chunk.end_page}` : ''}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {chunk.score !== undefined && (
                      <span className="text-[10px] font-mono text-white/50 bg-black/40 px-2 py-0.5 rounded">
                        تطابق: {(chunk.score * 100).toFixed(1)}%
                      </span>
                    )}
                    {chunk.source_url && (
                      <a
                        href={chunk.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-400 hover:text-sky-300 p-1 rounded hover:bg-white/5 transition-all"
                        title="فتح في موقع تراث"
                      >
                        <ExternalLink size={13} />
                      </a>
                    )}
                    <button
                      onClick={() => handleCopy(chunk.content, idx)}
                      className="text-white/60 hover:text-white p-1 rounded hover:bg-white/5 transition-all flex items-center gap-1 text-[10px]"
                      title="نسخ المقطع"
                    >
                      {copiedIdx === idx ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      <span>{copiedIdx === idx ? 'تم النسخ' : 'نسخ'}</span>
                    </button>
                  </div>
                </div>

                {hierarchyStr && (
                  <div className="text-[11px] text-white/50 flex items-center gap-1">
                    <span className="text-white/30">المسار:</span>
                    <span className="truncate">{hierarchyStr}</span>
                  </div>
                )}

                <div className="bg-black/40 p-3 rounded-lg border border-white/5 text-white/85 text-[11px] leading-relaxed whitespace-pre-line max-h-48 overflow-y-auto selection:bg-purple-500/30">
                  {chunk.content}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const SAMPLE_QUERIES = [
  { q: "ما هي شروط الصلاة في كتاب الروض المربع؟", domain: "فقه", label: "فقه حنبلي - الروض المربع" },
  { q: "ما حكم صلاة الجماعة في المذهب الشافعي في كتاب المجموع؟", domain: "فقه", label: "شافعي - المجموع" },
  { q: "ما حكم إزالة النجاسة بغير الماء؟", domain: "فقه", label: "مسألة طهارة مقارنة" },
  { q: "ما هي أصول الإيمان الستة وأدلتها؟", domain: "عقيدة", label: "عقيدة وأصول" },
  { q: "ما حكم قراءة الفاتحة خلف الإمام في الصلاة الجهرية؟", domain: "فقه", label: "مسألة خلافية" },
];

export const EngineControlPage: React.FC<EngineControlPageProps> = ({ onExit }) => {
  const [status, setStatus] = useState<EngineStatusResponse | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [switchingMode, setSwitchingMode] = useState<EngineMode | null>(null);
  const [togglingReranker, setTogglingReranker] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Playground state
  const [query, setQuery] = useState(SAMPLE_QUERIES[0].q);
  const [selectedDomain, setSelectedDomain] = useState('فقه');
  const [responseMode, setResponseMode] = useState('student');
  const [activeTab, setActiveTab] = useState<'single' | 'compare'>('compare');

  // Single query execution
  const [runningSingle, setRunningSingle] = useState(false);
  const [singleResult, setSingleResult] = useState<TestQueryResponse | null>(null);

  // Comparison execution
  const [runningCompare, setRunningCompare] = useState(false);
  const [compareResult, setCompareResult] = useState<CompareQueryResponse | null>(null);

  // UI helpers
  const [showCitations, setShowCitations] = useState(false);
  const [backendUrl, setBackendUrl] = useState(getAdminEngineBaseUrl());
  const [showSettings, setShowSettings] = useState(false);

  // Turath Catalog state
  const [catalogBooks, setCatalogBooks] = useState<TurathCatalogBook[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [syncingCatalog, setSyncingCatalog] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogMessage, setCatalogMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingBook, setAddingBook] = useState(false);
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    domain: 'فقه',
    madhhab: 'حنبلي',
    aliases: ''
  });

  const loadStatus = async () => {
    setLoadingStatus(true);
    setStatusError(null);
    try {
      const data = await fetchEngineStatus();
      setStatus(data);
    } catch (err: any) {
      setStatusError(err.message || 'فشل الاتصال بالباك إند');
    } finally {
      setLoadingStatus(false);
    }
  };

  const loadCatalog = async () => {
    setLoadingCatalog(true);
    try {
      const res = await fetchTurathCatalog();
      setCatalogBooks(res.books || []);
    } catch (err: any) {
      console.error('Failed to load Turath catalog:', err);
    } finally {
      setLoadingCatalog(false);
    }
  };

  const handleSyncCatalog = async () => {
    setSyncingCatalog(true);
    setCatalogMessage(null);
    try {
      const res = await syncTurathCatalog();
      setCatalogBooks(res.books || []);
      setCatalogMessage({
        type: 'success',
        text: `تمت المزامنة بنجاح من Qdrant! تم تحديث الفهرس: ${res.count} كتاباً (جديدة: ${res.added}).`
      });
      setTimeout(() => setCatalogMessage(null), 5000);
    } catch (err: any) {
      setCatalogMessage({
        type: 'error',
        text: err.message || 'فشلت المزامنة من كلاسترات Qdrant'
      });
    } finally {
      setSyncingCatalog(false);
    }
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBook.title.trim() || !newBook.author.trim()) return;
    setAddingBook(true);
    try {
      const aliasesList = newBook.aliases
        .split(',')
        .map(a => a.trim())
        .filter(Boolean);
      await addTurathCatalogBook({
        title: newBook.title.trim(),
        author: newBook.author.trim(),
        domain: newBook.domain,
        madhhab: newBook.madhhab,
        aliases: aliasesList
      });
      setShowAddModal(false);
      setNewBook({ title: '', author: '', domain: 'فقه', madhhab: 'حنبلي', aliases: '' });
      await loadCatalog();
      setCatalogMessage({
        type: 'success',
        text: `تمت إضافة الكتاب "${newBook.title}" بنجاح إلى فهرس تراث المعتمد.`
      });
      setTimeout(() => setCatalogMessage(null), 4000);
    } catch (err: any) {
      alert(`خطأ: ${err.message}`);
    } finally {
      setAddingBook(false);
    }
  };

  const handleDeleteBook = async (title: string) => {
    if (!confirm(`هل أنت متأكد من حذف كتاب "${title}" من قائمة الفهرس المعتمدة؟`)) return;
    try {
      await deleteTurathCatalogBook(title);
      await loadCatalog();
      setCatalogMessage({
        type: 'success',
        text: `تم حذف الكتاب "${title}" من الفهرس.`
      });
      setTimeout(() => setCatalogMessage(null), 4000);
    } catch (err: any) {
      alert(`خطأ أثناء الحذف: ${err.message}`);
    }
  };

  useEffect(() => {
    loadStatus();
    loadCatalog();
  }, []);

  const handleSwitchMode = async (mode: EngineMode) => {
    if (status?.engine_mode === mode) return;
    setSwitchingMode(mode);
    try {
      await setEngineMode(mode);
      await loadStatus();
    } catch (err: any) {
      alert(`خطأ أثناء التبديل: ${err.message}`);
    } finally {
      setSwitchingMode(null);
    }
  };

  const handleToggleReranker = async () => {
    if (!status) return;
    const nextState = !(status.use_reranker ?? true);
    setTogglingReranker(true);
    try {
      await setRerankerStatus(nextState);
      await loadStatus();
    } catch (err: any) {
      alert(`خطأ أثناء تعديل حالة نموذج إعادة الترتيب: ${err.message}`);
    } finally {
      setTogglingReranker(false);
    }
  };

  const handleRunSingle = async (engine: 'turath' | 'mongo') => {
    if (!query.trim()) return;
    setRunningSingle(true);
    setSingleResult(null);
    setActiveTab('single');
    try {
      const res = await runTestQuery(query, engine, selectedDomain, responseMode);
      setSingleResult(res);
    } catch (err: any) {
      setSingleResult({
        status: 'error',
        engine,
        latency_ms: 0,
        error: err.message
      });
    } finally {
      setRunningSingle(false);
    }
  };

  const handleRunCompare = async () => {
    if (!query.trim()) return;
    setRunningCompare(true);
    setCompareResult(null);
    setActiveTab('compare');
    try {
      const res = await runCompareQuery(query, selectedDomain, responseMode);
      setCompareResult(res);
    } catch (err: any) {
      alert(`خطأ أثناء المقارنة: ${err.message}`);
    } finally {
      setRunningCompare(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#0b0414] text-white p-4 md:p-8 font-sans selection:bg-purple-600 selection:text-white">
      {/* Background glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px]" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-sky-600/15 rounded-full blur-[128px]" />
        <div className="absolute -bottom-40 right-1/3 w-96 h-96 bg-emerald-600/15 rounded-full blur-[128px]" />
      </div>

      {/* Top Navbar Header */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="flex items-center gap-4">
          <button
            onClick={onExit}
            className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-white/80 hover:text-white flex items-center gap-2 group"
          >
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            <span className="text-sm font-semibold">العودة للرئيسية</span>
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-purple-300 via-sky-300 to-emerald-300 bg-clip-text text-transparent">
                إدارة محركات البحث والاسترجاع (RAG Engine Control)
              </h1>
              {status && (
                <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                  status.engine_mode === 'auto'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    : status.engine_mode === 'turath'
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}>
                  الوضع النشط: {status.engine_mode.toUpperCase()}
                </span>
              )}
            </div>
            <p className="text-sm text-white/60 mt-1">
              التبديل اللحظي بين مسار مونجو الكلاسيكي ومسار تراث السحابي واختبار المقارنة المباشرة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto relative">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-white/70 hover:text-white transition-all"
            title="تعديل رابط الباك إند"
          >
            <Settings size={14} className="text-purple-400" />
            <span className="max-w-[150px] truncate">{backendUrl}</span>
          </button>

          {showSettings && (
            <div className="absolute left-0 top-full mt-2 w-80 p-4 rounded-2xl bg-[#160829] border border-purple-500/30 shadow-2xl z-50 text-right space-y-3">
              <div className="text-xs font-bold text-white">رابط الباك إند (Backend API URL):</div>
              <input
                type="text"
                value={backendUrl}
                onChange={(e) => setBackendUrl(e.target.value)}
                placeholder="http://127.0.0.1:8550"
                className="w-full px-3 py-1.5 rounded-xl bg-black/50 border border-white/15 text-xs text-white font-mono focus:outline-none focus:border-purple-400"
              />
              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  onClick={() => {
                    const localUrl = 'http://127.0.0.1:8550';
                    setBackendUrl(localUrl);
                    setAdminEngineBaseUrl(localUrl);
                    setShowSettings(false);
                    loadStatus();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-[11px] text-white/80"
                >
                  Local 8550
                </button>
                <button
                  onClick={() => {
                    setAdminEngineBaseUrl(backendUrl);
                    setShowSettings(false);
                    loadStatus();
                  }}
                  className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-md"
                >
                  حفظ وتحديث
                </button>
              </div>
            </div>
          )}

          <button
            onClick={loadStatus}
            disabled={loadingStatus}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white/80 transition-all hover:text-white disabled:opacity-50"
          >
            <RefreshCw size={14} className={loadingStatus ? 'animate-spin text-purple-400' : ''} />
            <span>تحديث التشخيص</span>
          </button>
        </div>
      </header>

      {statusError && (
        <div className="max-w-7xl mx-auto mt-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-200 text-sm flex items-center gap-3">
          <AlertTriangle size={18} className="shrink-0 text-red-400" />
          <span>تنبيه: {statusError}. تأكد من تشغيل خادم FastAPI للباك إند.</span>
        </div>
      )}

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto mt-8 space-y-8">
        
        {/* SECTION 1: MODE SWITCHER CARDS */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-white/90">
              <Cpu size={20} className="text-purple-400" />
              <span>اختيار نمط المحرك النشط (Active Engine Selection)</span>
            </h2>
            <span className="text-xs text-white/50">يتم الحفظ تلقائياً في السيرفر وتطبيقه على كافة الطلبات</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Turath Mode */}
            <div
              onClick={() => handleSwitchMode('turath')}
              className={`cursor-pointer relative rounded-3xl p-6 transition-all duration-300 border flex flex-col justify-between ${
                status?.engine_mode === 'turath'
                  ? 'bg-sky-950/40 border-sky-400/60 shadow-[0_0_35px_rgba(56,189,248,0.25)] ring-2 ring-sky-400/40'
                  : 'bg-white/[0.03] border-white/10 hover:border-sky-500/40 hover:bg-white/[0.06]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    <Zap size={26} />
                  </div>
                  {status?.engine_mode === 'turath' && (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-500 text-black">
                      <CheckCircle2 size={13} />
                      المفعل حالياً
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-sky-200 mb-2">⚡ مسار تراث السحابي (Turath Stateless)</h3>
                <p className="text-xs text-white/70 leading-relaxed mb-4">
                  مسار فائق السرعة يعتمد على سحب نصوص الفصول الأصلية لحظياً من CDN تراث الرسمي بدون استهلاك مساحة القرص أو الرام.
                </p>
                <div className="space-y-1.5 text-[11px] text-white/60 font-mono">
                  <div className="flex items-center justify-between">
                    <span>استهلاك مونجو:</span>
                    <span className="text-emerald-400 font-bold">0% (مغلق بالكامل)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>تخزين القرص:</span>
                    <span className="text-emerald-400 font-bold">0% (Stateless)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>الكلاسترات:</span>
                    <span className="text-sky-300">Qdrant Cloud Multi-Cluster</span>
                  </div>
                </div>
              </div>
              
              <button
                disabled={switchingMode !== null || status?.engine_mode === 'turath'}
                className={`mt-6 w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  status?.engine_mode === 'turath'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 cursor-default'
                    : 'bg-sky-500 hover:bg-sky-400 text-black shadow-lg shadow-sky-500/20'
                }`}
              >
                {switchingMode === 'turath' ? <RefreshCw size={14} className="animate-spin" /> : null}
                <span>{status?.engine_mode === 'turath' ? 'الوضع النشط' : 'تفعيل مسار تراث الآن'}</span>
              </button>
            </div>

            {/* Card 2: Auto Hybrid Mode (Recommended) */}
            <div
              onClick={() => handleSwitchMode('auto')}
              className={`cursor-pointer relative rounded-3xl p-6 transition-all duration-300 border flex flex-col justify-between ${
                status?.engine_mode === 'auto'
                  ? 'bg-purple-950/40 border-purple-400/60 shadow-[0_0_35px_rgba(168,85,247,0.25)] ring-2 ring-purple-400/40'
                  : 'bg-white/[0.03] border-white/10 hover:border-purple-500/40 hover:bg-white/[0.06]'
              }`}
            >
              <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md">
                ⭐ الوضع الموصى به
              </div>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    <ShieldCheck size={26} />
                  </div>
                  {status?.engine_mode === 'auto' && (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500 text-white">
                      <CheckCircle2 size={13} />
                      المفعل حالياً
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-purple-200 mb-2">🛡️ الوضع الهجين الذكي (Smart Auto-Router)</h3>
                <p className="text-xs text-white/70 leading-relaxed mb-4">
                  تراث هو المحرك الأساسي دائماً لسرعته وتوفيره. وفي حال حدوث أي خطأ شبكة أو انقطاع أو عدم توفر نتائج، يتحول تلقائياً إلى مونجو (Automatic Fallback).
                </p>
                <div className="space-y-1.5 text-[11px] text-white/60 font-mono">
                  <div className="flex items-center justify-between">
                    <span>المحرك الأساسي:</span>
                    <span className="text-sky-300 font-bold">Turath Stateless</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>بديل الطوارئ:</span>
                    <span className="text-emerald-300 font-bold">Mongo Hybrid</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>الأمان التشغيلي:</span>
                    <span className="text-purple-300">100% Zero-Downtime</span>
                  </div>
                </div>
              </div>

              <button
                disabled={switchingMode !== null || status?.engine_mode === 'auto'}
                className={`mt-6 w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  status?.engine_mode === 'auto'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 cursor-default'
                    : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30'
                }`}
              >
                {switchingMode === 'auto' ? <RefreshCw size={14} className="animate-spin" /> : null}
                <span>{status?.engine_mode === 'auto' ? 'الوضع النشط' : 'تفعيل الوضع الهجين الآن'}</span>
              </button>
            </div>

            {/* Card 3: Mongo Mode */}
            <div
              onClick={() => handleSwitchMode('mongo')}
              className={`cursor-pointer relative rounded-3xl p-6 transition-all duration-300 border flex flex-col justify-between ${
                status?.engine_mode === 'mongo'
                  ? 'bg-emerald-950/40 border-emerald-400/60 shadow-[0_0_35px_rgba(52,211,153,0.25)] ring-2 ring-emerald-400/40'
                  : 'bg-white/[0.03] border-white/10 hover:border-emerald-500/40 hover:bg-white/[0.06]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <Database size={26} />
                  </div>
                  {status?.engine_mode === 'mongo' && (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-black">
                      <CheckCircle2 size={13} />
                      المفعل حالياً
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-emerald-200 mb-2">🍃 مسار مونجو الكلاسيكي (Mongo Enterprise)</h3>
                <p className="text-xs text-white/70 leading-relaxed mb-4">
                  المسار الكلاسيكي الأصلي الذي يعتمد على استدعاء كلاسترات MongoDB الـ 12 المقسمة حسب الفنون الشرعية والمذاهب الأربعة.
                </p>
                <div className="space-y-1.5 text-[11px] text-white/60 font-mono">
                  <div className="flex items-center justify-between">
                    <span>كلاسترات مونجو:</span>
                    <span className="text-emerald-300 font-bold">12 كلاستراً موزعة</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>طريقة البحث:</span>
                    <span className="text-white/80">Qdrant Dense + Sparse + Mongo</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>إحماء الاتصالات:</span>
                    <span className="text-emerald-400 font-bold">نشط في الذاكرة</span>
                  </div>
                </div>
              </div>

              <button
                disabled={switchingMode !== null || status?.engine_mode === 'mongo'}
                className={`mt-6 w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  status?.engine_mode === 'mongo'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20'
                }`}
              >
                {switchingMode === 'mongo' ? <RefreshCw size={14} className="animate-spin" /> : null}
                <span>{status?.engine_mode === 'mongo' ? 'الوضع النشط' : 'تفعيل مسار مونجو الآن'}</span>
              </button>
            </div>
          </div>

          {/* RERANKER GLOBAL TOGGLE */}
          <div className="mt-5 p-5 rounded-3xl bg-gradient-to-r from-purple-950/30 via-slate-900/40 to-sky-950/30 border border-purple-500/30 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg shadow-purple-950/20">
            <div className="flex items-start md:items-center gap-4">
              <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                <Target size={26} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
                    <span>مرحلة إعادة الترتيب الدقيق الفائقة (Cross-Encoder Reranker)</span>
                  </h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    (status?.use_reranker ?? true)
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-white/10 text-white/50 border-white/20'
                  }`}>
                    {(status?.use_reranker ?? true) ? '🟢 مفعل في الذاكرة' : '⚪ معطل (استرجاع سريع)'}
                  </span>
                </div>
                <p className="text-xs text-white/60 leading-relaxed max-w-3xl">
                  تطبيق نموذج <code className="text-purple-300 font-mono text-[11px] bg-purple-950/60 px-1 py-0.5 rounded border border-purple-500/30">BAAI/bge-reranker-v2-m3</code> على مسار تراث (ومونجو) لإعادة تصفية القطع التراثية المسترجعة وترتيبها حسب الصلة الفقهية الدقيقة قبل تزويد الموديل بها. عند الإيقاف يتم الاعتماد على ترتيب المتجهات المباشر لتقليل زمن الاستجابة إلى أدنى حد.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
              <button
                onClick={handleToggleReranker}
                disabled={togglingReranker || !status}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs transition-all shadow-md ${
                  (status?.use_reranker ?? true)
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20'
                    : 'bg-white/10 hover:bg-white/15 text-white/80 border border-white/20'
                } disabled:opacity-50`}
              >
                {togglingReranker ? (
                  <RefreshCw size={15} className="animate-spin text-current" />
                ) : (status?.use_reranker ?? true) ? (
                  <ToggleRight size={18} className="text-black" />
                ) : (
                  <ToggleLeft size={18} className="text-white/60" />
                )}
                <span>
                  {togglingReranker
                    ? 'جاري التعديل...'
                    : (status?.use_reranker ?? true)
                    ? 'إيقاف الـ Reranker (وضع السرعة القصوى)'
                    : 'تشغيل الـ Reranker (وضع الدقة القصوى)'}
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* SECTION 2: LIVE DIAGNOSTIC PROBES */}
        {status && (
          <section className="bg-white/[0.02] border border-white/10 rounded-3xl p-6">
            <h3 className="text-sm font-bold text-white/80 mb-4 flex items-center gap-2">
              <Server size={16} className="text-sky-400" />
              <span>مؤشرات صحة البنية التحتية الحية (Live Health Diagnostics)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Turath Status */}
              <div className="p-4 rounded-2xl bg-sky-950/20 border border-sky-500/20 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${status.turath.healthy ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                    <span className="font-bold text-sm text-sky-200">كلاسترات تراث السحابية (Qdrant)</span>
                  </div>
                  <p className="text-xs text-white/60 mt-1">
                    {status.turath.clusters_count} كلاسترات مسجلة | {status.turath.total_points.toLocaleString()} متجهة تضمينية
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  {status.turath.healthy ? 'سليمة ومتصلة' : 'تحتاج فحص'}
                </span>
              </div>

              {/* Mongo Status */}
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${status.mongo.is_active_in_current_mode ? (status.mongo.warmed_up ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400') : 'bg-white/30'}`} />
                    <span className="font-bold text-sm text-emerald-200">كلاسترات مونجو (MongoDB 12-Cluster)</span>
                  </div>
                  <p className="text-xs text-white/60 mt-1">
                    {status.mongo.is_active_in_current_mode
                      ? (status.mongo.warmed_up ? `جاهزة ومحمية (${status.mongo.active_clients} اتصال نشط)` : 'في مرحلة الإحماء')
                      : 'مغلقة لتوفير الرام (0% Mongo Footprint)'}
                  </p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                  status.mongo.is_active_in_current_mode
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-white/5 text-white/40 border-white/10'
                }`}>
                  {status.mongo.is_active_in_current_mode ? 'مفعلة' : 'في وضع السكون'}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 3: INTERACTIVE TESTING & COMPARISON PLAYGROUND */}
        <section className="bg-gradient-to-b from-white/[0.04] to-white/[0.02] border border-white/15 rounded-3xl p-6 md:p-8 shadow-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                <Sparkles size={22} className="text-amber-400" />
                <span>مختبر الاختبار والمقارنة اللحظية (RAG Comparison & Testbed)</span>
              </h2>
              <p className="text-xs text-white/60 mt-1">
                اطرح أي مسألة فقهية أو علمية وقارن سرعة ودقة المسارين في نفس الوقت
              </p>
            </div>

            {/* Quick Sample Queries */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-white/40">أمثلة سريعة:</span>
              {SAMPLE_QUERIES.map((sq, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(sq.q);
                    setSelectedDomain(sq.domain);
                  }}
                  className="px-2.5 py-1 rounded-xl text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all"
                >
                  {sq.label}
                </button>
              ))}
            </div>
          </div>

          {/* Query Input Box */}
          <div className="space-y-4">
            <div className="relative">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="اكتب سؤالك الشرعي أو التراثي هنا..."
                rows={3}
                className="w-full rounded-2xl bg-black/40 border border-white/15 p-4 text-sm text-white placeholder-white/40 focus:outline-none focus:border-purple-400/60 focus:ring-2 focus:ring-purple-400/20 transition-all resize-none font-medium leading-relaxed"
              />
            </div>

            {/* Controls & Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/60">المجال:</span>
                  <select
                    value={selectedDomain}
                    onChange={(e) => setSelectedDomain(e.target.value)}
                    className="bg-black/50 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-400"
                  >
                    <option value="فقه">فقه</option>
                    <option value="عقيدة">عقيدة</option>
                    <option value="تفسير">تفسير</option>
                    <option value="حديث">حديث</option>
                    <option value="تاريخ">تاريخ</option>
                    <option value="علوم اللغة">علوم اللغة</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/60">أسلوب الرد:</span>
                  <select
                    value={responseMode}
                    onChange={(e) => setResponseMode(e.target.value)}
                    className="bg-black/50 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-400"
                  >
                    <option value="student">طالب علم (مفصل وموثق)</option>
                    <option value="student_concise">طالب علم (مختصر مركز)</option>
                    <option value="simple">مبسط للعامة</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => handleRunSingle('turath')}
                  disabled={runningSingle || runningCompare || !query.trim()}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {runningSingle && singleResult?.engine === 'turath' ? <RefreshCw size={13} className="animate-spin" /> : <Zap size={14} />}
                  <span>تجربة تراث فقط</span>
                </button>

                <button
                  onClick={() => handleRunSingle('mongo')}
                  disabled={runningSingle || runningCompare || !query.trim()}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {runningSingle && singleResult?.engine === 'mongo' ? <RefreshCw size={13} className="animate-spin" /> : <Database size={14} />}
                  <span>تجربة مونجو فقط</span>
                </button>

                <button
                  onClick={handleRunCompare}
                  disabled={runningCompare || runningSingle || !query.trim()}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {runningCompare ? <RefreshCw size={14} className="animate-spin" /> : <Trophy size={15} />}
                  <span>تشغيل المقارنة جنباً إلى جنب ⚔️</span>
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 4: RESULTS DISPLAY */}
          {/* Comparison Result View */}
          {activeTab === 'compare' && compareResult && (
            <div className="mt-8 pt-8 border-t border-white/10 space-y-6 animate-fadeIn">
              {/* Winner Banner */}
              <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
                compareResult.winner_speed === 'turath'
                  ? 'bg-sky-950/30 border-sky-500/30'
                  : compareResult.winner_speed === 'mongo'
                  ? 'bg-emerald-950/30 border-emerald-500/30'
                  : 'bg-purple-950/30 border-purple-500/30'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Trophy size={22} />
                  </div>
                  <div>
                    <div className="text-sm font-bold flex items-center gap-2">
                      <span>الفائز في سرعة الاستجابة:</span>
                      <span className={`px-2 py-0.5 rounded-md text-xs font-black ${
                        compareResult.winner_speed === 'turath'
                          ? 'bg-sky-400 text-black'
                          : compareResult.winner_speed === 'mongo'
                          ? 'bg-emerald-400 text-black'
                          : 'bg-purple-400 text-black'
                      }`}>
                        {compareResult.winner_speed === 'turath' ? 'مسار تراث السحابي ⚡' : compareResult.winner_speed === 'mongo' ? 'مسار مونجو الكلاسيكي 🍃' : 'تعادل في السرعة ⚖️'}
                      </span>
                    </div>
                    <p className="text-xs text-white/60 mt-0.5">
                      تفوق بنسبة <span className="text-emerald-400 font-bold font-mono">{compareResult.speedup_percentage}%</span> | إجمالي الوقت الجداري المتوازي: <span className="font-mono text-white/80">{compareResult.total_wall_time_ms}ms</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="px-3 py-1.5 rounded-lg bg-sky-500/10 text-sky-300 border border-sky-500/20">
                    تراث: {compareResult.turath.latency_ms}ms
                  </span>
                  <span className="text-white/30">مقابل</span>
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    مونجو: {compareResult.mongo.latency_ms}ms
                  </span>
                </div>
              </div>

              {/* Side-by-Side Split Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Right Card: Turath Result */}
                <div className="rounded-2xl p-6 bg-sky-950/20 border border-sky-500/30 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-sky-500/20 mb-4">
                      <div className="flex items-center gap-2">
                        <Zap size={18} className="text-sky-400" />
                        <h4 className="font-bold text-sm text-sky-200">مسار تراث السحابي (Turath Live)</h4>
                      </div>
                      <span className="text-xs font-mono text-sky-300 bg-sky-500/20 px-2.5 py-0.5 rounded-md">
                        {compareResult.turath.latency_ms} ms
                      </span>
                    </div>

                    {compareResult.turath.status === 'success' ? (
                      <div className="text-sm text-white/90 leading-relaxed space-y-3">
                        <div className="whitespace-pre-line bg-black/30 p-4 rounded-xl border border-white/5 max-h-96 overflow-y-auto">
                          {compareResult.turath.answer}
                        </div>

                        {compareResult.turath.citations && Object.keys(compareResult.turath.citations).length > 0 && (
                          <div className="pt-2">
                            <span className="text-xs font-bold text-sky-300 block mb-1">المراجع التراثية المستشهد بها:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {Object.entries(compareResult.turath.citations).map(([k, c]: any) => (
                                <span key={k} className="text-[11px] px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 text-sky-200">
                                  {c.book_title || k} {c.part ? `(ج ${c.part})` : ''} {c.page_id ? `ص ${c.page_id}` : ''}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Retrieved Context Chunks (Fed into LLM) */}
                        <RetrievedChunksViewer
                          chunks={compareResult.turath.context}
                          engineName="تراث السحابي"
                          accentColor="sky"
                        />
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                        خطأ في استعلام تراث: {compareResult.turath.error}
                      </div>
                    )}
                  </div>
                </div>

                {/* Left Card: Mongo Result */}
                <div className="rounded-2xl p-6 bg-emerald-950/20 border border-emerald-500/30 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20 mb-4">
                      <div className="flex items-center gap-2">
                        <Database size={18} className="text-emerald-400" />
                        <h4 className="font-bold text-sm text-emerald-200">مسار مونجو الكلاسيكي (Mongo RAG)</h4>
                      </div>
                      <span className="text-xs font-mono text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-md">
                        {compareResult.mongo.latency_ms} ms
                      </span>
                    </div>

                    {compareResult.mongo.status === 'success' ? (
                      <div className="text-sm text-white/90 leading-relaxed space-y-3">
                        <div className="whitespace-pre-line bg-black/30 p-4 rounded-xl border border-white/5 max-h-96 overflow-y-auto">
                          {compareResult.mongo.answer}
                        </div>

                        {compareResult.mongo.citations && Object.keys(compareResult.mongo.citations).length > 0 && (
                          <div className="pt-2">
                            <span className="text-xs font-bold text-emerald-300 block mb-1">المراجع التراثية المستشهد بها:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {Object.entries(compareResult.mongo.citations).map(([k, c]: any) => (
                                <span key={k} className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-200">
                                  {c.book_title || k} {c.part ? `(ج ${c.part})` : ''} {c.page_id ? `ص ${c.page_id}` : ''}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Retrieved Context Chunks (Fed into LLM) */}
                        <RetrievedChunksViewer
                          chunks={compareResult.mongo.context}
                          engineName="مونجو الكلاسيكي"
                          accentColor="emerald"
                        />
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                        خطأ في استعلام مونجو: {compareResult.mongo.error}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Single Engine Result View */}
          {activeTab === 'single' && singleResult && (
            <div className="mt-8 pt-8 border-t border-white/10 animate-fadeIn space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-400" />
                  <span className="font-bold text-sm">
                    نتيجة الاستعلام على مسار [{singleResult.engine.toUpperCase()}]
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/60">
                    المحرك المجيب: <span className="font-bold text-purple-300">{singleResult.engine_used}</span>
                  </span>
                  <span className="text-xs font-mono px-3 py-1 rounded-lg bg-white/10 text-emerald-300 font-bold">
                    {singleResult.latency_ms} ms
                  </span>
                </div>
              </div>

              {singleResult.status === 'success' ? (
                <div className="bg-black/30 p-5 rounded-2xl border border-white/10 space-y-4">
                  <div className="text-sm text-white/90 leading-relaxed whitespace-pre-line">
                    {singleResult.answer}
                  </div>

                  {singleResult.citations && Object.keys(singleResult.citations).length > 0 && (
                    <div className="pt-3 border-t border-white/10">
                      <button
                        onClick={() => setShowCitations(!showCitations)}
                        className="flex items-center gap-2 text-xs font-bold text-purple-300 hover:text-purple-200"
                      >
                        <BookOpen size={14} />
                        <span>عرض المراجع والتوثيق التراثي ({Object.keys(singleResult.citations).length})</span>
                        {showCitations ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>

                      {showCitations && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
                          {Object.entries(singleResult.citations).map(([k, c]: any) => (
                            <div key={k} className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs space-y-1">
                              <div className="font-bold text-white">{c.book_title || k}</div>
                              <div className="text-white/60">{c.author || 'مؤلف معتمد'} | {c.madhhab || 'فقه عام'}</div>
                              {c.hierarchy && <div className="text-[11px] text-purple-300 truncate">{c.hierarchy}</div>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Retrieved Context Chunks (Fed into LLM) */}
                  <RetrievedChunksViewer
                    chunks={singleResult.context}
                    engineName={singleResult.engine_used || singleResult.engine}
                    accentColor="purple"
                  />
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                  خطأ أثناء التنفيذ: {singleResult.error}
                </div>
              )}
            </div>
          )}
        </section>

        {/* SECTION 4: TURATH QDRANT CATALOG MANAGEMENT */}
        <section className="bg-gradient-to-b from-white/[0.04] to-white/[0.02] border border-white/15 rounded-3xl p-6 md:p-8 shadow-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  <BookOpen size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                    <span>فهرس كتب ومؤلفي تراث المعتمدة (Turath Qdrant Catalog)</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 font-mono">
                      {catalogBooks.length} كتاب معتمد
                    </span>
                  </h2>
                  <p className="text-xs text-white/60 mt-1">
                    هذا الفهرس يحدد بدقة الكتب والمؤلفين المتاحين للفلترة، ويُحقن ديناميكياً في نموذج الاستخراج (LLM 2) لمنع الهلوسة والبحث في كتب غير مفهرسة.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions: Sync & Add */}
            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <button
                onClick={handleSyncCatalog}
                disabled={syncingCatalog}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-sky-600/20 hover:bg-sky-600/30 text-sky-200 border border-sky-500/30 transition-all hover:scale-102 active:scale-98 disabled:opacity-50"
                title="مزامنة تلقائية لكافة الكتب المفهرسة حالياً في كلاسترات Qdrant"
              >
                <RefreshCw size={14} className={syncingCatalog ? 'animate-spin' : ''} />
                <span>{syncingCatalog ? 'جاري المزامنة من Qdrant...' : 'مزامنة الفهرس من Qdrant 🔄'}</span>
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black shadow-lg shadow-emerald-500/20 transition-all hover:scale-102 active:scale-98"
              >
                <Plus size={15} />
                <span>إضافة كتاب يدوياً ➕</span>
              </button>
            </div>
          </div>

          {/* Alert / Notification banner */}
          {catalogMessage && (
            <div className={`mb-6 p-4 rounded-2xl border text-xs flex items-center justify-between ${
              catalogMessage.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : 'bg-red-950/40 border-red-500/40 text-red-200'
            }`}>
              <div className="flex items-center gap-2">
                {catalogMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                <span>{catalogMessage.text}</span>
              </div>
              <button onClick={() => setCatalogMessage(null)} className="opacity-70 hover:opacity-100">
                <X size={14} />
              </button>
            </div>
          )}

          {/* Search bar inside catalog */}
          <div className="mb-4 relative">
            <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              placeholder="ابحث عن كتاب، مؤلف، أو مذهب في الفهرس..."
              className="w-full bg-black/40 border border-white/10 rounded-xl pr-11 pl-4 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-sky-400/50"
            />
          </div>

          {/* Books List Grid / Table */}
          {loadingCatalog ? (
            <div className="py-12 flex flex-col items-center justify-center text-white/40 gap-3">
              <RefreshCw size={24} className="animate-spin text-sky-400" />
              <span className="text-xs">جاري تحميل فهرس الكتب من السيرفر...</span>
            </div>
          ) : catalogBooks.length === 0 ? (
            <div className="py-12 text-center text-white/40 text-xs bg-black/20 rounded-2xl border border-white/5">
              لا توجد كتب مفهرسة حالياً. اضغط على "مزامنة الفهرس من Qdrant" لجلب الكتب فوراً.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {catalogBooks
                .filter(b => {
                  if (!catalogSearch.trim()) return true;
                  const q = catalogSearch.toLowerCase();
                  return (
                    b.title.toLowerCase().includes(q) ||
                    b.author.toLowerCase().includes(q) ||
                    (b.domain && b.domain.toLowerCase().includes(q)) ||
                    (b.madhhab && b.madhhab.toLowerCase().includes(q)) ||
                    (b.aliases && b.aliases.some(a => a.toLowerCase().includes(q)))
                  );
                })
                .map((book, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-sky-500/30 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="text-sm font-bold text-white group-hover:text-sky-200 transition-colors">
                          {book.title}
                        </h4>
                        <button
                          onClick={() => handleDeleteBook(book.title)}
                          className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-red-400 p-1 rounded-lg hover:bg-red-500/10 transition-all"
                          title="حذف من الفهرس"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="text-xs text-white/70 mb-3 flex items-center gap-1.5">
                        <span className="text-white/40">المؤلف:</span>
                        <span className="text-sky-300 font-medium">{book.author}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                        {book.domain && (
                          <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/20">
                            {book.domain}
                          </span>
                        )}
                        {book.madhhab && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
                            {book.madhhab}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-md bg-white/5 text-white/50 border border-white/10">
                          {book.engine || 'turath'}
                        </span>
                      </div>
                    </div>

                    {book.aliases && book.aliases.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-white/5 text-[10px] text-white/50">
                        <span className="text-white/30">الأسماء الشائعة: </span>
                        <span>{book.aliases.join(' ، ')}</span>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </section>

        {/* Modal: Add Book to Catalog */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#130b22] border border-white/15 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative animate-scaleIn">
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute top-5 left-5 text-white/50 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Plus size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">إضافة كتاب إلى فهرس تراث المعتمد</h3>
                  <p className="text-xs text-white/60">أدخل بيانات الكتاب بدقة لتمكين الموديل من فلترته</p>
                </div>
              </div>

              <form onSubmit={handleAddBook} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1.5">اسم الكتاب الكامل *</label>
                  <input
                    type="text"
                    required
                    value={newBook.title}
                    onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                    placeholder="مثال: عمدة الفقه"
                    className="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1.5">المؤلف *</label>
                  <input
                    type="text"
                    required
                    value={newBook.author}
                    onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                    placeholder="مثال: ابن قدامة المقدسي"
                    className="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-white/80 mb-1.5">الفن الشرعي (Domain)</label>
                    <select
                      value={newBook.domain}
                      onChange={(e) => setNewBook({ ...newBook, domain: e.target.value })}
                      className="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-400"
                    >
                      <option value="فقه">فقه</option>
                      <option value="عقيدة">عقيدة</option>
                      <option value="تفسير">تفسير</option>
                      <option value="الحديث">الحديث</option>
                      <option value="سيرة">سيرة</option>
                      <option value="تاريخ">تاريخ</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-white/80 mb-1.5">المذهب الفقهي</label>
                    <select
                      value={newBook.madhhab}
                      onChange={(e) => setNewBook({ ...newBook, madhhab: e.target.value })}
                      className="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-400"
                    >
                      <option value="حنبلي">حنبلي</option>
                      <option value="شافعي">شافعي</option>
                      <option value="مالكي">مالكي</option>
                      <option value="حنفي">حنفي</option>
                      <option value="عام">عام / مقارن</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1.5">
                    الأسماء البديلة والشائعة (مفصولة بفواصل)
                  </label>
                  <input
                    type="text"
                    value={newBook.aliases}
                    onChange={(e) => setNewBook({ ...newBook, aliases: e.target.value })}
                    placeholder="مثال: العمدة, عمدة ابن قدامة"
                    className="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={addingBook}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
                  >
                    {addingBook ? <RefreshCw size={14} className="animate-spin" /> : null}
                    <span>حفظ الكتاب في الفهرس</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
export default EngineControlPage;
