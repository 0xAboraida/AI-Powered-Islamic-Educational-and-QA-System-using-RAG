import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle } from 'lucide-react'

export interface StudyExitConfirmModalProps {
  isOpen: boolean
  isDark?: boolean
  onClose: () => void
  onConfirm: () => void
}

export function StudyExitConfirmModal({
  isOpen,
  isDark = true,
  onClose,
  onConfirm,
}: StudyExitConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div
          dir="rtl"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border flex flex-col gap-4 ${
              isDark
                ? 'bg-[#160628]/95 border-purple-500/30 text-white shadow-[0_20px_60px_rgba(0,0,0,0.7)]'
                : 'bg-white/95 border-purple-200 text-slate-900 shadow-2xl'
            }`}
          >
            <div className="flex items-center gap-3 text-red-500">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                  isDark
                    ? 'bg-red-500/20 border border-red-500/30 text-red-400'
                    : 'bg-red-100 border border-red-200 text-red-700'
                }`}
              >
                <AlertCircle size={26} strokeWidth={2.2} />
              </div>

              <h3
                className={`text-base sm:text-lg font-black ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                تأكيد إنهاء الدرس والخروج
              </h3>
            </div>

            <p
              className={`text-xs sm:text-sm leading-relaxed font-bold p-4 rounded-2xl border ${
                isDark
                  ? 'bg-white/5 border-white/10 text-slate-300'
                  : 'bg-red-50/60 border-red-200 text-slate-800'
              }`}
            >
              عند الخروج باستخدام زر (X)، سيتم إنهاء الدرس الحالي وتصفير
              المحادثة والأسئلة والتقدم الحالي، والعودة للشاشة الرئيسية.
              <br />
              <br />
              <span className={isDark ? 'text-purple-300' : 'text-purple-800'}>
                ملاحظة: إذا أردت العودة للرئيسية مع حفظ تقدمك دون مسحه، يمكنك
                استخدام زر السهم (الرجوع).
              </span>
            </p>

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  isDark
                    ? 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={onConfirm}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-black shadow-lg shadow-red-600/30 transition-all hover:scale-105 active:scale-95"
              >
                تأكيد الإنهاء والخروج
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

