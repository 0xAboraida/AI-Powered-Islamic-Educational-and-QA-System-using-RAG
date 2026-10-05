import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  Cpu, 
  Database, 
  Layers, 
  RefreshCw, 
  Search, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Server, 
  Terminal, 
  Zap, 
  ArrowRight,
  ShieldAlert,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface SystemObservabilityProps {
  onExit: () => void;
}

export const SystemObservability: React.FC<SystemObservabilityProps> = ({ onExit }) => {
  const defaultBackend = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8550';
  const [backendUrl, setBackendUrl] = useState<string>(defaultBackend);
  const [activeTab, setActiveTab] = useState<'probes' | 'telemetry' | 'logs'>('probes');
  
  // KPI Metrics
  const [metrics, setMetrics] = useState<any>({
    total_requests: 0,
    avg_latency_ms: 0,
    success_rate_pct: 100,
    gemini_usage_count: 0,
    groq_usage_count: 0,
    fallback_count: 0,
    error_count: 0,
  });

  // Diagnostic Probes state
  const [probingType, setProbingType] = useState<string | null>(null);
  const [probeResults, setProbeResults] = useState<{ type: string; data: any } | null>(null);

  // Telemetry Requests state
  const [telemetryList, setTelemetryList] = useState<any[]>([]);
  const [telemetryFilter, setTelemetryFilter] = useState<string>('ALL');
  const [telemetrySearch, setTelemetrySearch] = useState<string>('');
  const [expandedReqId, setExpandedReqId] = useState<string | null>(null);
  const [copiedReqId, setCopiedReqId] = useState<string | null>(null);

  // Live Logs state
  const [logs, setLogs] = useState<any[]>([]);
  const [logLevel, setLogLevel] = useState<string>('ALL');
  const [logSearch, setLogSearch] = useState<string>('');
  const [autoRefreshLogs, setAutoRefreshLogs] = useState<boolean>(true);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Fetch summary metrics
  const fetchMetrics = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/admin/metrics`);
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (e) {
      console.warn("Could not fetch metrics from backend", e);
    }
  };

  // Fetch Telemetry records
  const fetchTelemetry = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/admin/telemetry?limit=50`);
      if (res.ok) {
        const data = await res.json();
        setTelemetryList(data);
      }
    } catch (e) {
      console.warn("Could not fetch telemetry", e);
    }
  };

  // Fetch Live Logs
  const fetchLogs = async () => {
    try {
      const url = `${backendUrl}/api/admin/logs?limit=200&level=${encodeURIComponent(logLevel)}&search=${encodeURIComponent(logSearch)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.warn("Could not fetch logs", e);
    }
  };

  // Clear logs
  const handleClearLogs = async () => {
    try {
      await fetch(`${backendUrl}/api/admin/logs`, { method: 'DELETE' });
      setLogs([]);
    } catch (e) {
      console.warn("Could not clear logs", e);
    }
  };

  // Trigger Diagnostic Probe
  const runProbe = async (type: 'gemini' | 'groq' | 'mongo' | 'qdrant') => {
    setProbingType(type);
    try {
      const res = await fetch(`${backendUrl}/api/admin/probe/${type}`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setProbeResults({ type, data });
      } else {
        setProbeResults({ type, data: { error: `HTTP ${res.status}: Probe failed` } });
      }
    } catch (err: any) {
      setProbeResults({ type, data: { error: err.message || 'Connection error' } });
    } finally {
      setProbingType(null);
      fetchMetrics();
    }
  };

  useEffect(() => {
    fetchMetrics();
    fetchTelemetry();
    fetchLogs();
  }, [backendUrl]);

  useEffect(() => {
    let timer: any = null;
    if (autoRefreshLogs && activeTab === 'logs') {
      timer = setInterval(() => {
        fetchLogs();
      }, 2500);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [autoRefreshLogs, activeTab, logLevel, logSearch, backendUrl]);

  // Filtered telemetry
  const filteredTelemetry = telemetryList.filter(item => {
    if (telemetryFilter !== 'ALL' && item.status !== telemetryFilter) return false;
    if (telemetrySearch) {
      const q = telemetrySearch.toLowerCase();
      const matchQuery = (item.query || '').toLowerCase().includes(q);
      const matchDomain = (item.domain || '').toLowerCase().includes(q);
      const matchMadhhab = (item.madhhab || '').toLowerCase().includes(q);
      if (!matchQuery && !matchDomain && !matchMadhhab) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#07090e] text-[#f0f6fc] font-sans rtl" dir="rtl">
      
      {/* ── Top Header Bar ── */}
      <header className="sticky top-0 z-50 bg-[#0d1117]/90 backdrop-blur-md border-b border-[#21262d] px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onExit}
            className="p-2.5 rounded-xl bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-[#8b949e] hover:text-white transition flex items-center gap-2 text-sm font-semibold"
            title="الرجوع للرئيسية"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة للمنصة</span>
          </button>
          <div>
            <h1 className="text-xl font-black text-[#f3e5ab] flex items-center gap-2">
              <Activity className="w-6 h-6 text-[#d4af37]" />
              <span>لوحة مراقبة وتحكم المشرف (Admin Observability)</span>
            </h1>
            <p className="text-xs text-[#8b949e]">رصد صحة البنية التحتية، فحص الموديلات، وتسجيل السجلات اللحظية</p>
          </div>
        </div>

        {/* Backend Target Input & Refresh */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#161b22] border border-[#30363d] px-3 py-1.5 rounded-xl text-xs">
            <Server className="w-3.5 h-3.5 text-[#d4af37]" />
            <span className="text-[#8b949e]">السيرفر المستهدف:</span>
            <input 
              type="text" 
              value={backendUrl} 
              onChange={(e) => setBackendUrl(e.target.value)}
              className="bg-transparent text-white font-mono outline-none w-48 text-left"
              dir="ltr"
            />
          </div>
          <button 
            onClick={() => { fetchMetrics(); fetchTelemetry(); fetchLogs(); }}
            className="p-2 bg-[#d4af37]/15 hover:bg-[#d4af37] text-[#f3e5ab] hover:text-black border border-[#d4af37]/50 rounded-xl transition"
            title="تحديث البيانات"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Main Container ── */}
      <main className="max-w-[1550px] mx-auto px-6 py-6 space-y-6">

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl p-5 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-[#8b949e] font-medium">إجمالي الاستعلامات</p>
                <h3 className="text-3xl font-black font-mono text-[#f3e5ab] mt-1">{metrics.total_requests || 0}</h3>
              </div>
              <div className="p-3 bg-[#d4af37]/10 rounded-xl text-[#d4af37]">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-[#8b949e] mt-3 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#34d399]" />
              <span>وقت تشغيل السيرفر: {metrics.uptime_seconds ? `${Math.round(metrics.uptime_seconds / 60)} دقيقة` : 'متصل'}</span>
            </p>
          </div>

          <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-[#8b949e] font-medium">متوسط زمن الاستجابة</p>
                <h3 className="text-3xl font-black font-mono text-[#34d399] mt-1">{metrics.avg_latency_ms || 0} <span className="text-sm font-normal text-[#8b949e]">ms</span></h3>
              </div>
              <div className="p-3 bg-[#10b981]/10 rounded-xl text-[#10b981]">
                <Zap className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-[#34d399] mt-3">End-to-End Pipeline Latency</p>
          </div>

          <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-[#8b949e] font-medium">نسبة النجاح العامة</p>
                <h3 className="text-3xl font-black font-mono text-[#60a5fa] mt-1">{metrics.success_rate_pct || 100}%</h3>
              </div>
              <div className="p-3 bg-[#3b82f6]/10 rounded-xl text-[#3b82f6]">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-[#8b949e] mt-3">الأخطاء المسجلة: {metrics.error_count || 0}</p>
          </div>

          <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-[#8b949e] font-medium">استخدام Gemini vs Groq</p>
                <h3 className="text-2xl font-black font-mono text-[#f3e5ab] mt-1">{metrics.gemini_usage_count || 0} <span className="text-sm text-[#8b949e]">/</span> {metrics.groq_usage_count || 0}</h3>
              </div>
              <div className="p-3 bg-[#6366f1]/10 rounded-xl text-[#6366f1]">
                <Cpu className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-[#f59e0b] mt-3">التحويلات الاحتياطية (Fallbacks): {metrics.fallback_count || 0}</p>
          </div>
        </div>

        {/* ── Sub Navigation Tabs ── */}
        <div className="flex border-b border-[#21262d] gap-2">
          <button
            onClick={() => setActiveTab('probes')}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'probes' 
                ? 'border-[#d4af37] text-[#f3e5ab]' 
                : 'border-transparent text-[#8b949e] hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4 text-[#d4af37]" />
            <span>فحص وتنشيط البنية التحتية (Diagnostics)</span>
          </button>

          <button
            onClick={() => setActiveTab('telemetry')}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'telemetry' 
                ? 'border-[#d4af37] text-[#f3e5ab]' 
                : 'border-transparent text-[#8b949e] hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4 text-[#60a5fa]" />
            <span>سجل الاستعلامات والعمليات الحية (Telemetry Feed)</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'logs' 
                ? 'border-[#d4af37] text-[#f3e5ab]' 
                : 'border-transparent text-[#8b949e] hover:text-white'
            }`}
          >
            <Terminal className="w-4 h-4 text-[#34d399]" />
            <span>طرفية السجلات الحية (Live Logs Console)</span>
          </button>
        </div>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: DIAGNOSTIC PROBES                                             */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'probes' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Probe Card: Gemini */}
              <div className="bg-[#0d1117] border border-[#21262d] hover:border-[#d4af37]/50 rounded-2xl p-5 flex flex-col justify-between gap-4 transition">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-base">مفاتيح Google Gemini</span>
                    <span className="text-2xl">💎</span>
                  </div>
                  <p className="text-xs text-[#8b949e] mt-2 leading-relaxed">
                    فحص جميع مفاتيح Gemini المسجلة للتأكد من جاهزيتها واكتشاف أي مفتاح به ضغط أو 429 Rate Limit.
                  </p>
                </div>
                <button
                  onClick={() => runProbe('gemini')}
                  disabled={probingType !== null}
                  className="w-full py-2.5 bg-[#d4af37]/15 hover:bg-[#d4af37] text-[#f3e5ab] hover:text-black border border-[#d4af37]/40 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {probingType === 'gemini' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  <span>{probingType === 'gemini' ? 'جاري الفحص...' : 'فحص مفاتيح Gemini ⚡'}</span>
                </button>
              </div>

              {/* Probe Card: Groq */}
              <div className="bg-[#0d1117] border border-[#21262d] hover:border-[#6366f1]/50 rounded-2xl p-5 flex flex-col justify-between gap-4 transition">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-base">المزود الاحتياطي (Groq)</span>
                    <span className="text-2xl">🚀</span>
                  </div>
                  <p className="text-xs text-[#8b949e] mt-2 leading-relaxed">
                    فحص جاهزية سيرفر Groq (Qwen 3.8 27B) وسرعة استجابته للتبديل الفوري في حالات طوارئ Gemini.
                  </p>
                </div>
                <button
                  onClick={() => runProbe('groq')}
                  disabled={probingType !== null}
                  className="w-full py-2.5 bg-[#6366f1]/15 hover:bg-[#6366f1] text-[#a5b4fc] hover:text-white border border-[#6366f1]/40 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {probingType === 'groq' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  <span>{probingType === 'groq' ? 'جاري الفحص...' : 'فحص سيرفر Groq ⚡'}</span>
                </button>
              </div>

              {/* Probe Card: MongoDB */}
              <div className="bg-[#0d1117] border border-[#21262d] hover:border-[#10b981]/50 rounded-2xl p-5 flex flex-col justify-between gap-4 transition">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-base">تنشيط 12 MongoDB Clusters</span>
                    <span className="text-2xl">🗄️</span>
                  </div>
                  <p className="text-xs text-[#8b949e] mt-2 leading-relaxed">
                    إرسال Ping لجميع الـ 12 كلاستر لتنشيط قنوات الاتصال (Warmup) وتفادي بطء الاستعلام الأول.
                  </p>
                </div>
                <button
                  onClick={() => runProbe('mongo')}
                  disabled={probingType !== null}
                  className="w-full py-2.5 bg-[#10b981]/15 hover:bg-[#10b981] text-[#6ee7b7] hover:text-black border border-[#10b981]/40 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {probingType === 'mongo' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  <span>{probingType === 'mongo' ? 'جاري التنشيط...' : 'تنشيط الـ 12 كلاستر ⚡'}</span>
                </button>
              </div>

              {/* Probe Card: Qdrant */}
              <div className="bg-[#0d1117] border border-[#21262d] hover:border-[#06b6d4]/50 rounded-2xl p-5 flex flex-col justify-between gap-4 transition">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-base">سحابة متجهات Qdrant</span>
                    <span className="text-2xl">🔍</span>
                  </div>
                  <p className="text-xs text-[#8b949e] mt-2 leading-relaxed">
                    فحص الاتصال بسحابة Qdrant واسترجاع عدد المجموعات الفقهية والتراثية المفهرسة وحالتها.
                  </p>
                </div>
                <button
                  onClick={() => runProbe('qdrant')}
                  disabled={probingType !== null}
                  className="w-full py-2.5 bg-[#06b6d4]/15 hover:bg-[#06b6d4] text-[#67e8f9] hover:text-black border border-[#06b6d4]/40 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {probingType === 'qdrant' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  <span>{probingType === 'qdrant' ? 'جاري الفحص...' : 'فحص Qdrant Cloud ⚡'}</span>
                </button>
              </div>

            </div>

            {/* Probe Results View */}
            {probeResults && (
              <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-[#21262d] pb-3">
                  <h3 className="font-bold text-sm text-[#f3e5ab] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#34d399]" />
                    <span>نتائج الفحص اللحظي ({probeResults.type.toUpperCase()})</span>
                  </h3>
                  <button 
                    onClick={() => setProbeResults(null)}
                    className="text-xs text-[#8b949e] hover:text-white"
                  >
                    إغلاق النتائج ✕
                  </button>
                </div>

                {/* Gemini Results Table */}
                {probeResults.type === 'gemini' && probeResults.data.results && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {probeResults.data.results.map((r: any, idx: number) => (
                      <div key={idx} className="bg-[#161b22] border border-[#30363d] p-4 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="font-bold text-sm text-white">مفتاح #{r.key_index} ({r.masked_key})</div>
                          <div className="text-xs text-[#8b949e] mt-1">{r.model} • {r.message}</div>
                        </div>
                        <div className="text-left flex flex-col items-end gap-1">
                          <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${
                            r.status === 'ACTIVE' 
                              ? 'bg-[#10b981]/20 text-[#34d399] border border-[#10b981]/40' 
                              : 'bg-[#f43f5e]/20 text-[#fb7185] border border-[#f43f5e]/40'
                          }`}>
                            {r.status}
                          </span>
                          <span className="font-mono text-xs text-[#8b949e]">{r.latency_ms} ms</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Groq Result */}
                {probeResults.type === 'groq' && probeResults.data.result && (
                  <div className="bg-[#161b22] border border-[#30363d] p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-white">{probeResults.data.result.provider} ({probeResults.data.result.model})</div>
                      <div className="text-xs text-[#8b949e] mt-1">{probeResults.data.result.message}</div>
                    </div>
                    <div className="text-left flex flex-col items-end gap-1">
                      <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${
                        probeResults.data.result.status === 'ACTIVE' 
                          ? 'bg-[#10b981]/20 text-[#34d399] border border-[#10b981]/40' 
                          : 'bg-[#f43f5e]/20 text-[#fb7185] border border-[#f43f5e]/40'
                      }`}>
                        {probeResults.data.result.status}
                      </span>
                      <span className="font-mono text-xs text-[#8b949e]">{probeResults.data.result.latency_ms} ms</span>
                    </div>
                  </div>
                )}

                {/* Mongo Results Grid */}
                {probeResults.type === 'mongo' && probeResults.data.results && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {probeResults.data.results.map((r: any, idx: number) => (
                      <div key={idx} className="bg-[#161b22] border border-[#30363d] p-3.5 rounded-xl flex justify-between items-center">
                        <div>
                          <div className="font-bold text-xs text-white">{r.title}</div>
                          <div className="text-[10px] text-[#8b949e]">{r.cluster_id}</div>
                        </div>
                        <div className="text-left">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            r.status === 'CONNECTED' 
                              ? 'bg-[#10b981]/20 text-[#34d399]' 
                              : 'bg-[#f43f5e]/20 text-[#fb7185]'
                          }`}>
                            {r.status}
                          </span>
                          <div className="text-[10px] font-mono text-[#8b949e] mt-1">{r.latency_ms} ms</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Qdrant Results */}
                {probeResults.type === 'qdrant' && probeResults.data.results && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {probeResults.data.results.map((r: any, idx: number) => (
                      <div key={idx} className="bg-[#161b22] border border-[#30363d] p-4 rounded-xl flex justify-between items-center">
                        <div>
                          <div className="font-bold text-sm text-white">{r.title} ({r.instance})</div>
                          <div className="text-xs text-[#34d399] mt-1">المجموعات المفهرسة: {r.collections_count}</div>
                          <div className="text-[11px] text-[#8b949e] mt-0.5 font-mono">{(r.collections || []).join(', ')}</div>
                        </div>
                        <div className="text-left">
                          <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${
                            r.status === 'ONLINE' ? 'bg-[#10b981]/20 text-[#34d399]' : 'bg-[#f43f5e]/20 text-[#fb7185]'
                          }`}>
                            {r.status}
                          </span>
                          <div className="font-mono text-xs text-[#8b949e] mt-1">{r.latency_ms} ms</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: DEEP REQUEST TELEMETRY FEED                                   */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'telemetry' && (
          <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl p-6 space-y-4">
            
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#21262d] pb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-[#8b949e] absolute right-3 top-3" />
                  <input
                    type="text"
                    value={telemetrySearch}
                    onChange={(e) => setTelemetrySearch(e.target.value)}
                    placeholder="بحث في الأسئلة أو المذاهب..."
                    className="bg-[#161b22] border border-[#30363d] pr-9 pl-4 py-2 rounded-xl text-xs outline-none focus:border-[#d4af37] w-64 text-white"
                  />
                </div>

                <select
                  value={telemetryFilter}
                  onChange={(e) => setTelemetryFilter(e.target.value)}
                  className="bg-[#161b22] border border-[#30363d] px-3 py-2 rounded-xl text-xs outline-none text-white font-semibold"
                >
                  <option value="ALL">جميع الحالات</option>
                  <option value="SUCCESS">ناجحة (SUCCESS)</option>
                  <option value="FALLBACK">تبديل احتياطي (FALLBACK)</option>
                  <option value="ERROR">أخطاء (ERROR)</option>
                </select>
              </div>

              <button
                onClick={fetchTelemetry}
                className="px-4 py-2 bg-[#d4af37]/15 hover:bg-[#d4af37] text-[#f3e5ab] hover:text-black border border-[#d4af37]/40 rounded-xl text-xs font-bold transition flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>تحديث السجل</span>
              </button>
            </div>

            {/* Telemetry Table */}
            <div className="overflow-x-auto border border-[#21262d] rounded-xl">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#161b22] text-[#f3e5ab] font-bold border-b border-[#21262d]">
                  <tr>
                    <th className="p-3">الوقت</th>
                    <th className="p-3">نص الاستعلام</th>
                    <th className="p-3">النية والمجال</th>
                    <th className="p-3">المذهب</th>
                    <th className="p-3">الكتب المستهدفة</th>
                    <th className="p-3">المزود والموديل</th>
                    <th className="p-3">الزمن (ms)</th>
                    <th className="p-3">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#21262d]">
                  {filteredTelemetry.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-[#8b949e]">
                        لا توجد استعلامات مسجلة مطابقة للفلاتر.
                      </td>
                    </tr>
                  ) : (
                    filteredTelemetry.map((item) => (
                      <React.Fragment key={item.id}>
                        <tr 
                          onClick={() => setExpandedReqId(expandedReqId === item.id ? null : item.id)}
                          className="hover:bg-white/[0.02] cursor-pointer transition"
                        >
                          <td className="p-3 text-[#8b949e] font-mono">{item.timestamp}</td>
                          <td className="p-3 font-semibold text-white max-w-[280px] truncate">{item.query}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded bg-[#6366f1]/20 text-[#a5b4fc] font-bold text-[11px] ml-1">
                              {item.intent || 'عام'}
                            </span>
                            <span className="text-[#8b949e] text-[11px]">{item.domain || ''}</span>
                          </td>
                          <td className="p-3 text-[#34d399] font-medium">{item.madhhab || '-'}</td>
                          <td className="p-3 text-[#f3e5ab] max-w-[180px] truncate">
                            {item.source_books && item.source_books.length ? item.source_books.join(', ') : 'جميع كتب المجال'}
                          </td>
                          <td className="p-3 font-mono text-[#8b949e]">{item.actual_provider_used || item.primary_provider}</td>
                          <td className="p-3 font-mono font-bold text-[#34d399]">{item.total_latency_ms}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              item.status === 'SUCCESS' ? 'bg-[#10b981]/20 text-[#34d399]' : 'bg-[#f43f5e]/20 text-[#fb7185]'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>

                        {/* Expanded Payload Details */}
                        {expandedReqId === item.id && (() => {
                          const raw = item.raw_response || item;
                          const steps = raw.timeline_steps || item.timeline_steps || [];
                          const totalLat = raw.performance?.total_latency_ms || item.total_latency_ms || 0;

                          const getStepColor = (id: string) => {
                            switch (id) {
                              case 'classification': return 'from-[#f59e0b] to-[#d97706]';
                              case 'preprocessing': return 'from-[#6366f1] to-[#4f46e5]';
                              case 'mongo_routing': return 'from-[#10b981] to-[#059669]';
                              case 'catalog_search': return 'from-[#06b6d4] to-[#0891b2]';
                              case 'full_rag': return 'from-[#ec4899] to-[#be185d]';
                              default: return 'from-[#3b82f6] to-[#2563eb]';
                            }
                          };

                          return (
                            <tr className="bg-[#040608]">
                              <td colSpan={8} className="p-4 border-t border-[#21262d] space-y-4">
                                
                                {/* 1. Waterfall Bar & Breakdown Table */}
                                {steps && steps.length > 0 && (
                                  <div className="bg-[#0d1117] border border-[#21262d] rounded-xl p-4 space-y-3">
                                    <div className="flex justify-between items-center">
                                      <span className="font-bold text-xs text-[#f3e5ab] flex items-center gap-1.5">
                                        <span>⏱️</span>
                                        <span>مخطط الشلال الزمني لتفكيك سرعة المراحل (Waterfall Latency Breakdown)</span>
                                      </span>
                                      <span className="text-xs font-mono font-bold text-[#34d399]">
                                        إجمالي الزمن: {totalLat} ms
                                      </span>
                                    </div>

                                    {/* Proportional Waterfall Bar */}
                                    <div className="flex h-5 bg-white/5 rounded-lg overflow-hidden border border-white/10">
                                      {steps.map((s: any, sIdx: number) => {
                                        const pct = s.percentage || 0;
                                        return (
                                          <div
                                            key={sIdx}
                                            style={{ width: `${pct}%` }}
                                            className={`h-full bg-gradient-to-r ${getStepColor(s.step_id)} flex items-center justify-center text-[10px] font-bold text-white transition-all hover:brightness-125 cursor-pointer`}
                                            title={`${s.name}: ${s.latency_ms} ms (${pct}%)`}
                                          >
                                            {pct >= 8 ? `${pct}%` : ''}
                                          </div>
                                        );
                                      })}
                                    </div>

                                    {/* Granular Table */}
                                    <div className="overflow-x-auto border border-[#21262d] rounded-lg">
                                      <table className="w-full text-right text-[11px]">
                                        <thead className="bg-[#161b22] text-[#8b949e] border-b border-[#21262d]">
                                          <tr>
                                            <th className="p-2">المرحلة المعمارية</th>
                                            <th className="p-2">المحرك / المزود</th>
                                            <th className="p-2">البيانات والمخرجات</th>
                                            <th className="p-2">الزمن (ms)</th>
                                            <th className="p-2">النسبة %</th>
                                            <th className="p-2">الحالة</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#21262d]">
                                          {steps.map((s: any, sIdx: number) => (
                                            <tr key={sIdx} className="hover:bg-white/[0.02]">
                                              <td className="p-2 font-bold text-white flex items-center gap-1.5">
                                                <span>{s.icon || '⚡'}</span>
                                                <span>{s.name}</span>
                                              </td>
                                              <td className="p-2 font-mono text-[#f3e5ab] text-[10px]">{s.engine || '-'}</td>
                                              <td className="p-2 text-[#8b949e] max-w-[240px] truncate">{s.output_summary || '-'}</td>
                                              <td className="p-2 font-mono font-bold text-[#34d399]">{s.latency_ms} ms</td>
                                              <td className="p-2 font-mono font-bold text-[#d4af37]">{s.percentage}%</td>
                                              <td className="p-2">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                  s.status === 'SUCCESS' ? 'bg-[#10b981]/20 text-[#34d399]' : 'bg-[#f43f5e]/20 text-[#fb7185]'
                                                }`}>
                                                  {s.status}
                                                </span>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}

                                {/* 2. Raw JSON Section */}
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <h4 className="font-bold text-xs text-[#f3e5ab] flex items-center gap-2">
                                      <span>📦</span>
                                      <span>كائن بيانات الاستجابة الكامل (Full Execution JSON Payload)</span>
                                    </h4>
                                    <div className="flex items-center gap-3">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const jsonPayload = JSON.stringify(item.raw_response || item, null, 2);
                                          navigator.clipboard.writeText(jsonPayload);
                                          setCopiedReqId(item.id);
                                          setTimeout(() => setCopiedReqId(null), 2000);
                                        }}
                                        className="px-3 py-1 bg-[#d4af37]/15 hover:bg-[#d4af37] text-[#f3e5ab] hover:text-black border border-[#d4af37]/40 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                                      >
                                        <span>📋</span>
                                        <span>{copiedReqId === item.id ? 'تم النسخ بنجاح! ✓' : 'نسخ كائن الـ JSON'}</span>
                                      </button>
                                      <span className="text-[11px] text-[#8b949e] font-mono">ID: {item.id}</span>
                                    </div>
                                  </div>
                                  <pre className="bg-[#0d1117] p-4 rounded-xl border border-[#21262d] font-mono text-[11px] text-[#e6edf3] overflow-x-auto text-left leading-relaxed max-h-[350px]" dir="ltr">
                                    {JSON.stringify(item.raw_response || item, null, 2)}
                                  </pre>
                                </div>

                              </td>
                            </tr>
                          );
                        })()}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* TAB 3: LIVE STRUCTURED LOGS CONSOLE                                  */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'logs' && (
          <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl p-6 space-y-4">
            
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#21262d] pb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-[#8b949e] absolute right-3 top-3" />
                  <input
                    type="text"
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    placeholder="بحث في محتوى السجلات..."
                    className="bg-[#161b22] border border-[#30363d] pr-9 pl-4 py-2 rounded-xl text-xs outline-none focus:border-[#d4af37] w-64 text-white"
                  />
                </div>

                <select
                  value={logLevel}
                  onChange={(e) => setLogLevel(e.target.value)}
                  className="bg-[#161b22] border border-[#30363d] px-3 py-2 rounded-xl text-xs outline-none text-white font-semibold"
                >
                  <option value="ALL">جميع المستويات (ALL)</option>
                  <option value="INFO">INFO فقط</option>
                  <option value="WARNING">WARNING فقط</option>
                  <option value="ERROR">ERROR فقط</option>
                </select>

                <label className="flex items-center gap-2 text-xs text-[#8b949e] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRefreshLogs}
                    onChange={(e) => setAutoRefreshLogs(e.target.checked)}
                    className="rounded accent-[#d4af37]"
                  />
                  <span>تحديث تلقائي (كل 2.5 ثانية)</span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchLogs}
                  className="px-3.5 py-2 bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-white rounded-xl text-xs font-bold transition flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>تحديث</span>
                </button>
                <button
                  onClick={handleClearLogs}
                  className="px-3.5 py-2 bg-[#f43f5e]/15 hover:bg-[#f43f5e] text-[#fb7185] hover:text-white border border-[#f43f5e]/40 rounded-xl text-xs font-bold transition flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>مسح السجلات</span>
                </button>
              </div>
            </div>

            {/* Terminal Window */}
            <div className="bg-[#040608] border border-[#21262d] rounded-xl p-4 font-mono text-xs text-[#e6edf3] h-[520px] overflow-y-auto text-left" dir="ltr">
              {logs.length === 0 ? (
                <div className="text-center py-16 text-[#8b949e]">
                  No log entries available matching current filters.
                </div>
              ) : (
                logs.map((l, idx) => (
                  <div key={idx} className="py-1 border-b border-white/[0.03] leading-relaxed break-words">
                    <span className="text-[#8b949e] mr-2">[{l.timestamp}]</span>
                    <span className={`font-bold mr-2 ${
                      l.level === 'INFO' ? 'text-[#58a6ff]' :
                      l.level === 'WARNING' ? 'text-[#d29922]' :
                      l.level === 'ERROR' ? 'text-[#f85149]' : 'text-[#8b949e]'
                    }`}>
                      [{l.level}]
                    </span>
                    <span className="text-[#8b949e] mr-2">[{l.module}:{l.line}]</span>
                    <span>{l.message}</span>
                  </div>
                ))
              )}
              <div ref={terminalEndRef} />
            </div>

          </div>
        )}

      </main>
    </div>
  );
};

export default SystemObservability;
