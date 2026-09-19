import { LogOut, RotateCcw, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface QuizConfirmModalProps {
  confirmModal: 'none' | 'exit' | 'retry' | 'new'
  isDark: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function QuizConfirmModal({ confirmModal, isDark, onCancel, onConfirm }: QuizConfirmModalProps) {
  return (
    <AnimatePresence>
      {confirmModal !== 'none' && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4" dir="rtl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className={`border rounded-3xl p-6 w-full max-w-sm shadow-2xl relative text-center ${
              isDark ? 'bg-[#12041f] border-emerald-500/40 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-4 border ${
              confirmModal === 'exit'
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-500'
                : confirmModal === 'retry'
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-500'
                : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-500'
            }`}>
              {confirmModal === 'exit'
                ? <LogOut size={28} />
                : confirmModal === 'retry'
                ? <RotateCcw size={28} />
                : <Sparkles size={28} />
              }
            </div>

            <h4 className="text-lg font-bold mb-2">
              {confirmModal === 'exit'
                ? 'تأكيد الخروج من الاختبار'
                : confirmModal === 'retry'
                ? 'تأكيد إعادة الاختبار'
                : 'تأكيد بدء اختبار جديد'
              }
            </h4>

            <p className="text-xs opacity-80 leading-relaxed mb-6">
              {confirmModal === 'exit'
                ? 'هل أنت متأكد من الخروج وإلغاء الاختبار الحالي؟ سيتم إلغاء تقدمك والعودة لإعدادات التخصيص.'
                : confirmModal === 'retry'
                ? 'هل أنت متأكد من إعادة هذا الاختبار وتصفير كافة إجاباتك الحالية؟'
                : 'هل أنت متأكد من إلغاء الاختبار الحالي والعودة لإعدادات التخصيص؟'
              }
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={onCancel}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  isDark ? 'bg-white/10 hover:bg-white/20 border-white/10 text-white' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
                }`}
              >
                إلغاء
              </button>

              <button
                onClick={onConfirm}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg transition-all cursor-pointer ${
                  confirmModal === 'exit' ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                تأكيد
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
