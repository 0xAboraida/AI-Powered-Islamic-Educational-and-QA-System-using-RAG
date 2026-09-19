import { motion } from 'framer-motion'
import { Target, FileText, MessageSquare, Sparkles } from 'lucide-react'

interface StudyWelcomeActionCardsProps {
  chunkTitle?: string
  isDark?: boolean
  onSelectOption: (optionKey: 'plan' | 'summary' | 'chat') => void
}

export function StudyWelcomeActionCards({
  chunkTitle,
  isDark = true,
  onSelectOption
}: StudyWelcomeActionCardsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`rounded-3xl border p-5 mb-5 shadow-2xl backdrop-blur-2xl ${
        isDark
          ? 'bg-gradient-to-b from-[#16092b]/90 via-[#0e1738]/95 to-[#0b1229]/95 border-purple-500/30 text-white shadow-purple-950/40'
          : 'bg-white/95 border-purple-300/80 text-slate-900 shadow-xl shadow-purple-500/10'
      }`}
    >
      {/* Header Greeting */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 via-sky-500 to-teal-400 text-white shadow-lg shadow-purple-500/30">
          <Sparkles size={20} />
        </div>
        <div>
          <h3 className={`text-sm font-black leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>
            أهلاً بك! كيف نصل إلى أفضل استفادة من درس <span className={isDark ? 'text-sky-300' : 'text-purple-700 font-extrabold'}>"{chunkTitle || 'الدرس المختار'}"</span>؟
          </h3>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-white/60' : 'text-slate-500'}`}>اختر المسار الأنسب لمذاكرتك الآن بنقرة واحدة:</p>
        </div>
      </div>

      {/* 3 Interactive Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Option 1: Study Plan */}
        <button
          type="button"
          onClick={() => onSelectOption('plan')}
          className={`flex flex-col justify-between rounded-2xl border p-4 text-right transition-all duration-300 hover:-translate-y-1 active:scale-95 cursor-pointer shadow-md ${
            isDark
              ? 'bg-gradient-to-b from-sky-500/15 to-cyan-500/10 border-sky-500/30 hover:border-sky-400 hover:shadow-lg hover:shadow-sky-500/20'
              : 'bg-gradient-to-b from-sky-50/90 to-cyan-50/40 border-sky-200 hover:border-sky-400 hover:shadow-lg hover:shadow-sky-100'
          }`}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-xl transition-transform duration-300 ${
              isDark ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
            }`}>
              <Target size={17} />
            </div>
            <span className={`text-xs font-black ${isDark ? 'text-sky-200' : 'text-sky-950'}`}>إنشاء خطة دراسية</span>
          </div>
          <p className={`text-[11px] leading-relaxed ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
            تقسيم الدرس إلى محاور تفاعلية مع شريط تقدم يتابع مدى استيعابك خطوة بخطوة.
          </p>
        </button>

        {/* Option 2: Balanced Summary */}
        <button
          type="button"
          onClick={() => onSelectOption('summary')}
          className={`flex flex-col justify-between rounded-2xl border p-4 text-right transition-all duration-300 hover:-translate-y-1 active:scale-95 cursor-pointer shadow-md ${
            isDark
              ? 'bg-gradient-to-b from-teal-500/15 to-emerald-500/10 border-teal-500/30 hover:border-teal-400 hover:shadow-lg hover:shadow-teal-500/20'
              : 'bg-gradient-to-b from-teal-50/90 to-emerald-50/40 border-teal-200 hover:border-teal-400 hover:shadow-lg hover:shadow-teal-100'
          }`}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-xl transition-transform duration-300 ${
              isDark ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' : 'bg-teal-600 text-white shadow-md shadow-teal-500/30'
            }`}>
              <FileText size={17} />
            </div>
            <span className={`text-xs font-black ${isDark ? 'text-teal-200' : 'text-teal-950'}`}>إنشاء تلخيص</span>
          </div>
          <p className={`text-[11px] leading-relaxed ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
            تلخيص مركز وشامل لأهم القواعد والفوائد.
          </p>
        </button>

        {/* Option 3: Direct Discussion */}
        <button
          type="button"
          onClick={() => onSelectOption('chat')}
          className={`flex flex-col justify-between rounded-2xl border p-4 text-right transition-all duration-300 hover:-translate-y-1 active:scale-95 cursor-pointer shadow-md ${
            isDark
              ? 'bg-gradient-to-b from-purple-500/15 to-indigo-500/10 border-purple-500/30 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/20'
              : 'bg-gradient-to-b from-purple-50/90 to-indigo-50/40 border-purple-200 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-100'
          }`}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-xl transition-transform duration-300 ${
              isDark ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'bg-purple-600 text-white shadow-md shadow-purple-500/30'
            }`}>
              <MessageSquare size={17} />
            </div>
            <span className={`text-xs font-black ${isDark ? 'text-purple-200' : 'text-purple-950'}`}>تحاور واستفسارات</span>
          </div>
          <p className={`text-[11px] leading-relaxed ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
            افتح باب النقاش المباشر واسأل زاد عن أي مسألة تشغل بالك في النص.
          </p>
        </button>
      </div>
    </motion.div>
  )
}
