import React, { useState } from 'react';
import {
  X,
  Layers,
  Plus,
  AlertCircle,
  RefreshCw,
  Sparkles,
  BookOpen,
  Folder,
  Shield,
  Scale,
  Bookmark,
  Compass
} from 'lucide-react';
import { createCollectionOnCluster } from '../turathRagApi';

interface CreateCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  clusterId: string;
  clusterName: string;
  onSuccess: () => void;
}

const ICON_OPTIONS = [
  { id: 'BookOpen', icon: BookOpen },
  { id: 'Layers', icon: Layers },
  { id: 'Folder', icon: Folder },
  { id: 'Sparkles', icon: Sparkles },
  { id: 'Shield', icon: Shield },
  { id: 'Scale', icon: Scale },
  { id: 'Bookmark', icon: Bookmark },
  { id: 'Compass', icon: Compass }
];

export const CreateCollectionModal: React.FC<CreateCollectionModalProps> = ({
  isOpen,
  onClose,
  clusterId,
  clusterName,
  onSuccess
}) => {
  const [arabicName, setArabicName] = useState('');
  const [collectionName, setCollectionName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('BookOpen');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Auto-generate technical slug from Arabic name if user hasn't edited slug manually
  const handleArabicNameChange = (val: string) => {
    setArabicName(val);
    if (!collectionName || collectionName.startsWith('c1_') || collectionName.startsWith('c2_') || collectionName.startsWith('zad_')) {
      const clusterPrefix = clusterId === 'cluster_2' ? 'c2_' : 'c1_';
      const transliterated = val
        .replace(/ال/g, '')
        .replace(/[^\u0621-\u064A0-9a-zA-Z]/g, '_')
        .replace(/_+/g, '_')
        .slice(0, 20);
      setCollectionName(`${clusterPrefix}zad_${transliterated || 'collection'}`.toLowerCase());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = collectionName.trim().toLowerCase().replace(/\s+/g, '_');
    const cleanArabic = arabicName.trim();

    if (!cleanArabic) {
      setError('يرجى إدخال اسم المجموعة باللغة العربية (الذي سيظهر في الواجهة).');
      return;
    }
    if (!cleanId) {
      setError('يرجى إدخال المعرف الفني للمجموعة في Qdrant.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await createCollectionOnCluster(clusterId, cleanId, cleanArabic, selectedIcon, description.trim());
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'فشل إنشاء المجموعة.');
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
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Layers className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white">إنشاء مجموعة (Collection) جديدة</h3>
              <p className="text-xs text-white/50 mt-0.5">
                الكلاستر المستهدف: <strong className="text-sky-300">{clusterName}</strong>
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

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-right">
          {/* Arabic Name (User Facing) */}
          <div>
            <label className="block text-xs font-semibold text-white/90 mb-1.5">
              اسم المجموعة بالعربية (الاسم الذي سيظهر لك في الموقع): <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              required
              value={arabicName}
              onChange={(e) => handleArabicNameChange(e.target.value)}
              placeholder="مثال: الفقه الحنبلي، أو العقيدة وأصول الدين، أو التفسير"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Technical Name (Qdrant Cloud ID) */}
          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1.5">
              المعرف الفني في Qdrant Cloud (ID تقني بالإنجليزية): <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              required
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
              placeholder="مثال: c1_zad_fiqh_hanbali_1"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs font-mono text-white placeholder-white/30 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <p className="text-[11px] text-white/40 mt-1">
              اسم الكوليكشن في سيرفر Qdrant بدون مسافات، بأحرف إنجليزية وأرقام و _
            </p>
          </div>

          {/* Lucide Icon Picker */}
          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1.5">
              أيقونة المجموعة:
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {ICON_OPTIONS.map((item) => {
                const IconComp = item.icon;
                const isSel = selectedIcon === item.id;
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setSelectedIcon(item.id)}
                    className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                      isSel
                        ? 'bg-amber-500/30 border-2 border-amber-400 scale-110 shadow-lg shadow-amber-500/20 text-amber-300'
                        : 'bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    <IconComp className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1.5">
              الوصف والتصنيف (اختياري):
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="مثال: مصادر وكتب الفقه الحنبلي المعتمدة وشروحها"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-[11px] text-amber-200/80 flex items-center gap-2">
            <Sparkles className="h-4 w-4 shrink-0 text-amber-400" />
            <span>سيتم إنشاء المجموعة في كلاستر <strong>{clusterName}</strong> مع تفعيل ضغط int8 Scalar Quantization ومتجهات Dense (1024) و Sparse آلياً.</span>
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
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2 text-xs font-bold text-black shadow-lg shadow-amber-500/25 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-black" />
                  <span>جاري إنشاء المجموعة...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>إنشاء المجموعة الآن</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
