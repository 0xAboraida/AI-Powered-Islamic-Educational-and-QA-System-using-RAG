import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  Server,
  Layers,
  Sparkles,
  Play,
  Copy,
  Check,
  ExternalLink,
  HardDrive,
  Cpu,
  Plus,
  AlertCircle,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { TurathBookItem, ClusterInfo, IngestJobState } from '../types';
import {
  generateKaggleScript,
  triggerIngestion,
  getIngestionStatus,
  createCollectionOnCluster
} from '../turathRagApi';
import { getCollectionDetails } from '../collectionsData';

interface BookIngestModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: TurathBookItem | null;
  clusters: ClusterInfo[];
  onRefreshClusters: () => void;
  onIngestionSuccess?: () => void;
}

export const BookIngestModal: React.FC<BookIngestModalProps> = ({
  isOpen,
  onClose,
  book,
  clusters,
  onRefreshClusters,
  onIngestionSuccess
}) => {
  // Step 1: Cluster Selection
  const [selectedClusterId, setSelectedClusterId] = useState<string>('');
  
  // Step 2: Collection Selection / Inline Creation
  const [collectionMode, setCollectionMode] = useState<'existing' | 'create'>('existing');
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [newCollectionName, setNewCollectionName] = useState<string>('');
  const [creatingColl, setCreatingColl] = useState(false);
  const [collCreationError, setCollCreationError] = useState<string | null>(null);

  // Step 3: Execution Mode & States
  const [activeTab, setActiveTab] = useState<'kaggle' | 'server'>('kaggle');
  
  // Kaggle Script State
  const [kaggleScript, setKaggleScript] = useState<string>('');
  const [loadingScript, setLoadingScript] = useState(false);
  const [copied, setCopied] = useState(false);

  // Server Ingest Progress State
  const [jobState, setJobState] = useState<IngestJobState | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 300,000 vectors limit per cluster free tier
  const ESTIMATED_MAX_VECTORS = 300000;
  // Estimated chunks for a standard heritage book (~1,000 vectors)
  const ESTIMATED_BOOK_CHUNKS = 1000;

  // Initialize selected cluster & collection on open
  useEffect(() => {
    if (isOpen && clusters.length > 0) {
      const initialCluster = clusters[0];
      setSelectedClusterId(initialCluster.id);

      // Default collection
      if (initialCluster.collections && initialCluster.collections.length > 0) {
        setSelectedCollection(initialCluster.collections[0].name);
      } else {
        setSelectedCollection('');
      }
    }
  }, [isOpen, clusters]);

  // When selected cluster changes, update default collection
  const currentCluster = clusters.find((c) => c.id === selectedClusterId) || clusters[0];

  useEffect(() => {
    if (currentCluster?.collections && currentCluster.collections.length > 0) {
      if (!currentCluster.collections.some((c) => c.name === selectedCollection)) {
        setSelectedCollection(currentCluster.collections[0].name);
      }
    } else {
      setSelectedCollection('');
    }
  }, [currentCluster]);

  // Generate Kaggle script when cluster or collection changes
  useEffect(() => {
    if (!isOpen || !book || activeTab !== 'kaggle') return;

    let isMounted = true;
    setLoadingScript(true);

    const bId = Number(book.turath_id);
    const targetColl = collectionMode === 'existing' ? selectedCollection : newCollectionName;

    generateKaggleScript([bId], targetColl || undefined, selectedClusterId)
      .then((res) => {
        if (isMounted) {
          setKaggleScript(res.script);
          setLoadingScript(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error(err);
          setLoadingScript(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, book, selectedClusterId, selectedCollection, newCollectionName, collectionMode, activeTab]);

  // Handle inline collection creation
  const handleCreateCollection = async () => {
    const clean = newCollectionName.trim().toLowerCase().replace(/\s+/g, '_');
    if (!clean) {
      setCollCreationError('يرجى كتابة اسم المجموعة.');
      return;
    }

    try {
      setCreatingColl(true);
      setCollCreationError(null);
      await createCollectionOnCluster(selectedClusterId, clean);
      onRefreshClusters();
      setSelectedCollection(clean);
      setCollectionMode('existing');
      setNewCollectionName('');
    } catch (err: any) {
      setCollCreationError(err.message || 'فشل إنشاء المجموعة.');
    } finally {
      setCreatingColl(false);
    }
  };

  // Handle copy script
  const handleCopy = () => {
    if (!kaggleScript) return;
    navigator.clipboard.writeText(kaggleScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Handle direct server ingestion
  const handleStartServerIngest = async () => {
    if (!book) return;
    const bId = Number(book.turath_id);
    const targetColl = collectionMode === 'existing' ? selectedCollection : newCollectionName;

    try {
      setIsProcessing(true);
      setJobState({
        book_id: bId,
        book_title: book.title,
        target_cluster: selectedClusterId,
        target_collection: targetColl,
        stage: 'started',
        percentage: 5,
        message: 'جاري بدء المعالجة الذكية في السيرفر...',
        is_running: true
      });

      await triggerIngestion(bId, targetColl || undefined, selectedClusterId);

      // Poll progress every 1.5s
      const pollTimer = setInterval(async () => {
        try {
          const st = await getIngestionStatus(bId);
          setJobState({
            book_id: bId,
            book_title: book.title,
            target_cluster: selectedClusterId,
            target_collection: targetColl,
            stage: st.stage,
            percentage: st.percentage,
            message: st.message,
            is_running: st.stage !== 'completed' && st.stage !== 'failed'
          });

          if (st.stage === 'completed') {
            clearInterval(pollTimer);
            setIsProcessing(false);
            onRefreshClusters();
            if (onIngestionSuccess) onIngestionSuccess();
          } else if (st.stage === 'failed') {
            clearInterval(pollTimer);
            setIsProcessing(false);
          }
        } catch (e) {
          console.warn('Poll status error:', e);
        }
      }, 1500);
    } catch (err: any) {
      setIsProcessing(false);
      setJobState({
        book_id: bId,
        book_title: book.title,
        stage: 'failed',
        percentage: 0,
        message: `خطأ: ${err.message}`,
        is_running: false
      });
    }
  };

  if (!isOpen || !book) return null;

  const currentPts = currentCluster?.points_count || 0;
  const remainingVectors = Math.max(0, ESTIMATED_MAX_VECTORS - currentPts);
  const quotaPercent = Math.min(100, Math.round((currentPts / ESTIMATED_MAX_VECTORS) * 100));
  const isCapacitySafe = remainingVectors >= ESTIMATED_BOOK_CHUNKS;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div
        dir="rtl"
        className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-[#160628] shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-5 bg-white/5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/25">
              <BookOpen className="h-6 w-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white truncate max-w-md">{book.title}</h3>
                <span className="rounded bg-black/50 px-2 py-0.5 text-xs font-mono text-sky-400 border border-white/5">
                  ID: #{book.turath_id}
                </span>
              </div>
              <p className="text-xs text-white/50 mt-0.5">
                {book.author || 'مؤلف غير معروف'} • {book.category}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/60 hover:bg-white/10 hover:text-white transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* 1. CAPACITY & SIZING ESTIMATION CARD */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Book Estimated Size */}
            <div className="rounded-2xl border border-white/10 bg-black/30 p-3.5 space-y-1">
              <span className="text-xs text-white/50 flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-amber-400" />
                الحجم التقديري للكتاب:
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-amber-300 font-mono">
                  ~{ESTIMATED_BOOK_CHUNKS.toLocaleString()}
                </span>
                <span className="text-xs text-white/50">فقرة / متجهة (Vector Chunks)</span>
              </div>
              <p className="text-[10px] text-white/40">
                تقطيع هرمي مع حقن السياق (الكتاب &gt; الباب &gt; الفصل)
              </p>
            </div>

            {/* Cluster Remaining Capacity */}
            <div className="rounded-2xl border border-white/10 bg-black/30 p-3.5 space-y-1">
              <span className="text-xs text-white/50 flex items-center gap-1.5">
                <HardDrive className="h-3.5 w-3.5 text-emerald-400" />
                المساحة المتبقية في الكلاستر المختار:
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-emerald-300 font-mono">
                  {remainingVectors.toLocaleString()}
                </span>
                <span className="text-xs text-white/50">متجهة متبقية (~{100 - quotaPercent}% متاح)</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                <span>المساحة كافية جداً (أقل من 0.5% من سعة الكلاستر)</span>
              </div>
            </div>
          </div>

          {/* 2. STEP 1: CHOOSE TARGET CLUSTER / ACCOUNT */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-white flex items-center gap-2">
              <Server className="h-4 w-4 text-sky-400" />
              <span>1. اختر الحساب / الكلاستر المستهدف (Target Account / Cluster):</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {clusters.map((c) => {
                const isSelected = c.id === selectedClusterId;
                const cRemaining = Math.max(0, ESTIMATED_MAX_VECTORS - (c.points_count || 0));

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedClusterId(c.id)}
                    className={`flex items-start justify-between p-3 rounded-xl border text-right transition-all ${
                      isSelected
                        ? 'border-sky-500 bg-sky-500/15 shadow-md shadow-sky-500/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">{c.name}</span>
                        <span className="rounded bg-black/40 px-1.5 py-0.2 text-[10px] font-mono text-white/50">
                          {c.id}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-white/40 mt-0.5 truncate max-w-[180px]">
                        {c.url}
                      </p>
                    </div>

                    <div className="text-left shrink-0">
                      <span className="text-xs font-mono font-bold text-sky-300 block">
                        {cRemaining.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-white/40 block">متبقي</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. STEP 2: CHOOSE OR CREATE COLLECTION */}
          <div className="space-y-2 rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-amber-400" />
                <span>2. تحديد المجموعة (Collection) داخل الكلاستر المختار:</span>
              </label>

              {/* Mode switch */}
              <div className="flex items-center rounded-lg bg-black/40 p-0.5 border border-white/5">
                <button
                  type="button"
                  onClick={() => setCollectionMode('existing')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                    collectionMode === 'existing'
                      ? 'bg-amber-500 text-black shadow'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  اختيار مجموعة حالية
                </button>
                <button
                  type="button"
                  onClick={() => setCollectionMode('create')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                    collectionMode === 'create'
                      ? 'bg-amber-500 text-black shadow'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  + إنشاء مجموعة جديدة
                </button>
              </div>
            </div>

            {collectionMode === 'existing' ? (
              <div>
                {currentCluster?.collections && currentCluster.collections.length > 0 ? (
                  <select
                    value={selectedCollection}
                    onChange={(e) => setSelectedCollection(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2.5 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                  >
                    {currentCluster.collections.map((coll) => {
                      const meta = getCollectionDetails(coll.name);
                      return (
                        <option key={coll.name} value={coll.name}>
                          {meta?.arabicName || coll.name} ({coll.name}) — [
                          {(coll.points_count || 0).toLocaleString()} فقرة]
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <div className="p-3 text-center rounded-xl bg-black/30 border border-dashed border-white/10">
                    <p className="text-xs text-white/50">
                      لا توجد مجموعات حالية في {currentCluster?.name}. يرجى التبديل لخيار "إنشاء مجموعة جديدة".
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    placeholder="اكتب اسم المجموعة (مثال: zad_turath_hanbali_extras)"
                    className="flex-1 rounded-xl border border-white/10 bg-black/50 px-3.5 py-2 text-xs font-mono text-white placeholder-white/40 focus:border-amber-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCreateCollection}
                    disabled={creatingColl}
                    className="flex items-center gap-1 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-black hover:bg-amber-400 disabled:opacity-50"
                  >
                    {creatingColl ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                    <span>إنشاء وتحديد</span>
                  </button>
                </div>
                {collCreationError && (
                  <p className="text-[11px] text-red-400">{collCreationError}</p>
                )}
              </div>
            )}
          </div>

          {/* 4. STEP 3: EXECUTION METHOD TABS */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-sky-400" />
                <span>3. اختر طريقة التضمين والاستدخال:</span>
              </span>

              <div className="flex items-center gap-1 rounded-xl bg-black/40 p-1 border border-white/5">
                <button
                  type="button"
                  onClick={() => setActiveTab('kaggle')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    activeTab === 'kaggle'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>توليد كود كاجل GPU (بنقرة واحدة)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('server')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    activeTab === 'server'
                      ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Play className="h-3.5 w-3.5" />
                  <span>استدخال مباشر عبر السيرفر</span>
                </button>
              </div>
            </div>

            {/* TAB 1: KAGGLE CODE */}
            {activeTab === 'kaggle' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-white/60">
                    تم تضمين رابط الكلاستر، مفتاح الـ API، ومعرف الكتاب #{book.turath_id} تلقائياً.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopy}
                      disabled={!kaggleScript || loadingScript}
                      className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition-all"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-emerald-300">تم النسخ!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>نسخ الكود بالكامل</span>
                        </>
                      )}
                    </button>

                    <a
                      href="https://www.kaggle.com/code"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20 transition-all"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>فتح Kaggle Notebook</span>
                    </a>
                  </div>
                </div>

                <div className="relative rounded-2xl border border-white/10 bg-black/60 p-4 overflow-hidden">
                  {loadingScript ? (
                    <div className="py-12 text-center">
                      <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-amber-400 border-r-transparent" />
                      <p className="mt-2 text-xs text-white/50">جاري تخصيص وتوليد الكود...</p>
                    </div>
                  ) : (
                    <pre
                      dir="ltr"
                      className="text-[11px] font-mono text-emerald-400/90 overflow-x-auto max-h-56 select-all whitespace-pre-wrap"
                    >
                      {kaggleScript}
                    </pre>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: DIRECT SERVER INGEST */}
            {activeTab === 'server' && (
              <div className="space-y-4">
                <p className="text-xs text-white/60">
                  تشغيل استدخال الكتاب في الخلفية عبر سيرفر المشروع دون تجميد المتصفح.
                </p>

                {jobState && (
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/80 font-semibold">{jobState.message}</span>
                      <span className="font-mono font-bold text-sky-400">{jobState.percentage}%</span>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-black/60 border border-white/5">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          jobState.stage === 'failed'
                            ? 'bg-red-500'
                            : jobState.stage === 'completed'
                            ? 'bg-emerald-400'
                            : 'bg-gradient-to-r from-sky-500 to-blue-500'
                        }`}
                        style={{ width: `${Math.max(jobState.percentage, 3)}%` }}
                      />
                    </div>

                    {jobState.stage === 'completed' && (
                      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>اكتملت المعالجة وحفظت المتجهات في Qdrant بنجاح!</span>
                      </div>
                    )}

                    {jobState.stage === 'failed' && (
                      <div className="flex items-center gap-2 text-xs font-semibold text-red-400">
                        <AlertCircle className="h-4 w-4" />
                        <span>فشلت العملية وتم التراجع للحفاظ على سلامة البيانات.</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleStartServerIngest}
                    disabled={isProcessing}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-sky-500/25 hover:from-sky-400 hover:to-blue-500 disabled:opacity-50 transition-all"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>جاري المعالجة والاستدخال...</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        <span>بدء الاستدخال المباشر الآن</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-white/10 p-4 bg-white/5 flex items-center justify-between">
          <span className="text-[11px] text-white/40">
            الكلاستر المختار: <strong className="text-sky-300 font-mono">{selectedClusterId}</strong> |
            المجموعة: <strong className="text-amber-300 font-mono">{selectedCollection || newCollectionName || 'تلقائي'}</strong>
          </span>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20 transition-all"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
