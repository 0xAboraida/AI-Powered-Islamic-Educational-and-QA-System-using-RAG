import { ClipboardList, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface QuizLoadingScreenProps {
  isDark: boolean
}

export function QuizLoadingScreen({ isDark }: QuizLoadingScreenProps) {
  return (
    <div className="my-auto w-full flex flex-col items-center justify-center py-8" key="quiz-loading">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: -15 }}
        className={`flex flex-col items-center justify-center text-center p-8 rounded-3xl border shadow-2xl backdrop-blur-xl max-w-sm w-full relative overflow-hidden ${
          isDark
            ? 'bg-[#12041f]/90 border-white/10 text-white shadow-emerald-500/10'
            : 'bg-white border-slate-200 text-slate-900 shadow-xl'
        }`}
      >
        <div className="absolute -top-12 -left-12 w-36 h-36 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-teal-500/20 rounded-full blur-3xl animate-pulse delay-500"></div>

        <div className="relative mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-md animate-ping"></div>
          <div className={`h-20 w-20 rounded-full flex items-center justify-center relative z-10 border shadow-xl ${
            isDark ? 'bg-gradient-to-br from-[#1a0730] to-[#12041f] border-emerald-500/40 text-[#10b981]' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
          }`}>
            <ClipboardList size={38} className="animate-pulse" />
          </div>
          <Loader2 size={92} className="absolute text-emerald-500/40 animate-spin stroke-[1.5]" />
        </div>

        <h3 className="text-xl font-bold mb-2">جاري إعداد وصياغة الأسئلة...</h3>
        <p className={`text-xs leading-relaxed max-w-xs ${isDark ? 'text-white/70' : 'text-slate-500'}`}>
          يقوم زاد الآن باستخراج محاور الدرس وإعداد تقييم مناسب وشامل لمستواك.
        </p>

        {/* Animated shimmer progress bar */}
        <div className="mt-6 w-full bg-slate-500/20 h-1.5 rounded-full overflow-hidden relative">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 rounded-full"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>
    </div>
  )
}
