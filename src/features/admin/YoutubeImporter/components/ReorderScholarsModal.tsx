import React, { useState } from 'react';
import { Scholar } from '../../../lessons/data/mockData';
import { ScholarAvatar } from '../../../../components/common/ScholarAvatar';
import { 
  X, 
  ArrowUp, 
  ArrowDown, 
  ChevronsUp, 
  ChevronsDown, 
  Search, 
  Check, 
  Sparkles, 
  ArrowUpDown,
  RotateCcw
} from 'lucide-react';

interface ReorderScholarsModalProps {
  scholars: Scholar[];
  onSave: (orderedScholars: Scholar[]) => void;
  onClose: () => void;
}

export const ReorderScholarsModal: React.FC<ReorderScholarsModalProps> = ({
  scholars,
  onSave,
  onClose,
}) => {
  const [items, setItems] = useState<Scholar[]>(() => [...scholars]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Move item up
  const moveUp = (index: number) => {
    if (index === 0) return;
    setItems((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index - 1];
      next[index - 1] = temp;
      return next;
    });
  };

  // Move item down
  const moveDown = (index: number) => {
    if (index === items.length - 1) return;
    setItems((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index + 1];
      next[index + 1] = temp;
      return next;
    });
  };

  // Move directly to top (#1)
  const moveToTop = (index: number) => {
    if (index === 0) return;
    setItems((prev) => {
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.unshift(item);
      return next;
    });
  };

  // Move directly to bottom
  const moveToBottom = (index: number) => {
    if (index === items.length - 1) return;
    setItems((prev) => {
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.push(item);
      return next;
    });
  };

  // Reset to original passed order
  const handleReset = () => {
    setItems([...scholars]);
  };

  const handleSave = () => {
    setIsSaving(true);
    onSave(items);
    setTimeout(() => {
      setIsSaving(false);
      onClose();
    }, 400);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      dir="rtl"
    >
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-neutral-950 border border-neutral-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 bg-black/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <ArrowUpDown size={18} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">ترتيب المشايخ في صفحة الشروح</h3>
              <p className="text-xs text-neutral-400">
                حدد الترتيب الدقيق لظهور المشايخ في الموقع من الأول إلى الأخير
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-neutral-900 bg-neutral-950/60 flex items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن شيخ لتحديد موقعه وترتيبه..."
              className="w-full bg-neutral-900 border border-neutral-800 text-white text-xs px-3.5 py-2.5 pr-9 rounded-xl focus:outline-none focus:border-amber-500/50 transition-colors"
            />
            <Search size={14} className="absolute right-3 top-3 text-neutral-500" />
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white text-xs font-semibold transition-all shrink-0 cursor-pointer"
            title="إعادة الترتيب للوضع السابق"
          >
            <RotateCcw size={12} />
            <span className="hidden sm:inline">إعادة ضبط</span>
          </button>
        </div>

        {/* Scholars List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {items.map((scholar, index) => {
            const isMatch = !searchQuery.trim() || 
              scholar.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
              (scholar.specialty || '').toLowerCase().includes(searchQuery.toLowerCase());

            if (!isMatch) return null;

            const isFirst = index === 0;
            const isLast = index === items.length - 1;

            return (
              <div
                key={scholar.id}
                className={`flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all ${
                  index < 3
                    ? 'bg-amber-500/[0.04] border-amber-500/30'
                    : 'bg-neutral-900/40 border-neutral-800/80 hover:border-neutral-700'
                }`}
              >
                {/* Right: Order number + Avatar + Name */}
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-8 h-8 rounded-xl font-mono text-xs font-black flex items-center justify-center shrink-0 border ${
                    index === 0
                      ? 'bg-amber-500 text-black border-amber-400 font-extrabold shadow-sm'
                      : index < 3
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-neutral-900 text-neutral-400 border-neutral-800'
                  }`}>
                    #{index + 1}
                  </span>

                  <div className="w-10 h-10 rounded-full p-0.5 shrink-0 bg-neutral-800 border border-neutral-700">
                    <div className="w-full h-full rounded-full overflow-hidden bg-black">
                      <ScholarAvatar src={scholar.avatar} name={scholar.name} />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <h4 className="font-amiri font-bold text-sm sm:text-base text-white truncate">
                      {scholar.name}
                    </h4>
                    {scholar.specialty && (
                      <span className="text-[11px] text-neutral-500 truncate block">
                        {scholar.specialty}
                      </span>
                    )}
                  </div>
                </div>

                {/* Left: Reorder Action Buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => moveToTop(index)}
                    disabled={isFirst}
                    className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-amber-300 disabled:opacity-25 disabled:hover:text-neutral-400 transition-all cursor-pointer"
                    title="نقل إلى المركز الأول مباشرة (#1)"
                  >
                    <ChevronsUp size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => moveUp(index)}
                    disabled={isFirst}
                    className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white disabled:opacity-25 disabled:hover:text-neutral-400 transition-all cursor-pointer"
                    title="تحريك لأعلى خطوة واحدة"
                  >
                    <ArrowUp size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => moveDown(index)}
                    disabled={isLast}
                    className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white disabled:opacity-25 disabled:hover:text-neutral-400 transition-all cursor-pointer"
                    title="تحريك لأسفل خطوة واحدة"
                  >
                    <ArrowDown size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => moveToBottom(index)}
                    disabled={isLast}
                    className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-amber-300 disabled:opacity-25 disabled:hover:text-neutral-400 transition-all cursor-pointer"
                    title="نقل إلى نهاية القائمة"
                  >
                    <ChevronsDown size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-black/60 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-neutral-400 font-medium">
            إجمالي المشايخ: <span className="text-white font-bold">{items.length}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold border border-neutral-800 transition-all cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              <Check size={14} />
              <span>حفظ واعتماد الترتيب الجديد</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

