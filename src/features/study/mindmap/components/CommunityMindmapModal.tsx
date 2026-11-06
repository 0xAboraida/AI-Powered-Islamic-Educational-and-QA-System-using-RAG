import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, BookOpen, User, Calendar, Brain, ArrowRight } from 'lucide-react'
import { VisualMindmap } from './VisualMindmap'
import { CommunityMindmapItem } from '../../components/StudyHeroCommunity'
import { MindmapNode } from '../../../../contexts/StudyContext'

interface CommunityMindmapModalProps {
  isOpen: boolean
  mindmap: CommunityMindmapItem | null
  isDark: boolean
  onClose: () => void
  onStartStudyLesson: (mindmap: CommunityMindmapItem) => void
}

export function CommunityMindmapModal({
  isOpen,
  mindmap,
  isDark,
  onClose,
  onStartStudyLesson
}: CommunityMindmapModalProps) {
  const [mindmapViewMode, setMindmapViewMode] = useState<any>('visual')

  const parsedNodes: MindmapNode[] = useMemo(() => {
    if (!mindmap || !mindmap.treeData) return []
    let data = mindmap.treeData
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data)
      } catch {
        return []
      }
    }
    if (Array.isArray(data)) return data
    if (typeof data === 'object') return [data]
    return []
  }, [mindmap])

  if (!isOpen || !mindmap) return null

  const formattedDate = mindmap.createdAt
    ? new Date(mindmap.createdAt).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })
    : 'حديثاً'

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6" dir="rtl">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Modal Window Frame */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className={`relative w-full max-w-7xl h-[92vh] max-h-[92vh] flex flex-col rounded-2xl md:rounded-3xl border shadow-2xl overflow-hidden z-10 ${
            isDark
              ? 'bg-[#0f0418]/95 border-amber-500/30 text-white shadow-purple-950/50'
              : 'bg-white/95 border-amber-300 text-slate-900 shadow-xl'
          }`}
          style={{ backdropFilter: 'blur(20px)' }}
        >
          {/* Header Bar */}
          <div
            className={`flex items-center justify-between px-4 sm:px-6 py-3 border-b flex-wrap gap-3 ${
              isDark ? 'border-white/10 bg-black/40' : 'border-slate-200 bg-slate-50/90'
            }`}
          >
            {/* Title & Meta Info */}
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md flex-shrink-0 ${
                  isDark ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-amber-100 text-amber-800'
                }`}
              >
                <Brain size={22} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black flex items-center gap-2">
                  <span>{mindmap.title || 'خريطة مفاهيم الدرس'}</span>
                </h3>
                <div className="flex items-center gap-2 text-[11px] font-semibold mt-0.5 flex-wrap opacity-80">
                  {mindmap.bookTitle && (
                    <span className="flex items-center gap-1">
                      <BookOpen size={12} className="text-amber-500" />
                      <span>{mindmap.bookTitle}</span>
                    </span>
                  )}
                  {mindmap.authorName && (
                    <span className="flex items-center gap-1 border-r border-current/20 pr-2">
                      <User size={12} className="text-amber-500" />
                      <span>{mindmap.authorName}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1 border-r border-current/20 pr-2">
                    <Calendar size={12} />
                    <span>{formattedDate}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Actions: Start Study & Close */}
            <div className="flex items-center gap-2.5 mr-auto">
              {/* Go to study lesson button */}
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onStartStudyLesson(mindmap)
                }}
                className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer shadow-md bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white active:scale-95"
              >
                <BookOpen size={15} />
                <span>الذهاب لمدارسة هذا الدرس</span>
                <ArrowRight size={14} className="rotate-180" />
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  isDark
                    ? 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-white/10'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
                title="إغلاق والعودة للمجتمع"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Visual Mindmap Frame: Exact same tools, toolbar, zoom, canvas */}
          <div className="flex-1 w-full h-full relative overflow-hidden">
            {parsedNodes.length > 0 ? (
              <VisualMindmap
                data={parsedNodes}
                mindmapViewMode={mindmapViewMode}
                setMindmapViewMode={setMindmapViewMode}
                onBack={onClose}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
                <Brain size={48} className="text-amber-500/50 animate-pulse" />
                <p className="text-sm font-bold opacity-70">تعذر تحميل بيانات الشجرة لهذه الخريطة</p>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30"
                >
                  العودة للمجتمع
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

