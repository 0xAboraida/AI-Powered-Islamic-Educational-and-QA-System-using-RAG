import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Sparkles,
  Play,
  Check,
  Server,
  Layers,
  HardDrive,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Clock,
  Terminal,
  ExternalLink,
  Plus,
  RefreshCw,
  Sliders,
  Copy,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Key,
  Tag,
  RotateCcw
} from 'lucide-react';
import { TurathBookItem, ClusterInfo, KaggleJobStatusResponse } from '../types';
import { COMMON_TURATH_CATEGORIES } from '../collectionsData';
import {
  launchKaggleJob,
  getKaggleJobStatus,
  createCollectionOnCluster,
  updateKaggleCredentials,
  getKaggleCredentialsStatus
} from '../turathRagApi';

interface IngestionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBooks: TurathBookItem[];
  clusters: ClusterInfo[];
  clusterAssignments: Record<string, string>;
  onIngestionSuccess?: () => void;
}

// Smart collection resolver helper based on classical taxonomy
function resolveCollectionForBook(category: string, title: string = ''): string {
  const text = `${category} ${title}`.toLowerCase();
  if (text.includes('حنبلي') || text.includes('الحنابلة') || text.includes('ابن قدامة') || text.includes('ابن تيمية')) {
    return 'c1_zad_fiqh_hanbali_1';
  } else if (text.includes('حنفي') || text.includes('الحنفية')) {
    return 'zad_turath_fiqh_hanafi';
  } else if (text.includes('شافعي') || text.includes('الشافعية')) {
    return 'zad_turath_fiqh_shafii';
  } else if (text.includes('مالكي') || text.includes('المالكية')) {
    return 'zad_turath_fiqh_maliki';
  } else if (text.includes('فقه')) {
    return 'zad_turath_fiqh_aam';
  } else if (text.includes('عقيدة') || text.includes('التوحيد') || text.includes('أصول الدين')) {
    return 'zad_turath_aqeedah';
  } else if (text.includes('تفسير') || text.includes('علوم القرآن')) {
    return 'zad_turath_tafseer';
  } else if (text.includes('حديث') || text.includes('السنن') || text.includes('شرح')) {
    return 'zad_turath_hadith';
  } else if (text.includes('سيرة') || text.includes('شمائل')) {
    return 'zad_turath_seerah';
  } else if (text.includes('تاريخ') || text.includes('تراجم') || text.includes('طبقات')) {
    return 'zad_turath_tarikh';
  } else if (text.includes('نحو') || text.includes('لغة') || text.includes('صرف')) {
    return 'zad_turath_lugha';
  }
  return 'zad_turath_general';
}

