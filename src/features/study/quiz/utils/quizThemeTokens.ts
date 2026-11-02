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
        cardBorder: isDark ? 'border-sky-500/25 shadow-sky-950/20' : 'border-sky-100 shadow-xl',
        cardBg: isDark ? 'bg-[#0b1626] text-white' : 'bg-[#fafcff] text-slate-900',
        qCardBg: isDark ? 'bg-[#0e213d] text-white' : 'bg-sky-50/60 text-slate-900',
        qCardBorder: isDark ? 'border-sky-500/30' : 'border-sky-200',
        qNumBadge: isDark ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'bg-sky-100 text-[#154696] border-sky-200',
        promptText: 'text-[#154696] dark:text-sky-300',
        stepperPillActive: 'bg-[#154696] text-white border-[#154696] shadow-sky-500/30 ring-2 ring-sky-400/40 scale-110',
        stepperPillDone: isDark ? 'bg-sky-500/20 text-sky-300 border-sky-500/30' : 'bg-sky-100 text-sky-800 border-sky-200',
        stepperArrow: 'text-[#154696] dark:text-sky-400 hover:bg-sky-500/10',
        progressText: 'text-[#154696] dark:text-sky-300',
        nextBtn: 'bg-[#154696] hover:bg-[#103878] active:bg-[#0c2b5d] text-white shadow-md transition-all',
        submitBtn: 'bg-[#154696] hover:bg-[#103878] text-white shadow-md transition-all',
        optionHover: isDark ? 'hover:bg-sky-500/10 hover:border-sky-400/40' : 'hover:bg-sky-50/70 hover:border-sky-300',
        optionSelected: isDark ? 'bg-sky-950/40 border-2 border-sky-400 text-white font-extrabold shadow-md' : 'bg-sky-50 border-2 border-[#154696] text-slate-900 font-extrabold shadow-md',
        optionBadgeSelected: 'bg-[#154696] text-white border-[#154696]',
        optionCheckIcon: 'text-[#154696] dark:text-sky-300',
        blankPlaceholder: 'bg-sky-500/15 text-[#154696] dark:text-sky-300 border-sky-400/60',
        fillBlankSelected: isDark ? 'bg-sky-950/40 border-2 border-sky-400 text-white font-extrabold shadow-md' : 'bg-sky-50 border-2 border-[#154696] text-slate-900 font-extrabold shadow-md',
        matchingHint: isDark ? 'bg-sky-500/10 border-sky-500/30 text-sky-300' : 'bg-sky-50 border-sky-200 text-[#154696]',
        matchingTermBadge: isDark ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'bg-sky-100 text-[#154696] border-sky-200',
        matchingDefBadge: isDark ? 'bg-sky-500/25 text-sky-200 border-sky-500/40' : 'bg-sky-100 text-[#154696] border-sky-200',
      }
    case 'amber':
      return {
        cardBorder: isDark ? 'border-[#5e431a]/40 shadow-stone-950/40' : 'border-[#e6d8c3] shadow-xl',
        cardBg: isDark ? 'bg-[#18120a] text-stone-100' : 'bg-[#fcfaf6] text-stone-900',
        qCardBg: isDark ? 'bg-[#261b0c] text-stone-100' : 'bg-[#faf4ea] text-stone-900',
        qCardBorder: isDark ? 'border-[#8a6328]/50' : 'border-[#e2d2ba]',
        qNumBadge: isDark ? 'bg-[#3b2a12] text-[#edd8ae] border-[#8a6328]/50' : 'bg-[#f5ede0] text-[#7a5720] border-[#decbb0]',
        promptText: 'text-[#7a5720] dark:text-[#dfbf83]',
        stepperPillActive: 'bg-[#7a5720] text-white border-[#7a5720] shadow-stone-900/30 ring-2 ring-[#dfbf83]/40 scale-110',
        stepperPillDone: isDark ? 'bg-[#5e431a]/40 text-[#edd8ae] border-[#8a6328]/40' : 'bg-[#f5ecdc] text-[#5e431a] border border-[#e2d2ba]',
        stepperArrow: 'text-[#7a5720] dark:text-[#dfbf83] hover:bg-[#8a6328]/10',
        progressText: 'text-[#7a5720] dark:text-[#dfbf83]',
        nextBtn: 'bg-[#7a5720] hover:bg-[#684918] active:bg-[#593d12] text-white shadow-md transition-all',
        submitBtn: 'bg-[#7a5720] hover:bg-[#684918] text-white shadow-md transition-all',
        optionHover: isDark ? 'hover:bg-[#281b0a]/40 hover:border-[#8a6328]/50' : 'hover:bg-[#fbf6ec] hover:border-[#b88d46]',
        optionSelected: isDark ? 'bg-[#281b0a]/60 border-2 border-[#dfbf83] text-stone-100 font-extrabold shadow-md' : 'bg-[#fbf6ec] border-2 border-[#7a5720] text-stone-900 font-extrabold shadow-md',
        optionBadgeSelected: 'bg-[#7a5720] text-white border-[#7a5720]',
        optionCheckIcon: 'text-[#7a5720] dark:text-[#dfbf83]',
        blankPlaceholder: 'bg-[#5e431a]/20 text-[#7a5720] dark:text-[#edd8ae] border-[#8a6328]/60',
        fillBlankSelected: isDark ? 'bg-[#281b0a]/60 border-2 border-[#dfbf83] text-stone-100 font-extrabold shadow-md' : 'bg-[#fbf6ec] border-2 border-[#7a5720] text-stone-900 font-extrabold shadow-md',
        matchingHint: isDark ? 'bg-[#261b0c] border-[#8a6328]/50 text-[#edd8ae]' : 'bg-[#f5ede0] border-[#decbb0] text-[#7a5720]',
        matchingTermBadge: isDark ? 'bg-[#3b2a12] text-[#edd8ae] border-[#8a6328]/50' : 'bg-[#f5ede0] text-[#7a5720] border-[#decbb0]',
        matchingDefBadge: isDark ? 'bg-[#2b1f0c] text-[#edd8ae] border-[#8a6328]/40' : 'bg-[#f5ede0] text-[#7a5720] border-[#decbb0]',
      }
    case 'purple':
      return {
        cardBorder: isDark ? 'border-purple-500/25 shadow-purple-950/20' : 'border-purple-100 shadow-xl',
        cardBg: isDark ? 'bg-[#140624] text-white' : 'bg-[#faf7fd] text-slate-900',
        qCardBg: isDark ? 'bg-[#240a3d] text-white' : 'bg-purple-50/60 text-slate-900',
        qCardBorder: isDark ? 'border-purple-500/30' : 'border-purple-200',
        qNumBadge: isDark ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-purple-100 text-[#581c87] border-purple-200',
        promptText: 'text-[#581c87] dark:text-purple-300',
        stepperPillActive: 'bg-[#581c87] text-white border-[#581c87] shadow-purple-500/30 ring-2 ring-purple-400/40 scale-110',
        stepperPillDone: isDark ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-purple-100 text-purple-800 border-purple-200',
        stepperArrow: 'text-[#581c87] dark:text-purple-400 hover:bg-purple-500/10',
        progressText: 'text-[#581c87] dark:text-purple-300',
        nextBtn: 'bg-[#581c87] hover:bg-[#4a1572] active:bg-[#3b0f5c] text-white shadow-md transition-all',
        submitBtn: 'bg-[#581c87] hover:bg-[#4a1572] text-white shadow-md transition-all',
        optionHover: isDark ? 'hover:bg-purple-500/10 hover:border-purple-400/40' : 'hover:bg-purple-50/70 hover:border-purple-300',
        optionSelected: isDark ? 'bg-purple-950/40 border-2 border-purple-400 text-white font-extrabold shadow-md' : 'bg-purple-50 border-2 border-[#581c87] text-slate-900 font-extrabold shadow-md',
        optionBadgeSelected: 'bg-[#581c87] text-white border-[#581c87]',
        optionCheckIcon: 'text-[#581c87] dark:text-purple-300',
        blankPlaceholder: 'bg-purple-500/15 text-[#581c87] dark:text-purple-300 border-purple-400/60',
        fillBlankSelected: isDark ? 'bg-purple-950/40 border-2 border-purple-400 text-white font-extrabold shadow-md' : 'bg-purple-50 border-2 border-[#581c87] text-slate-900 font-extrabold shadow-md',
        matchingHint: isDark ? 'bg-purple-500/10 border-purple-500/30 text-purple-300' : 'bg-purple-50 border-purple-200 text-[#581c87]',
        matchingTermBadge: isDark ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-purple-100 text-[#581c87] border-purple-200',
        matchingDefBadge: isDark ? 'bg-purple-500/25 text-purple-200 border-purple-500/40' : 'bg-purple-100 text-[#581c87] border-purple-200',
      }
    case 'emerald':
    default:
      return {
        cardBorder: isDark ? 'border-emerald-500/25 shadow-emerald-950/20' : 'border-emerald-100 shadow-xl',
        cardBg: isDark ? 'bg-[#051c14] text-white' : 'bg-[#f7fcf9] text-slate-900',
        qCardBg: isDark ? 'bg-[#092b1f] text-white' : 'bg-emerald-50/60 text-slate-900',
        qCardBorder: isDark ? 'border-emerald-500/30' : 'border-emerald-200',
        qNumBadge: isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-100 text-[#046c4e] border-emerald-200',
        promptText: 'text-[#046c4e] dark:text-emerald-300',
        stepperPillActive: 'bg-[#046c4e] text-white border-[#046c4e] shadow-emerald-500/30 ring-2 ring-emerald-400/40 scale-110',
        stepperPillDone: isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-emerald-100 text-emerald-800 border border-emerald-200',
        stepperArrow: 'text-[#046c4e] dark:text-emerald-400 hover:bg-emerald-500/10',
        progressText: 'text-[#046c4e] dark:text-emerald-300',
        nextBtn: 'bg-[#046c4e] hover:bg-[#03543d] active:bg-[#023e2d] text-white shadow-md transition-all',
        submitBtn: 'bg-[#046c4e] hover:bg-[#03543d] text-white shadow-md transition-all',
        optionHover: isDark ? 'hover:bg-emerald-500/10 hover:border-emerald-400/40' : 'hover:bg-emerald-50/70 hover:border-emerald-300',
        optionSelected: isDark ? 'bg-emerald-950/40 border-2 border-emerald-400 text-white font-extrabold shadow-md' : 'bg-emerald-50 border-2 border-[#046c4e] text-slate-900 font-extrabold shadow-md',
        optionBadgeSelected: 'bg-[#046c4e] text-white border-[#046c4e]',
        optionCheckIcon: 'text-[#046c4e] dark:text-emerald-300',
        blankPlaceholder: 'bg-emerald-500/15 text-[#046c4e] dark:text-emerald-300 border-emerald-400/60',
        fillBlankSelected: isDark ? 'bg-emerald-950/40 border-2 border-emerald-400 text-white font-extrabold shadow-md' : 'bg-emerald-50 border-2 border-[#046c4e] text-slate-900 font-extrabold shadow-md',
        matchingHint: isDark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-[#046c4e]',
        matchingTermBadge: isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-100 text-[#046c4e] border-emerald-200',
        matchingDefBadge: isDark ? 'bg-emerald-500/25 text-emerald-200 border-emerald-500/40' : 'bg-emerald-100 text-[#046c4e] border-emerald-200',
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
}

export function getQuizCompletedThemeTokens(accentColor: AccentColor = 'emerald', isDark: boolean = true): QuizCompletedThemeTokens {
  switch (accentColor) {
    case 'blue':
      return {
        cardBorder: isDark ? 'border-sky-500/25 shadow-sky-950/20' : 'border-sky-100 shadow-xl',
        cardBg: isDark ? 'bg-[#0b1626] text-white' : 'bg-[#fafcff] text-slate-900',
        ambientGlow: 'bg-sky-500/10',
        gaugeGradientStart: '#154696',
        gaugeGradientEnd: '#38bdf8',
        scoreText: 'text-[#154696] dark:text-sky-400',
        scoreSubtitle: 'text-[#154696]/80 dark:text-sky-200/80',
        floatingBadge: isDark ? 'bg-[#0e213d] border-sky-500/40 text-sky-300 shadow-sky-500/10' : 'bg-sky-50 border-sky-200 text-[#154696] shadow-sm',
        reviewBtn: isDark
          ? 'bg-[#0e213d]/85 border-sky-500/40 hover:border-sky-400 text-white shadow-lg shadow-sky-950/20'
          : 'bg-sky-50 border-sky-200 hover:border-sky-400 text-slate-900',
        reviewIconBg: 'bg-gradient-to-br from-sky-500/20 to-blue-600/25',
        reviewIconBorder: 'border-sky-400/40',
        reviewIcon: 'text-sky-400',
        reviewTitle: 'text-[#154696] dark:text-sky-300',
        reviewArrow: 'text-[#154696]/80 dark:text-sky-400/80',
        newQuizBtn: isDark
          ? 'bg-[#09182d]/85 border-sky-500/30 hover:border-sky-400/60 text-white'
          : 'bg-slate-50 border-slate-200 hover:border-sky-300 text-slate-800',
        newQuizIconBg: 'bg-sky-500/15 border border-sky-500/30',
        newQuizIcon: 'text-sky-400',
        newQuizTitle: 'text-[#154696] dark:text-sky-300',
      }
    case 'amber':
      return {
        cardBorder: isDark ? 'border-[#5e431a]/40 shadow-stone-950/40' : 'border-[#e6d8c3] shadow-xl',
        cardBg: isDark ? 'bg-[#18120a] text-stone-100' : 'bg-[#fcfaf6] text-stone-900',
        ambientGlow: 'bg-[#dfbf83]/10',
        gaugeGradientStart: '#c59a53',
        gaugeGradientEnd: '#dfbf83',
        scoreText: 'text-[#7a5720] dark:text-[#dfbf83]',
        scoreSubtitle: 'text-[#7a5720]/80 dark:text-[#edd8ae]/80',
        floatingBadge: isDark ? 'bg-[#261b0c] border-[#8a6328]/50 text-[#edd8ae] shadow-[#8a6328]/10' : 'bg-[#faf4ea] border-[#decbb0] text-[#7a5720] shadow-sm',
        reviewBtn: isDark
          ? 'bg-[#221606]/85 border-[#8a6328]/50 hover:border-[#dfbf83] text-stone-100 shadow-lg shadow-amber-950/20'
          : 'bg-[#faf4ea] border-[#e2d2ba] hover:border-[#7a5720] text-stone-900',
        reviewIconBg: 'bg-gradient-to-br from-[#8a6328]/25 to-[#5e431a]/30',
        reviewIconBorder: 'border-[#8a6328]/50',
        reviewIcon: 'text-[#dfbf83]',
        reviewTitle: 'text-[#7a5720] dark:text-[#dfbf83]',
        reviewArrow: 'text-[#7a5720]/80 dark:text-[#dfbf83]/80',
        newQuizBtn: isDark
          ? 'bg-[#1c1409]/85 border-[#8a6328]/35 hover:border-[#8a6328]/60 text-stone-100'
          : 'bg-[#faf4ea]/80 border-[#e2d2ba] hover:border-[#b88d46] text-stone-900',
        newQuizIconBg: 'bg-[#5e431a]/25 border border-[#8a6328]/40',
        newQuizIcon: 'text-[#dfbf83]',
        newQuizTitle: 'text-[#7a5720] dark:text-[#dfbf83]',
      }
    case 'purple':
      return {
        cardBorder: isDark ? 'border-purple-500/25 shadow-purple-950/20' : 'border-purple-100 shadow-xl',
        cardBg: isDark ? 'bg-[#140624] text-white' : 'bg-[#faf7fd] text-slate-900',
        ambientGlow: 'bg-purple-500/10',
        gaugeGradientStart: '#7c3aed',
        gaugeGradientEnd: '#c084fc',
        scoreText: 'text-[#581c87] dark:text-purple-400',
        scoreSubtitle: 'text-[#581c87]/80 dark:text-purple-200/80',
        floatingBadge: isDark ? 'bg-[#240a3d] border-purple-500/40 text-purple-300 shadow-purple-500/10' : 'bg-purple-50 border-purple-200 text-[#581c87] shadow-sm',
        reviewBtn: isDark
          ? 'bg-[#240a3d]/85 border-purple-500/40 hover:border-purple-400 text-white shadow-lg shadow-purple-950/20'
          : 'bg-purple-50 border-purple-200 hover:border-purple-400 text-slate-900',
        reviewIconBg: 'bg-gradient-to-br from-purple-500/20 to-fuchsia-600/25',
        reviewIconBorder: 'border-purple-400/40',
        reviewIcon: 'text-purple-400',
        reviewTitle: 'text-[#581c87] dark:text-purple-300',
        reviewArrow: 'text-[#581c87]/80 dark:text-purple-400/80',
        newQuizBtn: isDark
          ? 'bg-[#1c0833]/85 border-purple-500/30 hover:border-purple-400/60 text-white'
          : 'bg-slate-50 border-slate-200 hover:border-purple-300 text-slate-800',
        newQuizIconBg: 'bg-purple-500/15 border border-purple-500/30',
        newQuizIcon: 'text-purple-400',
        newQuizTitle: 'text-[#581c87] dark:text-purple-300',
      }
    case 'emerald':
    default:
      return {
        cardBorder: isDark ? 'border-emerald-500/25 shadow-emerald-950/20' : 'border-emerald-100 shadow-xl',
        cardBg: isDark ? 'bg-[#051c14] text-white' : 'bg-[#f7fcf9] text-slate-900',
        ambientGlow: 'bg-emerald-500/10',
        gaugeGradientStart: '#10b981',
        gaugeGradientEnd: '#14b8a6',
        scoreText: 'text-[#046c4e] dark:text-emerald-400',
        scoreSubtitle: 'text-[#046c4e]/80 dark:text-emerald-200/80',
        floatingBadge: isDark ? 'bg-[#092b1f] border-emerald-500/40 text-emerald-300 shadow-emerald-500/10' : 'bg-emerald-50 border-emerald-200 text-[#046c4e] shadow-sm',
        reviewBtn: isDark
          ? 'bg-[#092b1f]/85 border-emerald-500/40 hover:border-emerald-400 text-white shadow-lg shadow-emerald-950/20'
          : 'bg-emerald-50 border-emerald-200 hover:border-emerald-400 text-slate-900',
        reviewIconBg: 'bg-gradient-to-br from-emerald-500/20 to-teal-600/25',
        reviewIconBorder: 'border-emerald-400/40',
        reviewIcon: 'text-emerald-400',
        reviewTitle: 'text-[#046c4e] dark:text-emerald-300',
        reviewArrow: 'text-[#046c4e]/80 dark:text-emerald-400/80',
        newQuizBtn: isDark
          ? 'bg-[#072419]/85 border-emerald-500/30 hover:border-emerald-400/60 text-white'
          : 'bg-slate-50 border-slate-200 hover:border-emerald-300 text-slate-800',
        newQuizIconBg: 'bg-emerald-500/15 border border-emerald-500/30',
        newQuizIcon: 'text-emerald-400',
        newQuizTitle: 'text-[#046c4e] dark:text-emerald-300',
      }
  }
}

