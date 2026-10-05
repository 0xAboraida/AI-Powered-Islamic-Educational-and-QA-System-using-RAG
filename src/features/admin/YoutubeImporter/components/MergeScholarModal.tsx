import React, { useState } from 'react';
import { Scholar } from '../../../lessons/data/mockData';
import { X, GitMerge, AlertCircle, ArrowLeft } from 'lucide-react';
import { ScholarAvatar } from '../../../../components/common/ScholarAvatar';

interface MergeScholarModalProps {
  sourceScholar: Scholar;
  availableScholars: Scholar[];
  onMerge: (targetScholarId: string) => void;
  onClose: () => void;
}

export const MergeScholarModal: React.FC<MergeScholarModalProps> = ({
  sourceScholar,
  availableScholars,
  onMerge,
  onClose,
}) => {
  // Candidate scholars to merge into (excluding the source scholar)
  const targets = availableScholars.filter((s) => s.id !== sourceScholar.id);
  const [selectedTargetId, setSelectedTargetId] = useState(targets[0]?.id || '');

  const selectedTarget = targets.find((s) => s.id === selectedTargetId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTargetId) {
      alert('يرجى اختيار الشيخ المستهدف للدمج.');
      return;
    }
    if (
      window.confirm(
        `تأكيد عملية الدمج:\nسيتم نقل جميع السلاسل من "${sourceScholar.name}" إلى "${selectedTarget?.name}" وحذف هذا البروفايل المكرر. هل تود المتابعة؟`
      )
    ) {
      onMerge(selectedTargetId);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      dir="rtl"
    >
      <div 
        className="relative w-full max-w-lg bg-neutral-950 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-800 bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <GitMerge size={20} />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-white">دمج محتوى الشيخ في بروفايل آخر</h3>
              <p className="text-xs text-neutral-400">
                نقل السلاسل وحل مشكلة الشيوخ المكررين
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs text-amber-300 leading-relaxed">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>
              هذه العملية ستنقل <strong>كافة سلاسل وقوائم</strong> الشيخ الحالي إلى الشيخ المستهدف، ثم يتم حذف هذا البروفايل المكرر نهائياً لمنع أي ازدواجية في دليل الشيوخ.
            </span>
          </div>

          {/* Visual Source -> Target Representation */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800">
            {/* Source */}
            <div className="flex flex-col items-center text-center space-y-1.5 flex-1">
              <span className="text-[10px] text-neutral-500 font-semibold">المصدر (سيُحذف):</span>
              <div className="w-12 h-12 rounded-full overflow-hidden border border-red-500/40">
                <ScholarAvatar src={sourceScholar.avatar} name={sourceScholar.name} />
              </div>
              <span className="text-xs font-bold text-white line-clamp-1 max-w-[120px]">{sourceScholar.name}</span>
            </div>

            <div className="p-2 rounded-full bg-neutral-800 text-neutral-400 shrink-0">
              <ArrowLeft size={16} />
            </div>

            {/* Target */}
            <div className="flex flex-col items-center text-center space-y-1.5 flex-1">
              <span className="text-[10px] text-emerald-400 font-semibold">الهدف (ستنتقل إليه):</span>
              <div className="w-12 h-12 rounded-full overflow-hidden border border-emerald-500/40">
                <ScholarAvatar src={selectedTarget?.avatar} name={selectedTarget?.name} />
              </div>
              <span className="text-xs font-bold text-white line-clamp-1 max-w-[120px]">{selectedTarget?.name || 'اختر شيخاً'}</span>
            </div>
          </div>

          {/* Target Select Dropdown */}
          <div>
            <label className="block text-xs font-bold text-neutral-300 mb-1.5">
              اختر الشيخ المستهدف:
            </label>
            <select
              value={selectedTargetId}
              onChange={(e) => setSelectedTargetId(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 text-white px-4 py-3 rounded-xl text-xs focus:outline-none focus:border-white transition-colors"
            >
              {targets.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.specialty || 'عالم إسلامي'})
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-semibold text-xs transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={!selectedTargetId}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all flex items-center gap-2 shadow-sm"
            >
              <GitMerge size={14} />
              <span>تأكيد الدمج ونقل السلاسل</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
