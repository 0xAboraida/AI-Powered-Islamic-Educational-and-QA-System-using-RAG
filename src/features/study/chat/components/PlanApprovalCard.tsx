import { motion } from 'framer-motion'
import { Rocket, CheckCircle } from 'lucide-react'
import { studyPlanManager } from '../../utils/studyPlanManager'

interface PlanApprovalCardProps {
  keyId: number | string
  extractedSteps: string[]
  isDark?: boolean
  onApprovePlan: (firstStepTitle: string) => void
}

export function PlanApprovalCard({
  keyId,
  extractedSteps,
  isDark = true,
  onApprovePlan
}: PlanApprovalCardProps) {
  if (!extractedSteps || extractedSteps.length === 0) return null

  // Check if plan is already active
  const existing = studyPlanManager.getSessionProgress(keyId)
  if (existing && existing.totalSteps > 0) return null

  const handleConfirm = () => {
    studyPlanManager.saveSessionPlan(keyId, extractedSteps)
    const firstStep = extractedSteps[0] || 'المحور الأول'
    onApprovePlan(firstStep)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`my-2.5 p-3 sm:p-3.5 rounded-xl border backdrop-blur-xl shadow-md max-w-lg mx-auto ${
        isDark
          ? 'bg-gradient-to-b from-sky-950/80 to-slate-900/90 border-sky-500/30 text-white shadow-sky-950/30'
          : 'bg-sky-50/90 border-sky-200 text-slate-900'
      }`}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <CheckCircle size={16} className={isDark ? 'text-sky-400' : 'text-sky-600'} />
        <h4 className={`text-xs font-black ${isDark ? 'text-sky-200' : 'text-sky-950'}`}>الخطة التفاعلية جاهزة للاعتماد ({extractedSteps.length} محاور)</h4>
      </div>
      <p className={`text-[11px] mb-2.5 leading-relaxed ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
        عند موافقتك، سيتم تفعيل شريط التقدم المثبت أعلى الشات والبدء بشرح المحور الأول فوراً.
      </p>

      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleConfirm}
        className="flex items-center justify-center gap-2 w-full py-2 px-3.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs shadow-md hover:shadow-emerald-500/20 cursor-pointer transition-all"
      >
        <Rocket size={15} />
        <span>اعتمد الخطة وابدأ في شرح المحور الأول</span>
      </motion.button>
    </motion.div>
  )
}