export const IngestionDrawer: React.FC<IngestionDrawerProps> = ({
  isOpen,
  onClose,
  selectedBooks,
  clusters,
  clusterAssignments,
  onIngestionSuccess
}) => {
  // Navigation: 'matrix' (Step 1) -> 'execution' (Step 2)
  const [currentStep, setCurrentStep] = useState<'matrix' | 'execution'>('matrix');

  // Book Configs Map: book_id -> { clusterId, collection, category }
  const [bookConfigs, setBookConfigs] = useState<Record<number, { clusterId: string; collection: string; category: string }>>({});

  // Batch Apply State
  const [batchCluster, setBatchCluster] = useState<string>('cluster_1');
  const [batchCollection, setBatchCollection] = useState<string>('');
  const [batchCategory, setBatchCategory] = useState<string>('');

  // Inline Collection Creation Modal
  const [showCreateCollModal, setShowCreateCollModal] = useState(false);
  const [createCollCluster, setCreateCollCluster] = useState('cluster_1');
  const [newCollName, setNewCollName] = useState('');
  const [newCollArabic, setNewCollArabic] = useState('');
  const [isCreatingColl, setIsCreatingColl] = useState(false);
  const [createCollError, setCreateCollError] = useState<string | null>(null);

  // Kaggle Execution State
  const [launchingJob, setLaunchingJob] = useState(false);
  const [kaggleKernelSlug, setKaggleKernelSlug] = useState<string | null>(null);
  const [kaggleUrl, setKaggleUrl] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<'idle' | 'queued' | 'running' | 'completed' | 'failed'>('idle');
  const [jobStatusMsg, setJobStatusMsg] = useState<string>('');
  const [terminalLogs, setTerminalLogs] = useState<string>('');
  const [copiedLogs, setCopiedLogs] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  // Kaggle Credentials Fix State
  const [showKaggleCredModal, setShowKaggleCredModal] = useState(false);
  const [kaggleUsernameInput, setKaggleUsernameInput] = useState('');
  const [kaggleKeyInput, setKaggleKeyInput] = useState('');
  const [updatingCreds, setUpdatingCreds] = useState(false);
  const [credMsg, setCredMsg] = useState<string | null>(null);

  const prevIsOpenRef = useRef(false);
  const prevBooksKeyRef = useRef('');

  // Initialize Matrix with smart defaults ONLY when modal newly opens, or when books selection changes while on matrix step
  useEffect(() => {
    const isOpening = isOpen && !prevIsOpenRef.current;
    prevIsOpenRef.current = isOpen;

    if (!isOpen) return;

    const selectedKey = selectedBooks.map((b) => b.turath_id).sort().join(',');
    const isBooksChanged = selectedKey !== prevBooksKeyRef.current;

    // Reset and initialize ONLY when the drawer is newly opened, OR when books change while on the matrix step
    if (isOpening || (isBooksChanged && currentStep === 'matrix')) {
      prevBooksKeyRef.current = selectedKey;
      setCurrentStep('matrix');
      setJobStatus('idle');
      setTerminalLogs('');
      setKaggleKernelSlug(null);
      setKaggleUrl(null);

      const defaultClusterId = clusters[0]?.id || 'cluster_1';
      setBatchCluster(defaultClusterId);

      const initialMap: Record<number, { clusterId: string; collection: string; category: string }> = {};
      selectedBooks.forEach((book) => {
        const bId = Number(book.turath_id);
        const suggestedColl = resolveCollectionForBook(book.category || '', book.title);
        const assignedCluster = clusterAssignments[suggestedColl] || defaultClusterId;

        const clusterObj = clusters.find((c) => c.id === assignedCluster) || clusters[0];
        const collExists = clusterObj?.collections.some((col) => col.name === suggestedColl);
        const finalColl = collExists
          ? suggestedColl
          : clusterObj?.collections[0]?.name || suggestedColl;

        initialMap[bId] = {
          clusterId: clusterObj?.id || defaultClusterId,
          collection: finalColl,
          category: book.category || 'عام'
        };
      });

      setBookConfigs(initialMap);

      const firstColl = Object.values(initialMap)[0]?.collection || '';
      setBatchCollection(firstColl);
    }
  }, [isOpen, selectedBooks, clusters, clusterAssignments, currentStep]);

  // Auto-scroll terminal logs
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs]);

  // Update specific book cluster
  const handleBookClusterChange = (bookId: number, clusterId: string) => {
    const clusterObj = clusters.find((c) => c.id === clusterId);
    const firstColl = clusterObj?.collections[0]?.name || 'zad_turath_general';
    setBookConfigs((prev) => ({
      ...prev,
      [bookId]: {
        ...prev[bookId],
        clusterId,
        collection: firstColl
      }
    }));
  };

  // Update specific book collection
  const handleBookCollectionChange = (bookId: number, collection: string) => {
    setBookConfigs((prev) => ({
      ...prev,
      [bookId]: {
        ...prev[bookId],
        collection
      }
    }));
  };

  // Update specific book category override
  const handleBookCategoryChange = (bookId: number, category: string) => {
    setBookConfigs((prev) => ({
      ...prev,
      [bookId]: {
        ...prev[bookId],
        category
      }
    }));
  };

  // Reset book category to Shamela default
  const handleResetBookCategory = (bookId: number, defaultCategory: string) => {
    setBookConfigs((prev) => ({
      ...prev,
      [bookId]: {
        ...prev[bookId],
        category: defaultCategory || 'عام'
      }
    }));
  };

  // Apply batch settings to all books
  const handleApplyBatchToAll = () => {
    if (!batchCollection && !batchCategory) return;
    setBookConfigs((prev) => {
      const next: Record<number, { clusterId: string; collection: string; category: string }> = {};
      selectedBooks.forEach((b) => {
        const bId = Number(b.turath_id);
        const prevCfg = prev[bId];
        next[bId] = {
          clusterId: batchCluster || prevCfg?.clusterId || 'cluster_1',
          collection: batchCollection || prevCfg?.collection || 'zad_turath_general',
          category: batchCategory.trim() ? batchCategory.trim() : (prevCfg?.category || b.category || 'عام')
        };
      });
      return next;
    });
  };

  // Inline Collection Creation
  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollName.trim()) return;

    try {
      setIsCreatingColl(true);
      setCreateCollError(null);
      await createCollectionOnCluster(
        createCollCluster,
        newCollName.trim(),
        newCollArabic.trim() || newCollName.trim(),
        'BookOpen',
        'مجموعة فقهية منشأة للاستدخال المجمع'
      );

      // Auto update current batch collection
      setBatchCluster(createCollCluster);
      setBatchCollection(newCollName.trim());

      setShowCreateCollModal(false);
      setNewCollName('');
      setNewCollArabic('');
    } catch (err: any) {
      setCreateCollError(err.message || 'فشل إنشاء المجموعة');
    } finally {
      setIsCreatingColl(false);
    }
  };

  // Launch Automated Kaggle Job
  const handleLaunchKaggleJob = async () => {
    if (selectedBooks.length === 0) return;
    const bookIds = selectedBooks.map((b) => Number(b.turath_id));

    // Determine target collection & cluster
    const firstConfig = Object.values(bookConfigs)[0];
    const targetColl = firstConfig?.collection || 'c1_zad_fiqh_hanbali_1';
    const targetClust = firstConfig?.clusterId || 'cluster_1';

    try {
      setLaunchingJob(true);
      setCurrentStep('execution');
      setJobStatus('queued');
      setJobStatusMsg('جاري إرسال المهمة المجمعة إلى Kaggle Cloud T4 GPU عبر Kaggle API...');

      // Build books metadata map with custom verified categories
      const booksMetadata: Record<number, { title: string; category: string; collection: string; clusterId: string; shamela_category?: string }> = {};
      selectedBooks.forEach((b) => {
        const bId = Number(b.turath_id);
        const cfg = bookConfigs[bId];
        booksMetadata[bId] = {
          title: b.title,
          category: cfg?.category?.trim() || b.category || '',
          collection: cfg?.collection || targetColl,
          clusterId: cfg?.clusterId || targetClust,
          shamela_category: b.category || ''
        };
      });

      const launchRes = await launchKaggleJob(
        undefined,
        targetColl,
        targetClust,
        bookIds,
        booksMetadata
      );

      setKaggleKernelSlug(launchRes.kernel_slug);
      setKaggleUrl(launchRes.url);

      if (launchRes.status === 'success') {
        setJobStatus('running');
        setJobStatusMsg(`تم إطلاق المهمة بنجاح على Kaggle T4 GPU (${bookIds.length} كتاب) عبر شبكة كاجل!`);
      } else {
        setJobStatus('failed');
        setJobStatusMsg(launchRes.message || 'تعذر تشغيل المهمة تلقائياً عبر حساب Kaggle.');
        if (launchRes.message?.includes('Unauthorized') || launchRes.message?.includes('401') || launchRes.message?.includes('Key')) {
          setShowKaggleCredModal(true);
        }
      }
    } catch (err: any) {
      setJobStatus('failed');
      setJobStatusMsg(err.message || 'حدث خطأ أثناء الاتصال بسيرفر Kaggle');
      if (err.message?.includes('Unauthorized') || err.message?.includes('401')) {
        setShowKaggleCredModal(true);
      }
    } finally {
      setLaunchingJob(false);
    }
  };

  const onIngestionSuccessRef = useRef(onIngestionSuccess);
  useEffect(() => {
    onIngestionSuccessRef.current = onIngestionSuccess;
  }, [onIngestionSuccess]);

  // Automated live polling for Kaggle Kernel Status & Terminal Logs (sequential without overlapping)
  useEffect(() => {
    if (!isOpen || !kaggleKernelSlug || currentStep !== 'execution') return;
    if (jobStatus === 'completed' || jobStatus === 'failed') return;

    let isMounted = true;
    let pollTimeout: any = null;

    const poll = async () => {
      if (!isMounted) return;
      try {
        const stat = await getKaggleJobStatus(kaggleKernelSlug);
        if (!isMounted) return;

        if (stat.logs && stat.logs.trim().length > 0) {
          setTerminalLogs(stat.logs);
        }

        if (stat.status === 'completed') {
          setJobStatus('completed');
          setJobStatusMsg('اكتمل التضمين السحابي للكتب ورفع كافة المتجهات إلى Qdrant Cloud بنجاح!');
          if (onIngestionSuccessRef.current) onIngestionSuccessRef.current();
          return; // Stop polling on completion
        } else if (stat.status === 'failed') {
          setJobStatus('failed');
          setJobStatusMsg(`فشلت المهمة في كاجل: ${stat.failure_message || 'راجع مخرجات الطرفية أدناه'}`);
          return; // Stop polling on failure
        } else if (stat.status === 'running') {
          setJobStatus('running');
          setJobStatusMsg('سيرفر كاجل يقوم الآن بالتنزيل والتقطيع وتوليد متجهات BGE-M3 بالـ GPU ورفعها لـ Qdrant...');
        } else if (stat.status === 'queued') {
          setJobStatus('queued');
          setJobStatusMsg('المهمة في طابور Kaggle GPU، جاري بدء الحاوية السحابية...');
        }
      } catch (err) {
        console.warn('Live poll error:', err);
      }

      // Schedule next poll 3s after current response arrives
      if (isMounted) {
        pollTimeout = setTimeout(poll, 3000);
      }
    };

    // Immediate poll check
    poll();

    return () => {
      isMounted = false;
      if (pollTimeout) clearTimeout(pollTimeout);
    };
  }, [isOpen, kaggleKernelSlug, currentStep, jobStatus]);

  // Dynamic Pipeline Phase Calculation based on real-time log contents
  const activePhase = useMemo(() => {
    if (jobStatus === 'completed') return 4;
    if (!terminalLogs) return jobStatus === 'running' || jobStatus === 'queued' ? 1 : 0;
    const lower = terminalLogs.toLowerCase();
    if (lower.includes('uploading') || lower.includes('qdrant') || lower.includes('successfully ingested')) return 4;
    if (lower.includes('embedding') || lower.includes('chunks:') || lower.includes('bge-m3')) return 3;
    if (lower.includes('slicing') || lower.includes('processing') || lower.includes('paragraphs')) return 2;
    return 1;
  }, [terminalLogs, jobStatus]);

  const [fetchingLogsManual, setFetchingLogsManual] = useState(false);
  const handleManualRefreshLogs = async () => {
    if (!kaggleKernelSlug) return;
    try {
      setFetchingLogsManual(true);
      const stat = await getKaggleJobStatus(kaggleKernelSlug);
      if (stat.logs) {
        setTerminalLogs(stat.logs);
      }
      if (stat.status === 'completed') {
        setJobStatus('completed');
        setJobStatusMsg('اكتمل التضمين السحابي للكتب ورفع كافة المتجهات إلى Qdrant Cloud بنجاح!');
        if (onIngestionSuccessRef.current) onIngestionSuccessRef.current();
      } else if (stat.status === 'failed') {
        setJobStatus('failed');
        setJobStatusMsg(`فشلت المهمة: ${stat.failure_message || 'راجع مخرجات الطرفية'}`);
      } else if (stat.status === 'running') {
        setJobStatus('running');
        setJobStatusMsg('سيرفر كاجل يقوم الآن بالتنزيل والتقطيع وتوليد متجهات BGE-M3 بالـ GPU ورفعها لـ Qdrant...');
      } else if (stat.status === 'queued') {
        setJobStatus('queued');
        setJobStatusMsg('المهمة في طابور Kaggle GPU، جاري بدء الحاوية السحابية...');
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setFetchingLogsManual(false);
    }
  };

  // Update Kaggle Token
  const handleSaveKaggleCreds = async () => {
    if (!kaggleUsernameInput.trim() || !kaggleKeyInput.trim()) return;
    try {
      setUpdatingCreds(true);
      setCredMsg(null);
      const res = await updateKaggleCredentials(kaggleUsernameInput.trim(), kaggleKeyInput.trim());
      if (res.valid) {
        setCredMsg('تم حفظ المفتاح والتحقق بنجاح! يمكنك إعادة المحاولة الآن.');
        setTimeout(() => setShowKaggleCredModal(false), 1500);
      } else {
        setCredMsg(`فشل التحقق: ${res.message}`);
      }
    } catch (err: any) {
      setCredMsg(err.message || 'فشل حفظ المفتاح');
    } finally {
      setUpdatingCreds(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div
        dir="rtl"
        className="relative flex flex-col w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-3xl border border-sky-500/30 bg-[#0d0416] text-white shadow-2xl"
      >
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-white/10 bg-[#170526]/90 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  معالج الاستدخال والتضمين السحابي المجمع
                </h3>
                <span className="rounded-lg bg-sky-500/20 px-2 py-0.5 text-xs font-mono font-bold text-sky-300 border border-sky-500/30">
                  {selectedBooks.length} كتب محددة
                </span>
              </div>
              <p className="text-xs text-white/50 mt-0.5">
                توزيع الكتب على الكلاسترات والمجموعات، والمعالجة تتم 100% على سحابة Kaggle T4 GPU
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowKaggleCredModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-xs text-white/70 hover:bg-white/10 hover:text-white"
              title="إعدادات مفتاح Kaggle API"
            >
              <Key className="h-3.5 w-3.5 text-amber-400" />
              <span>حساب Kaggle</span>
            </button>

            <button
              onClick={onClose}
              className="rounded-xl p-2 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* STEP PROGRESS INDICATOR */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-black/40 text-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentStep('matrix')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold transition-all ${
                currentStep === 'matrix'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>1. مصفوفة تعيين الكلاسترات والمجموعات</span>
            </button>

            <ArrowRight className="h-3.5 w-3.5 text-white/20 rotate-180" />

            <button
              onClick={() => setCurrentStep('execution')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold transition-all ${
                currentStep === 'execution'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Cpu className="h-4 w-4" />
              <span>2. التنفيذ السحابي التلقائي (Kaggle GPU)</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20 font-medium">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>0% استهلاك إنترنت من جهازك • التنفيذ على سحابة كاجل</span>
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ================= STEP 1: DESTINATION MATRIX ================= */}
          {currentStep === 'matrix' && (
            <div className="space-y-6 animate-in fade-in">
              {/* BATCH APPLY TOOLBAR */}
              <div className="p-4 rounded-2xl border border-sky-500/30 bg-sky-950/40 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <Sliders className="h-4 w-4 text-sky-400" />
                  <div>
                    <h5 className="text-xs font-bold text-white">تطبيق جماعي موحد (Batch Apply):</h5>
                    <p className="text-[11px] text-sky-200/60">
                      تعيين نفس الكلاستر والمجموعة أو تصنيف موحد لجميع الكتب بنقرة واحدة
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Select Cluster */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-white/50">الكلاستر:</span>
                    <select
                      value={batchCluster}
                      onChange={(e) => {
                        setBatchCluster(e.target.value);
                        const cl = clusters.find((c) => c.id === e.target.value);
                        if (cl?.collections.length) setBatchCollection(cl.collections[0].name);
                      }}
                      className="rounded-xl border border-white/10 bg-black/60 px-3 py-1.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                    >
                      {clusters.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select Collection */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-white/50">المجموعة:</span>
                    <select
                      value={batchCollection}
                      onChange={(e) => setBatchCollection(e.target.value)}
                      className="rounded-xl border border-white/10 bg-black/60 px-3 py-1.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                    >
                      {clusters
                        .find((c) => c.id === batchCluster)
                        ?.collections.map((col) => (
                          <option key={col.name} value={col.name}>
                            {col.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Batch Category */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-white/50">تصنيف موحد:</span>
                    <input
                      type="text"
                      list="batch-categories-list"
                      placeholder="اختياري (تغيير تصنيف الكل)"
                      value={batchCategory}
                      onChange={(e) => setBatchCategory(e.target.value)}
                      className="rounded-xl border border-white/10 bg-black/60 px-3 py-1.5 text-xs text-amber-200 placeholder-white/30 focus:border-amber-400 focus:outline-none w-44"
                    />
                    <datalist id="batch-categories-list">
                      {COMMON_TURATH_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyBatchToAll}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-md shadow-sky-500/20 transition-all cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>تطبيق على الكل</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowCreateCollModal(true)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-white/15 bg-white/5 text-xs text-white/80 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>مجموعة جديدة</span>
                  </button>
                </div>
              </div>

              {/* BOOKS MATRIX TABLE */}
              <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden shadow-lg">
                <div className="px-5 py-3 border-b border-white/10 bg-white/[0.02] flex items-center justify-between text-xs text-white/50">
                  <span>الكتاب وتصنيف الشاملة</span>
                  <div className="flex items-center gap-8">
                    <span>التصنيف المعتمد (قابل للتعديل)</span>
                    <span>الوجهة المستهدفة (الكلاستر + المجموعة)</span>
                  </div>
                </div>

                <div className="divide-y divide-white/5 max-h-[46vh] overflow-y-auto">
                  {selectedBooks.map((book) => {
                    const bId = Number(book.turath_id);
                    const cfg = bookConfigs[bId] || { clusterId: 'cluster_1', collection: 'zad_turath_general', category: book.category || 'عام' };
                    const activeCluster = clusters.find((c) => c.id === cfg.clusterId) || clusters[0];
                    const isCategoryModified = Boolean(cfg.category && book.category && cfg.category.trim() !== book.category.trim());

                    return (
                      <div
                        key={bId}
                        className="px-5 py-3.5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                      >
                        {/* Book Info */}
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 text-xs font-bold border border-sky-500/20 font-mono mt-0.5">
                            #{bId}
                          </span>
                          <div className="min-w-0 space-y-1">
                            <h5 className="text-sm font-bold text-white truncate">{book.title}</h5>
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="text-white/50">{book.author || 'مؤلف غير معروف'}</span>
                              <span className="text-white/20">•</span>
                              <span className="text-white/40 text-[11px]" title="تصنيف المكتبة الشاملة الافتراضي">
                                تصنيف الشاملة: <span className="text-white/70 font-medium">{book.category || 'غير محدد'}</span>
                              </span>
                              {isCategoryModified && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                                  معدّل يدوياً
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Controls (Category Customizer + Cluster & Collection Selectors) */}
                        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto shrink-0">
                          {/* Category Customizer Input */}
                          <div className="flex items-center gap-1.5">
                            <div className="relative">
                              <Tag className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40 pointer-events-none" />
                              <input
                                type="text"
                                list={`cats-list-${bId}`}
                                value={cfg.category || ''}
                                onChange={(e) => handleBookCategoryChange(bId, e.target.value)}
                                placeholder="التصنيف المعتمد"
                                title="تعديل تصنيف الكتاب قبل إرساله للاستدخال"
                                className="rounded-xl border border-white/10 bg-black/60 pr-8 pl-2.5 py-1.5 text-xs text-amber-200 focus:border-amber-400 focus:outline-none w-44"
                              />
                              <datalist id={`cats-list-${bId}`}>
                                {COMMON_TURATH_CATEGORIES.map((cat) => (
                                  <option key={cat} value={cat} />
                                ))}
                              </datalist>
                            </div>

                            {isCategoryModified && (
                              <button
                                type="button"
                                onClick={() => handleResetBookCategory(bId, book.category || 'عام')}
                                title="استعادة تصنيف الشاملة الأصلي"
                                className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Cluster Selector */}
                          <select
                            value={cfg.clusterId}
                            onChange={(e) => handleBookClusterChange(bId, e.target.value)}
                            className="rounded-xl border border-white/10 bg-black/60 px-3 py-1.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                          >
                            {clusters.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>

                          {/* Collection Selector */}
                          <select
                            value={cfg.collection}
                            onChange={(e) => handleBookCollectionChange(bId, e.target.value)}
                            className="rounded-xl border border-white/10 bg-black/60 px-3 py-1.5 text-xs text-emerald-300 font-mono focus:border-emerald-500 focus:outline-none"
                          >
                            {activeCluster?.collections.map((col) => (
                              <option key={col.name} value={col.name}>
                                {col.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ACTION FOOTER */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <span className="text-xs text-white/50">
                  سيتم تجهيز سكريبت GPU مجمع وتشغيله سحابياً لمعالجة {selectedBooks.length} كتب دفعة واحدة.
                </span>

                <button
                  type="button"
                  onClick={handleLaunchKaggleJob}
                  disabled={launchingJob}
                  className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-sm shadow-xl shadow-amber-500/25 transition-all cursor-pointer"
                >
                  {launchingJob ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 fill-black" />
                  )}
                  <span>بدء الاستدخال السحابي لجميع الكتب عبر Kaggle GPU</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 2: KAGGLE EXECUTION & TERMINAL ================= */}
          {currentStep === 'execution' && (
            <div className="space-y-6 animate-in fade-in">
              {/* KAGGLE CLOUD GPU HEADER CARD */}
              <div className="p-6 rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/10 via-black/40 to-transparent space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-lg">
                      <Cpu className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">
                        مهمة كاجل السحابية (Kaggle Cloud T4 GPU)
                      </h4>
                      <p className="text-xs text-white/60 mt-0.5">
                        معالجة مجمعة لـ <span className="text-amber-300 font-bold">{selectedBooks.length} كتب</span> • تنزيل من CDN وتضمين BGE-M3 سحابياً
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {kaggleUrl && (
                      <a
                        href={kaggleUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white font-semibold border border-white/10 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>فتح جلسة Kaggle</span>
                      </a>
                    )}

                    {jobStatus === 'failed' && (
                      <button
                        onClick={handleLaunchKaggleJob}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>إعادة المحاولة</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* PROGRESS BANNER */}
                <div className="p-4 rounded-xl border border-white/10 bg-black/60 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white flex items-center gap-2">
                      {jobStatus === 'running' || jobStatus === 'queued' ? (
                        <RefreshCw className="h-4 w-4 text-amber-400 animate-spin" />
                      ) : jobStatus === 'completed' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-rose-400" />
                      )}
                      <span>{jobStatusMsg || 'جاري تجهيز بيئة التشغيل السحابية...'}</span>
                    </span>

                    <span className="font-mono text-amber-300 font-bold uppercase tracking-wider">
                      [{jobStatus}]
                    </span>
                  </div>

                  {/* 4 PIPELINE PHASES PILLS */}
                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/10 text-[11px] text-center">
                    <div
                      className={`p-2 rounded-lg border transition-all ${
                        activePhase >= 1
                          ? activePhase > 1
                            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-bold'
                            : 'border-amber-500/40 bg-amber-500/10 text-amber-300 font-bold animate-pulse'
                          : 'border-white/5 bg-white/[0.02] text-white/40'
                      }`}
                    >
                      1. تنزيل تراث CDN
                    </div>
                    <div
                      className={`p-2 rounded-lg border transition-all ${
                        activePhase >= 2
                          ? activePhase > 2
                            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-bold'
                            : 'border-amber-500/40 bg-amber-500/10 text-amber-300 font-bold animate-pulse'
                          : 'border-white/5 bg-white/[0.02] text-white/40'
                      }`}
                    >
                      2. تقطيع وحقن السياق
                    </div>
                    <div
                      className={`p-2 rounded-lg border transition-all ${
                        activePhase >= 3
                          ? activePhase > 3
                            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-bold'
                            : 'border-amber-500/40 bg-amber-500/10 text-amber-300 font-bold animate-pulse'
                          : 'border-white/5 bg-white/[0.02] text-white/40'
                      }`}
                    >
                      3. تضمين BGE-M3 GPU
                    </div>
                    <div
                      className={`p-2 rounded-lg border transition-all ${
                        activePhase >= 4
                          ? jobStatus === 'completed'
                            ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300 font-extrabold shadow-md'
                            : 'border-amber-500/40 bg-amber-500/10 text-amber-300 font-bold animate-pulse'
                          : 'border-white/5 bg-white/[0.02] text-white/40'
                      }`}
                    >
                      4. رفع Qdrant Cloud
                    </div>
                  </div>
                </div>
              </div>

              {/* LIVE TERMINAL LOGS WINDOW */}
              <div className="rounded-2xl border border-white/10 bg-[#08010f] overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between px-4 py-2.5 bg-white/5 border-b border-white/10 text-xs">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-amber-400" />
                    <span className="font-semibold text-white/80 font-mono">
                      Kaggle Cloud Live Terminal Output
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleManualRefreshLogs}
                      disabled={fetchingLogsManual}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-[11px] cursor-pointer"
                      title="سحب السجلات الحية الآن من Kaggle"
                    >
                      <RefreshCw className={`h-3 w-3 ${fetchingLogsManual ? 'animate-spin text-amber-400' : ''}`} />
                      <span>{fetchingLogsManual ? 'جاري السحب...' : 'تحديث السجلات'}</span>
                    </button>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(terminalLogs);
                        setCopiedLogs(true);
                        setTimeout(() => setCopiedLogs(false), 2000);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-[11px] cursor-pointer"
                    >
                      {copiedLogs ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedLogs ? 'تم النسخ' : 'نسخ المخرجات'}</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 font-mono text-xs text-emerald-400/90 leading-relaxed max-h-80 overflow-y-auto whitespace-pre-wrap select-text bg-black/80">
                  {terminalLogs || (
                    <div className="text-white/40 italic py-8 text-center space-y-2">
                      <div className="flex items-center justify-center gap-2 text-amber-300">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>سيرفر Kaggle يقوم بتجهيز الحاوية السحابية (GPU Container) وتحميل نموذج الذكاء الاصطناعي...</span>
                      </div>
                      <p className="text-[11px] text-white/30">
                        تستغرق البداية من 25 إلى 40 ثانية على كاجل، وستتدفق السجلات هنا لحظة بلحظة تلقائياً.
                      </p>
                    </div>
                  )}
                  <div ref={terminalEndRef} />
                </div>
              </div>

              {/* COMPLETION ACTION BAR */}
              {jobStatus === 'completed' && (
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/30 backdrop-blur-md text-xs animate-in fade-in">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                    <span>اكتمل التضمين السحابي للكتب ورفع كافة المتجهات بنجاح! تم تحديث الكلاستر تلقائياً.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentStep('matrix')}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition-all cursor-pointer"
                    >
                      العودة لمصفوفة الكتب
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
                    >
                      إغلاق المعالج
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL: CREATE COLLECTION INLINE */}
        {showCreateCollModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#170526] p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Plus className="h-4 w-4 text-sky-400" />
                  <span>إنشاء مجموعة جديدة (Collection)</span>
                </h4>
                <button onClick={() => setShowCreateCollModal(false)} className="text-white/40 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateCollection} className="space-y-4 text-xs">
                <div>
                  <label className="text-white/60 block mb-1">الكلاستر المستهدف:</label>
                  <select
                    value={createCollCluster}
                    onChange={(e) => setCreateCollCluster(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white"
                  >
                    {clusters.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-white/60 block mb-1">اسم المجموعة بالإنجليزية (ID):</label>
                  <input
                    type="text"
                    value={newCollName}
                    onChange={(e) => setNewCollName(e.target.value)}
                    placeholder="e.g. c1_zad_fiqh_new_1"
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-white/60 block mb-1">الاسم العربي المعروض:</label>
                  <input
                    type="text"
                    value={newCollArabic}
                    onChange={(e) => setNewCollArabic(e.target.value)}
                    placeholder="مثال: الفقه المقارن المتقدم"
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white"
                  />
                </div>

                {createCollError && (
                  <p className="text-rose-400 text-xs">{createCollError}</p>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowCreateCollModal(false)}
                    className="px-3.5 py-1.5 rounded-xl border border-white/10 text-white/60 hover:text-white"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingColl}
                    className="px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold"
                  >
                    {isCreatingColl ? 'جاري الإنشاء...' : 'إنشاء المجموعة'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: KAGGLE CREDENTIALS SETUP */}
        {showKaggleCredModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-md rounded-2xl border border-amber-500/30 bg-[#160526] p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 text-amber-400">
                  <Key className="h-4 w-4" />
                  <h4 className="text-sm font-bold text-white">تحديث بيانات حساب Kaggle API</h4>
                </div>
                <button onClick={() => setShowKaggleCredModal(false)} className="text-white/40 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="text-xs text-white/70 leading-relaxed">
                إذا انتهت صلاحية التوكن أو ظهر خطأ 401، يمكنك الحصول على مفتاح جديد مجاناً من إعدادات حسابك في كاجل:{' '}
                <a
                  href="https://www.kaggle.com/settings"
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-400 underline"
                >
                  kaggle.com/settings
                </a>{' '}
                (زر Create New Token).
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-white/60 block mb-1">اسم المستخدم في كاجل (Username):</label>
                  <input
                    type="text"
                    value={kaggleUsernameInput}
                    onChange={(e) => setKaggleUsernameInput(e.target.value)}
                    placeholder="مثال: ahmedaboraida"
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-white/60 block mb-1">مفتاح API Key:</label>
                  <input
                    type="password"
                    value={kaggleKeyInput}
                    onChange={(e) => setKaggleKeyInput(e.target.value)}
                    placeholder="المفتاح من ملف kaggle.json"
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white font-mono"
                  />
                </div>

                {credMsg && (
                  <p className="text-amber-300 text-xs">{credMsg}</p>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowKaggleCredModal(false)}
                    className="px-3 py-1.5 rounded-xl border border-white/10 text-white/60 hover:text-white"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveKaggleCreds}
                    disabled={updatingCreds}
                    className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold"
                  >
                    {updatingCreds ? 'جاري التحقق...' : 'حفظ وتحقق'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
