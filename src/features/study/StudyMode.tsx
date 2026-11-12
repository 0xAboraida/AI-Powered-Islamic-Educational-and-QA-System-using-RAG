import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useDeferredValue,
  useCallback,
} from "react"
import {
  BookOpen,
  MessageCircle,
  Brain,
  ClipboardList,
  Folder,
} from "lucide-react"
import IslamicPattern from "../knowledge/components/IslamicPattern"
import LibrarySidebar from "../knowledge/components/LibrarySidebar"
import { useStudyContext } from "../../contexts/StudyContext"
import { useTheme } from "../../contexts/ThemeContext"
import libraryBgLight from "@/assets/images/library-background-light-desktop.jpg"
import UserProfileModal from "../profile/UserProfileModal"

import {
  StudyHeroView,
  StudyWorkspaceSidebar,
  StudyMobileHeader,
  StudyWorkspacePanels,
  ChunkSwitchConfirmModal,
  StudyExitConfirmModal,
  StudyHistoryModal,
} from "./components"

import {
  getWorkspaceDarkBg as getWorkspaceDarkBgHelper,
  getWorkspacePatternColor as getWorkspacePatternColorHelper,
  getZadWordClass as getZadWordClassHelper,
  getNavCircleBtnStyle as getNavCircleBtnStyleHelper,
} from "./utils/studyThemeTokens"

import {
  useStudyLayout,
  useStudyLibrarySource,
  useStudyChatTutor,
  useStudyAiActions,
  useStudyDocumentReader,
} from "./hooks"

