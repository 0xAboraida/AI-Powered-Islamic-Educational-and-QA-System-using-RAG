import Navbar from "../../../../components/layout/Navbar"
import { StudyHero } from "./StudyHero"
import { StudyHistoryModal } from "../modals/StudyHistoryModal"
import type { MindmapNode } from "../../../../contexts/StudyContext"
import type { StudySessionDto } from "../../../../api/studyApi"

export interface StudyHeroViewProps {
  accentColor: "purple" | "emerald" | "amber" | "blue"
  isDark: boolean
  chunkTitle: string
  headerSubtitle: string
  chunkMeta: any
  currentChunkId: string | null
  isHistoryModalOpen: boolean
  setIsHistoryModalOpen: (open: boolean) => void
  setStudyView: (view: "hero" | "workspace" | "tracks" | "track-admin") => void
  handleStartNewSession: () => void
  handleSelectSavedSession: (sess: StudySessionDto) => void
  executeChunkSelect: (
    chunkId: string,
    title: string,
    fullPath: string,
    node?: any,
    initialMindmapData?: MindmapNode[] | null,
  ) => Promise<void>
  setMindmapData: (data: MindmapNode[] | null) => void
  setIsMindmapOpen: (open: boolean) => void
  setIsQuizOpen: (open: boolean) => void
  focusPanel: (panel: "chat" | "document" | "mindmap" | "quiz" | "sidebar") => void
  handleLoadQuiz: (quizDto: any) => Promise<void>
  onExit: () => void
  onNavigateHome?: () => void
  onTryChat?: () => void
  onLogin?: () => void
  onOpenKnowledge?: (tab?: any) => void
  onOpenVoiceChat?: () => void
  onOpenLessons?: () => void
  onOpenAdmin?: () => void
  onOpenTurathRag?: () => void
  onOpenEngineControl?: () => void
  onOpenDataIngestion?: () => void
  onOpenV2PipelineAdmin?: () => void
  onOpenAdminLibrary?: () => void
  onOpenYoutubeImporter?: () => void
  onOpenSystemObservability?: () => void
}

export function StudyHeroView({
  accentColor,
  isDark,
  chunkTitle,
  headerSubtitle,
  chunkMeta,
  currentChunkId,
  isHistoryModalOpen,
  setIsHistoryModalOpen,
  setStudyView,
  handleStartNewSession,
  handleSelectSavedSession,
  executeChunkSelect,
  setMindmapData,
  setIsMindmapOpen,
  setIsQuizOpen,
  focusPanel,
  handleLoadQuiz,
  onExit,
  onNavigateHome,
  onTryChat,
  onLogin,
  onOpenKnowledge,
  onOpenVoiceChat,
  onOpenLessons,
  onOpenAdmin,
  onOpenTurathRag,
  onOpenEngineControl,
  onOpenDataIngestion,
  onOpenV2PipelineAdmin,
  onOpenAdminLibrary,
  onOpenYoutubeImporter,
  onOpenSystemObservability,
}: StudyHeroViewProps) {
  return (
    <div
      dir="rtl"
      className="relative min-h-screen w-full bg-background text-foreground transition-colors duration-300"
    >
      {/* Floating Top Navbar matching Homepage and Library */}
      <Navbar
        headerClassName="absolute inset-x-0 top-4 sm:top-6 z-50 px-3 sm:px-4"
        activeTab="study"
        onNavigateHome={onNavigateHome || onExit}
        onTryChat={onTryChat || (() => {})}
        onLogin={onLogin}
        onOpenKnowledge={onOpenKnowledge || (() => {})}
        onOpenStudy={() => setStudyView("hero")}
        onOpenLessons={onOpenLessons || (() => {})}
        onOpenVoiceChat={onOpenVoiceChat || (() => {})}
        onOpenAdmin={onOpenAdmin}
        onOpenTurathRag={onOpenTurathRag}
        onOpenEngineControl={onOpenEngineControl}
        onOpenDataIngestion={onOpenDataIngestion}
        onOpenV2PipelineAdmin={onOpenV2PipelineAdmin}
        onOpenAdminLibrary={onOpenAdminLibrary}
        onOpenYoutubeImporter={onOpenYoutubeImporter}
        onOpenSystemObservability={onOpenSystemObservability}
      />

      {/* Study Mode Hero Landing View */}
      <StudyHero
        accentColor={accentColor}
        isDark={isDark}
        chunkTitle={chunkTitle}
        headerSubtitle={headerSubtitle}
        chunkMeta={chunkMeta}
        currentChunkId={currentChunkId}
        onEnterWorkspace={() => setStudyView("workspace")}
        onOpenBookSelector={handleStartNewSession}
        onOpenHistory={() => setIsHistoryModalOpen(true)}
        onSelectSession={(sess) => {
          handleSelectSavedSession(sess)
          setStudyView("workspace")
        }}
        onSelectCommunityMindmap={async (mm) => {
          let parsedNodes: MindmapNode[] = []
          if (mm.treeData) {
            let raw = mm.treeData
            if (typeof raw === "string") {
              try {
                raw = JSON.parse(raw)
              } catch {}
            }
            parsedNodes = Array.isArray(raw) ? raw : [raw]
          }

          const cleanLessonTitle =
            mm.lessonTitle ||
            mm.title?.replace(/^خريطة:\s*/, "") ||
            "درس مدارسة"
          const cleanBookTitle = mm.bookTitle || "كتاب شرعي"
          const targetChunkId = mm.chunkId || ""

          if (targetChunkId) {
            await executeChunkSelect(
              targetChunkId,
              cleanLessonTitle,
              cleanBookTitle,
              undefined,
              parsedNodes.length > 0 ? parsedNodes : null,
            )
          } else if (parsedNodes.length > 0) {
            setMindmapData(parsedNodes)
            setIsMindmapOpen(true)
            focusPanel("mindmap")
            setStudyView("workspace")
          }
        }}
        onSelectCommunityQuiz={async (qz) => {
          const cleanLessonTitle =
            qz.lessonTitle ||
            qz.sectionTitle ||
            qz.title?.replace(/^اختبار:\s*/, "") ||
            "درس مدارسة"
          const cleanBookTitle = qz.bookTitle || "كتاب شرعي"
          const targetChunkId = qz.chunkId || ""

          if (targetChunkId) {
            await executeChunkSelect(
              targetChunkId,
              cleanLessonTitle,
              cleanBookTitle,
            )
          }

          handleLoadQuiz(qz)
          setIsQuizOpen(true)
          setStudyView("workspace")
        }}
      />

      {/* Saved Sessions History Modal */}
      <StudyHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        onSelectSession={(sess) => {
          handleSelectSavedSession(sess)
          setStudyView("workspace")
        }}
        isDark={isDark}
      />
    </div>
  )
}
