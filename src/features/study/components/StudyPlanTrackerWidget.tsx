import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Circle, ListOrdered, ChevronDown, ChevronUp, Sparkles, Check, PlusCircle } from 'lucide-react'
import { studyPlanManager, type SessionPlanProgress } from '../utils/studyPlanManager'

interface StudyPlanTrackerWidgetProps {
  sessionId?: number | string | null
  chunkTitle?: string
  isDark?: boolean
  onStepComplete?: (stepId: number) => void
}

export function StudyPlanTrackerWidget({
  sessionId,
  chunkTitle,
  isDark = true,
  onStepComplete
}: StudyPlanTrackerWidgetProps) {
  const effectiveSessionId = sessionId || 'current_session'
  const [progress, setProgress] = useState<SessionPlanProgress | null>(null)
  const [isExpanded, setIsExpanded] = useState(true)

  const reloadProgress = () => {
    const data = studyPlanManager.getSessionProgress(effectiveSessionId)
    setProgress(data)
  }

  useEffect(() => {
    reloadProgress()
    const handleStorageChange = () => reloadProgress()
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [effectiveSessionId])

  const handleCreateDefaultPlan = () => {
    const defaultSteps = [
      'المدخل والمفهوم الأكاديمي للدرس',
      'الأدلة الشرعية والتأصيل الأصولي',
      'التطبيقات المسائلية والفروق الفقهية'
    ]
    const newProg = studyPlanManager.saveSessionPlan(effectiveSessionId, defaultSteps, undefined, chunkTitle)
    setProgress(newProg)
  }

  if (!progress || progress.totalSteps === 0) {
    return (
      <div className={`relative rounded-2xl border p-3.5 px-4 mb-4 transition-all shadow-md backdrop-blur-xl ${
        isDark
          ? 'bg-[#0e1a38]/80 border-sky-500/30 text-white'
          : 'bg-sky-50/80 border-sky-200 text-slate-900'
      }`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Sparkles size={16} />
            </div>
            <div>
              <h4 className="text-xs font-black text-sky-200">خطة المذاكرة التفاعلية</h4>
              <p className="text-[10px] text-white/60">تتبع محاور الدرس واستيعابك خطوة بخطوة</p>
            </div>
          </div>

          <button
            onClick={handleCreateDefaultPlan}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 text-slate-950 hover:scale-105 transition-all text-xs font-black shadow-md shadow-sky-500/20"
          >
            <PlusCircle size={14} />
            <span>إنشاء خطة الدرس ⚡</span>
          </button>
        </div>
      </div>
    )
  }

  const pct = Math.round((progress.completedSteps / progress.totalSteps) * 100)
  const nextUncompletedStep = progress.steps.find(s => !s.isCompleted)

  const handleToggleStep = (stepId: number) => {
    const isCompletedNow = !progress.steps.find(s => s.id === stepId)?.isCompleted
    const updated = studyPlanManager.markStepCompleted(effectiveSessionId, stepId, isCompletedNow)
    if (updated) {
      setProgress({ ...updated })
      if (isCompletedNow && onStepComplete) {
        onStepComplete(stepId)
      }
    }
  }

  return (
    <div className={`relative rounded-2xl border transition-all shadow-xl backdrop-blur-xl mb-4 ${
      isDark
        ? 'bg-[#0e1a38]/90 border-sky-500/30 text-white shadow-sky-950/40'
        : 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-200'
    }`}>
      {/* Header Bar */}
      <div className="flex items-center justify-between p-3.5 px-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-cyan-400 text-slate-950 shadow-md">
            <ListOrdered size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-black text-sky-200">خطة مذاكرة الدرس</h4>
              <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                {pct}% مكتمل ({progress.completedSteps}/{progress.totalSteps})
              </span>
            </div>
            {nextUncompletedStep && (
              <p className="text-[11px] text-white/70 truncate max-w-xs mt-0.5">
                النقطة الحالية: <span className="font-bold text-sky-300">{nextUncompletedStep.title}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Action Button for next uncompleted step */}
          {nextUncompletedStep && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleToggleStep(nextUncompletedStep.id)
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500 hover:text-slate-950 transition-all text-xs font-black shadow-md hover:scale-105"
            >
              <Check size={14} />
              <span>فهمت هذه النقطة ✔</span>
            </button>
          )}

          <button className="p-1 text-white/60 hover:text-white transition-colors">
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {/* Progress Bar Line */}
      <div className="h-1.5 w-full bg-white/10 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-300 transition-all duration-500 shadow-md"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Collapsible Steps List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-white/10 p-3.5 space-y-2 bg-black/20"
          >
            {progress.steps.map((step) => (
              <div
                key={step.id}
                onClick={() => handleToggleStep(step.id)}
                className={`flex items-center justify-between p-2.5 px-3 rounded-xl border cursor-pointer transition-all ${
                  step.isCompleted
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                    : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:border-sky-400/40'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {step.isCompleted ? (
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  ) : (
                    <Circle size={16} className="text-white/40 shrink-0" />
                  )}
                  <span className={`text-xs font-bold ${step.isCompleted ? 'line-through opacity-80' : ''}`}>
                    {step.id}. {step.title.replace(/^[0-9]+[\.\-\)]\s*/, '')}
                  </span>
                </div>

                {step.isCompleted && (
                  <span className="text-[9px] font-extrabold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    مستوعبة 🗸
                  </span>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
