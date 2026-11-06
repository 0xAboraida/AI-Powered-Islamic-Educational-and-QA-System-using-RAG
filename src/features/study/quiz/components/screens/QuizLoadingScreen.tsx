import { ClipboardList, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTheme, type AccentColor } from '../../../../../contexts/ThemeContext'

interface QuizLoadingScreenProps {
  isDark: boolean
}

function getQuizLoadingThemeTokens(accentColor: AccentColor = 'emerald', isDark: boolean = true) {
  switch (accentColor) {
    case 'blue':
      return {
        cardBorder: isDark ? 'border-sky-500/25 shadow-sky-950/20' : 'border-slate-200/90 shadow-[0_12px_36px_rgba(0,0,0,0.06)]',
        cardBg: isDark ? 'bg-[#0b1626] text-white' : 'bg-[#fafcff] text-slate-900',
        glowPrimary: isDark ? 'bg-sky-500/10' : 'hidden',
        glowSecondary: isDark ? 'bg-blue-600/10' : 'hidden',
        iconBox: isDark ? 'bg-[#0d223f] border-sky-500/40 text-sky-300' : 'bg-sky-50 border-sky-200 text-[#154696]',
        spinner: 'text-sky-500/40',
        titleColor: 'text-[#12396e] dark:text-sky-200',
        pingGlow: 'bg-sky-500/20',
        progressBar: 'bg-gradient-to-r from-sky-500 via-[#154696] to-sky-500',
      }
    case 'amber':
      return {
        cardBorder: isDark ? 'border-[#5e431a]/40 shadow-stone-950/40' : 'border-slate-200/90 shadow-[0_12px_36px_rgba(0,0,0,0.06)]',
        cardBg: isDark ? 'bg-[#18120a] text-stone-100' : 'bg-[#fcfaf6] text-stone-900',
        glowPrimary: isDark ? 'bg-[#c99a4e]/10' : 'hidden',
        glowSecondary: isDark ? 'bg-[#8a6328]/10' : 'hidden',
        iconBox: isDark ? 'bg-[#261b0c] border-[#8a6328]/50 text-[#dfbf83]' : 'bg-[#f5ede0] border-[#decbb0] text-[#7a5720]',
        spinner: 'text-[#8a6328]/40',
        titleColor: 'text-[#5c4118] dark:text-[#edd8ae]',
        pingGlow: 'bg-[#c99a4e]/20',
        progressBar: 'bg-gradient-to-r from-[#b88d46] via-[#7a5720] to-[#b88d46]',
      }
    case 'purple':
      return {
        cardBorder: isDark ? 'border-purple-500/25 shadow-purple-950/20' : 'border-slate-200/90 shadow-[0_12px_36px_rgba(0,0,0,0.06)]',
        cardBg: isDark ? 'bg-[#140624] text-white' : 'bg-[#faf7fd] text-slate-900',
        glowPrimary: isDark ? 'bg-purple-500/10' : 'hidden',
        glowSecondary: isDark ? 'bg-fuchsia-600/10' : 'hidden',
        iconBox: isDark ? 'bg-[#240a3d] border-purple-500/40 text-purple-300' : 'bg-purple-50 border-purple-200 text-[#581c87]',
        spinner: 'text-purple-500/40',
        titleColor: 'text-[#4a1572] dark:text-purple-200',
        pingGlow: 'bg-purple-500/20',
        progressBar: 'bg-gradient-to-r from-purple-500 via-[#581c87] to-purple-500',
      }
    case 'emerald':
    default:
      return {
        cardBorder: isDark ? 'border-emerald-500/25 shadow-emerald-950/20' : 'border-slate-200/90 shadow-[0_12px_36px_rgba(0,0,0,0.06)]',
        cardBg: isDark ? 'bg-[#051c14] text-white' : 'bg-[#f7fcf9] text-slate-900',
        glowPrimary: isDark ? 'bg-emerald-500/10' : 'hidden',
        glowSecondary: isDark ? 'bg-teal-600/10' : 'hidden',
        iconBox: isDark ? 'bg-[#092b1f] border-emerald-500/40 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-[#046c4e]',
        spinner: 'text-emerald-500/40',
        titleColor: 'text-[#065f46] dark:text-emerald-200',
        pingGlow: 'bg-emerald-500/20',
        progressBar: 'bg-gradient-to-r from-emerald-500 via-[#046c4e] to-emerald-500',
      }
  }
}

export function QuizLoadingScreen({ isDark }: QuizLoadingScreenProps) {
  const { accentColor } = useTheme()
  const theme = getQuizLoadingThemeTokens(accentColor, isDark)

  return (
    <div className="my-auto w-full flex flex-col items-center justify-center py-8" key="quiz-loading">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: -15 }}
        className={`flex flex-col items-center justify-center text-center p-8 rounded-3xl border backdrop-blur-xl max-w-sm w-full relative overflow-hidden transition-all duration-300 ${theme.cardBg} ${theme.cardBorder}`}
        dir="rtl"
      >
        <div className={`absolute -top-12 -left-12 w-36 h-36 ${theme.glowPrimary} rounded-full blur-3xl animate-pulse`}></div>
        <div className={`absolute -bottom-12 -right-12 w-36 h-36 ${theme.glowSecondary} rounded-full blur-3xl animate-pulse delay-500`}></div>

        <div className="relative mb-6 flex items-center justify-center">
          <div className={`absolute inset-0 rounded-full ${theme.pingGlow} blur-md animate-ping`}></div>
          <div className={`h-20 w-20 rounded-full flex items-center justify-center relative z-10 border shadow-xl transition-all ${theme.iconBox}`}>
            <ClipboardList size={38} className="animate-pulse" />
          </div>
          <Loader2 size={92} className={`absolute ${theme.spinner} animate-spin stroke-[1.5]`} />
        </div>

        <h3 className={`text-xl font-black mb-2 ${theme.titleColor}`}>جاري إعداد وصياغة الأسئلة...</h3>
        <p className={`text-xs leading-relaxed max-w-xs ${isDark ? 'text-white/70' : 'text-slate-500'}`}>
          يقوم زاد الآن باستخراج محاور الدرس وإعداد تقييم مناسب وشامل لمستواك.
        </p>

        {/* Animated shimmer progress bar */}
        <div className="mt-6 w-full bg-slate-500/20 h-1.5 rounded-full overflow-hidden relative">
          <motion.div
            className={`h-full ${theme.progressBar} rounded-full`}
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>
    </div>
  )
}