export interface StudyModeProps {
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

export default function StudyMode({
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
}: StudyModeProps) {
  const { isDark, accentColor } = useTheme()
  const [studyView, setStudyView] = useState<"hero" | "workspace">("hero")

  const getWorkspaceDarkBg = () => getWorkspaceDarkBgHelper(accentColor)
  const getWorkspacePatternColor = () =>
    getWorkspacePatternColorHelper(accentColor, isDark)
  const getZadWordClass = () => getZadWordClassHelper(accentColor, isDark)
  const getNavCircleBtnStyle = () =>
    getNavCircleBtnStyleHelper(accentColor, isDark)

  // Background Type (Image vs Pattern vs Solid)
  const [bgType] = useState<"image" | "pattern" | "solid">(() => {
    return (
      (localStorage.getItem(
        "zad_study_bg_type",
      ) as "image" | "pattern" | "solid") || "pattern"
    )
  })

  // Global Context State
  const {
    messages,
    setMessages,
    chatHistory,
    setChatHistory,
    currentChunkId,
    setCurrentChunkId,
    activeSessionId,
    setActiveSessionId,
    chunkTitle,
    setChunkTitle,
    headerSubtitle,
    setHeaderSubtitle,
    chunkText,
    setChunkText,
    chunkMeta,
    setChunkMeta,
    quizQuestions,
    setQuizQuestions,
    quizFlowState,
    setQuizFlowState,
    mindmapData,
    setMindmapData,
    selectedAnswers,
    setSelectedAnswers,
    treeData,
    setTreeData,
    treeLoading,
    setTreeLoading,
    clearStudySession,
  } = useStudyContext()

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("")
  const deferredSearchQuery = useDeferredValue(searchQuery)

  // Modals
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)

  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null)
  const workspaceRef = useRef<HTMLDivElement>(null)

  // Hook 1: Layout & Resizing
  const {
    isSidebarOpen,
    setIsSidebarOpen,
    isDocumentOpen,
    setIsDocumentOpen,
    isChatOpen,
    setIsChatOpen,
    isMindmapOpen,
    setIsMindmapOpen,
    isQuizOpen,
    setIsQuizOpen,
    sidebarWidth,
    documentWidth,
    chatWidth,
    mindmapWidth,
    quizWidth,
    isResizing,
    startResizingPanel,
    isMobile,
    focusTarget,
    focusPanel,
    activeMobileTab,
    handleSelectMobileTab,
    isWorkspaceSidebarExpanded,
    setIsWorkspaceSidebarExpanded,
    handleToggleWorkspaceSidebar,
    isTimerNavbarExpanded,
    setIsTimerNavbarExpanded,
    isPlatformSidebarOpen,
    setIsPlatformSidebarOpen,
    isFullscreen,
    toggleFullscreen,
    openPanelNames,
    getBottomNavTabClass,
  } = useStudyLayout({
    isDark,
    accentColor,
    onSwitchView: setStudyView,
  })

  // Hook 2: Chat & AI Tutor
  const {
    input,
    setInput,
    loading: chatLoading,
    setLoading: setChatLoading,
    pendingPlanSteps,
    setPendingPlanSteps,
    requestTutorChat,
    handleSelectStartOption,
    handleApprovePlan,
    handleStepComplete,
    handleSend,
  } = useStudyChatTutor({
    currentChunkId,
    chunkTitle,
    chunkText,
    activeSessionId,
    chatHistory: chatHistory as any,
    setChatHistory: setChatHistory as any,
    setMessages: setMessages as any,
  })

  // Hook 3: Document Reader & Navigation
  const {
    isChunkLoading,
    chunkLoadError,
    confirmClose,
    setConfirmClose,
    pendingChunkSwitch,
    setPendingChunkSwitch,
    executeChunkSelect,
    handleSelectSavedSession,
    handleTurathPageChange,
    handleChunkSelect,
    handleConfirmChunkSwitch,
    handleConfirmExit,
    handleStartNewSession,
    retryChunkLoad,
  } = useStudyDocumentReader({
    treeData,
    currentChunkId,
    chunkTitle,
    headerSubtitle,
    setCurrentChunkId,
    setChunkTitle,
    setHeaderSubtitle,
    setChunkText,
    setChunkMeta,
    activeSessionId,
    setActiveSessionId,
    clearStudySession,
    setMessages: setMessages as any,
    setChatHistory: setChatHistory as any,
    setPendingPlanSteps,
    setMindmapData,
    setQuizQuestions,
    setSelectedAnswers,
    setQuizFlowState,
    setMindmapLoading: () => {},
    setQuizLoading: () => {},
    setLoading: setChatLoading,
    setActiveQuizId: () => {},
    isMobile,
    isDark,
    focusPanel,
    setIsDocumentOpen,
    setIsChatOpen,
    setIsSidebarOpen,
    setIsMindmapOpen,
    setIsQuizOpen,
    setIsWorkspaceSidebarExpanded,
    setStudyView,
    onExit,
  })

  // Hook 4: AI Actions (Quizzes & Mindmaps)
  const {
    quizLoading,
    mindmapLoading,
    activeQuizId,
    handleGenerateQuiz,
    handleLoadQuiz,
    handleOpenQuizSetup,
    handleGenerateMindmap,
    handleDiscussQuestion,
  } = useStudyAiActions({
    currentChunkId,
    chunkTitle,
    chunkText,
    chunkMeta,
    headerSubtitle,
    activeSessionId,
    executeChunkSelect,
    requestTutorChat,
    setQuizQuestions,
    setSelectedAnswers,
    setQuizFlowState,
    setMindmapData,
    setIsQuizOpen,
    setIsMindmapOpen,
    setIsChatOpen,
    focusPanel,
    setMessages: setMessages as any,
    setChatHistory: setChatHistory as any,
    setLoading: setChatLoading,
  })

  // Hook 5: Library Data Source & Multi-Engine Book Tree Caching
  const { librarySource, handleLoadBookTree } = useStudyLibrarySource({
    treeData,
    setTreeData,
    setTreeLoading,
    onSelectChunk: (chunkId, title, fullPath, node) => {
      executeChunkSelect(chunkId, title, fullPath, node)
    },
  })

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Smoothly focus / scroll workspace to target panel when opened or selected
  useEffect(() => {
    if (!focusTarget) return
    const timer = setTimeout(() => {
      const el = document.getElementById(`panel-${focusTarget.panel}`)
      if (el) {
        el.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        })
      }
    }, 120)
    return () => clearTimeout(timer)
  }, [focusTarget])

  // Set mobile browser theme-color
  useEffect(() => {
    let meta = document.querySelector('meta[name="theme-color"]')
    if (!meta) {
      meta = document.createElement("meta")
      meta.setAttribute("name", "theme-color")
      document.head.appendChild(meta)
    }
    meta.setAttribute("content", isDark ? "#0d021a" : "#F8FAFC")
  }, [isDark])

  // Navigation across platform views
  const handleNavigateGlobal = useCallback(
    (view: any) => {
      setIsPlatformSidebarOpen(false)
      if (view === "login" || view === "signup") onLogin?.()
      else if (view === "home") (onNavigateHome || onExit)()
      else if (view === "chat") onTryChat?.()
      else if (view === "knowledge") onOpenKnowledge?.()
      else if (view === "study") setStudyView("hero")
      else if (view === "lessons") onOpenLessons?.()
      else if (view === "voice") onOpenVoiceChat?.()
      else if (view === "admin") onOpenAdmin?.()
      else if (view === "turath-rag") onOpenTurathRag?.()
      else if (view === "engine-control") onOpenEngineControl?.()
      else if (view === "data-ingestion") onOpenDataIngestion?.()
      else if (view === "v2-pipeline-admin") onOpenV2PipelineAdmin?.()
      else if (view === "admin-library") onOpenAdminLibrary?.()
      else if (view === "youtube-importer") onOpenYoutubeImporter?.()
      else if (view === "system-observability") onOpenSystemObservability?.()
    },
    [
      setIsPlatformSidebarOpen,
      onLogin,
      onNavigateHome,
      onExit,
      onTryChat,
      onOpenKnowledge,
      onOpenLessons,
      onOpenVoiceChat,
      onOpenAdmin,
      onOpenTurathRag,
      onOpenEngineControl,
      onOpenDataIngestion,
      onOpenV2PipelineAdmin,
      onOpenAdminLibrary,
      onOpenYoutubeImporter,
      onOpenSystemObservability,
    ],
  )

  const filteredTreeData = useMemo(() => {
    return treeData
  }, [treeData])

  const totalBooksCount = useMemo(() => {
    if (!treeData || treeData.length === 0) return 51
    const countBooks = (n: any): number => {
      if (n.is_book) return 1
      if (!n.children || n.children.length === 0) return 0
      return n.children.reduce((acc: number, child: any) => acc + countBooks(child), 0)
    }
    const count = treeData.reduce((acc, node) => acc + countBooks(node), 0)
    return count > 0 ? count : 51
  }, [treeData])

  const areAllPanelsClosed =
    !isSidebarOpen &&
    !isDocumentOpen &&
    !isChatOpen &&
    !isMindmapOpen &&
    !isQuizOpen

  // HERO VIEW
  if (studyView === "hero") {
    return (
      <StudyHeroView
        accentColor={accentColor}
        isDark={isDark}
        chunkTitle={chunkTitle}
        headerSubtitle={headerSubtitle}
        chunkMeta={chunkMeta}
        currentChunkId={currentChunkId}
        isHistoryModalOpen={isHistoryModalOpen}
        setIsHistoryModalOpen={setIsHistoryModalOpen}
        setStudyView={setStudyView}
        handleStartNewSession={handleStartNewSession}
        handleSelectSavedSession={handleSelectSavedSession}
        executeChunkSelect={executeChunkSelect}
        setMindmapData={setMindmapData}
        setIsMindmapOpen={setIsMindmapOpen}
        setIsQuizOpen={setIsQuizOpen}
        focusPanel={focusPanel}
        handleLoadQuiz={handleLoadQuiz}
        onExit={onExit}
        onNavigateHome={onNavigateHome}
        onTryChat={onTryChat}
        onLogin={onLogin}
        onOpenKnowledge={onOpenKnowledge}
        onOpenVoiceChat={onOpenVoiceChat}
        onOpenLessons={onOpenLessons}
        onOpenAdmin={onOpenAdmin}
        onOpenTurathRag={onOpenTurathRag}
        onOpenEngineControl={onOpenEngineControl}
        onOpenDataIngestion={onOpenDataIngestion}
        onOpenV2PipelineAdmin={onOpenV2PipelineAdmin}
        onOpenAdminLibrary={onOpenAdminLibrary}
        onOpenYoutubeImporter={onOpenYoutubeImporter}
        onOpenSystemObservability={onOpenSystemObservability}
      />
    )
  }

  // WORKSPACE VIEW
  return (
    <div
      dir="rtl"
      className={`relative flex h-screen w-screen flex-col overflow-hidden font-sans transition-colors duration-500 ${
        isDark ? "bg-[#0d021a] text-white" : "bg-[#F8FAFC] text-slate-800"
      }`}
    >
      <style>{`
        details.mindmap-details[open] > summary .mindmap-arrow {
          transform: rotate(-90deg);
        }
        details.mindmap-details[open] > .mindmap-content {
          animation: slideFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes slideFadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Background (Dark & Light) */}
      {isDark ? (
        <div className="absolute inset-0 z-0 pointer-events-none">
          {bgType === "image" ? (
            <>
              <img
                src={getWorkspaceDarkBg()}
                alt=""
                className="h-full w-full object-cover opacity-100"
              />
              <div className="absolute inset-0 bg-[#0d021a]/40" />
            </>
          ) : bgType === "pattern" ? (
            <>
              <div className="absolute inset-0 bg-[#07010f]" />
              <IslamicPattern
                className={`${getWorkspacePatternColor()} pointer-events-none`}
                opacity={0.12}
                scale={0.8}
              />
            </>
          ) : (
            <div className="absolute inset-0 bg-[#07010f]" />
          )}
        </div>
      ) : (
        <div className="absolute inset-0 z-0 pointer-events-none">
          {bgType === "image" ? (
            <>
              <img
                src={libraryBgLight}
                alt=""
                className="h-full w-full object-cover opacity-100"
              />
              <div className="absolute inset-0 bg-white/20" />
            </>
          ) : bgType === "pattern" ? (
            <>
              <div className="absolute inset-0 bg-[#faf8fd]" />
              <IslamicPattern
                className={`${getWorkspacePatternColor()} pointer-events-none`}
                opacity={0.08}
                scale={0.9}
              />
            </>
          ) : (
            <div className="absolute inset-0 bg-[#faf8fd]" />
          )}
        </div>
      )}

      {/* Mobile Top Header */}
      <StudyMobileHeader
        isDark={isDark}
        accentColor={accentColor}
        isHistoryModalOpen={isHistoryModalOpen}
        setIsHistoryModalOpen={setIsHistoryModalOpen}
        isTimerNavbarExpanded={isTimerNavbarExpanded}
        setIsTimerNavbarExpanded={setIsTimerNavbarExpanded}
        setIsPlatformSidebarOpen={setIsPlatformSidebarOpen}
        setStudyView={setStudyView}
        getNavCircleBtnStyle={getNavCircleBtnStyle}
        getZadWordClass={getZadWordClass}
      />

      {/* Main Content Workspace Layout: Right Pro Sidebar + Horizontal Panels */}
      <div className="relative z-10 flex flex-1 min-h-0 w-full overflow-hidden">
        {/* Pro Workspace Sidebar on Right (RTL) */}
        <div className="hidden md:flex shrink-0 h-full">
          <StudyWorkspaceSidebar
            isExpanded={isWorkspaceSidebarExpanded}
            onToggleExpanded={handleToggleWorkspaceSidebar}
            onExpandSidebar={() => {
              setIsWorkspaceSidebarExpanded(true)
              try {
                localStorage.setItem(
                  "zad_study_workspace_sidebar_expanded",
                  "true",
                )
              } catch (e) {}
            }}
            onOpenPlatformSidebar={() => setIsPlatformSidebarOpen(true)}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => {
              if (!isSidebarOpen) {
                setIsSidebarOpen(true)
                focusPanel("sidebar")
              } else if (focusTarget?.panel !== "sidebar") {
                focusPanel("sidebar")
              } else {
                setIsSidebarOpen(false)
              }
            }}
            isDocumentOpen={isDocumentOpen}
            onToggleDocument={() => {
              if (!isDocumentOpen) {
                setIsDocumentOpen(true)
                focusPanel("document")
              } else if (focusTarget?.panel !== "document") {
                focusPanel("document")
              } else {
                setIsDocumentOpen(false)
              }
            }}
            isChatOpen={isChatOpen}
            onToggleChat={() => {
              if (!isChatOpen) {
                setIsChatOpen(true)
                focusPanel("chat")
              } else if (focusTarget?.panel !== "chat") {
                focusPanel("chat")
              } else {
                setIsChatOpen(false)
              }
            }}
            isMindmapOpen={isMindmapOpen}
            onToggleMindmap={() => {
              if (!isMindmapOpen) {
                setIsMindmapOpen(true)
                focusPanel("mindmap")
              } else if (focusTarget?.panel !== "mindmap") {
                focusPanel("mindmap")
              } else {
                setIsMindmapOpen(false)
              }
            }}
            isQuizOpen={isQuizOpen}
            onToggleQuiz={() => {
              if (!isQuizOpen) {
                setIsQuizOpen(true)
                focusPanel("quiz")
              } else if (focusTarget?.panel !== "quiz") {
                focusPanel("quiz")
              } else {
                setIsQuizOpen(false)
              }
            }}
            onNewSession={handleStartNewSession}
            onReturnToHero={() => setStudyView("hero")}
            onOpenHistory={() => setIsHistoryModalOpen(true)}
            onOpenProfile={() => setShowProfileModal(true)}
            onSelectSavedSession={handleSelectSavedSession}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
            currentBookTitle={headerSubtitle}
            currentChunkTitle={chunkTitle}
          />
        </div>

        {/* Horizontal Multi-Panel Layout */}
        <StudyWorkspacePanels
          workspaceRef={workspaceRef}
          isDark={isDark}
          isMobile={isMobile}
          isResizing={isResizing}
          openPanelNames={openPanelNames}
          areAllPanelsClosed={areAllPanelsClosed}
          startResizingPanel={startResizingPanel}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          sidebarWidth={sidebarWidth}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          deferredSearchQuery={deferredSearchQuery}
          treeLoading={treeLoading}
          filteredTreeData={filteredTreeData}
          handleLoadBookTree={handleLoadBookTree}
          librarySource={librarySource}
          currentChunkId={currentChunkId}
          chunkTitle={chunkTitle}
          headerSubtitle={headerSubtitle}
          chunkMeta={chunkMeta}
          chunkText={chunkText}
          isChunkLoading={isChunkLoading}
          chunkLoadError={chunkLoadError}
          onRetryChunkLoad={retryChunkLoad}
          handleChunkSelect={handleChunkSelect}
          isDocumentOpen={isDocumentOpen}
          setIsDocumentOpen={setIsDocumentOpen}
          documentWidth={documentWidth}
          handleTurathPageChange={handleTurathPageChange}
          isChatOpen={isChatOpen}
          setIsChatOpen={setIsChatOpen}
          chatWidth={chatWidth}
          messages={messages as any}
          chatLoading={chatLoading}
          chatEndRef={chatEndRef}
          input={input}
          setInput={setInput}
          handleSend={handleSend}
          activeSessionId={activeSessionId}
          handleSelectStartOption={handleSelectStartOption}
          pendingPlanSteps={pendingPlanSteps}
          handleApprovePlan={handleApprovePlan}
          handleStepComplete={handleStepComplete}
          isMindmapOpen={isMindmapOpen}
          setIsMindmapOpen={setIsMindmapOpen}
          mindmapWidth={mindmapWidth}
          mindmapData={mindmapData}
          mindmapLoading={mindmapLoading}
          handleGenerateMindmap={handleGenerateMindmap}
          isQuizOpen={isQuizOpen}
          setIsQuizOpen={setIsQuizOpen}
          quizWidth={quizWidth}
          quizQuestions={quizQuestions}
          setQuizQuestions={setQuizQuestions}
          quizLoading={quizLoading}
          selectedAnswers={selectedAnswers}
          setSelectedAnswers={setSelectedAnswers}
          handleDiscussQuestion={handleDiscussQuestion}
          handleGenerateQuiz={handleGenerateQuiz}
          handleOpenQuizSetup={handleOpenQuizSetup}
          quizFlowState={quizFlowState}
          setQuizFlowState={setQuizFlowState}
          activeQuizId={activeQuizId}
          handleLoadQuiz={handleLoadQuiz}
        />
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        dir="rtl"
        className={`md:hidden shrink-0 w-full border-t z-40 backdrop-blur-2xl transition-all duration-200 p-0 m-0 ${
          isDark
            ? "bg-[#0a0d14]/75 border-white/10 shadow-[0_-8px_25px_rgba(0,0,0,0.7)] text-white backdrop-blur-2xl backdrop-saturate-150"
            : "bg-white/75 border-gray-200/90 shadow-[0_-6px_20px_rgba(0,0,0,0.06)] text-slate-800 backdrop-blur-2xl backdrop-saturate-150"
        }`}
        aria-label="شريط التبويبات السفلي"
      >
        <div className="flex items-stretch justify-around h-14 sm:h-16 w-full max-w-lg mx-auto p-0">
          {[
            { id: "sidebar", label: "الفهرس", icon: Folder },
            { id: "document", label: "نص الدرس", icon: BookOpen },
            { id: "chat", label: "المساعد زاد", icon: MessageCircle },
            { id: "mindmap", label: "التشجير", icon: Brain },
            { id: "quiz", label: "الاختبارات", icon: ClipboardList },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeMobileTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSelectMobileTab(tab.id as any)}
                className={getBottomNavTabClass(isActive)}
                title={tab.label}
              >
                <Icon
                  className={`h-5 w-5 sm:h-5.5 sm:w-5.5 transition-transform duration-200 ${
                    isActive ? "scale-110" : ""
                  }`}
                  strokeWidth={2.2}
                />
                <span className="text-[10px] xs:text-[11px] sm:text-xs font-bold tracking-tight truncate max-w-full text-center block px-0.5">
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Platform Sidebar Drawer */}
      <LibrarySidebar
        isOpen={isPlatformSidebarOpen}
        onClose={() => setIsPlatformSidebarOpen(false)}
        theme={isDark ? "dark" : "light"}
        activeMainTab={"study" as any}
        activeStudyTab={activeMobileTab}
        counts={{
          domains: 40,
          authors: 3177,
          favorites: 0,
          narrators: "18.9K",
          downloads: 0,
          books: totalBooksCount,
        }}
        recentBook={null}
        onSelectTab={(tab) => {
          setIsPlatformSidebarOpen(false)
          onOpenKnowledge?.(tab)
        }}
        onReadRecentBook={() => {}}
        onNavigateGlobal={handleNavigateGlobal}
        onLogin={onLogin}
        onExit={onNavigateHome || onExit}
        onOpenProfile={() => setShowProfileModal(true)}
      />

      {/* Modal: Switch Lessons Confirm */}
      <ChunkSwitchConfirmModal
        isOpen={Boolean(pendingChunkSwitch)}
        pendingTitle={pendingChunkSwitch?.title || null}
        isDark={isDark}
        onClose={() => setPendingChunkSwitch(null)}
        onConfirm={handleConfirmChunkSwitch}
      />

      {/* Modal: Exit Lesson Confirm */}
      <StudyExitConfirmModal
        isOpen={confirmClose}
        isDark={isDark}
        onClose={() => setConfirmClose(false)}
        onConfirm={handleConfirmExit}
      />

      {/* Modal: Study History */}
      <StudyHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        onSelectSession={handleSelectSavedSession}
        isDark={isDark}
      />

      {/* Modal: User Profile */}
      {showProfileModal && (
        <UserProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </div>
  )
}
