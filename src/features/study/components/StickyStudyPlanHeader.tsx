import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Circle, MessageCircle, ChevronDown, ChevronUp, Check, Clock, X, Sparkles, ListOrdered, Loader2 } from 'lucide-react'
import { studyPlanManager, type SessionPlanProgress } from '../utils/studyPlanManager'
import whiteLogo from '@/assets/images/WhiteLogo.png'
import darkLogo from '@/assets/images/ZadDarkLogo.png'

interface UnifiedStudyChatHeaderProps {
  keyId?: number | string | null
  isDark?: boolean
  loading?: boolean
  onClose?: () => void
  onStepComplete?: (stepId: number) => void
}

export function StickyStudyPlanHeader({
  keyId,
  isDark = true,
  loading = false,
  onClose,
  onStepComplete
}: UnifiedStudyChatHeaderProps) {
  const [progress, setProgress] = useState<SessionPlanProgress | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)

  const reloadProgress = () => {
    if (!keyId) {
      setProgress(null)
      setIsExpanded(false)
      return
    }
    const data = studyPlanManager.getSessionProgress(keyId)
    setProgress(data)
    if (!data || data.totalSteps === 0) {
      setIsExpanded(false)
    }
  }

  // Click outside handler to auto-close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setIsExpanded(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setIsExpanded(false)
    reloadProgress()
    const handleStorageChange = () => reloadProgress()
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('zad_plan_updated', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('zad_plan_updated', handleStorageChange)
    }
  }, [keyId])

  const hasPlan = keyId && progress && progress.totalSteps > 0
  const pct = hasPlan ? Math.round((progress.completedSteps / progress.totalSteps) * 100) : 0
  const isCompleted100 = pct === 100
  const nextUncompletedStep = hasPlan ? progress.steps.find(s => !s.isCompleted) : null

  const handleAdvanceCurrentStep = () => {
    if (loading || !keyId || !nextUncompletedStep) return
    const updated = studyPlanManager.markStepCompleted(keyId, nextUncompletedStep.id, true)
    if (updated) {
      setProgress({ ...updated })
      if (onStepComplete) {
        onStepComplete(nextUncompletedStep.id)
      }
    }
  }

  return (
    <div
      ref={headerRef}
      className={`sticky top-0 z-30 w-full border-b backdrop-blur-2xl transition-all ${isDark
        ? isCompleted100
          ? 'bg-[#0f1d24]/95 border-emerald-500/40 text-white shadow-lg shadow-emerald-950/40'
          : 'bg-[#12041f]/90 border-white/10 text-white shadow-md'
        : isCompleted100
          ? 'bg-[#ECFDF5]/95 border-emerald-200 text-emerald-950 shadow-sm'
          : 'bg-white/95 border-purple-100/80 text-slate-800 shadow-sm'
        }`}
    >
      {/* Single Merged Bar */}
      <div className="flex items-center justify-between px-4 py-3.5 min-h-[54px]">
        {/* Right Section: Logo/Title + Progress Pill */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 text-sm font-black shrink-0">
            <MessageCircle size={18} className="text-purple-500 shrink-0 stroke-[2.2]" />
            <span className={`font-extrabold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>زاد</span>
          </div>

          {hasPlan && (
            <div className={`flex items-center gap-2 min-w-0 border-r pr-3 ${isDark ? 'border-white/15' : 'border-slate-200'}`}>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border shrink-0 flex items-center gap-1 ${isCompleted100
                ? isDark
                  ? 'text-emerald-300 bg-emerald-500/25 border-emerald-400/50 shadow-[0_0_12px_rgba(16,185,129,0.3)] animate-pulse'
                  : 'text-emerald-800 bg-emerald-100 border-emerald-300 shadow-sm animate-pulse'
                : isDark
                  ? 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30'
                  : 'text-emerald-800 bg-emerald-50 border-emerald-200'
                }`}>
                {isCompleted100 && <Sparkles size={11} />}
                {pct}%
              </span>
              {nextUncompletedStep ? (
                <span className={`text-[11px] font-bold truncate max-w-[130px] sm:max-w-[200px] ${isDark ? 'text-sky-200' : 'text-slate-700'}`}>
                  {nextUncompletedStep.title}
                </span>
              ) : (
                <span className={`text-[11px] font-bold truncate ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                  مكتمل 🗸
                </span>
              )}
            </div>
          )}
        </div>

        {/* Left Section: Action Button + Sleek Plan Trigger Button + Close */}
        <div className="flex items-center gap-2 shrink-0">
          {hasPlan && nextUncompletedStep && (
            <button
              disabled={loading}
              onClick={handleAdvanceCurrentStep}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black transition-all ${loading
                ? isDark
                  ? 'bg-white/10 text-white/40 border border-white/10 cursor-not-allowed opacity-70 shadow-none'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-70 shadow-none'
                : 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:brightness-110 shadow-md hover:scale-105 cursor-pointer'
                }`}
            >
              {loading ? <Loader2 size={13} className="animate-spin text-emerald-400" /> : <Check size={13} />}
              <span className="hidden sm:inline">
                {loading ? 'جاري الشرح...' : 'فهمت هذه النقطة ✔'}
              </span>
            </button>
          )}

          {/* Dedicated Glass Button to Toggle Plan Steps */}
          {hasPlan && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border transition-all text-xs font-bold cursor-pointer shadow-sm ${isExpanded
                ? isDark
                  ? 'bg-sky-500/20 border-sky-400/60 text-sky-200 ring-1 ring-sky-400/30'
                  : 'bg-sky-100 border-sky-300 text-sky-800 ring-1 ring-sky-300/40'
                : isDark
                  ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80 hover:text-white'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 hover:text-slate-900'
                }`}
              title="عرض خطة الدرس"
            >
              <ListOrdered size={14} className={isExpanded ? (isDark ? 'text-sky-300' : 'text-sky-600') : (isDark ? 'text-white/60' : 'text-slate-500')} />
              <span className="text-[11px]">المحاور</span>
              {isExpanded ? <ChevronUp size={13} className={isDark ? 'text-sky-300' : 'text-sky-600'} /> : <ChevronDown size={13} className={isDark ? 'text-white/60' : 'text-slate-500'} />}
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${isDark ? 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700'
                }`}
              title="إغلاق التاب"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Embedded Progress Line Indicator at bottom border of header */}
      {hasPlan && (
        <div className={`h-1 w-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-200/80'}`}>
          <div
            className={`h-full transition-all duration-500 shadow-md ${isCompleted100
              ? 'bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 shadow-emerald-400/50'
              : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-300'
              }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {/* Standalone Floating Glass Popover Menu Aligned Under Trigger Button */}
      {hasPlan && (
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.18 }}
              className={`absolute top-[100%] left-3 sm:left-4 right-auto w-[calc(100%-1.5rem)] sm:w-[420px] max-w-[calc(100vw-2rem)] z-50 mt-2 p-3.5 space-y-2.5 rounded-2xl backdrop-blur-2xl border max-h-80 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${isDark
                ? 'bg-[#0d041c]/95 border-sky-500/30 shadow-2xl shadow-purple-950/90 ring-1 ring-white/10 text-white'
                : 'bg-white/98 border-slate-200 shadow-xl ring-1 ring-slate-200/60 text-slate-900'
                }`}
            >
              <div className={`text-[11px] font-black border-b pb-2 px-1 flex items-center justify-between ${isDark ? 'text-sky-300 border-white/10' : 'text-sky-700 border-slate-100'
                }`}>
                <span className="flex items-center gap-1.5">
                  <ListOrdered size={14} />
                  محاور خطة الدرس
                </span>
              </div>

              {progress.steps.map((step) => {
                const isCurrent = nextUncompletedStep?.id === step.id

                return (
                  <div
                    key={step.id}
                    className={`flex items-start justify-between gap-3 p-2.5 px-3 rounded-xl border select-none transition-all ${step.isCompleted
                      ? isDark
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                        : 'border-emerald-300 bg-emerald-50 text-emerald-900'
                      : isCurrent
                        ? isDark
                          ? 'border-sky-400/60 bg-sky-500/15 text-sky-100 ring-1 ring-sky-400/30'
                          : 'border-sky-300 bg-sky-50 text-sky-900 ring-1 ring-sky-300/40'
                        : isDark
                          ? 'border-white/5 bg-transparent text-white/50'
                          : 'border-slate-100 bg-transparent text-slate-500'
                      }`}
                  >
                    {/* Step Icon + Full Title Text (No truncation, multiline ready) */}
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      {step.isCompleted ? (
                        <CheckCircle2 size={16} className={isDark ? 'text-emerald-400 shrink-0 mt-0.5' : 'text-emerald-600 shrink-0 mt-0.5'} />
                      ) : isCurrent ? (
                        <Clock size={16} className={isDark ? 'text-sky-400 shrink-0 animate-pulse mt-0.5' : 'text-sky-600 shrink-0 animate-pulse mt-0.5'} />
                      ) : (
                        <Circle size={16} className={isDark ? 'text-white/30 shrink-0 mt-0.5' : 'text-slate-300 shrink-0 mt-0.5'} />
                      )}
                      <span className={`text-xs font-bold leading-relaxed text-wrap break-words ${step.isCompleted ? 'line-through opacity-80' : ''}`}>
                        {step.id}. {step.title.replace(/^[0-9]+[\.\-\)]\s*/, '')}
                      </span>
                    </div>

                    {/* Clean Pinned Status Badge */}
                    <div className="shrink-0 pt-0.5">
                      {step.isCompleted && (
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border inline-block ${isDark ? 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' : 'text-emerald-700 bg-emerald-100 border-emerald-300'
                          }`}>
                          مستوعبة 🗸
                        </span>
                      )}
                      {isCurrent && (
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border inline-block ${isDark ? 'text-sky-300 bg-sky-500/20 border-sky-500/30' : 'text-sky-800 bg-sky-100 border-sky-300'
                          }`}>
                          المحور الحالي ⏳
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}
