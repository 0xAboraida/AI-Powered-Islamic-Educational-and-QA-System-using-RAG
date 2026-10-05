import React, { useState, useEffect, useCallback } from 'react';
import {
  Server,
  Database,
  Layers,
  Sparkles,
  Zap,
  RefreshCw,
  HardDrive,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Play,
  Settings,
  HelpCircle,
  ExternalLink,
  BookOpen,
  X,
  Clock
} from 'lucide-react';
import { ClusterInfo, ClusterStatusResponse, TurathBookItem } from './types';
import {
  fetchClusterStatus,
  fetchClusterAssignments,
  assignCollectionToCluster,
  getTurathRagBaseUrl,
  setTurathRagBaseUrl,
  fetchActiveJobs,
  cancelActiveJob
} from './turathRagApi';
import { ClusterMonitorCards } from './components/ClusterMonitorCards';
import { TurathBookSelector } from './components/TurathBookSelector';
import { IngestionDrawer } from './components/IngestionDrawer';
import { RagPlaygroundModal } from './components/RagPlaygroundModal';
import { BookSteppedIngestModal } from './components/BookSteppedIngestModal';

interface TurathRagHubProps {
  onNotify?: (type: 'info' | 'success' | 'warning' | 'error', msg: string) => void;
}

export const TurathRagHub: React.FC<TurathRagHubProps> = ({ onNotify }) => {
  const [clusters, setClusters] = useState<ClusterInfo[]>([]);
  const [totalCollections, setTotalCollections] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [isHealthy, setIsHealthy] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Active Kaggle Jobs state for global monitoring & resumption
  const [activeJobsData, setActiveJobsData] = useState<{ active_book_ids: number[]; jobs: any[] }>({
    active_book_ids: [],
    jobs: []
  });
  const [catalogBooks, setCatalogBooks] = useState<TurathBookItem[]>([]);
  const [cancelingJobId, setCancelingJobId] = useState<number | null>(null);

  // Cluster Assignments map: collectionName -> clusterId
  const [clusterAssignments, setClusterAssignments] = useState<Record<string, string>>({});

  // Ingestion Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedBooksForIngest, setSelectedBooksForIngest] = useState<TurathBookItem[]>([]);
  const [drawerInitialTab, setDrawerInitialTab] = useState<'kaggle' | 'server'>('kaggle');

  // RAG Playground Modal state
  const [isPlaygroundOpen, setIsPlaygroundOpen] = useState(false);

  // Dedicated Single Book Ingest Modal state with resumption support
  const [bookForIngestModal, setBookForIngestModal] = useState<TurathBookItem | null>(null);
  const [modalInitialStep, setModalInitialStep] = useState<1 | 2 | 3 | 4>(1);
  const [modalInitialKernelSlug, setModalInitialKernelSlug] = useState<string | undefined>();
  const [modalInitialCollection, setModalInitialCollection] = useState<string | undefined>();
  const [modalInitialClusterId, setModalInitialClusterId] = useState<string | undefined>();

  // Backend URL settings popover
  const [backendUrl, setBackendUrlState] = useState(getTurathRagBaseUrl());
  const [showSettings, setShowSettings] = useState(false);

  // 1. Load Turath Catalog flat list for book title resolution in banner
  useEffect(() => {
    async function loadCatalogList() {
      try {
        const res = await fetch('/data/turath_catalog.json');
        if (res.ok) {
          const data = await res.json();
          const books: TurathBookItem[] = [];
          data.forEach((c: any) => {
            c.children?.forEach((b: any) => {
              books.push({ ...b, category: c.title, turath_id: Number(b.turath_id) });
            });
          });
          setCatalogBooks(books);
        }
      } catch (err) {
        console.warn('Failed to load catalog for resume banner:', err);
      }
    }
    loadCatalogList();
  }, []);

  // 2. Load cluster, assignment, and active jobs data
  const loadData = useCallback(async () => {
    try {
      setLoadingStatus(true);
      const [statusRes, assignmentsRes, activeRes] = await Promise.all([
        fetchClusterStatus().catch((err) => {
          console.warn('Could not fetch cluster status:', err);
          return null;
        }),
        fetchClusterAssignments().catch((err) => {
          console.warn('Could not fetch assignments:', err);
          return {};
        }),
        fetchActiveJobs().catch((err) => {
          console.warn('Could not fetch active jobs:', err);
          return { active_book_ids: [], jobs: [] };
        })
      ]);

      if (activeRes) {
        setActiveJobsData(activeRes);
      }

      if (statusRes) {
        setClusters(statusRes.clusters || []);
        setTotalCollections(statusRes.total_collections || 0);
        setTotalPoints(statusRes.total_points || 0);
        setIsHealthy(statusRes.is_healthy);
      } else {
        // Fallback default structure if backend offline
        setClusters([
          {
            id: 'cluster_1',
            name: 'Cluster 1 (US East)',
            url: 'aws.cloud.qdrant.io',
            is_healthy: true,
            collections_count: 5,
            points_count: 0,
            collections: [],
            assigned_collections: [
              'zad_turath_fiqh_hanbali',
              'zad_turath_fiqh_hanafi',
              'zad_turath_fiqh_aam',
              'zad_turath_aqeedah',
              'zad_turath_general'
            ]
          },
          {
            id: 'cluster_2',
            name: 'Cluster 2 (EU West)',
            url: 'aws.cloud.qdrant.io',
            is_healthy: true,
            collections_count: 7,
            points_count: 0,
            collections: [],
            assigned_collections: [
              'zad_turath_fiqh_shafii',
              'zad_turath_fiqh_maliki',
              'zad_turath_tafseer',
              'zad_turath_hadith',
              'zad_turath_seerah',
              'zad_turath_tarikh',
              'zad_turath_lugha'
            ]
          }
        ]);
      }

      setClusterAssignments(assignmentsRes || {});
    } catch (e: any) {
      console.error(e);
      if (onNotify) onNotify('error', `فشل الاتصال بـ Qdrant: ${e.message}`);
    } finally {
      setLoadingStatus(false);
    }
  }, [onNotify]);

  useEffect(() => {
    loadData();
    // Poll active jobs every 10s if any job is running
    const timer = setInterval(() => {
      fetchActiveJobs().then((data) => {
        if (data) setActiveJobsData(data);
      }).catch(() => {});
    }, 10000);
    return () => clearInterval(timer);
  }, [loadData]);

  // Open modal with step resumption support
  const handleOpenBookModal = (
    book: TurathBookItem,
    step: 1 | 2 | 3 | 4 = 1,
    slug?: string,
    collection?: string,
    clusterId?: string
  ) => {
    setBookForIngestModal(book);
    setModalInitialStep(step);
    setModalInitialKernelSlug(slug);
    setModalInitialCollection(collection);
    setModalInitialClusterId(clusterId);
  };

  // Resume active job directly into Step 3 (Live Terminal)
  const handleResumeJob = (job: any) => {
    const bId = Number(job.book_ids?.[0] || 0);
    const foundBook = catalogBooks.find((b) => Number(b.turath_id) === bId);
    const bookObj: TurathBookItem = foundBook || {
      turath_id: bId,
      title: `كتاب #${bId}`,
      author: 'مؤلف غير معروف',
      category: 'فقه'
    };
    handleOpenBookModal(bookObj, 3, job.kernel_slug, job.target_collection);
  };

  // Cancel an active job and reset state
  const handleCancelJob = async (bId: number) => {
    if (!window.confirm(`هل تريد إلغاء المهمة الحالية لكتاب #${bId} وإعادة ضبطه؟`)) return;
    try {
      setCancelingJobId(bId);
      await cancelActiveJob(bId);
      if (onNotify) onNotify('info', `تم إلغاء المهمة لكتاب #${bId} بنجاح.`);
      await loadData();
    } catch (err: any) {
      if (onNotify) onNotify('error', err.message || 'فشل إلغاء المهمة');
    } finally {
      setCancelingJobId(null);
    }
  };


  // Handle reassigning collection
  const handleReassignCollection = async (collectionName: string, targetClusterId: string) => {
    try {
      const res = await assignCollectionToCluster(collectionName, targetClusterId);
      setClusterAssignments(res.all_assignments);
      if (onNotify) {
        onNotify('success', `تم تحويل مجموعة ${collectionName} إلى ${targetClusterId} بنجاح!`);
      }
      await loadData();
    } catch (e: any) {
      alert(`فشل تحويل المجموعة: ${e.message}`);
      if (onNotify) onNotify('error', `فشل تحويل المجموعة: ${e.message}`);
    }
  };

  // Handle book selection for ingest
  const handleOpenIngestDrawer = (books: TurathBookItem[], mode: 'kaggle' | 'server') => {
    setSelectedBooksForIngest(books);
    setDrawerInitialTab(mode);
    setIsDrawerOpen(true);
  };

  const handleSaveBackendUrl = () => {
    setTurathRagBaseUrl(backendUrl);
    setShowSettings(false);
    loadData();
  };

  return (
    <div dir="rtl" className="w-full space-y-6">
      {/* Top Banner & Control Hub */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#1a0730]/90 via-[#12041f]/95 to-[#0b0114] p-6 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/30">
                <Server className="h-6 w-6" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white tracking-wide">
                    إدارة استخراج الكتب وتخزينها (Qdrant & Kaggle GPU)
                  </h2>
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-500/30">
                    Stateless Engine
                  </span>
                </div>
                <p className="text-xs text-white/60 mt-1">
                  إدارة الكلاسترات السحابية الموزعة، استدخال الكتب بدون استهلاك ديسك، وتوليد كود التضمين بنقرة واحدة
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            {/* RAG Playground Trigger */}
            <button
              onClick={() => setIsPlaygroundOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-sky-500/25 hover:from-sky-400 hover:to-blue-500 transition-all"
            >
              <Zap className="h-4 w-4" />
              <span>مختبر الاسترجاع (Playground)</span>
            </button>

            {/* Backend URL Settings button */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white transition-all"
              title="إعدادات رابط الخادم"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Backend Settings Popover */}
        {showSettings && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/60 p-4 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">رابط خادم RAG (Backend URL):</span>
              <span className="text-[11px] text-white/40">الافتراضي: http://127.0.0.1:8550</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={backendUrl}
                onChange={(e) => setBackendUrlState(e.target.value)}
                placeholder="http://127.0.0.1:8550"
                className="flex-1 rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
              />
              <button
                onClick={handleSaveBackendUrl}
                className="rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-white hover:bg-sky-400"
              >
                حفظ وإعادة الاتصال
              </button>
            </div>
          </div>
        )}

        {/* Top KPIs Metric Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10">
          <div className="rounded-2xl border border-white/5 bg-black/30 p-3.5">
            <span className="text-xs text-white/50 block">الكلاسترات السحابية</span>
            <div className="flex items-center gap-2 mt-1">
              <Database className="h-4 w-4 text-sky-400" />
              <span className="text-lg font-bold text-white font-mono">{clusters.length || 2}</span>
              <span className="text-[10px] text-emerald-400 font-semibold">(US East & EU West)</span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-black/30 p-3.5">
            <span className="text-xs text-white/50 block">المجموعات المخصصة</span>
            <div className="flex items-center gap-2 mt-1">
              <Layers className="h-4 w-4 text-amber-400" />
              <span className="text-lg font-bold text-white font-mono">12 مجموعة</span>
              <span className="text-[10px] text-white/40 font-semibold">(موزعة المذاهب)</span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-black/30 p-3.5">
            <span className="text-xs text-white/50 block">إجمالي المتجهات (Vectors)</span>
            <div className="flex items-center gap-2 mt-1">
              <Cpu className="h-4 w-4 text-emerald-400" />
              <span className="text-lg font-bold text-emerald-300 font-mono">
                {totalPoints.toLocaleString()}
              </span>
              <span className="text-[10px] text-white/40">فقرة مفهرسة</span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-black/30 p-3.5">
            <span className="text-xs text-white/50 block">حالة الاتصال العامة</span>
            <div className="flex items-center gap-2 mt-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-bold text-emerald-300">
                {isHealthy ? 'متصل وجاهز للاستعلام' : 'يوجد انقطاع جزئي'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ACTIVE CLOUD TASKS BANNER (Live Task Resumption & Recovery) */}
      {activeJobsData.jobs.length > 0 && (
        <div className="rounded-3xl border border-amber-500/40 bg-gradient-to-r from-amber-950/80 via-black/85 to-purple-950/80 p-5 shadow-2xl backdrop-blur-xl animate-in slide-in-from-top space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse shrink-0 shadow-lg">
                <Cpu className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h4 className="text-base font-bold text-white">
                    توجد مهام استدخال نشطة تعمل حالياً على Kaggle Cloud T4 GPU
                  </h4>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold animate-pulse">
                    {activeJobsData.jobs.length} مهمة جارية
                  </span>
                </div>
                <p className="text-xs text-white/50 mt-1">
                  المعالجة السحابية مستمرة في الداتا سنتر حتى لو أغلقت اللابتوب أو قمت بتحديث الصفحة. يمكنك استئناف متابعة السجلات الحية بنقرة واحدة:
                </p>
              </div>
            </div>
          </div>

          {/* Active Job Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-white/5">
            {activeJobsData.jobs.map((job) => {
              const bId = Number(job.book_ids?.[0] || 0);
              const foundBook = catalogBooks.find((b) => Number(b.turath_id) === bId);
              const bookTitle = foundBook ? foundBook.title : `كتاب #${bId}`;

              return (
                <div
                  key={job.kernel_slug}
                  className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-black/40 border border-amber-500/20 shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 font-mono text-xs text-amber-300 border border-amber-500/25 shrink-0">
                      #{bId}
                    </span>
                    <div>
                      <h5 className="text-sm font-bold text-white truncate max-w-[260px]" title={bookTitle}>
                        {bookTitle}
                      </h5>
                      <span className="text-[11px] text-amber-400/80 flex items-center gap-1.5 mt-0.5 font-medium">
                        <Clock className="h-3 w-3 animate-spin" />
                        <span>جاري المعالجة السحابية • {job.target_collection}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleResumeJob(job)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black text-xs font-extrabold transition-all cursor-pointer shadow-md"
                      title="فتح نافذة المراحل الأربعة والطرفية الحية لمتابعة هذا الكتاب"
                    >
                      <Play className="h-3.5 w-3.5 fill-black" />
                      <span>استئناف ومتابعة المراحل</span>
                    </button>

                    <a
                      href={job.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all border border-white/10"
                      title="فتح جلسة Kaggle في تبويب جديد"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>

                    <button
                      onClick={() => handleCancelJob(bId)}
                      disabled={cancelingJobId === bId}
                      className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 transition-all cursor-pointer disabled:opacity-30"
                      title="إلغاء المهمة وإعادة ضبط الكتاب كغير مضاف"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 1. CLUSTERS MONITOR & COLLECTION TOPOLOGY CARDS */}
      <ClusterMonitorCards
        clusters={clusters}
        totalPoints={totalPoints}
        totalCollections={totalCollections}
        isLoading={loadingStatus}
        onRefresh={loadData}
        onReassignCollection={handleReassignCollection}
      />

      {/* 2. TURATH CATALOG EXPLORER & INGESTION SELECTOR */}
      <TurathBookSelector
        clusters={clusters}
        clusterAssignments={clusterAssignments}
        onSelectBooksForIngest={handleOpenIngestDrawer}
        onOpenBookIngestModal={handleOpenBookModal}
        onRefreshClusters={loadData}
      />

      {/* 3. DEDICATED PER-BOOK STEPPED INGESTION MODAL (Human-in-the-Loop) */}
      <BookSteppedIngestModal
        isOpen={!!bookForIngestModal}
        onClose={() => setBookForIngestModal(null)}
        book={bookForIngestModal}
        clusters={clusters}
        onRefreshClusters={loadData}
        onIngestionSuccess={loadData}
        initialStep={modalInitialStep}
        initialKernelSlug={modalInitialKernelSlug}
        initialCollection={modalInitialCollection}
        initialClusterId={modalInitialClusterId}
      />

      {/* 4. BULK INGESTION DRAWER / MODAL */}
      <IngestionDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        selectedBooks={selectedBooksForIngest}
        clusters={clusters}
        clusterAssignments={clusterAssignments}
        onIngestionSuccess={loadData}
      />

      {/* 5. RAG PLAYGROUND MODAL */}
      <RagPlaygroundModal
        isOpen={isPlaygroundOpen}
        onClose={() => setIsPlaygroundOpen(false)}
        clusterAssignments={clusterAssignments}
      />
    </div>
  );
};
