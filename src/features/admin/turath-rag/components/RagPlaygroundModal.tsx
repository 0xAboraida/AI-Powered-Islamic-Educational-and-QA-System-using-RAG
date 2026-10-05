import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Sparkles,
  Layers,
  BookOpen,
  Server,
  Zap,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Filter,
  CheckCircle2,
  Terminal,
  User,
  Hash,
  FileText,
  Boxes,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { QueryBenchmarkResponse, RetrievedParent, RetrievedChild } from '../types';
import { testTurathQueryStream, testTurathQuery, fetchCollectionsMeta, fetchClusterStatus } from '../turathRagApi';
import { getCollectionDetails } from '../collectionsData';

interface RagPlaygroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  clusterAssignments: Record<string, string>;
}

const SAMPLE_BENCHMARKS = [
  { q: 'ما هي شروط الصلاة في كتاب المغني؟', cluster: 'cluster_1', coll: 'c1_zad_fiqh_hanbali_1', madhhab: 'حنبلي', label: 'المغني (شروط الصلاة)' },
  { q: 'ما حكم صلاة الجماعة في المذهب الحنبلي؟', cluster: 'cluster_1', coll: 'c1_zad_fiqh_hanbali_1', madhhab: 'حنبلي', label: 'صلاة الجماعة' },
  { q: 'ما هي شروط صحة البيع وخيار المجلس؟', cluster: 'cluster_1', coll: 'c1_zad_fiqh_hanbali_1', madhhab: 'حنبلي', label: 'شروط البيع' },
  { q: 'ما حكم الوضوء من مس المرأة؟', cluster: 'all', madhhab: 'all', label: 'نواقض الوضوء' },
  { q: 'ما تفسير قوله تعالى: (إنما يخشى الله من عباده العلماء)؟', cluster: 'all', domain: 'تفسير', label: 'تفسير القرآن' },
  { q: 'ما صحة حديث: (إنما الأعمال بالنيات)؟', cluster: 'all', domain: 'حديث', label: 'حديث النيات' }
];

