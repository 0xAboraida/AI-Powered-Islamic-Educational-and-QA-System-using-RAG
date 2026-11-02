import React from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen, Sparkles, Target, FileText, MessageSquare, Brain,
  ChevronDown, History, ArrowLeft, BookmarkCheck, Library, GraduationCap
} from 'lucide-react'
import studyModeHeroBg from '@/assets/images/study mode background light2.png'
import { type ChunkMetadata } from '../../../contexts/StudyContext'
import { StudyHeroCommunity, type CommunityMindmapItem, type CommunityQuizItem } from './StudyHeroCommunity'

interface StudyHeroProps {
  accentColor: 'purple' | 'emerald' | 'amber' | 'blue'
  isDark: boolean
  chunkTitle?: string
  headerSubtitle?: string
  chunkMeta?: ChunkMetadata | null
  currentChunkId?: string | null
  onEnterWorkspace: () => void
  onOpenBookSelector?: () => void
  onOpenHistory?: () => void
  onSelectCommunityMindmap?: (mindmap: CommunityMindmapItem) => void
  onSelectCommunityQuiz?: (quiz: CommunityQuizItem) => void
}

export function StudyHero({
  accentColor,
  isDark,
  chunkTitle,
  headerSubtitle,
  chunkMeta,
  currentChunkId,
  onEnterWorkspace,
  onOpenBookSelector,
  onOpenHistory,
  onSelectCommunityMindmap,
  onSelectCommunityQuiz,
}: StudyHeroProps) {

  // Theme-specific glow and title styles
  const getThemeTitleClass = () => {
    if (isDark) {
      switch (accentColor) {
        case 'emerald':
          return 'from-teal-200 via-teal-400 to-emerald-300 drop-shadow-[0_2px_24px_rgba(20,184,166,0.6)]'
        case 'amber':
          return 'from-[#fef3c7] via-[#dfbf83] to-[#b88d46] drop-shadow-[0_2px_24px_rgba(223,191,131,0.6)]'
        case 'blue':
          return 'from-sky-200 via-blue-400 to-indigo-300 drop-shadow-[0_2px_24px_rgba(59,130,246,0.6)]'
        case 'purple':
        default:
          return 'from-purple-200 via-fuchsia-400 to-purple-300 drop-shadow-[0_2px_24px_rgba(168,85,247,0.6)]'
      }
    } else {
      switch (accentColor) {
        case 'emerald':
          return 'from-teal-900 via-teal-700 to-emerald-800'
        case 'amber':
          return 'from-[#5e431a] via-[#8a652a] to-[#78350f]'
        case 'blue':
          return 'from-blue-950 via-blue-800 to-indigo-900'
        case 'purple':
        default:
          return 'from-purple-950 via-purple-800 to-purple-900'
      }
    }
  }

  // Primary Action Button Theme Class
  const getPrimaryBtnClass = () => {
    switch (accentColor) {
      case 'emerald':
        return isDark
          ? 'bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-[0_8px_30px_rgba(20,184,166,0.45)] border-teal-400/40'
          : 'bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-700 hover:from-teal-600 hover:to-emerald-600 text-white shadow-[0_8px_25px_rgba(13,148,136,0.35)] border-teal-500/30'
      case 'amber':
        return isDark
          ? 'bg-gradient-to-r from-[#8e682d] via-[#b88d46] to-[#dfbf83] hover:from-[#b88d46] hover:to-[#dfbf83] text-stone-950 font-black shadow-[0_8px_30px_rgba(223,191,131,0.45)] border-[#dfbf83]/50'
          : 'bg-gradient-to-r from-[#78350f] via-[#b88d46] to-[#5e431a] hover:from-[#854d0e] hover:to-[#78350f] text-white shadow-[0_8px_25px_rgba(184,141,70,0.35)] border-[#dfbf83]/30'
      case 'blue':
        return isDark
          ? 'bg-gradient-to-r from-blue-600 via-blue-500 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white shadow-[0_8px_30px_rgba(37,99,235,0.45)] border-blue-400/40'
          : 'bg-gradient-to-r from-blue-700 via-blue-600 to-sky-700 hover:from-blue-600 hover:to-sky-600 text-white shadow-[0_8px_25px_rgba(37,99,235,0.35)] border-blue-500/30'
      case 'purple':
      default:
        return isDark
          ? 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-700 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-[0_8px_30px_rgba(168,85,247,0.45)] border-purple-400/40'
          : 'bg-gradient-to-r from-purple-700 via-purple-600 to-fuchsia-700 hover:from-purple-600 hover:to-purple-700 text-white shadow-[0_8px_25px_rgba(147,51,234,0.35)] border-purple-500/30'
    }
  }

  // Secondary Button Glass Style
  const getSecondaryBtnClass = () => {
    if (isDark) {
      switch (accentColor) {
        case 'emerald':
          return 'bg-teal-950/25 hover:bg-teal-950/40 text-teal-100 border-teal-500/30 hover:border-teal-400/60 shadow-[0_4px_20px_rgba(0,0,0,0.3)]'
        case 'amber':
          return 'bg-amber-950/25 hover:bg-amber-950/40 text-[#f5ebd7] border-[#dfbf83]/30 hover:border-[#dfbf83]/60 shadow-[0_4px_20px_rgba(0,0,0,0.3)]'
        case 'blue':
          return 'bg-blue-950/25 hover:bg-blue-950/40 text-blue-100 border-blue-500/30 hover:border-blue-400/60 shadow-[0_4px_20px_rgba(0,0,0,0.3)]'
        case 'purple':
        default:
          return 'bg-purple-950/25 hover:bg-purple-950/40 text-purple-100 border-purple-500/30 hover:border-purple-400/60 shadow-[0_4px_20px_rgba(0,0,0,0.3)]'
      }
    } else {
      switch (accentColor) {
        case 'emerald':
          return 'bg-white/60 hover:bg-white/85 text-teal-950 border-teal-200 hover:border-teal-300 shadow-[0_4px_20px_rgba(20,184,166,0.1)]'
        case 'amber':
          return 'bg-white/60 hover:bg-white/85 text-amber-950 border-[#dfbf83]/50 hover:border-[#dfbf83] shadow-[0_4px_20px_rgba(184,141,70,0.1)]'
        case 'blue':
          return 'bg-white/60 hover:bg-white/85 text-blue-950 border-blue-200 hover:border-blue-300 shadow-[0_4px_20px_rgba(59,130,246,0.1)]'
        case 'purple':
        default:
          return 'bg-white/60 hover:bg-white/85 text-purple-950 border-purple-200 hover:border-purple-300 shadow-[0_4px_20px_rgba(168,85,247,0.1)]'
      }
    }
  }

  // Feature Card Style
  const getCardStyle = () => {
    if (isDark) {
      switch (accentColor) {
        case 'emerald':
          return 'bg-[#041413]/70 hover:bg-[#06201e]/85 border-teal-500/25 hover:border-teal-400/50 shadow-[0_8px_30px_rgba(0,0,0,0.35)]'
        case 'amber':
          return 'bg-[#181208]/70 hover:bg-[#22190b]/85 border-[#dfbf83]/25 hover:border-[#dfbf83]/50 shadow-[0_8px_30px_rgba(0,0,0,0.35)]'
        case 'blue':
          return 'bg-[#051124]/70 hover:bg-[#071935]/85 border-blue-500/25 hover:border-blue-400/50 shadow-[0_8px_30px_rgba(0,0,0,0.35)]'
        case 'purple':
        default:
          return 'bg-[#12041f]/70 hover:bg-[#1a0730]/85 border-purple-500/25 hover:border-purple-400/50 shadow-[0_8px_30px_rgba(0,0,0,0.35)]'
      }
    } else {
      switch (accentColor) {
        case 'emerald':
          return 'bg-white/70 hover:bg-white/90 border-teal-100 hover:border-teal-300 shadow-[0_8px_30px_rgba(20,184,166,0.08)]'
        case 'amber':
          return 'bg-white/70 hover:bg-white/90 border-[#ebd9b5] hover:border-[#dfbf83] shadow-[0_8px_30px_rgba(184,141,70,0.08)]'
        case 'blue':
          return 'bg-white/70 hover:bg-white/90 border-blue-100 hover:border-blue-300 shadow-[0_8px_30px_rgba(59,130,246,0.08)]'
        case 'purple':
        default:
          return 'bg-white/70 hover:bg-white/90 border-purple-100 hover:border-purple-300 shadow-[0_8px_30px_rgba(168,85,247,0.08)]'
      }
    }
  }

  // Feature Icon Box Style
  const getIconBoxStyle = (idx: number) => {
    switch (accentColor) {
      case 'emerald':
        return isDark
          ? 'bg-teal-500/20 text-teal-300 border border-teal-500/35'
          : 'bg-teal-100 text-teal-800 border border-teal-200'
      case 'amber':
        return isDark
          ? 'bg-[#dfbf83]/20 text-[#eed9b0] border border-[#dfbf83]/35'
          : 'bg-[#f4ecdc] text-[#78350f] border border-[#ebd9b5]'
      case 'blue':
        return isDark
          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/35'
          : 'bg-blue-100 text-blue-800 border border-blue-200'
      case 'purple':
      default:
        return isDark
          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/35'
          : 'bg-purple-100 text-purple-800 border border-purple-200'
    }
  }

  // Active book display info
  const displayBookTitle = chunkMeta?.book_title || chunkTitle || 'المغني لابن قدامة - ط مكتبة القاهرة'
  const displaySectionTitle = headerSubtitle || chunkMeta?.hierarchy?.kitab || 'فصل في الصلوات المكتوبات'

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-start overflow-y-auto overflow-x-hidden text-right selection:bg-primary/20">
      {/* Background Graphic - Fixed to Viewport, Crisp & 100% Pure with No Overlays */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          src={studyModeHeroBg}
          alt="خلفية واجهة المدارسة"
          className="h-full w-full object-cover object-bottom"
        />
      </div>

      {/* Hero Center Content (Top padding accounts for Navbar) */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-start px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-16 max-w-6xl mx-auto w-full text-center">
        {/* Hero Titles */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="space-y-2 sm:space-y-2.5 max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold backdrop-blur-xl border shadow-xs transition-all duration-300 bg-white/20 dark:bg-black/30 border-white/30 dark:border-white/10 text-foreground">
            <Sparkles size={14} className="text-amber-500 animate-pulse" />
            <span>منصة المدارسة التفاعلية بالذكاء الاصطناعي</span>
          </div>

          <h1
            className={`font-display text-2xl sm:text-4xl lg:text-[42px] font-black tracking-tight leading-tight bg-gradient-to-r bg-clip-text text-transparent ${getThemeTitleClass()}`}
          >
            مُدارَسة كتب التراث والعلوم الشرعية
          </h1>

          <p
            className={`text-xs sm:text-sm lg:text-base leading-relaxed max-w-2xl mx-auto ${isDark ? 'text-white/85 drop-shadow-xs' : 'text-stone-800 font-medium'
              }`}
          >
            بيئة تفاعلية لقراءة وتحليل أمهات المتون: تفكيك المسائل، تلخيص القواعد، الخرائط الذهنية، واختبارات قياس الفهم والاستيعاب.
          </p>
        </motion.div>

        {/* Resume Session Banner */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-4 sm:mt-5 w-full max-w-2xl"
        >
          <div
            className={`rounded-2xl border p-3.5 sm:p-4 backdrop-blur-2xl transition-all duration-300 text-right flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg ${isDark
                ? 'bg-black/40 border-white/15 hover:border-white/25'
                : 'bg-white/85 border-stone-200/90 shadow-[0_12px_35px_rgba(0,0,0,0.06)]'
              }`}
          >
            <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-md ${isDark
                    ? 'bg-gradient-to-br from-white/10 to-white/5 border border-white/20 text-white'
                    : 'bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 text-amber-900'
                  }`}
              >
                <BookOpen size={20} className="stroke-[2.2]" />
              </div>
              <div className="min-w-0 text-right">
                <div className="flex items-center gap-2">
                  <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                    جلسة نشطة
                  </span>
                  <span className={`text-[11.5px] ${isDark ? 'text-white/60' : 'text-stone-500'}`}>
                    متابعة من حيث توقفت
                  </span>
                </div>
                <h4
                  className={`text-sm sm:text-base font-black truncate mt-0.5 ${isDark ? 'text-white' : 'text-stone-900'
                    }`}
                >
                  {displayBookTitle}
                </h4>
                <p className={`text-xs truncate ${isDark ? 'text-white/70' : 'text-stone-600'}`}>
                  {displaySectionTitle}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onEnterWorkspace}
              className={`shrink-0 w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 active:scale-95 cursor-pointer border ${getPrimaryBtnClass()}`}
            >
              <span>متابعة المدارسة الآن</span>
              <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            </button>
          </div>
        </motion.div>

        {/* Secondary Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-3 flex flex-wrap items-center justify-center gap-2.5 w-full"
        >
          {onOpenBookSelector && (
            <button
              type="button"
              onClick={onOpenBookSelector}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold backdrop-blur-xl border transition-all duration-300 active:scale-95 cursor-pointer ${getSecondaryBtnClass()}`}
            >
              <Library size={15} />
              <span>اختيار كتاب أو درس من التراث</span>
            </button>
          )}

          <button
            type="button"
            onClick={onEnterWorkspace}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold backdrop-blur-xl border transition-all duration-300 active:scale-95 cursor-pointer ${getSecondaryBtnClass()}`}
          >
            <GraduationCap size={15} />
            <span>الدخول لمساحة المدارسة المباشرة</span>
          </button>

          {onOpenHistory && (
            <button
              type="button"
              onClick={onOpenHistory}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold backdrop-blur-xl border transition-all duration-300 active:scale-95 cursor-pointer ${getSecondaryBtnClass()}`}
            >
              <History size={15} />
              <span>سجل الجلسات السابقة</span>
            </button>
          )}
        </motion.div>

        {/* 4 Pillars of Study Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mt-4 sm:mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full max-w-5xl"
        >
          {/* 1. الخطة التفاعلية */}
          <div
            onClick={onEnterWorkspace}
            className={`group rounded-2xl border p-3.5 text-right transition-all duration-300 hover:-translate-y-1 cursor-pointer backdrop-blur-xl ${getCardStyle()}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${getIconBoxStyle(
                  0
                )}`}
              >
                <Target size={18} className="stroke-[2.2]" />
              </div>
              <span className={`text-[10px] font-bold ${isDark ? 'text-white/40' : 'text-stone-400'}`}>
                المسار الأول
              </span>
            </div>
            <h3 className={`text-sm font-black ${isDark ? 'text-white' : 'text-stone-900'}`}>
              الخطة التفاعلية
            </h3>
            <p className={`text-xs leading-relaxed mt-1 ${isDark ? 'text-white/70' : 'text-stone-600'}`}>
              تفكيك الدرس إلى محاور مرحلية مع تتبع استيعابك خطوة بخطوة.
            </p>
          </div>

          {/* 2. التلخيص المركز */}
          <div
            onClick={onEnterWorkspace}
            className={`group rounded-2xl border p-3.5 text-right transition-all duration-300 hover:-translate-y-1 cursor-pointer backdrop-blur-xl ${getCardStyle()}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${getIconBoxStyle(
                  1
                )}`}
              >
                <FileText size={18} className="stroke-[2.2]" />
              </div>
              <span className={`text-[10px] font-bold ${isDark ? 'text-white/40' : 'text-stone-400'}`}>
                المسار الثاني
              </span>
            </div>
            <h3 className={`text-sm font-black ${isDark ? 'text-white' : 'text-stone-900'}`}>
              التلخيص المركز
            </h3>
            <p className={`text-xs leading-relaxed mt-1 ${isDark ? 'text-white/70' : 'text-stone-600'}`}>
              تحرير وضبط أهم القواعد الفقهية والأصولية والفوائد المستنبطة.
            </p>
          </div>

          {/* 3. حوار زاد الشرعي */}
          <div
            onClick={onEnterWorkspace}
            className={`group rounded-2xl border p-3.5 text-right transition-all duration-300 hover:-translate-y-1 cursor-pointer backdrop-blur-xl ${getCardStyle()}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${getIconBoxStyle(
                  2
                )}`}
              >
                <MessageSquare size={18} className="stroke-[2.2]" />
              </div>
              <span className={`text-[10px] font-bold ${isDark ? 'text-white/40' : 'text-stone-400'}`}>
                المسار الثالث
              </span>
            </div>
            <h3 className={`text-sm font-black ${isDark ? 'text-white' : 'text-stone-900'}`}>
              حوار زاد الشرعي
            </h3>
            <p className={`text-xs leading-relaxed mt-1 ${isDark ? 'text-white/70' : 'text-stone-600'}`}>
              نقاش مباشر لسؤال زاد عن المعاني الغامضة وفك عبارات المتون.
            </p>
          </div>

          {/* 4. الخرائط والاختبارات */}
          <div
            onClick={onEnterWorkspace}
            className={`group rounded-2xl border p-3.5 text-right transition-all duration-300 hover:-translate-y-1 cursor-pointer backdrop-blur-xl ${getCardStyle()}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${getIconBoxStyle(
                  3
                )}`}
              >
                <Brain size={18} className="stroke-[2.2]" />
              </div>
              <span className={`text-[10px] font-bold ${isDark ? 'text-white/40' : 'text-stone-400'}`}>
                المسار الرابع
              </span>
            </div>
            <h3 className={`text-sm font-black ${isDark ? 'text-white' : 'text-stone-900'}`}>
              الخرائط والتقييم
            </h3>
            <p className={`text-xs leading-relaxed mt-1 ${isDark ? 'text-white/70' : 'text-stone-600'}`}>
              تشجير بصري للمسائل مصحوباً باختبارات تقييم ذكية لقياس الفهم.
            </p>
          </div>
        </motion.div>

        {/* 5. Community Hub: التشجيرات والاختبارات المنشورة في الصفحة الرئيسية للمدارسة */}
        <StudyHeroCommunity
          accentColor={accentColor}
          isDark={isDark}
          onSelectMindmap={(item) => {
            if (onSelectCommunityMindmap) {
              onSelectCommunityMindmap(item)
            } else {
              onEnterWorkspace()
            }
          }}
          onSelectQuiz={(item) => {
            if (onSelectCommunityQuiz) {
              onSelectCommunityQuiz(item)
            } else {
              onEnterWorkspace()
            }
          }}
        />
      </div>
    </div>
  )
}
