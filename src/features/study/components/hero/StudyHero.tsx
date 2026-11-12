import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  BookOpen,
  Sparkles,
  History,
  ArrowLeft,
  Library,
  Clock,
  Compass,
  Bookmark,
  ChevronLeft,
} from "lucide-react"
import IslamicPattern from "@/features/knowledge/components/IslamicPattern"
import { type ChunkMetadata } from "../../../../contexts/StudyContext"
import { studyApi, type StudySessionDto } from "../../../../api/studyApi"
import { getLocalStudySessions } from "../../utils/studyStorage"
import {
  StudyHeroCommunity,
  type CommunityMindmapItem,
  type CommunityQuizItem,
} from "./StudyHeroCommunity"

interface StudyHeroProps {
  accentColor: "purple" | "emerald" | "amber" | "blue"
  isDark: boolean
  chunkTitle?: string
  headerSubtitle?: string
  chunkMeta?: ChunkMetadata | null
  currentChunkId?: string | null
  onEnterWorkspace: () => void
  onOpenBookSelector?: () => void
  onOpenHistory?: () => void
  onSelectSession?: (session: StudySessionDto) => void
  onSelectCommunityMindmap?: (mindmap: CommunityMindmapItem) => void
  onSelectCommunityQuiz?: (quiz: CommunityQuizItem) => void
}

