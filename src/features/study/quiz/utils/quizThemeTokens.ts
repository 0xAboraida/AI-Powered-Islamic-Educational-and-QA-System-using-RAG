import type { AccentColor } from '../../../../contexts/ThemeContext'

export interface QuizThemeTokens {
  // Main view & card
  cardBorder: string
  cardBg: string
  // Question text container
  qCardBg: string
  qCardBorder: string
  qNumBadge: string
  promptText: string
  // Stepper & navigator
  stepperPillActive: string
  stepperPillDone: string
  stepperArrow: string
  progressText: string
  nextBtn: string
  submitBtn: string
  // MCQ options
  optionHover: string
  optionSelected: string
  optionBadgeSelected: string
  optionCheckIcon: string
  // Fill in blank
  blankPlaceholder: string
  fillBlankSelected: string
  // Matching
  matchingHint: string
  matchingTermBadge: string
  matchingDefBadge: string
}

export function getQuizActiveThemeTokens(accentColor: AccentColor = 'emerald', isDark: boolean = true): QuizThemeTokens {
  switch (accentColor) {
    case 'blue':
      return {
        cardBorder: isDark ? 'border-white/10 shadow-black/40' : 'border-slate-200/90 shadow-[0_12px_36px_rgba(0,0,0,0.06)]',
        cardBg: isDark ? 'bg-[#090b10] text-white' : 'bg-white text-slate-900',
        qCardBg: isDark ? 'bg-[#0e213d] text-white' : 'bg-sky-50/60 text-slate-900',
        qCardBorder: isDark ? 'border-sky-500/30' : 'border-sky-200',
        qNumBadge: isDark ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'bg-sky-100 text-blue-700 border-sky-200',
        promptText: 'text-blue-700 dark:text-sky-300',
        stepperPillActive: 'bg-blue-600 text-white border-blue-400 shadow-blue-500/30 ring-2 ring-sky-400/40 scale-110',
        stepperPillDone: isDark ? 'bg-sky-500/20 text-sky-300 border-sky-500/30' : 'bg-sky-100 text-sky-800 border-sky-200',
        stepperArrow: 'text-blue-700 dark:text-sky-400 hover:bg-sky-500/10',
        progressText: 'text-blue-700 dark:text-sky-300',
        nextBtn: 'bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all',
        submitBtn: 'bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all',
        optionHover: isDark ? 'hover:bg-sky-500/10 hover:border-sky-400/40' : 'hover:bg-sky-50/70 hover:border-sky-300',
        optionSelected: isDark ? 'bg-sky-950/40 border-2 border-sky-400 text-white font-extrabold shadow-md' : 'bg-sky-50 border-2 border-blue-600 text-slate-900 font-extrabold shadow-md',
        optionBadgeSelected: 'bg-blue-600 text-white border-blue-600',
        optionCheckIcon: 'text-blue-700 dark:text-sky-300',
        blankPlaceholder: 'bg-sky-500/15 text-blue-700 dark:text-sky-300 border-sky-400/60',
        fillBlankSelected: isDark ? 'bg-sky-950/40 border-2 border-sky-400 text-white font-extrabold shadow-md' : 'bg-sky-50 border-2 border-blue-600 text-slate-900 font-extrabold shadow-md',
        matchingHint: isDark ? 'bg-sky-500/10 border-sky-500/30 text-sky-300' : 'bg-sky-50 border-sky-200 text-blue-700',
        matchingTermBadge: isDark ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'bg-sky-100 text-blue-700 border-sky-200',
        matchingDefBadge: isDark ? 'bg-sky-500/25 text-sky-200 border-sky-500/40' : 'bg-sky-100 text-blue-700 border-sky-200',
      }
    case 'amber':
      return {
        cardBorder: isDark ? 'border-white/10 shadow-black/40' : 'border-slate-200/90 shadow-[0_12px_36px_rgba(0,0,0,0.06)]',
        cardBg: isDark ? 'bg-[#090b10] text-white' : 'bg-white text-slate-900',
        qCardBg: isDark ? 'bg-[#261b0c] text-stone-100' : 'bg-[#faf4ea] text-stone-900',
        qCardBorder: isDark ? 'border-[#8a6328]/50' : 'border-[#e2d2ba]',
        qNumBadge: isDark ? 'bg-[#3b2a12] text-[#edd8ae] border-[#8a6328]/50' : 'bg-[#f5ede0] text-[#7a5720] border-[#decbb0]',
        promptText: 'text-[#8a652a] dark:text-[#dfbf83]',
        stepperPillActive: 'bg-[#b88d46] text-stone-950 font-bold border-[#dfbf83] shadow-amber-900/30 ring-2 ring-[#dfbf83]/40 scale-110',
        stepperPillDone: isDark ? 'bg-[#5e431a]/40 text-[#edd8ae] border-[#8a6328]/40' : 'bg-[#f5ecdc] text-[#5e431a] border border-[#e2d2ba]',
        stepperArrow: 'text-[#8a652a] dark:text-[#dfbf83] hover:bg-[#8a6328]/10',
        progressText: 'text-[#8a652a] dark:text-[#dfbf83]',
        nextBtn: 'bg-[#b88d46] hover:bg-[#a67c38] text-stone-950 font-bold shadow-md transition-all',
        submitBtn: 'bg-[#b88d46] hover:bg-[#a67c38] text-stone-950 font-bold shadow-md transition-all',
        optionHover: isDark ? 'hover:bg-[#281b0a]/40 hover:border-[#8a6328]/50' : 'hover:bg-[#fbf6ec] hover:border-[#b88d46]',
        optionSelected: isDark ? 'bg-[#281b0a]/60 border-2 border-[#dfbf83] text-stone-100 font-extrabold shadow-md' : 'bg-[#fbf6ec] border-2 border-[#b88d46] text-stone-900 font-extrabold shadow-md',
        optionBadgeSelected: 'bg-[#b88d46] text-stone-950 border-[#dfbf83]',
        optionCheckIcon: 'text-[#8a652a] dark:text-[#dfbf83]',
        blankPlaceholder: 'bg-[#dfbf83]/15 text-[#8a652a] dark:text-[#dfbf83] border-[#dfbf83]/60',
        fillBlankSelected: isDark ? 'bg-[#281b0a]/60 border-2 border-[#dfbf83] text-stone-100 font-extrabold shadow-md' : 'bg-[#fbf6ec] border-2 border-[#b88d46] text-stone-900 font-extrabold shadow-md',
        matchingHint: isDark ? 'bg-[#dfbf83]/10 border-[#dfbf83]/30 text-[#dfbf83]' : 'bg-[#faf4ea] border-[#decbb0] text-[#7a5720]',
        matchingTermBadge: isDark ? 'bg-[#3b2a12] text-[#edd8ae] border-[#8a6328]/50' : 'bg-[#f5ede0] text-[#7a5720] border-[#decbb0]',
        matchingDefBadge: isDark ? 'bg-[#4a3416] text-[#edd8ae] border-[#8a6328]/50' : 'bg-[#f5ede0] text-[#7a5720] border-[#decbb0]',
      }
    case 'purple':
      return {
        cardBorder: isDark ? 'border-white/10 shadow-black/40' : 'border-slate-200/90 shadow-[0_12px_36px_rgba(0,0,0,0.06)]',
        cardBg: isDark ? 'bg-[#090b10] text-white' : 'bg-white text-slate-900',
        qCardBg: isDark ? 'bg-[#090b10] text-white' : 'bg-purple-50/60 text-slate-900',
        qCardBorder: isDark ? 'border-purple-500/30' : 'border-purple-200',
        qNumBadge: isDark ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-purple-100 text-purple-800 border-purple-200',
        promptText: 'text-purple-700 dark:text-purple-300',
        stepperPillActive: 'bg-[#800080] text-white border-purple-400 shadow-purple-500/30 ring-2 ring-purple-400/40 scale-110',
        stepperPillDone: isDark ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-purple-100 text-purple-800 border-purple-200',
        stepperArrow: 'text-purple-700 dark:text-purple-400 hover:bg-purple-500/10',
        progressText: 'text-purple-700 dark:text-purple-300',
        nextBtn: 'bg-[#800080] hover:bg-[#6b006b] text-white shadow-md transition-all',
        submitBtn: 'bg-[#800080] hover:bg-[#6b006b] text-white shadow-md transition-all',
        optionHover: isDark ? 'hover:bg-purple-500/10 hover:border-purple-400/40' : 'hover:bg-purple-50/70 hover:border-purple-300',
        optionSelected: isDark ? 'bg-purple-950/40 border-2 border-purple-400 text-white font-extrabold shadow-md' : 'bg-purple-50 border-2 border-[#800080] text-slate-900 font-extrabold shadow-md',
        optionBadgeSelected: 'bg-[#800080] text-white border-[#800080]',
        optionCheckIcon: 'text-purple-700 dark:text-purple-300',
        blankPlaceholder: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-400/60',
        fillBlankSelected: isDark ? 'bg-purple-950/40 border-2 border-purple-400 text-white font-extrabold shadow-md' : 'bg-purple-50 border-2 border-[#800080] text-slate-900 font-extrabold shadow-md',
        matchingHint: isDark ? 'bg-purple-500/10 border-purple-500/30 text-purple-300' : 'bg-purple-50 border-purple-200 text-purple-800',
        matchingTermBadge: isDark ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-purple-100 text-purple-800 border-purple-200',
        matchingDefBadge: isDark ? 'bg-purple-500/25 text-purple-200 border-purple-500/40' : 'bg-purple-100 text-purple-800 border-purple-200',
      }
    case 'emerald':
    default:
      return {
        cardBorder: isDark ? 'border-white/10 shadow-black/40' : 'border-slate-200/90 shadow-[0_12px_36px_rgba(0,0,0,0.06)]',
        cardBg: isDark ? 'bg-[#090b10] text-white' : 'bg-white text-slate-900',
        qCardBg: isDark ? 'bg-[#092b1f] text-emerald-100' : 'bg-emerald-50/60 text-slate-900',
        qCardBorder: isDark ? 'border-emerald-500/30' : 'border-emerald-200',
        qNumBadge: isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-100 text-teal-800 border-emerald-200',
        promptText: 'text-teal-700 dark:text-teal-300',
        stepperPillActive: 'bg-teal-600 text-white border-teal-400 shadow-teal-500/30 ring-2 ring-emerald-400/40 scale-110',
        stepperPillDone: isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-emerald-100 text-emerald-800 border-emerald-200',
        stepperArrow: 'text-teal-700 dark:text-teal-400 hover:bg-emerald-500/10',
        progressText: 'text-teal-700 dark:text-teal-300',
        nextBtn: 'bg-teal-600 hover:bg-teal-700 text-white shadow-md transition-all',
        submitBtn: 'bg-teal-600 hover:bg-teal-700 text-white shadow-md transition-all',
        optionHover: isDark ? 'hover:bg-emerald-500/10 hover:border-emerald-400/40' : 'hover:bg-emerald-50/70 hover:border-emerald-300',
        optionSelected: isDark ? 'bg-emerald-950/40 border-2 border-teal-400 text-white font-extrabold shadow-md' : 'bg-emerald-50 border-2 border-teal-600 text-slate-900 font-extrabold shadow-md',
        optionBadgeSelected: 'bg-teal-600 text-white border-teal-600',
        optionCheckIcon: 'text-teal-700 dark:text-teal-300',
        blankPlaceholder: 'bg-emerald-500/15 text-teal-700 dark:text-teal-300 border-teal-400/60',
        fillBlankSelected: isDark ? 'bg-emerald-950/40 border-2 border-teal-400 text-white font-extrabold shadow-md' : 'bg-emerald-50 border-2 border-teal-600 text-slate-900 font-extrabold shadow-md',
        matchingHint: isDark ? 'bg-emerald-500/10 border-emerald-500/30 text-teal-300' : 'bg-emerald-50 border-emerald-200 text-teal-800',
        matchingTermBadge: isDark ? 'bg-emerald-500/20 text-teal-300 border-emerald-500/40' : 'bg-emerald-100 text-teal-800 border-emerald-200',
        matchingDefBadge: isDark ? 'bg-emerald-500/25 text-teal-200 border-emerald-500/40' : 'bg-emerald-100 text-teal-800 border-emerald-200',
      }
  }
}

