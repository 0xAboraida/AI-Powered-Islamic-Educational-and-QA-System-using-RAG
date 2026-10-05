import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Search,
  Eye,
  FileText,
  Clock,
  ArrowRight,
  ArrowLeft,
  Maximize2,
  Terminal,
  Key,
  ShieldCheck,
  Tag,
  RotateCcw
} from 'lucide-react';
import { COMMON_TURATH_CATEGORIES } from '../collectionsData';
import {
  TurathBookItem,
  ClusterInfo,
  BookInspectionResponse,
  ChunkPreviewResponse,
  ChunkPreviewItem,
  BookHeadingItem,
  KaggleJobStatusResponse,
  RetrievedParent
} from '../types';
import {
  inspectBook,
  previewChunks,
  launchKaggleJob,
  getKaggleJobStatus,
  createCollectionOnCluster,
  testTurathQuery,
  updateKaggleCredentials
} from '../turathRagApi';

interface BookSteppedIngestModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: TurathBookItem | null;
  clusters: ClusterInfo[];
  onRefreshClusters: () => void;
  onIngestionSuccess?: () => void;
  initialStep?: 1 | 2 | 3 | 4;
  initialKernelSlug?: string;
  initialCollection?: string;
  initialClusterId?: string;
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

export const BookSteppedIngestModal: React.FC<BookSteppedIngestModalProps> = ({
  isOpen,
  onClose,
  book,
  clusters,
  onRefreshClusters,
  onIngestionSuccess,
  initialStep = 1,
  initialKernelSlug,
  initialCollection,
  initialClusterId
}) => {
  // Step 1: Destination -> Step 2: Inspection -> Step 3: Kaggle GPU -> Step 4: Verification
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(initialStep);

  // --- Step 1: Target Destination State ---
  const [selectedClusterId, setSelectedClusterId] = useState<string>(initialClusterId || 'cluster_1');
  const [selectedCollection, setSelectedCollection] = useState<string>(initialCollection || '');
  const [customCategory, setCustomCategory] = useState<string>(book?.category || '');
  const [showCreateCollModal, setShowCreateCollModal] = useState(false);
  const [newCollName, setNewCollName] = useState('');
  const [newCollArabic, setNewCollArabic] = useState('');
  const [isCreatingColl, setIsCreatingColl] = useState(false);
  const [createCollError, setCreateCollError] = useState<string | null>(null);

  // --- Step 2: Inspection & Preview State ---
  const [inspectionData, setInspectionData] = useState<BookInspectionResponse | null>(null);
  const [loadingInspection, setLoadingInspection] = useState<boolean>(false);
  const [inspectionError, setInspectionError] = useState<string | null>(null);
  const [headingSearchQuery, setHeadingSearchQuery] = useState('');

  const [chunksData, setChunksData] = useState<ChunkPreviewResponse | null>(null);
  const [loadingChunks, setLoadingChunks] = useState<boolean>(false);
  const [chunksError, setChunksError] = useState<string | null>(null);
  const [chunkSearchQuery, setChunkSearchQuery] = useState('');
  const [selectedChunkForDetail, setSelectedChunkForDetail] = useState<ChunkPreviewItem | null>(null);
  const [showOriginalModal, setShowOriginalModal] = useState<boolean>(false);

  // --- Step 3: Kaggle GPU Cloud State ---
  const [kaggleKernelSlug, setKaggleKernelSlug] = useState<string | null>(initialKernelSlug || null);
  const [kaggleUrl, setKaggleUrl] = useState<string | null>(
    initialKernelSlug ? `https://www.kaggle.com/code/${initialKernelSlug}` : null
  );
  const [launchingJob, setLaunchingJob] = useState(false);
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

  // --- Step 4: Verification State ---
  const [testQueryText, setTestQueryText] = useState('ما هي شروط الصلاة في هذا الكتاب؟');
  const [runningTest, setRunningTest] = useState(false);
  const [testResults, setTestResults] = useState<RetrievedParent[]>([]);
  const [testLatency, setTestLatency] = useState<number | null>(null);

  const prevIsOpenRef = useRef(false);
  const prevBookIdRef = useRef<number | null>(null);

  // Initialize on modal open (supports resuming at Step 3 if already launched!)
  useEffect(() => {
    const isOpening = isOpen && !prevIsOpenRef.current;
    const currentBookId = book ? Number(book.turath_id) : null;
    const isBookChanged = currentBookId !== prevBookIdRef.current;

    prevIsOpenRef.current = isOpen;

    if (!isOpen || !book) return;

    // Only reset/initialize if modal just opened or a different book was selected
    if (isOpening || isBookChanged) {
      prevBookIdRef.current = currentBookId;
      const stepToUse = initialStep || 1;
      setCurrentStep(stepToUse);
      setCustomCategory(book.category || '');
      setInspectionData(null);
      setChunksData(null);
      setTestResults([]);
      setSelectedChunkForDetail(null);
      setShowOriginalModal(false);

      if (initialKernelSlug || stepToUse === 3) {
        const slug = initialKernelSlug || kaggleKernelSlug;
        if (slug) {
          setKaggleKernelSlug(slug);
          setKaggleUrl(`https://www.kaggle.com/code/${slug}`);
          setJobStatus('running');
          setJobStatusMsg('جاري استئناف متابعة المهمة السحابية الحية على Kaggle GPU...');
          pollJobStatus(slug);
        }
      } else {
        setJobStatus('idle');
        setTerminalLogs('');
      }

      // Resolve smart default cluster & collection based on book metadata
      const suggestedColl = initialCollection || resolveCollectionForBook(book.category || '', book.title);
      const defaultCluster = initialClusterId || clusters[0]?.id || 'cluster_1';
      setSelectedClusterId(defaultCluster);

      const targetClusterObj = clusters.find((c) => c.id === defaultCluster) || clusters[0];
      const collExists = targetClusterObj?.collections.some((col) => col.name === suggestedColl);
      setSelectedCollection(collExists ? suggestedColl : targetClusterObj?.collections[0]?.name || suggestedColl);

      setTestQueryText(`ما هي أهم أحكام ومسائل ${book.title}؟`);
    }
  }, [isOpen, book, clusters, initialStep, initialKernelSlug, initialCollection, initialClusterId]);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs]);

  // Fetch Step 2: Inspection
  const fetchStep2Inspection = async (bId: number) => {
    try {
      setLoadingInspection(true);
      setInspectionError(null);
      const res = await inspectBook(bId);
      setInspectionData(res);
    } catch (err: any) {
      console.error(err);
      setInspectionError(err.message || 'تعذر فحص فهرس الكتاب من شبكة تراث');
    } finally {
      setLoadingInspection(false);
    }
  };

  // Fetch Step 2: Chunks Preview
  const fetchStep2Chunks = async (bId: number) => {
    try {
      setLoadingChunks(true);
      setChunksError(null);
      const res = await previewChunks(bId, 60);
      setChunksData(res);
      if (res.chunks && res.chunks.length > 0) {
        setSelectedChunkForDetail(res.chunks[0]);
      }
    } catch (err: any) {
      console.error(err);
      setChunksError(err.message || 'تعذر استعراض القطع الفقهية');
    } finally {
      setLoadingChunks(false);
    }
  };

  // Move from Step 1 (Destination) to Step 2 (Inspection)
  const handleConfirmDestinationAndInspect = () => {
    if (!book) return;
    setCurrentStep(2);
    if (!inspectionData) {
      fetchStep2Inspection(Number(book.turath_id));
    }
    if (!chunksData) {
      fetchStep2Chunks(Number(book.turath_id));
    }
  };

  // Move from Step 2 (Inspection) to Step 3 (Kaggle Cloud GPU)
  const handleApproveInspectionAndProceed = async () => {
    if (!book) return;
    setCurrentStep(3);
    // Auto-launch the Kaggle job immediately!
    handleLaunchKaggleJob();
  };

  // Launch Kaggle Cloud Job
  const handleLaunchKaggleJob = async () => {
    if (!book) return;
    const bId = Number(book.turath_id);

    try {
      setLaunchingJob(true);
      setJobStatus('queued');
      setJobStatusMsg('جاري إرسال المهمة إلى سحابة Kaggle T4 GPU عبر Kaggle API...');

      const launchRes = await launchKaggleJob(
        bId,
        selectedCollection,
        selectedClusterId,
        undefined,
        {
          [bId]: {
            title: book.title,
            category: customCategory.trim() || book.category || '',
            collection: selectedCollection,
            clusterId: selectedClusterId,
            shamela_category: book.category || ''
          }
        }
      );

      setKaggleKernelSlug(launchRes.kernel_slug);
      setKaggleUrl(launchRes.url);

      if (launchRes.status === 'success') {
        setJobStatus('running');
        setJobStatusMsg(`تم إطلاق المهمة بنجاح على Kaggle T4 GPU لكتاب #${bId} عبر شبكة كاجل!`);
        pollJobStatus(launchRes.kernel_slug);
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

  const pollTimeoutRef = useRef<any>(null);

  // Poll Kaggle Status & Terminal Logs (sequential without overlapping)
  const pollJobStatus = (slug: string) => {
    if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);

    const poll = async () => {
      try {
        const stat = await getKaggleJobStatus(slug);
        if (stat.logs && stat.logs.trim().length > 0) {
          setTerminalLogs(stat.logs);
        }
        if (stat.status === 'completed') {
          setJobStatus('completed');
          setJobStatusMsg('اكتمل التضمين السحابي للكتاب ورفع كافة المتجهات إلى Qdrant Cloud بنجاح!');
          onRefreshClusters();
          if (onIngestionSuccess) onIngestionSuccess();
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
      } catch (e) {
        console.warn('Poll warning:', e);
      }

      // Schedule next poll 3s after current response arrives
      pollTimeoutRef.current = setTimeout(poll, 3000);
    };

    poll();
  };

  useEffect(() => {
    return () => {
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    };
  }, []);

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
        setJobStatusMsg('اكتمل التضمين السحابي للكتاب ورفع كافة المتجهات إلى Qdrant Cloud بنجاح!');
        onRefreshClusters();
        if (onIngestionSuccess) onIngestionSuccess();
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

  // Run Step 4 Instant RAG Test
  const handleRunRAGTest = async () => {
    if (!testQueryText.trim() || !book) return;
    try {
      setRunningTest(true);
      const res = await testTurathQuery({
        query: testQueryText.trim(),
        target_cluster: selectedClusterId,
        target_collection: selectedCollection,
        book_id: Number(book.turath_id),
        top_k: 3
      });
      setTestResults(res.parents || []);
      setTestLatency(res.latency_ms ?? null);
    } catch (err: any) {
      alert(`فشل الاستعلام التجريبي: ${err.message}`);
    } finally {
      setRunningTest(false);
    }
  };

  // Create Collection Inline
  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollName.trim()) return;

    try {
      setIsCreatingColl(true);
      setCreateCollError(null);
      await createCollectionOnCluster(
        selectedClusterId,
        newCollName.trim(),
        newCollArabic.trim() || newCollName.trim(),
        'BookOpen',
        'مجموعة فقهية منشأة للاستدخال'
      );
      setSelectedCollection(newCollName.trim());
      setShowCreateCollModal(false);
      setNewCollName('');
      setNewCollArabic('');
      onRefreshClusters();
    } catch (err: any) {
      setCreateCollError(err.message || 'فشل إنشاء المجموعة');
    } finally {
      setIsCreatingColl(false);
    }
  };

  // Update Kaggle Credentials
  const handleSaveKaggleCreds = async () => {
    if (!kaggleUsernameInput.trim() || !kaggleKeyInput.trim()) return;
    try {
      setUpdatingCreds(true);
      setCredMsg(null);
      const res = await updateKaggleCredentials(kaggleUsernameInput.trim(), kaggleKeyInput.trim());
      if (res.valid) {
        setCredMsg('تم حفظ المفتاح والتحقق بنجاح! أعد المحاولة الآن.');
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

  // Filtered Headings
  const filteredHeadings = useMemo(() => {
    if (!inspectionData?.headings) return [];
    if (!headingSearchQuery.trim()) return inspectionData.headings;
    const q = headingSearchQuery.toLowerCase();
    return inspectionData.headings.filter((h) => h.title.toLowerCase().includes(q));
  }, [inspectionData, headingSearchQuery]);

  // Filtered Chunks
  const filteredChunks = useMemo(() => {
    if (!chunksData?.chunks) return [];
    if (!chunkSearchQuery.trim()) return chunksData.chunks;
    const q = chunkSearchQuery.toLowerCase();
    return chunksData.chunks.filter((c) => c.child_content.toLowerCase().includes(q) || c.chapter_title.toLowerCase().includes(q));
  }, [chunksData, chunkSearchQuery]);

  const activeClusterObj = clusters.find((c) => c.id === selectedClusterId) || clusters[0];

  if (!isOpen || !book) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div
        dir="rtl"
        className="relative flex flex-col w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-3xl border border-sky-500/30 bg-[#0d0416] text-white shadow-2xl"
      >
        {/* HEADER */}
        <div className="border-b border-white/10 bg-[#170526]/90 px-6 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 shadow-lg">
                <BookOpen className="h-6 w-6" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight text-white">{book.title}</h2>
                  <span className="rounded-md bg-white/10 px-2.5 py-0.5 text-xs font-mono text-sky-300 border border-white/10">
                    رقم #{book.turath_id}
                  </span>
                </div>
                <p className="text-xs text-white/50 mt-0.5">
                  معالج الاستدخال والتضمين السحابي (Cloud Ingestion Pipeline)
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
                className="rounded-full p-2 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* STEPPER TABS */}
          <div className="grid grid-cols-4 gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5">
            {[
              { step: 1, label: '1. تخصيص الكلاستر والمجموعة', icon: Layers },
              { step: 2, label: '2. فحص الهيكل وتقطيع العينات', icon: FileText },
              { step: 3, label: '3. التضمين السحابي (Kaggle GPU)', icon: Cpu },
              { step: 4, label: '4. التحقق وتجربة الـ RAG', icon: Sparkles }
            ].map((s) => {
              const Icon = s.icon;
              const isActive = currentStep === s.step;
              const isPast = currentStep > s.step;
              return (
                <button
                  key={s.step}
                  onClick={() => {
                    if (isPast) setCurrentStep(s.step as any);
                  }}
                  disabled={!isPast && !isActive}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30 font-bold'
                      : isPast
                      ? 'bg-white/10 text-sky-300 hover:bg-white/15 cursor-pointer'
                      : 'text-white/30 cursor-not-allowed'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{s.label}</span>
                  {isPast && <Check className="h-3.5 w-3.5 text-sky-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ================= STEP 1: DESTINATION CONFIGURATION (CLUSTER & COLLECTION) ================= */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in">
              {/* BOOK DETAILS CARD */}
              <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-[11px] text-white/40 block">اسم الكتاب</span>
                  <p className="text-sm font-bold text-white mt-1">{book.title}</p>
                </div>
                <div>
                  <span className="text-[11px] text-white/40 block">المؤلف والوفاة</span>
                  <p className="text-sm font-semibold text-white mt-1">
                    {book.author || 'مؤلف غير معروف'}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-white/40 block">تصنيف المكتبة الشاملة الافتراضي</span>
                  <p className="text-sm font-semibold text-sky-300 mt-1">{book.category || 'غير محدد'}</p>
                </div>
                <div className="flex items-center md:justify-end">
                  <a
                    href={`https://app.turath.io/book/${book.turath_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-sky-300 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>عرض الكتاب في تراث</span>
                  </a>
                </div>
              </div>

              {/* CATEGORY CUSTOMIZATION CARD */}
              <div className="p-5 rounded-2xl border border-amber-500/30 bg-amber-950/20 backdrop-blur-md space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Tag className="h-5 w-5 text-amber-400" />
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>التصنيف المعتمد للكتاب في Qdrant</span>
                        {customCategory && book.category && customCategory.trim() !== book.category.trim() ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                            تخصيص يدوي
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/10 text-white/60 border border-white/10">
                            مطابق للشاملة
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-white/50 mt-0.5">
                        يمكنك تعديل التصنيف أو اختياره من القائمة قبل الاستدخال السحابي
                      </p>
                    </div>
                  </div>

                  {customCategory && book.category && customCategory.trim() !== book.category.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomCategory(book.category || '');
                        const suggestedColl = resolveCollectionForBook(book.category || '', book.title);
                        const targetClusterObj = clusters.find((c) => c.id === selectedClusterId) || clusters[0];
                        if (targetClusterObj?.collections.some((col) => col.name === suggestedColl)) {
                          setSelectedCollection(suggestedColl);
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-white/70 hover:text-white transition-colors cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>استعادة تصنيف الشاملة</span>
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      list="single-modal-cats-list"
                      value={customCategory}
                      onChange={(e) => {
                        const newCat = e.target.value;
                        setCustomCategory(newCat);
                        const suggestedColl = resolveCollectionForBook(newCat, book.title);
                        const targetClusterObj = clusters.find((c) => c.id === selectedClusterId) || clusters[0];
                        if (targetClusterObj?.collections.some((col) => col.name === suggestedColl)) {
                          setSelectedCollection(suggestedColl);
                        }
                      }}
                      placeholder="اكتب أو اختر التصنيف المعتمد..."
                      className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2.5 text-xs text-amber-200 placeholder-white/30 focus:border-amber-400 focus:outline-none"
                    />
                    <datalist id="single-modal-cats-list">
                      {COMMON_TURATH_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>

                  {/* Quick Category Suggestion Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-white/40 ml-1">اقتراحات سريعة:</span>
                    {COMMON_TURATH_CATEGORIES.slice(0, 8).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setCustomCategory(cat);
                          const suggestedColl = resolveCollectionForBook(cat, book.title);
                          const targetClusterObj = clusters.find((c) => c.id === selectedClusterId) || clusters[0];
                          if (targetClusterObj?.collections.some((col) => col.name === suggestedColl)) {
                            setSelectedCollection(suggestedColl);
                          }
                        }}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          customCategory === cat
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                            : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* TARGET CLUSTER & COLLECTION CONFIG */}
              <div className="p-6 rounded-2xl border border-sky-500/30 bg-sky-950/20 backdrop-blur-md space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Server className="h-5 w-5 text-sky-400" />
                    <span>حدد أين تريد حفظ وتخزين متجهات هذا الكتاب؟</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowCreateCollModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-semibold text-white transition-all"
                  >
                    <Plus className="h-4 w-4 text-sky-400" />
                    <span>إنشاء مجموعة جديدة (Collection)</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Select Cluster */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-white/80 block">
                      الكلاستر المستهدف (Qdrant Cluster):
                    </label>
                    <select
                      value={selectedClusterId}
                      onChange={(e) => {
                        setSelectedClusterId(e.target.value);
                        const cl = clusters.find((c) => c.id === e.target.value);
                        if (cl?.collections.length) {
                          setSelectedCollection(cl.collections[0].name);
                        }
                      }}
                      className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                    >
                      {clusters.map((c) => (
                        <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                          {c.name} ({c.points_count.toLocaleString()} نقطة • {c.collections_count} مجموعات)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select Collection */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-white/80 block">
                      المجموعة (Collection) المستهدفة:
                    </label>
                    <select
                      value={selectedCollection}
                      onChange={(e) => setSelectedCollection(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2.5 text-xs text-emerald-300 font-mono focus:border-emerald-500 focus:outline-none"
                    >
                      {activeClusterObj?.collections.map((col) => (
                        <option key={col.name} value={col.name} className="bg-slate-900 text-white">
                          {col.name} ({col.points_count.toLocaleString()} متجه)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* SMART SUGGESTION BADGE */}
                <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-xs text-emerald-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 shrink-0 text-emerald-400" />
                    <span>
                      المجموعة المقترحة تلقائياً لهذا الكتاب بناءً على تصنيفه ومذهبه هي:{' '}
                      <strong className="font-mono text-white underline">{selectedCollection}</strong>
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-400/70">توجيه ذكي</span>
                </div>
              </div>

              {/* ACTION BUTTON */}
              <div className="flex items-center justify-end pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleConfirmDestinationAndInspect}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-lg shadow-sky-500/25 transition-all cursor-pointer"
                >
                  <span>تأكيد الوجهة والمتابعة لفحص الأبواب والمعاينة</span>
                  <ArrowLeft className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 2: TOC & CHUNK INSPECTION ================= */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in">
              {/* LOADING INDICATOR */}
              {(loadingInspection || loadingChunks) && (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                  <RefreshCw className="h-10 w-10 text-sky-400 animate-spin" />
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-white">جاري الاتصال وتجهيز عينات التقطيع الفقهي...</p>
                    <p className="text-xs text-white/50">تحليل الفهرس واختبار دقة التقطيع (400 كلمة مع 50 تداخل)</p>
                  </div>
                </div>
              )}

              {/* ERROR BANNER WITH RETRY AND SKIP BUTTONS */}
              {inspectionError && (
                <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-amber-400" />
                    <div>
                      <h4 className="font-semibold text-sm">ملاحظة اتصال بشبكة تراث</h4>
                      <p className="text-xs mt-1 text-white/70 leading-relaxed">
                        {inspectionError}.<br />
                        يمكنك إعادة المحاولة، أو <strong>المتابعة مباشرة للاستدخال السحابي عبر كاجل</strong> حيث ستتولى سيرفرات كاجل السريعة تنزيل الكتاب وتضمينه دون أي عائق.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => {
                        fetchStep2Inspection(Number(book.turath_id));
                        fetchStep2Chunks(Number(book.turath_id));
                      }}
                      className="px-4 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-xs font-semibold"
                    >
                      إعادة المحاولة
                    </button>

                    <button
                      onClick={handleApproveInspectionAndProceed}
                      className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all"
                    >
                      تخطي المعاينة والاستدخال عبر Kaggle فوراً
                    </button>
                  </div>
                </div>
              )}

              {/* INSPECTED DATA HEADINGS */}
              {inspectionData && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <FileText className="h-4 w-4 text-sky-400" />
                      <span>شجرة أبواب الكتاب ({inspectionData.headings_count} باب وفصل فقهي)</span>
                    </h3>
                    <div className="relative w-60">
                      <Search className="absolute right-3 top-2.5 h-3.5 w-3.5 text-white/40" />
                      <input
                        type="text"
                        value={headingSearchQuery}
                        onChange={(e) => setHeadingSearchQuery(e.target.value)}
                        placeholder="ابحث في الأبواب..."
                        className="w-full rounded-xl border border-white/10 bg-black/40 pr-8 pl-3 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-1.5 rounded-2xl border border-white/10 bg-black/30 p-3">
                    {filteredHeadings.slice(0, 50).map((h) => (
                      <div
                        key={h.index}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.04] text-xs"
                      >
                        <span className="font-semibold text-white">{h.title}</span>
                        <span className="text-[11px] text-white/50 font-mono">ص {h.start_page} إلى {h.end_page}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ACTION FOOTER */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs"
                >
                  الرجوع لتعديل الكلاستر
                </button>

                <button
                  type="button"
                  onClick={handleApproveInspectionAndProceed}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
                >
                  <span>الموافقة وبدء الاستدخال السحابي عبر Kaggle GPU</span>
                  <ArrowLeft className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 3: KAGGLE CLOUD GPU EXECUTION & TERMINAL ================= */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="p-6 rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/10 via-black/40 to-transparent space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-lg">
                      <Cpu className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">
                        المعالجة السحابية عبر Kaggle Cloud (Nvidia T4 GPU)
                      </h4>
                      <p className="text-xs text-white/60 mt-0.5">
                        الوجهة:{' '}
                        <strong className="text-sky-300 font-mono">{selectedClusterId}</strong> ›{' '}
                        <strong className="text-emerald-300 font-mono">{selectedCollection}</strong>
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
                      <span>{jobStatusMsg || 'جاري تجهيز بيئة التشغيل السحابية في كاجل...'}</span>
                    </span>

                    <span className="font-mono text-amber-300 font-bold uppercase tracking-wider">
                      [{jobStatus}]
                    </span>
                  </div>

                  {/* 4 PHASES */}
                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/10 text-[11px] text-center">
                    <div
                      className={`p-2 rounded-lg border ${
                        jobStatus === 'running' || jobStatus === 'completed'
                          ? 'border-amber-500/40 bg-amber-500/10 text-amber-300 font-bold'
                          : 'border-white/5 bg-white/[0.02] text-white/40'
                      }`}
                    >
                      1. تنزيل تراث CDN
                    </div>
                    <div
                      className={`p-2 rounded-lg border ${
                        jobStatus === 'running' || jobStatus === 'completed'
                          ? 'border-amber-500/40 bg-amber-500/10 text-amber-300 font-bold'
                          : 'border-white/5 bg-white/[0.02] text-white/40'
                      }`}
                    >
                      2. تقطيع وحقن السياق
                    </div>
                    <div
                      className={`p-2 rounded-lg border ${
                        jobStatus === 'running' || jobStatus === 'completed'
                          ? 'border-amber-500/40 bg-amber-500/10 text-amber-300 font-bold'
                          : 'border-white/5 bg-white/[0.02] text-white/40'
                      }`}
                    >
                      3. تضمين BGE-M3 GPU
                    </div>
                    <div
                      className={`p-2 rounded-lg border ${
                        jobStatus === 'completed'
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-bold'
                          : 'border-white/5 bg-white/[0.02] text-white/40'
                      }`}
                    >
                      4. رفع Qdrant Cloud
                    </div>
                  </div>
                </div>
              </div>

              {/* LIVE TERMINAL */}
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

                <div className="p-4 font-mono text-xs text-emerald-400/90 leading-relaxed max-h-72 overflow-y-auto whitespace-pre-wrap select-text bg-black/80">
                  {terminalLogs || (
                    <div className="text-white/30 italic py-6 text-center">
                      جاري انتظار بدء إخراج الطرفية من سيرفر Kaggle... ستظهر السجلات الحية هنا تلقائياً فور بدء تشغيل النواة.
                    </div>
                  )}
                  <div ref={terminalEndRef} />
                </div>
              </div>

              {/* ADVANCE TO RAG VERIFICATION BUTTON */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <span className="text-xs text-white/50">
                  {jobStatus === 'completed'
                    ? 'اكتملت المعالجة السحابية بنجاح! انتقل لتجربة استرجاع الكتاب في RAG.'
                    : 'يمكنك الانتقال لخطوة التجربة بمجرد اكتمال الرفع السحابي.'}
                </span>

                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <span>الانتقال لخطوة الفحص وتجربة الاسترجاع</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 4: VERIFICATION & INSTANT RAG SANDBOX ================= */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <span>تم التحقق من المتجهات بنجاح!</span>
                  </h3>
                  <p className="text-xs text-white/50 mt-1">
                    كتاب ({book.title}) مفهرس ومتاح الآن بالكامل للبحث والاسترجاع الفقهي التلقائي.
                  </p>
                </div>
              </div>

              {/* INSTANT RAG TEST BOX */}
              <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] space-y-4">
                <h4 className="text-sm font-bold text-white">تجربة استرجاع فورية (Instant RAG Sandbox)</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={testQueryText}
                    onChange={(e) => setTestQueryText(e.target.value)}
                    placeholder="اكتب سؤالاً أو مسألة فقهية لاختبار استرجاع هذا الكتاب..."
                    className="flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    onClick={handleRunRAGTest}
                    disabled={runningTest}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-colors cursor-pointer"
                  >
                    {runningTest ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    <span>استعلام الآن</span>
                  </button>
                </div>

                {testLatency !== null && (
                  <p className="text-[11px] text-white/40">
                    زمن الاستجابة: <span className="text-emerald-400 font-mono font-bold">{testLatency} ms</span> • تم توسيع الـ Parent ديناميكياً من CDN تراث
                  </p>
                )}

                {testResults.length > 0 && (
                  <div className="space-y-3 pt-2">
                    {testResults.map((res, i) => (
                      <div key={i} className="p-4 rounded-xl border border-white/10 bg-black/30 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white">{res.chapter_title}</span>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                            تطابق: {(res.score * 100).toFixed(1)}%
                          </span>
                        </div>
                        <p className="text-xs text-white/70 leading-relaxed">{res.content_preview}</p>
                        <div className="flex justify-end">
                          <a
                            href={res.source_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span>فتح النص الأصلي في تراث</span>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRefreshClusters();
                  }}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  إتمام وإغلاق المعالج
                </button>
              </div>
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
                  <label className="text-white/60 block mb-1">اسم المجموعة بالإنجليزية (ID):</label>
                  <input
                    type="text"
                    value={newCollName}
                    onChange={(e) => setNewCollName(e.target.value)}
                    placeholder="مثال: c1_zad_fiqh_new_1"
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
                    placeholder="مثال: الفقه الحنبلي الموسع"
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white"
                  />
                </div>

                {createCollError && <p className="text-rose-400 text-xs">{createCollError}</p>}

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

                {credMsg && <p className="text-amber-300 text-xs">{credMsg}</p>}

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