const SUGGESTED_BOOKS = [
  {
    title: "عمدة الفقه",
    author: "ابن قدامة المقدسي (ت 620 هـ)",
    domain: "الفقه الحنبلي",
    desc: "المتن المعتمد للمبتدئين في الفقه الحنبلي، جامع لأبواب العبادات والمعاملات بأدلتها.",
    tag: "فقه",
  },
  {
    title: "الورقات في أصول الفقه",
    author: "إمام الحرمين الجويني (ت 478 هـ)",
    domain: "أصول الفقه",
    desc: "درة المتون في علم أصول الفقه، يضبط مدارك الاستنباط ومسالك الأدلة الشرعية.",
    tag: "أصول",
  },
  {
    title: "الأربعون النووية",
    author: "الإمام يحيى بن شرف النووي (ت 676 هـ)",
    domain: "الحديث النبوي",
    desc: "جوامع الكلم النبوي وأمهات الأحاديث التي يدور عليها مدار الدين الإسلامي.",
    tag: "حديث",
  },
  {
    title: "العقيدة الواسطية",
    author: "شيخ الإسلام ابن تيمية (ت 728 هـ)",
    domain: "أصول الدين والعقيدة",
    desc: "تحرير محكم لمعتقد أهل السنة والجماعة في توحيد الأسماء والصفات والإيمان.",
    tag: "عقيدة",
  },
]

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
  onSelectSession,
  onSelectCommunityMindmap,
  onSelectCommunityQuiz,
}: StudyHeroProps) {
  const [recentSessions, setRecentSessions] = useState<any[]>([])

  // Load up to 3 recent study sessions
  useEffect(() => {
    let isMounted = true

    const loadRecent = async () => {
      try {
        const local = getLocalStudySessions()
        if (local && local.length > 0 && isMounted) {
          setRecentSessions(local.slice(0, 3))
        }

        const res = await studyApi.getSessions().catch(() => null)
        if (res && Array.isArray(res) && res.length > 0 && isMounted) {
          const enriched = res.slice(0, 3).map((remote: any) => {
            const localMatch = local?.find(
              (loc: any) =>
                loc.id === remote.id ||
                (remote.chunkId && loc.chunkId === remote.chunkId),
            )
            return localMatch ? { ...localMatch, ...remote } : remote
          })
          setRecentSessions(enriched)
        }
      } catch (err) {
        console.warn("Could not load recent study sessions:", err)
      }
    }

    loadRecent()
    return () => {
      isMounted = false
    }
  }, [])

  // Theme-specific glow and title styles
  const getThemeTitleClass = () => {
    if (isDark) {
      switch (accentColor) {
        case "emerald":
          return "from-teal-200 via-teal-400 to-emerald-300 drop-shadow-[0_2px_24px_rgba(20,184,166,0.6)]"
        case "amber":
          return "from-[#fef3c7] via-[#dfbf83] to-[#b88d46] drop-shadow-[0_2px_24px_rgba(223,191,131,0.6)]"
        case "blue":
          return "from-sky-200 via-blue-400 to-indigo-300 drop-shadow-[0_2px_24px_rgba(59,130,246,0.6)]"
        case "purple":
        default:
          return "from-purple-200 via-fuchsia-400 to-purple-300 drop-shadow-[0_2px_24px_rgba(168,85,247,0.6)]"
      }
    } else {
      switch (accentColor) {
        case "emerald":
          return "from-teal-900 via-teal-700 to-emerald-800"
        case "amber":
          return "from-[#5e431a] via-[#8a652a] to-[#78350f]"
        case "blue":
          return "from-blue-950 via-blue-800 to-indigo-900"
        case "purple":
        default:
          return "from-purple-950 via-purple-800 to-purple-900"
      }
    }
  }

  // Primary Action Button Theme Class (Subtle, clean shadows without blinding halo)
  const getPrimaryBtnClass = () => {
    switch (accentColor) {
      case "emerald":
        return isDark
          ? "bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-xs border-teal-400/30 hover:brightness-105"
          : "bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-700 hover:from-teal-600 hover:to-emerald-600 text-white shadow-xs border-teal-500/30 hover:brightness-105"
      case "amber":
        return isDark
          ? "bg-gradient-to-r from-[#a67c38] via-[#b88d46] to-[#dfbf83] hover:from-[#956d2e] hover:to-[#cfab65] text-stone-950 font-black shadow-xs border-[#dfbf83]/40 hover:brightness-105"
          : "bg-gradient-to-r from-[#78350f] via-[#b88d46] to-[#5e431a] hover:from-[#854d0e] hover:to-[#78350f] text-white shadow-xs border-[#dfbf83]/30 hover:brightness-105"
      case "blue":
        return isDark
          ? "bg-gradient-to-r from-blue-600 via-blue-500 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white shadow-xs border-blue-400/30 hover:brightness-105"
          : "bg-gradient-to-r from-blue-700 via-blue-600 to-sky-700 hover:from-blue-600 hover:to-sky-600 text-white shadow-xs border-blue-500/30 hover:brightness-105"
      case "purple":
      default:
        return isDark
          ? "bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-700 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-xs border-purple-400/30 hover:brightness-105"
          : "bg-gradient-to-r from-purple-700 via-purple-600 to-fuchsia-700 hover:from-purple-600 hover:to-purple-700 text-white shadow-xs border-purple-500/30 hover:brightness-105"
    }
  }

  // Islamic Pattern color matching Library / KnowledgeBase exactly
  const getPatternColorClass = () => {
    if (isDark) {
      switch (accentColor) {
        case "amber":
          return "text-[#dfbf83]"
        case "emerald":
          return "text-teal-400"
        case "blue":
          return "text-blue-400"
        case "purple":
        default:
          return "text-purple-400"
      }
    }
    switch (accentColor) {
      case "amber":
        return "text-[#b88d46]"
      case "emerald":
        return "text-teal-600"
      case "blue":
        return "text-blue-600"
      case "purple":
      default:
        return "text-purple-600"
    }
  }

  // Badge pill style
  const getAccentBadgeStyle = () => {
    switch (accentColor) {
      case "emerald":
        return isDark
          ? "bg-teal-500/15 text-teal-300 border-teal-500/30"
          : "bg-teal-50 text-teal-800 border-teal-200"
      case "amber":
        return isDark
          ? "bg-[#dfbf83]/15 text-[#edd8ae] border-[#dfbf83]/30"
          : "bg-[#fcfaf5] text-[#78350f] border-[#dfbf83]/40"
      case "blue":
        return isDark
          ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
          : "bg-blue-50 text-blue-800 border-blue-200"
      case "purple":
      default:
        return isDark
          ? "bg-purple-500/15 text-purple-300 border-purple-500/30"
          : "bg-purple-50 text-purple-800 border-purple-200"
    }
  }

  // Resolve active session details for Resume Hero Card
  const latestSession = recentSessions.length > 0 ? recentSessions[0] : null

  // 1. Lesson Title (العنوان الأساسي للدرس)
  let resolvedLessonTitle =
    latestSession?.sectionTitle ||
    (chunkMeta?.hierarchy?.fasl as string) ||
    (chunkMeta?.hierarchy?.bab as string) ||
    (chunkMeta?.hierarchy?.kitab as string) ||
    (chunkTitle && !chunkTitle.includes("شرح") && !chunkTitle.includes("المغني") ? chunkTitle : null) ||
    "مسألة في أحكام الطهارة"

  // 2. Book Title (اسم الكتاب)
  let rawBookTitle =
    chunkMeta?.book_title ||
    latestSession?.bookTitle ||
    (chunkTitle && (chunkTitle.includes("شرح") || chunkTitle.includes("المغني") || chunkTitle.includes("عمدة")) ? chunkTitle : null) ||
    "شرح عمدة الفقه"

  let resolvedBookTitle = rawBookTitle
  let resolvedAuthor = chunkMeta?.author || latestSession?.author || ""

  // Parse if book title has combined "الكتاب - المؤلف - الباب" format
  if (rawBookTitle.includes(" - ")) {
    const parts = rawBookTitle.split(" - ").map((p) => p.trim())
    if (parts.length >= 1) resolvedBookTitle = parts[0]
    if (parts.length >= 2 && !resolvedAuthor) resolvedAuthor = parts[1]
    if (parts.length >= 3 && (!latestSession?.sectionTitle || resolvedLessonTitle === "مسألة في أحكام الطهارة")) {
      resolvedLessonTitle = parts.slice(2).join(" - ")
    }
  }

  // 3. Domain (اسم القسم)
  const resolvedDomain =
    chunkMeta?.domain ||
    latestSession?.domain ||
    (headerSubtitle && !headerSubtitle.includes("/") ? headerSubtitle : "فقه")

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-start overflow-y-auto overflow-x-hidden text-right selection:bg-primary/20">
      {/* Background Graphic - Clean Islamic Pattern identical to KnowledgeBase */}
      <div
        className={`fixed inset-0 z-0 pointer-events-none overflow-hidden transition-colors duration-500 ${isDark ? "bg-[#0c0e14]" : "bg-white"
          }`}
      >
        {/* Authentic Islamic Tessellation Pattern (Rub el-Hizb Girih) matching Library / KnowledgeBase */}
        <IslamicPattern
          isFixed
          opacity={isDark ? 0.07 : 0.08}
          className={`${getPatternColorClass()} pointer-events-none transition-colors duration-300`}
        />
      </div>

      {/* Hero Center Content (Top padding accounts for floating Navbar with comfortable spacing) */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-start px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 md:pt-28 pb-16 max-w-6xl mx-auto w-full text-center">
        {/* Hero Titles */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="space-y-2.5 sm:space-y-3 max-w-3xl"
        >
          <h1
            className={`font-amiri text-2xl sm:text-4xl lg:text-[46px] font-black tracking-wide leading-[1.45] inline-block pt-3 pb-2 overflow-visible bg-gradient-to-r bg-clip-text text-transparent ${getThemeTitleClass()}`}
          >
            مُدارَسة العلوم الشرعية بمساعدة الذكاء الاصطناعي
          </h1>

          <p
            className={`text-xs sm:text-sm lg:text-base leading-relaxed max-w-2xl mx-auto ${isDark
              ? "text-white/85 drop-shadow-xs"
              : "text-stone-800 font-medium"
              }`}
          >
            بيئة تفاعلية لقراءة وتحليل أمهات المتون: تفكيك المسائل، تلخيص
            القواعد، الخرائط الذهنية، واختبارات قياس الفهم والاستيعاب.
          </p>
        </motion.div>

        {/* 1. Resume Session Banner (Clean Hero Resume Card) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-4 sm:mt-5 w-full max-w-2xl"
        >
          <div
            className={`rounded-2xl border p-3.5 sm:p-4 backdrop-blur-2xl transition-all duration-300 text-right flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg ${isDark
              ? "bg-[#121622]/90 border-white/12 hover:border-white/25"
              : "bg-white/95 border-stone-200/90 shadow-[0_12px_35px_rgba(0,0,0,0.06)]"
              }`}
          >
            <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-md ${isDark
                  ? "bg-gradient-to-br from-white/10 to-white/5 border border-white/20 text-white"
                  : "bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 text-amber-900"
                  }`}
              >
                <BookOpen size={20} className="stroke-[2.2]" />
              </div>
              <div className="min-w-0 text-right">
                {/* 1. Main Headline: Lesson Title (عنوان الدرس كعنوان أساسي) */}
                <h4
                  className={`text-sm sm:text-base font-black truncate ${
                    isDark ? "text-white" : "text-stone-900"
                  }`}
                  title={resolvedLessonTitle}
                >
                  {resolvedLessonTitle}
                </h4>

                {/* 2. Subtitle: اسم الكتاب . اسم المؤلف . اسم القسم */}
                <div
                  className={`flex items-center gap-1.5 text-xs truncate mt-0.5 ${
                    isDark ? "text-white/65" : "text-stone-600"
                  }`}
                >
                  <span className="font-semibold">{resolvedBookTitle}</span>
                  {resolvedAuthor && (
                    <>
                      <span className="opacity-40">•</span>
                      <span>{resolvedAuthor}</span>
                    </>
                  )}
                  {resolvedDomain && (
                    <>
                      <span className="opacity-40">•</span>
                      <span className="text-primary font-medium">{resolvedDomain}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (latestSession && onSelectSession) {
                  onSelectSession(latestSession)
                } else {
                  onEnterWorkspace()
                }
              }}
              className={`shrink-0 w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 active:scale-95 cursor-pointer border ${getPrimaryBtnClass()}`}
            >
              <span>متابعة المدارسة الآن</span>
              <ArrowLeft
                size={16}
                className="transition-transform group-hover:-translate-x-1"
              />
            </button>
          </div>
        </motion.div>

        {/* 2. Recent Sessions (بحد أقصى 3 جلسات) */}
        {recentSessions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="mt-6 w-full max-w-5xl text-right"
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-amber-500" />
                <h3
                  className={`text-sm sm:text-base font-black ${isDark ? "text-white" : "text-stone-900"
                    }`}
                >
                  أحدث جلسات المدارسة
                </h3>
              </div>

              {onOpenHistory && (
                <button
                  type="button"
                  onClick={onOpenHistory}
                  className={`text-xs font-bold transition-colors hover:underline inline-flex items-center gap-1 ${isDark ? "text-white/60 hover:text-white" : "text-stone-600 hover:text-stone-900"
                    }`}
                >
                  <span>عرض السجل كاملاً</span>
                  <ChevronLeft size={13} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {recentSessions.slice(0, 3).map((sess, idx) => {
                const bTitle = sess.bookTitle || sess.chunkTitle || "درس من التراث"
                const sTitle = sess.sectionTitle || sess.hierarchy?.kitab || "فصل مدارسة"
                const dateLabel = sess.lastAccessedAt || sess.createdAt
                  ? new Date(sess.lastAccessedAt || sess.createdAt).toLocaleDateString("ar-EG", {
                    day: "numeric",
                    month: "short",
                  })
                  : "مؤخراً"

                return (
                  <div
                    key={sess.id || sess.chunkId || idx}
                    onClick={() => {
                      if (onSelectSession) {
                        onSelectSession(sess)
                      } else {
                        onEnterWorkspace()
                      }
                    }}
                    className={`group rounded-2xl border p-3.5 text-right transition-all duration-300 hover:-translate-y-1 cursor-pointer backdrop-blur-xl flex flex-col justify-between ${isDark
                      ? "bg-[#121622]/80 border-white/10 hover:border-white/20 hover:bg-[#181d2c]"
                      : "bg-white/80 border-stone-200/90 hover:border-stone-300 hover:bg-white shadow-xs"
                      }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border truncate max-w-[140px] ${getAccentBadgeStyle()}`}
                        >
                          {sess.domain || "علوم شرعية"}
                        </span>
                        <span
                          className={`text-[10.5px] ${isDark ? "text-white/40" : "text-stone-400"
                            }`}
                        >
                          {dateLabel}
                        </span>
                      </div>

                      <h4
                        className={`text-xs sm:text-sm font-black truncate group-hover:text-primary transition-colors ${isDark ? "text-white" : "text-stone-900"
                          }`}
                      >
                        {bTitle}
                      </h4>
                      <p
                        className={`text-[11.5px] truncate mt-0.5 ${isDark ? "text-white/65" : "text-stone-600"
                          }`}
                      >
                        {sTitle}
                      </p>
                    </div>

                    <div className="pt-2.5 mt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
                      <span
                        className={`text-[11px] font-bold ${isDark ? "text-white/50" : "text-stone-500"
                          }`}
                      >
                        استئناف المدارسة
                      </span>
                      <ArrowLeft
                        size={13}
                        className="transition-transform group-hover:-translate-x-1 text-primary"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* 3. Suggested Foundational Mutun (اقتراحات أمهات الكتب للمدارسة) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-7 w-full max-w-5xl text-right"
        >
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <Compass size={16} className="text-amber-500" />
              <h3
                className={`text-sm sm:text-base font-black ${isDark ? "text-white" : "text-stone-900"
                  }`}
              >
                كتب مقترحة للمُدارسة
              </h3>
            </div>
            {onOpenBookSelector && (
              <button
                type="button"
                onClick={onOpenBookSelector}
                className={`text-xs font-bold transition-colors hover:underline inline-flex items-center gap-1 ${isDark ? "text-white/60 hover:text-white" : "text-stone-600 hover:text-stone-900"
                  }`}
              >
                <span>تصفح كافة المتون</span>
                <ChevronLeft size={13} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {SUGGESTED_BOOKS.map((book) => (
              <div
                key={book.title}
                onClick={onOpenBookSelector || onEnterWorkspace}
                className={`group rounded-2xl border p-3.5 text-right transition-all duration-300 hover:-translate-y-1 cursor-pointer backdrop-blur-xl flex flex-col justify-between ${isDark
                  ? "bg-[#121622]/80 border-white/10 hover:border-white/20 hover:bg-[#181d2c]"
                  : "bg-white/80 border-stone-200/90 hover:border-stone-300 hover:bg-white shadow-xs"
                  }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getAccentBadgeStyle()}`}
                    >
                      {book.tag}
                    </span>
                    <Bookmark
                      size={14}
                      className={isDark ? "text-white/30 group-hover:text-amber-400 transition-colors" : "text-stone-300 group-hover:text-amber-500 transition-colors"}
                    />
                  </div>

                  <h4
                    className={`text-xs sm:text-sm font-black truncate group-hover:text-primary transition-colors ${isDark ? "text-white" : "text-stone-900"
                      }`}
                  >
                    {book.title}
                  </h4>
                  <p
                    className={`text-[10.5px] truncate font-medium mt-0.5 ${isDark ? "text-white/60" : "text-stone-500"
                      }`}
                  >
                    {book.author}
                  </p>
                  <p
                    className={`text-[11px] leading-relaxed line-clamp-2 mt-1.5 ${isDark ? "text-white/70" : "text-stone-600"
                      }`}
                  >
                    {book.desc}
                  </p>
                </div>

                <div className="pt-2.5 mt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <span
                    className={`text-[11px] font-bold ${isDark ? "text-white/50" : "text-stone-500"
                      }`}
                  >
                    بدء المدارسة
                  </span>
                  <ArrowLeft
                    size={13}
                    className="transition-transform group-hover:-translate-x-1 text-primary"
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 4. Community Hub: التشجيرات والاختبارات المنشورة في الصفحة الرئيسية للمدارسة */}
        <div className="mt-8 w-full max-w-5xl">
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
    </div>
  )
}
