import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { BookOpen } from "lucide-react"
import { StudySidebar } from "./StudySidebar"
import { StudyDocument } from "../document/StudyDocument"
import { StudyChatPanel } from "../../chat"
import { StudyMindmapPanel } from "../../mindmap"
import { StudyQuizPanel } from "../../quiz"
import { PanelResizer } from "./PanelResizer"
import { PanelErrorBoundary } from "@/components/common/PanelErrorBoundary"
import type { TreeNode, MindmapNode, Question } from "../../../../contexts/StudyContext"
import type { QuizFlowState } from "../../quiz/types"
import type { ChatMessage } from "../../hooks/useStudyChatTutor"
import type {
  BookTrackDefinition,
  TrackRecordingItem,
  TrackSidebarDisplayMode,
} from "../../tracks"

export interface StudyWorkspacePanelsProps {
  workspaceRef: React.RefObject<HTMLDivElement | null>
  isDark: boolean
  isMobile: boolean
  isResizing: boolean
  openPanelNames: string[]
  areAllPanelsClosed: boolean
  startResizingPanel: (
    panel: "sidebar" | "document" | "chat" | "mindmap" | "quiz",
    e: React.MouseEvent,
  ) => void

  // Sidebar
  isSidebarOpen: boolean
  setIsSidebarOpen: (open: boolean) => void
  sidebarWidth: number
  searchQuery: string
  setSearchQuery: (query: string) => void
  deferredSearchQuery: string
  treeLoading: boolean
  filteredTreeData: TreeNode[]
  handleLoadBookTree: (node: TreeNode) => Promise<any>
  librarySource: "turath" | "mongo"
  activeTrack?: BookTrackDefinition | null
  trackDisplayMode?: TrackSidebarDisplayMode
  onChangeTrackDisplayMode?: (mode: TrackSidebarDisplayMode) => void
  trackCompletedRecordingIds?: string[]
  onOpenTrackRecording?: (rec: TrackRecordingItem) => void
  onExitTrack?: () => void

  // Common Chunk
  currentChunkId: string | null
  chunkTitle: string
  headerSubtitle: string
  chunkMeta: any
  chunkText: string
  isChunkLoading: boolean
  chunkLoadError?: string | null
  onRetryChunkLoad?: () => void
  handleChunkSelect: (chunkId: string, title: string, fullPath: string, node?: TreeNode) => void

  // Document
  isDocumentOpen: boolean
  setIsDocumentOpen: (open: boolean) => void
  documentWidth: number
  handleTurathPageChange: (direction: "next" | "prev", headerSubtitle: string) => void

  // Chat
  isChatOpen: boolean
  setIsChatOpen: (open: boolean) => void
  chatWidth: number
  messages: ChatMessage[]
  chatLoading: boolean
  chatEndRef: React.RefObject<HTMLDivElement | null>
  input: string
  setInput: (input: string) => void
  handleSend: () => void
  activeSessionId: number | null
  handleSelectStartOption: (optionKey: "plan" | "summary" | "chat") => Promise<void>
  pendingPlanSteps: string[]
  handleApprovePlan: (firstStepTitle: string) => Promise<void>
  handleStepComplete: (stepIndex: number) => Promise<void>

  // Mindmap
  isMindmapOpen: boolean
  setIsMindmapOpen: (open: boolean) => void
  mindmapWidth: number
  mindmapData: MindmapNode[] | null
  mindmapLoading: boolean
  handleGenerateMindmap: () => Promise<void>

  // Quiz
  isQuizOpen: boolean
  setIsQuizOpen: (open: boolean) => void
  quizWidth: number
  quizQuestions: Question[] | null
  setQuizQuestions: (q: Question[] | null) => void
  quizLoading: boolean
  selectedAnswers: Record<number, number>
  setSelectedAnswers: React.Dispatch<React.SetStateAction<Record<number, number>>>
  handleDiscussQuestion: (q: Question, wrongOpt: string) => Promise<void>
  handleGenerateQuiz: (options?: any) => Promise<void>
  handleOpenQuizSetup: () => void
  quizFlowState: QuizFlowState
  setQuizFlowState: React.Dispatch<React.SetStateAction<QuizFlowState>>
  activeQuizId: number | null
  handleLoadQuiz: (quizDto: any) => Promise<void>
}