export interface QuizCompletedThemeTokens {
  cardBorder: string
  cardBg: string
  ambientGlow: string
  gaugeGradientStart: string
  gaugeGradientEnd: string
  scoreText: string
  scoreSubtitle: string
  floatingBadge: string
  reviewBtn: string
  reviewIconBg: string
  reviewIconBorder: string
  reviewIcon: string
  reviewTitle: string
  reviewArrow: string
  newQuizBtn: string
  newQuizIconBg: string
  newQuizIcon: string
  newQuizTitle: string
  discussIconBg: string
  discussIconBorder: string
  discussHoverBorder: string
  discussArrow: string
  discussPulseRing: string
  newQuizHoverBorder?: string
}

export function getQuizCompletedThemeTokens(accentColor: AccentColor = 'emerald', isDark: boolean = true): QuizCompletedThemeTokens {
  switch (accentColor) {
    case 'blue':
      return {
        cardBorder: isDark ? 'border-white/10 shadow-black/40' : 'border-slate-200/90 shadow-[0_12px_36px_rgba(0,0,0,0.06)]',
        cardBg: isDark ? 'bg-[#090b10] text-white' : 'bg-white text-slate-900',
        ambientGlow: isDark ? 'bg-sky-500/10' : 'hidden',
        gaugeGradientStart: '#2563eb',
        gaugeGradientEnd: '#0284c7',
        scoreText: 'text-blue-700 dark:text-sky-400',
        scoreSubtitle: 'text-blue-700/80 dark:text-sky-200/80',
        floatingBadge: isDark ? 'bg-[#090b10] border-sky-500/40 text-sky-300 shadow-black/20' : 'bg-sky-50 border-sky-200 text-blue-700 shadow-sm',
        reviewBtn: isDark
          ? 'bg-[#090b10] border-white/10 hover:border-blue-400/50 text-white shadow-md'
          : 'bg-white border-slate-200 hover:border-blue-400 text-slate-900',
        reviewIconBg: 'bg-gradient-to-br from-blue-600 to-sky-500',
        reviewIconBorder: 'border-blue-400/50',
        reviewIcon: 'text-white',
        reviewTitle: 'text-blue-700 dark:text-sky-300',
        reviewArrow: 'text-blue-700 dark:text-sky-400',
        newQuizBtn: isDark
          ? 'bg-[#090b10] border-white/10 hover:border-blue-400/50 text-white'
          : 'bg-white border-slate-200 hover:border-blue-300 text-slate-800',
        newQuizIconBg: 'bg-gradient-to-br from-blue-600 to-sky-500',
        newQuizIcon: 'text-white',
        newQuizTitle: 'text-blue-700 dark:text-sky-300',
        discussIconBg: 'bg-gradient-to-br from-blue-600 to-sky-500',
        discussIconBorder: 'border-blue-400/50',
        discussHoverBorder: isDark ? 'hover:border-blue-400/60 hover:bg-blue-500/10' : 'hover:border-blue-400 hover:bg-blue-50/50',
        discussArrow: 'group-hover:text-sky-400',
        discussPulseRing: 'ring-sky-400/40',
        newQuizHoverBorder: isDark ? 'hover:border-blue-400/60 hover:bg-blue-500/10' : 'hover:border-blue-400 hover:bg-blue-50/50',
      }
    case 'amber':
      return {
        cardBorder: isDark ? 'border-white/10 shadow-black/40' : 'border-slate-200/90 shadow-[0_12px_36px_rgba(0,0,0,0.06)]',
        cardBg: isDark ? 'bg-[#090b10] text-white' : 'bg-white text-stone-900',
        ambientGlow: isDark ? 'bg-[#dfbf83]/10' : 'hidden',
        gaugeGradientStart: '#b88d46',
        gaugeGradientEnd: '#dfbf83',
        scoreText: 'text-[#b88d46] dark:text-[#dfbf83]',
        scoreSubtitle: 'text-[#8a652a]/80 dark:text-[#eed8ad]/80',
        floatingBadge: isDark ? 'bg-[#090b10] border-[#dfbf83]/40 text-[#eed8ad] shadow-black/20' : 'bg-[#faf4ea] border-[#decbb0] text-[#7a5720] shadow-sm',
        reviewBtn: isDark
          ? 'bg-[#090b10] border-white/10 hover:border-[#dfbf83]/50 text-stone-100 shadow-md'
          : 'bg-white border-slate-200 hover:border-[#b88d46] text-stone-900',
        reviewIconBg: 'bg-gradient-to-br from-[#b88d46] to-[#dfbf83]',
        reviewIconBorder: 'border-[#dfbf83]/40',
        reviewIcon: 'text-stone-950 font-bold',
        reviewTitle: 'text-[#8a652a] dark:text-[#dfbf83]',
        reviewArrow: 'text-[#8a652a] dark:text-[#dfbf83]',
        newQuizBtn: isDark
          ? 'bg-[#090b10] border-white/10 hover:border-[#dfbf83]/50 text-stone-100'
          : 'bg-white border-slate-200 hover:border-[#b88d46] text-stone-900',
        newQuizIconBg: 'bg-gradient-to-br from-[#b88d46] to-[#dfbf83]',
        newQuizIcon: 'text-stone-950 font-bold',
        newQuizTitle: 'text-[#8a652a] dark:text-[#dfbf83]',
        discussIconBg: 'bg-gradient-to-br from-[#b88d46] to-[#dfbf83]',
        discussIconBorder: 'border-[#dfbf83]/40',
        discussHoverBorder: isDark ? 'hover:border-[#dfbf83]/60 hover:bg-[#dfbf83]/10' : 'hover:border-[#b88d46] hover:bg-[#fbf8f0]',
        discussArrow: 'group-hover:text-[#dfbf83]',
        discussPulseRing: 'ring-[#dfbf83]/40',
        newQuizHoverBorder: isDark ? 'hover:border-[#dfbf83]/60 hover:bg-[#dfbf83]/10' : 'hover:border-[#b88d46] hover:bg-[#fbf8f0]',
      }
    case 'purple':
      return {
        cardBorder: isDark ? 'border-white/10 shadow-black/40' : 'border-slate-200/90 shadow-[0_12px_36px_rgba(0,0,0,0.06)]',
        cardBg: isDark ? 'bg-[#090b10] text-white' : 'bg-white text-slate-900',
        ambientGlow: isDark ? 'bg-purple-500/10' : 'hidden',
        gaugeGradientStart: '#800080',
        gaugeGradientEnd: '#9333ea',
        scoreText: 'text-purple-700 dark:text-purple-400',
        scoreSubtitle: 'text-purple-700/80 dark:text-purple-200/80',
        floatingBadge: isDark ? 'bg-[#090b10] border-purple-500/40 text-purple-300 shadow-black/20' : 'bg-purple-50 border-purple-200 text-purple-800 shadow-sm',
        reviewBtn: isDark
          ? 'bg-[#090b10] border-white/10 hover:border-purple-400/50 text-white shadow-md'
          : 'bg-white border-slate-200 hover:border-purple-400 text-slate-900',
        reviewIconBg: 'bg-gradient-to-br from-[#800080] to-purple-600',
        reviewIconBorder: 'border-purple-400/50',
        reviewIcon: 'text-white',
        reviewTitle: 'text-purple-700 dark:text-purple-300',
        reviewArrow: 'text-purple-700 dark:text-purple-400',
        newQuizBtn: isDark
          ? 'bg-[#090b10] border-white/10 hover:border-purple-400/50 text-white'
          : 'bg-white border-slate-200 hover:border-purple-300 text-slate-800',
        newQuizIconBg: 'bg-gradient-to-br from-[#800080] to-purple-600',
        newQuizIcon: 'text-white',
        newQuizTitle: 'text-purple-700 dark:text-purple-300',
        discussIconBg: 'bg-gradient-to-br from-[#800080] to-purple-600',
        discussIconBorder: 'border-purple-400/50',
        discussHoverBorder: isDark ? 'hover:border-purple-400/60 hover:bg-purple-500/10' : 'hover:border-purple-400 hover:bg-purple-50/50',
        discussArrow: 'group-hover:text-purple-400',
        discussPulseRing: 'ring-purple-400/40',
        newQuizHoverBorder: isDark ? 'hover:border-purple-400/60 hover:bg-purple-500/10' : 'hover:border-purple-400 hover:bg-purple-50/50',
      }
    case 'emerald':
    default:
      return {
        cardBorder: isDark ? 'border-white/10 shadow-black/40' : 'border-slate-200/90 shadow-[0_12px_36px_rgba(0,0,0,0.06)]',
        cardBg: isDark ? 'bg-[#090b10] text-white' : 'bg-white text-slate-900',
        ambientGlow: isDark ? 'bg-emerald-500/10' : 'hidden',
        gaugeGradientStart: '#0d9488',
        gaugeGradientEnd: '#10b981',
        scoreText: 'text-teal-700 dark:text-teal-400',
        scoreSubtitle: 'text-teal-700/80 dark:text-teal-200/80',
        floatingBadge: isDark ? 'bg-[#090b10] border-teal-500/40 text-teal-300 shadow-black/20' : 'bg-emerald-50 border-emerald-200 text-teal-800 shadow-sm',
        reviewBtn: isDark
          ? 'bg-[#090b10] border-white/10 hover:border-teal-400/50 text-white shadow-md'
          : 'bg-white border-slate-200 hover:border-teal-400 text-slate-900',
        reviewIconBg: 'bg-gradient-to-br from-teal-600 to-emerald-500',
        reviewIconBorder: 'border-teal-400/50',
        reviewIcon: 'text-white',
        reviewTitle: 'text-teal-700 dark:text-teal-300',
        reviewArrow: 'text-teal-700 dark:text-teal-400',
        newQuizBtn: isDark
          ? 'bg-[#090b10] border-white/10 hover:border-teal-400/50 text-white'
          : 'bg-white border-slate-200 hover:border-teal-300 text-slate-800',
        newQuizIconBg: 'bg-gradient-to-br from-teal-600 to-emerald-500',
        newQuizIcon: 'text-white',
        newQuizTitle: 'text-teal-700 dark:text-teal-300',
        discussIconBg: 'bg-gradient-to-br from-teal-600 to-emerald-500',
        discussIconBorder: 'border-teal-400/50',
        discussHoverBorder: isDark ? 'hover:border-teal-400/60 hover:bg-teal-500/10' : 'hover:border-teal-400 hover:bg-teal-50/50',
        discussArrow: 'group-hover:text-teal-400',
        discussPulseRing: 'ring-teal-400/40',
        newQuizHoverBorder: isDark ? 'hover:border-teal-400/60 hover:bg-teal-500/10' : 'hover:border-teal-400 hover:bg-teal-50/50',
      }
  }
}
