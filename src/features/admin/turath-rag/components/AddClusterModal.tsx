import React, { useState } from 'react';
import {
  X,
  Server,
  Key,
  Globe,
  Plus,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { addCluster } from '../turathRagApi';

interface AddClusterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddClusterModal: React.FC<AddClusterModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim() || !apiKey.trim()) {
      setError('يرجى ملء جميع الحقول المطلوبة.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await addCluster(name.trim(), url.trim(), apiKey.trim());
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'فشل الاتصال بالكلاستر.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div
        dir="rtl"
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[#160628] shadow-2xl p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Server className="h-6 w-6" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white">إضافة حساب / كلاستر Qdrant جديد</h3>
              <p className="text-xs text-white/50 mt-0.5">
                ربط حساب سحابي جديد لتوسيع سعة التخزين المجانية
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

        {/* Error Alert */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1.5">
              اسم الحساب / الكلاستر (مثال: Cluster 3 - Asia أو حساب بديل):
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: Cluster 3 (Asia-Pacific)"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder-white/40 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1.5">
              رابط Qdrant Cloud URL (مع المنفذ أو بدونه):
            </label>
            <div className="relative">
              <Globe className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <input
                type="text"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xxxx.us-east-1-1.aws.cloud.qdrant.io:6333"
                className="w-full rounded-xl border border-white/10 bg-black/40 pr-10 pl-3.5 py-2.5 text-xs font-mono text-white placeholder-white/40 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1.5">
              مفتاح الـ API Key:
            </label>
            <div className="relative">
              <Key className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <input
                type="password"
                required
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6Ikp..."
                className="w-full rounded-xl border border-white/10 bg-black/40 pr-10 pl-3.5 py-2.5 text-xs font-mono text-white placeholder-white/40 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <p className="text-[11px] text-white/40 mt-1">
              يتم التحقق من صحة المفتاح والاتصال بالكلاستر فوراً قبل الحفظ لضمان سلامة العمليات.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-sky-500/25 hover:from-sky-400 hover:to-blue-500 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-white" />
                  <span>جاري فحص الاتصال والحفظ...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>إضافة الحساب وتفعيله</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