export function StudyWorkspacePanels({
  workspaceRef,
  isDark,
  isMobile,
  isResizing,
  openPanelNames,
  areAllPanelsClosed,
  startResizingPanel,

  isSidebarOpen,
  setIsSidebarOpen,
  sidebarWidth,
  searchQuery,
  setSearchQuery,
  deferredSearchQuery,
  treeLoading,
  filteredTreeData,
  handleLoadBookTree,
  librarySource,
  activeTrack = null,
  trackDisplayMode = "index",
  onChangeTrackDisplayMode,
  trackCompletedRecordingIds = [],
  onOpenTrackRecording,
  onExitTrack,

  currentChunkId,
  chunkTitle,
  headerSubtitle,
  chunkMeta,
  chunkText,
  isChunkLoading,
  chunkLoadError,
  onRetryChunkLoad,
  handleChunkSelect,

  isDocumentOpen,
  setIsDocumentOpen,
  documentWidth,
  handleTurathPageChange,

  isChatOpen,
  setIsChatOpen,
  chatWidth,
  messages,
  chatLoading,
  chatEndRef,
  input,
  setInput,
  handleSend,
  activeSessionId,
  handleSelectStartOption,
  pendingPlanSteps,
  handleApprovePlan,
  handleStepComplete,

  isMindmapOpen,
  setIsMindmapOpen,
  mindmapWidth,
  mindmapData,
  mindmapLoading,
  handleGenerateMindmap,

  isQuizOpen,
  setIsQuizOpen,
  quizWidth,
  quizQuestions,
  setQuizQuestions,
  quizLoading,
  selectedAnswers,
  setSelectedAnswers,
  handleDiscussQuestion,
  handleGenerateQuiz,
  handleOpenQuizSetup,
  quizFlowState,
  setQuizFlowState,
  activeQuizId,
  handleLoadQuiz,
}: StudyWorkspacePanelsProps) {
  return (
    <div
      ref={workspaceRef as any}
      className="relative flex flex-1 overflow-x-auto min-w-0 scroll-smooth h-full"
    >
      {areAllPanelsClosed ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center p-8 my-auto animate-in fade-in duration-300">
          <div
            className={`h-20 w-20 rounded-full flex items-center justify-center mb-4 transition-all shadow-xl ${
              isDark
                ? "bg-[#a855f7]/15 border border-[#a855f7]/30 shadow-[0_0_30px_rgba(168,85,247,0.2)]"
                : "bg-purple-100/80 border border-purple-200/90 shadow-lg shadow-purple-500/10"
            }`}
          >
            <BookOpen
              size={32}
              className={isDark ? "text-[#c084fc]" : "text-purple-700"}
            />
          </div>

          <h2
            className={`text-2xl font-bold mb-2 tracking-wide ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            جميع التبويبات مغلقة
          </h2>

          <p
            className={`text-sm leading-relaxed max-w-md ${
              isDark ? "text-white/70" : "text-slate-600 font-medium"
            }`}
          >
            اضغط على أي زر من التبويبات الخمسة بالأعلى لفتح الفهرس، النص الأصلي،
            المحادثة، الخريطة، أو التقييم.
          </p>
        </div>
      ) : (
        <AnimatePresence initial={false}>
          {/* Panel 1: الفهرس */}
          {isSidebarOpen && (
            <>
              <motion.div
                id="panel-sidebar"
                key="sidebar-panel"
                initial={{ opacity: 0, width: 0 }}
                animate={{
                  opacity: 1,
                  width:
                    isMobile || openPanelNames.length === 1
                      ? "100%"
                      : sidebarWidth,
                }}
                exit={{ opacity: 0, width: 0 }}
                transition={
                  isResizing
                    ? { duration: 0 }
                    : { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
                }
                className={`h-full flex overflow-hidden ${
                  isMobile || openPanelNames.length === 1
                    ? "flex-1 w-full min-w-full"
                    : "shrink-0"
                }`}
              >
                <StudySidebar
                  isSidebarOpen={isSidebarOpen}
                  sidebarWidth={
                    isMobile || openPanelNames.length === 1
                      ? undefined
                      : sidebarWidth
                  }
                  setIsSidebarOpen={setIsSidebarOpen}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  deferredSearchQuery={deferredSearchQuery}
                  treeLoading={treeLoading}
                  filteredTreeData={filteredTreeData}
                  currentChunkId={currentChunkId}
                  handleChunkSelect={handleChunkSelect}
                  startResizingSidebar={() => {}}
                  isDark={isDark}
                  onLoadBookTree={handleLoadBookTree}
                  librarySource={librarySource}
                  activeTrack={activeTrack}
                  trackDisplayMode={trackDisplayMode}
                  onChangeTrackDisplayMode={onChangeTrackDisplayMode}
                  trackCompletedRecordingIds={trackCompletedRecordingIds}
                  onOpenTrackRecording={onOpenTrackRecording}
                  onExitTrack={onExitTrack}
                />
              </motion.div>

              {openPanelNames.length > 1 && !isMobile && (
                <PanelResizer
                  onMouseDown={(e) => startResizingPanel("sidebar", e)}
                  isDark={isDark}
                  label="سحب لتغيير عرض الفهرس"
                />
              )}
            </>
          )}

          {/* Panel 2: النص الأصلي */}
          {isDocumentOpen && (
            <>
              <motion.div
                id="panel-document"
                key="document-panel"
                initial={{ opacity: 0, width: 0 }}
                animate={{
                  opacity: 1,
                  width:
                    isMobile || openPanelNames.length === 1
                      ? "100%"
                      : documentWidth,
                }}
                exit={{ opacity: 0, width: 0 }}
                transition={
                  isResizing
                    ? { duration: 0 }
                    : { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
                }
                className={`h-full flex overflow-hidden ${
                  isMobile || openPanelNames.length === 1
                    ? "flex-1 w-full min-w-full"
                    : "shrink-0"
                }`}
              >
                <StudyDocument
                  isDocumentOpen={isDocumentOpen}
                  documentWidth={
                    isMobile || openPanelNames.length === 1
                      ? undefined
                      : documentWidth
                  }
                  setIsDocumentOpen={setIsDocumentOpen}
                  currentChunkId={currentChunkId}
                  chunkMeta={chunkMeta}
                  chunkText={chunkText}
                  loading={isChunkLoading}
                  mindmapLoading={mindmapLoading}
                  quizLoading={quizLoading}
                  handleGenerateMindmap={handleGenerateMindmap}
                  handleGenerateQuiz={handleOpenQuizSetup}
                  startResizingDocument={() => {}}
                  isDark={isDark}
                  onPageChange={(direction) =>
                    handleTurathPageChange(direction, headerSubtitle)
                  }
                  chunkLoadError={chunkLoadError}
                  onRetryLoad={onRetryChunkLoad}
                />
              </motion.div>

              {openPanelNames.length > 1 && !isMobile && (
                <PanelResizer
                  onMouseDown={(e) => startResizingPanel("document", e)}
                  isDark={isDark}
                  label="سحب لتغيير عرض النص الأصلي"
                />
              )}
            </>
          )}

          {/* Panel 3: المعلم الذكي */}
          {isChatOpen && (
            <>
              <motion.div
                id="panel-chat"
                key="chat-panel"
                initial={{ opacity: 0, width: 0 }}
                animate={{
                  opacity: 1,
                  width:
                    isMobile || openPanelNames.length === 1
                      ? "100%"
                      : chatWidth,
                }}
                exit={{ opacity: 0, width: 0 }}
                transition={
                  isResizing
                    ? { duration: 0 }
                    : { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
                }
                className={`h-full flex overflow-hidden ${
                  isMobile || openPanelNames.length === 1
                    ? "flex-1 w-full min-w-full"
                    : "shrink-0"
                }`}
              >
                <StudyChatPanel
                  messages={messages}
                  loading={chatLoading}
                  chatEndRef={chatEndRef as any}
                  input={input}
                  setInput={setInput}
                  handleSend={handleSend}
                  currentChunkId={currentChunkId}
                  sessionId={activeSessionId}
                  chunkTitle={chunkTitle}
                  onClose={() => setIsChatOpen(false)}
                  onSelectStartOption={handleSelectStartOption}
                  pendingPlanSteps={pendingPlanSteps}
                  onApprovePlan={handleApprovePlan}
                  onStepComplete={handleStepComplete}
                  panelWidth={
                    isMobile || openPanelNames.length === 1
                      ? undefined
                      : chatWidth
                  }
                  startResizing={() => {}}
                  isDark={isDark}
                />
              </motion.div>

              {openPanelNames.length > 1 && !isMobile && (
                <PanelResizer
                  onMouseDown={(e) => startResizingPanel("chat", e)}
                  isDark={isDark}
                  label="سحب لتغيير عرض محادثة زاد"
                />
              )}
            </>
          )}

          {/* Panel 4: الخريطة الذهنية */}
          {isMindmapOpen && (
            <>
              <motion.div
                id="panel-mindmap"
                key="mindmap-panel"
                initial={{ opacity: 0, width: 0 }}
                animate={{
                  opacity: 1,
                  width:
                    isMobile || openPanelNames.length === 1
                      ? "100%"
                      : mindmapWidth,
                }}
                exit={{ opacity: 0, width: 0 }}
                transition={
                  isResizing
                    ? { duration: 0 }
                    : { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
                }
                className={`h-full flex overflow-hidden ${
                  isMobile || openPanelNames.length === 1
                    ? "flex-1 w-full min-w-full"
                    : "shrink-0"
                }`}
              >
                <StudyMindmapPanel
                  mindmapData={mindmapData}
                  loading={mindmapLoading}
                  currentChunkId={currentChunkId}
                  handleGenerateMindmap={handleGenerateMindmap}
                  onClose={() => setIsMindmapOpen(false)}
                  panelWidth={
                    isMobile || openPanelNames.length === 1
                      ? undefined
                      : mindmapWidth
                  }
                  startResizing={() => {}}
                  isDark={isDark}
                  chunkLoading={isChunkLoading}
                />
              </motion.div>

              {openPanelNames.length > 1 && !isMobile && (
                <PanelResizer
                  onMouseDown={(e) => startResizingPanel("mindmap", e)}
                  isDark={isDark}
                  label="سحب لتغيير عرض الخريطة الذهنية"
                />
              )}
            </>
          )}

          {/* Panel 5: اختبار التقييم */}
          {isQuizOpen && (
            <>
              <motion.div
                id="panel-quiz"
                key="quiz-panel"
                initial={{ opacity: 0, width: 0 }}
                animate={{
                  opacity: 1,
                  width:
                    isMobile || openPanelNames.length === 1
                      ? "100%"
                      : quizWidth,
                }}
                exit={{ opacity: 0, width: 0 }}
                transition={
                  isResizing
                    ? { duration: 0 }
                    : { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
                }
                className={`h-full flex overflow-hidden ${
                  isMobile || openPanelNames.length === 1
                    ? "flex-1 w-full min-w-full"
                    : "shrink-0"
                }`}
              >
                <PanelErrorBoundary
                  panelName="اختبار التقييم"
                  isDark={isDark}
                  onReset={() => setQuizQuestions(null)}
                >
                  <StudyQuizPanel
                    quizQuestions={quizQuestions}
                    loading={quizLoading}
                    selectedAnswers={selectedAnswers}
                    setSelectedAnswers={setSelectedAnswers}
                    handleDiscussQuestion={handleDiscussQuestion}
                    currentChunkId={currentChunkId}
                    handleGenerateQuiz={handleGenerateQuiz}
                    onResetQuiz={() => setQuizQuestions(null)}
                    onClose={() => setIsQuizOpen(false)}
                    panelWidth={
                      isMobile || openPanelNames.length === 1
                        ? undefined
                        : quizWidth
                    }
                    startResizing={() => {}}
                    isDark={isDark}
                    flowState={quizFlowState}
                    setFlowState={setQuizFlowState}
                    activeQuizId={activeQuizId}
                    activeSessionId={activeSessionId}
                    onLoadQuiz={handleLoadQuiz}
                    chunkLoading={isChunkLoading}
                  />
                </PanelErrorBoundary>
              </motion.div>

              {openPanelNames.length > 1 && (
                <PanelResizer
                  onMouseDown={(e) => startResizingPanel("quiz", e)}
                  isDark={isDark}
                  label="سحب لتغيير عرض اختبار التقييم"
                />
              )}
            </>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}