export const RagPlaygroundModal: React.FC<RagPlaygroundModalProps> = ({
  isOpen,
  onClose,
  clusterAssignments
}) => {
  const [query, setQuery] = useState('ما هي شروط الصلاة في كتاب المغني؟');
  const [selectedCluster, setSelectedCluster] = useState<string>('cluster_1');
  const [selectedCollection, setSelectedCollection] = useState<string>('c1_zad_fiqh_hanbali_1');
  const [selectedMadhhab, setSelectedMadhhab] = useState<string>('all');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [filterBookId, setFilterBookId] = useState<string>('');
  const [filterAuthor, setFilterAuthor] = useState<string>('');
  const [topK, setTopK] = useState<number>(3);
  
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'parents' | 'children'>('parents');

  // Progressive streaming data states
  const [liveLogs, setLiveLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(true);
  const [streamChildren, setStreamChildren] = useState<RetrievedChild[]>([]);
  const [streamParents, setStreamParents] = useState<RetrievedParent[]>([]);
  const [executionMeta, setExecutionMeta] = useState<{ latency_ms?: number; status?: string } | null>(null);

  const [expandedParents, setExpandedParents] = useState<Set<number>>(new Set([0]));
  const [expandedChildren, setExpandedChildren] = useState<Set<number>>(new Set());

  // Dynamic collections metadata and options
  const [collectionsMeta, setCollectionsMeta] = useState<Record<string, any>>({});
  const [availableCollections, setAvailableCollections] = useState<string[]>(['c1_zad_fiqh_hanbali_1']);

  useEffect(() => {
    if (!isOpen) return;

    fetchCollectionsMeta().then(meta => {
      setCollectionsMeta(meta);
      const keys = Object.keys(meta);
      if (keys.length > 0) {
        setAvailableCollections(prev => Array.from(new Set([...prev, ...keys])));
      }
    }).catch(console.error);

    fetchClusterStatus().then(status => {
      const colls: string[] = [];
      status.clusters?.forEach(c => {
        c.collections?.forEach(coll => colls.push(coll.name));
      });
      if (colls.length > 0) {
        setAvailableCollections(prev => Array.from(new Set([...prev, ...colls])));
      }
    }).catch(console.error);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRunQuery = async () => {
    if (!query.trim()) return;

    try {
      setIsLoading(true);
      setLiveLogs([
        `بدء إرسال الاستعلام إلى محرك زاد للاسترجاع الهجين...`,
        `الاستعلام: "${query.trim()}"`,
        `المعايير: Cluster=${selectedCluster} | Collection=${selectedCollection} | BookID=${filterBookId || 'All'} | Author=${filterAuthor || 'All'}`
      ]);
      setStreamChildren([]);
      setStreamParents([]);
      setExecutionMeta(null);
      setExpandedParents(new Set([0]));
      setExpandedChildren(new Set());

      await testTurathQueryStream(
        {
          query: query.trim(),
          domain: selectedDomain !== 'all' ? selectedDomain : undefined,
          madhhab: selectedMadhhab !== 'all' ? selectedMadhhab : undefined,
          target_cluster: selectedCluster !== 'all' ? selectedCluster : undefined,
          target_collection: selectedCollection !== 'all' ? selectedCollection : undefined,
          book_id: filterBookId.trim() ? parseInt(filterBookId.trim(), 10) : undefined,
          author: filterAuthor.trim() ? filterAuthor.trim() : undefined,
          top_k: topK
        },
        {
          onLog: (logText) => {
            setLiveLogs(prev => [...prev, logText]);
          },
          onChildren: (childrenList) => {
            setStreamChildren(childrenList);
          },
          onParent: (parentItem) => {
            setStreamParents(prev => [...prev, parentItem]);
          },
          onComplete: (meta) => {
            setExecutionMeta(meta);
            setIsLoading(false);
          },
          onError: (err) => {
            setLiveLogs(prev => [...prev, `خطأ في الاسترجاع: ${err}`]);
            setIsLoading(false);
          }
        }
      );
    } catch (err: any) {
      console.warn('Streaming failed, trying fallback standard request:', err);
      try {
        const res = await testTurathQuery({
          query: query.trim(),
          domain: selectedDomain !== 'all' ? selectedDomain : undefined,
          madhhab: selectedMadhhab !== 'all' ? selectedMadhhab : undefined,
          target_cluster: selectedCluster !== 'all' ? selectedCluster : undefined,
          target_collection: selectedCollection !== 'all' ? selectedCollection : undefined,
          book_id: filterBookId.trim() ? parseInt(filterBookId.trim(), 10) : undefined,
          author: filterAuthor.trim() ? filterAuthor.trim() : undefined,
          top_k: topK
        });
        if (res.logs) setLiveLogs(res.logs);
        if (res.children) setStreamChildren(res.children);
        if (res.parents) setStreamParents(res.parents);
        setExecutionMeta({ latency_ms: res.latency_ms, status: 'success' });
      } catch (fallbackErr: any) {
        setLiveLogs(prev => [...prev, `خطأ: ${fallbackErr.message}`]);
        alert(`خطأ أثناء الاستعلام: ${fallbackErr.message}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const toggleExpandParent = (idx: number) => {
    const next = new Set(expandedParents);
    if (next.has(idx)) {
      next.delete(idx);
    } else {
      next.add(idx);
    }
    setExpandedParents(next);
  };

  const toggleExpandChild = (idx: number) => {
    const next = new Set(expandedChildren);
    if (next.has(idx)) {
      next.delete(idx);
    } else {
      next.add(idx);
    }
    setExpandedChildren(next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div
        dir="rtl"
        className="relative flex flex-col w-full max-w-6xl max-h-[94vh] overflow-hidden rounded-3xl border border-white/15 bg-[#12041f] text-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-[#1a0730]/90 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Zap className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                مختبر الاسترجاع الهجين والآباء الحية (Stateless RAG Testbed)
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300 border border-emerald-500/30">
                  بث لحظي فوري (Real-Time SSE)
                </span>
              </h3>
              <p className="text-xs text-white/60">
                استعراض فوري لقطع المتجهات (Child Chunks) ونصوص الأبواب المنقاة بدون انتظار لنهاية العملية
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-5 border-b border-white/10 bg-black/40 space-y-3.5">
          {/* Query Input */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRunQuery()}
                placeholder="اكتب المسألة الفقهية أو السؤال الشرعي المراد البحث عنه..."
                className="w-full rounded-xl border border-white/10 bg-black/50 pr-10 pl-4 py-3 text-sm text-white placeholder-white/40 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <button
              onClick={handleRunQuery}
              disabled={isLoading || !query.trim()}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-blue-500 disabled:opacity-50 transition-all shrink-0"
            >
              <Zap className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'جاري الاسترجاع...' : 'بحث متعدد الكلاسترات'}</span>
            </button>
          </div>

          {/* Quick Benchmark Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-white/40 text-[11px] shrink-0">أمثلة سريعة:</span>
            {SAMPLE_BENCHMARKS.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuery(s.q);
                  if (s.cluster) setSelectedCluster(s.cluster);
                  if (s.coll) setSelectedCollection(s.coll);
                  if (s.madhhab) setSelectedMadhhab(s.madhhab);
                  if (s.domain) setSelectedDomain(s.domain);
                }}
                className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/70 hover:border-sky-400/40 hover:bg-sky-500/10 hover:text-sky-200 transition-all"
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Advanced Multi-Cluster & Filtering Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-2 border-t border-white/5 text-xs text-white/80">
            {/* Cluster Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-sky-300 flex items-center gap-1">
                <Server className="h-3 w-3" />
                الكلاستر المستهدف:
              </label>
              <select
                value={selectedCluster}
                onChange={(e) => setSelectedCluster(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/60 px-2.5 py-1.5 text-xs text-white focus:border-sky-400 focus:outline-none"
              >
                <option value="all">كل الكلاسترات (Fan-Out)</option>
                <option value="cluster_1">Cluster 1 (US East)</option>
                <option value="cluster_2">Cluster 2 (EU West)</option>
              </select>
            </div>

            {/* Collection Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-amber-300 flex items-center gap-1">
                <Layers className="h-3 w-3" />
                المجموعة المستهدفة:
              </label>
              <select
                value={selectedCollection}
                onChange={(e) => setSelectedCollection(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/60 px-2.5 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
              >
                <option value="all">توجيه آلي بالمجال والمذهب</option>
                {availableCollections.map((cName) => {
                  const details = getCollectionDetails(cName, collectionsMeta);
                  return (
                    <option key={cName} value={cName}>
                      {details.icon} {details.arabicName} ({cName})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Madhhab Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-white/60">المذهب الفقهي:</label>
              <select
                value={selectedMadhhab}
                onChange={(e) => setSelectedMadhhab(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/60 px-2.5 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="all">مقارن / كل المذاهب</option>
                <option value="حنبلي">الحنبلي</option>
                <option value="شافعي">الشافعي</option>
                <option value="مالكي">المالكي</option>
                <option value="حنفي">الحنفي</option>
              </select>
            </div>

            {/* Domain Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-white/60">المجال الشرعي:</label>
              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/60 px-2.5 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="all">كل المجالات</option>
                <option value="فقه">فقه</option>
                <option value="عقيدة">عقيدة</option>
                <option value="تفسير">تفسير</option>
                <option value="حديث">حديث</option>
                <option value="سيرة">سيرة</option>
              </select>
            </div>

            {/* Filter by Book ID */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-white/60 flex items-center gap-1">
                <Hash className="h-3 w-3" />
                رقم الكتاب (اختياري):
              </label>
              <input
                type="number"
                value={filterBookId}
                onChange={(e) => setFilterBookId(e.target.value)}
                placeholder="مثال: 8463 (المغني)"
                className="w-full rounded-lg border border-white/10 bg-black/60 px-2.5 py-1.5 text-xs text-white placeholder-white/30 focus:border-sky-400 focus:outline-none font-mono"
              />
            </div>

            {/* Filter by Author */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-white/60 flex items-center gap-1">
                <User className="h-3 w-3" />
                المؤلف (اختياري):
              </label>
              <input
                type="text"
                value={filterAuthor}
                onChange={(e) => setFilterAuthor(e.target.value)}
                placeholder="مثال: ابن قدامة"
                className="w-full rounded-lg border border-white/10 bg-black/60 px-2.5 py-1.5 text-xs text-white placeholder-white/30 focus:border-sky-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Live Execution Logs Terminal Viewer */}
        {liveLogs.length > 0 && (
          <div className="border-b border-white/10 bg-[#0a0212] px-6 py-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <Terminal className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-xs font-mono font-bold text-emerald-300">
                  سجل التنفيذ الحي ومسار استدعاء المتجهات (Live Retrieval Trace)
                </span>
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-400 border border-emerald-500/20">
                  {liveLogs.length} خطوات
                </span>
                {isLoading && (
                  <span className="flex items-center gap-1.5 text-[11px] text-amber-300 animate-pulse mr-2">
                    <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                    جاري المعالجة والبث المباشر...
                  </span>
                )}
              </div>

              <button
                onClick={() => setShowLogs(!showLogs)}
                className="text-xs text-white/50 hover:text-white flex items-center gap-1"
              >
                <span>{showLogs ? 'طي السجل' : 'عرض السجل'}</span>
                {showLogs ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            </div>

            {showLogs && (
              <div className="rounded-xl border border-white/10 bg-black/80 p-3 max-h-32 overflow-y-auto font-mono text-[11px] leading-relaxed text-white/80 space-y-1 select-text">
                {liveLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-2 ${
                      log.includes('نجاح') || log.includes('اكتمل') || log.includes('SUCCESS')
                        ? 'text-emerald-400'
                        : log.includes('استرجاع') || log.includes('جاري') || log.includes('INFO')
                        ? 'text-amber-300'
                        : log.includes('تطابق') || log.includes('درجة')
                        ? 'text-sky-300'
                        : log.includes('خطأ') || log.includes('فشل') || log.includes('ERROR')
                        ? 'text-red-400'
                        : 'text-white/70'
                    }`}
                  >
                    <span className="text-white/30 select-none">{idx + 1}.</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Navigation Tabs (Parents vs Children) */}
        {(streamParents.length > 0 || streamChildren.length > 0 || isLoading) && (
          <div className="flex items-center justify-between border-b border-white/10 bg-black/25 px-6 py-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('parents')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'parents'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-lg shadow-sky-500/10'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <BookOpen className="h-4 w-4" />
                <span>الآباء المسترجعة بالكامل (Parent Chapters)</span>
                <span className="rounded-full bg-sky-500/30 px-2 py-0.5 text-[10px] text-sky-200">
                  {streamParents.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('children')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'children'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg shadow-amber-500/10'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Boxes className="h-4 w-4" />
                <span>القطع الفقهية المتطابقة من Qdrant (Child Chunks)</span>
                <span className="rounded-full bg-amber-500/30 px-2 py-0.5 text-[10px] text-amber-200">
                  {streamChildren.length}
                </span>
              </button>
            </div>

            {executionMeta && (
              <div className="flex items-center gap-2 text-xs text-white/60">
                <Clock className="h-3.5 w-3.5 text-emerald-400" />
                <span>الزمن الإجمالي:</span>
                <span className="font-mono font-bold text-emerald-300">
                  {executionMeta.latency_ms || 0} ms
                </span>
              </div>
            )}
          </div>
        )}

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {streamParents.length === 0 && streamChildren.length === 0 && !isLoading ? (
            <div className="py-16 text-center text-white/40">
              <Zap className="h-10 w-10 mx-auto text-sky-400/40 mb-3" />
              <p className="text-sm font-semibold text-white/70">
                جاهز لاختبار البحث متعدد الكلاسترات
              </p>
              <p className="text-xs text-white/40 mt-1 max-w-md mx-auto">
                اكتب أي مسألة فقهية أو اختر مثالاً من الأمثلة السريعة بالأعلى لتشغيل محرك الاسترجاع المتوازي ومراقبة بث النتائج لحظة بلحظة
              </p>
            </div>
          ) : activeTab === 'parents' ? (
            /* TAB 1: PARENTS VIEW */
            <div className="space-y-3">
              {streamParents.length === 0 && isLoading && (
                <div className="py-12 text-center text-white/60">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-sky-400 border-r-transparent mb-2" />
                  <p className="text-xs">جاري جلب نصوص الأبواب وتنقيتها من تراث CDN...</p>
                </div>
              )}

              {streamParents.map((parent, idx) => {
                const isExpanded = expandedParents.has(idx);

                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-white/10 bg-[#160628]/90 p-4 transition-all hover:border-white/20 animate-in fade-in"
                  >
                    {/* Parent Header */}
                    <div
                      onClick={() => toggleExpandParent(idx)}
                      className="flex items-start justify-between gap-3 cursor-pointer select-none"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-500/20 text-sky-300 font-bold text-xs border border-sky-500/30">
                          #{idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white">{parent.book_title}</h4>
                            <span className="text-xs text-white/50">({parent.author})</span>
                            <span className="rounded bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-300 border border-sky-500/20">
                              ص {parent.start_page}
                            </span>
                          </div>

                          {parent.chapter_title && (
                            <p className="text-xs text-amber-300 font-semibold mt-1">
                              {parent.chapter_title}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 font-mono text-xs text-emerald-300 font-bold">
                          تطابق: {parent.score}
                        </span>
                        <button className="text-white/40 hover:text-white">
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Breadcrumbs */}
                    {parent.hierarchy && parent.hierarchy.length > 0 && (
                      <div className="mt-2 text-[11px] text-white/40 flex items-center gap-1">
                        <span>المسار:</span>
                        <span>{parent.hierarchy.join(' › ')}</span>
                      </div>
                    )}

                    {/* Content Preview or Full (Zero leakage applied!) */}
                    <div className="mt-3 rounded-xl border border-white/5 bg-black/30 p-3.5 text-xs text-white/95 leading-relaxed font-serif whitespace-pre-line">
                      {isExpanded ? parent.full_content : parent.content_preview}
                    </div>

                    {/* Footer Links */}
                    <div className="mt-3 flex items-center justify-between text-xs text-white/50 pt-2 border-t border-white/5">
                      <button
                        onClick={() => toggleExpandParent(idx)}
                        className="text-sky-400 hover:underline text-[11px] font-semibold"
                      >
                        {isExpanded ? 'طي المحتوى' : 'عرض نص الباب كاملاً'}
                      </button>

                      {parent.source_url && (
                        <a
                          href={parent.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-white/60 hover:text-white text-[11px]"
                        >
                          <span>معاينة وتوثيق على تراث CDN</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* TAB 2: CHILD CHUNKS VIEW */
            <div className="space-y-3">
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200/90 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>تم العثور على <strong>{streamChildren.length} قطعة فقهية</strong> مطابقة لمتجه السؤال مباشرة داخل فهارس Qdrant Cloud.</span>
                </span>
                <span className="text-[11px] text-white/50 font-mono">Dense 1024 + int8</span>
              </div>

              {streamChildren.map((child, idx) => {
                const isExpanded = expandedChildren.has(idx);

                return (
                  <div
                    key={child.chunk_id || idx}
                    className="rounded-2xl border border-white/10 bg-[#160628]/80 p-4 transition-all hover:border-amber-400/30 animate-in fade-in"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-start gap-2.5">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{child.book_title}</span>
                            <span className="text-[11px] text-white/50">({child.author})</span>
                            <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-mono text-sky-200">
                              ص {child.start_page}
                            </span>
                          </div>
                          {child.chapter_title && (
                            <p className="text-[11px] text-amber-300/80 mt-0.5">{child.chapter_title}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 font-mono text-xs text-amber-300 font-bold">
                          Cosine: {child.score}
                        </span>
                        <span className="text-[10px] font-mono text-white/30 hidden sm:inline">
                          ID: {child.chunk_id.slice(-8)}
                        </span>
                      </div>
                    </div>

                    {/* Chunk Text */}
                    <div className="rounded-xl border border-white/5 bg-black/40 p-3 text-xs text-white/90 leading-relaxed font-serif whitespace-pre-line">
                      {isExpanded ? child.content : child.content.slice(0, 300) + (child.content.length > 300 ? '...' : '')}
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-white/50 pt-2 border-t border-white/5">
                      {child.content.length > 300 ? (
                        <button
                          onClick={() => toggleExpandChild(idx)}
                          className="text-amber-400 hover:underline"
                        >
                          {isExpanded ? 'طي القطعة' : 'عرض نص القطعة كاملاً'}
                        </button>
                      ) : <span />}

                      {child.source_url && (
                        <a
                          href={child.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-white/60 hover:text-white"
                        >
                          <span>فتح الصفحة في تراث</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
