import 'regenerator-runtime/runtime'
import React, { useEffect, useState } from 'react'
import darkLogo from '@/assets/images/ZadDarkLogo.webp'
import Navbar from './components/layout/Navbar'
import Hero from './components/layout/Hero'
import FeatureCards from './components/layout/FeatureCards'
import Footer from './components/layout/Footer'
import ChatScreen from './features/chat/ChatScreen'
import VoiceScreen from './features/voice/VoiceScreen'
import KnowledgeBase, { type MainTab } from './features/knowledge/KnowledgeBase'
import StudyMode from './features/study/StudyMode'
import AdminDashboard from './features/admin/AdminDashboard'
import AuthPage from './features/auth/AuthPage'
import { StudyProvider } from './contexts/StudyContext'
import DataIngestionAdmin from './components/admin/DataIngestionAdmin'
import V2PipelineAdmin from './components/admin/V2PipelineAdmin'
import AdminLibrary from './features/knowledge/AdminLibrary'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import { TextSelectionToolbar } from './components/common/TextSelectionToolbar'
import { YoutubeImporter } from './features/admin/YoutubeImporter/YoutubeImporter'
import { LessonsPage } from './features/lessons/LessonsPage'
import { ScholarProfilePage } from './features/lessons/ScholarProfilePage'
import { SystemObservability } from './features/admin/SystemObservability'
import { TurathRagPage } from './features/admin/turath-rag'
import { EngineControlPage } from './features/admin/engine-control'

type View = 'home' | 'chat' | 'voice' | 'knowledge' | 'study' | 'admin' | 'turath_rag' | 'engine_control' | 'data_ingestion' | 'v2_pipeline_admin' | 'admin_library' | 'youtube_importer' | 'lessons' | 'scholar_profile' | 'system_observability' | 'login' | 'signup'

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, color: 'red', direction: 'ltr', background: 'white', minHeight: '100vh' }}>
          <h2>Something went wrong in React:</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error?.toString()}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', marginTop: 20 }}>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const [view, setView] = useState<View>('home')
  const [hasVisitedKnowledge, setHasVisitedKnowledge] = useState(false)
  const [libraryTab, setLibraryTab] = useState<MainTab>('home')
  const [isLibraryScrolled, setIsLibraryScrolled] = useState(false)
  const [selectedScholar, setSelectedScholar] = useState<string | null>(null)
  const [pendingQuestion, setPendingQuestion] = useState<string | undefined>()
  const [pendingBook, setPendingBook] = useState<{ id: number | string; title: string; author: string } | null>(null)
  const { isAuthenticated } = useAuth()
  const { isDark } = useTheme()

  const navigate = (newView: View) => {
    if (view === newView) return
    if (newView === 'knowledge') {
      setHasVisitedKnowledge(true)
    }
    window.scrollTo({ top: 0, behavior: 'instant' })
    setView(newView)
  }

  useEffect(() => {
    document.documentElement.dir = 'rtl'
    document.documentElement.lang = 'ar'
  }, [])

  const askAboutBook = (book: { id: number | string; title: string; author: string }) => {
    setPendingBook(book)
    setPendingQuestion(undefined)
    navigate('chat')
  }

  const askQuestion = (question: string) => {
    setPendingQuestion(question)
    setPendingBook(null)
    navigate('chat')
  }

  const openChat = () => {
    setPendingBook(null)
    isAuthenticated ? navigate('chat') : navigate('login')
  }
  const openVoice = () => isAuthenticated ? navigate('voice') : navigate('login')
  const openKnowledge = () => {
    setLibraryTab('home')
    setHasVisitedKnowledge(true)
    navigate('knowledge')
  }
  const openStudy = () => isAuthenticated ? navigate('study') : navigate('login')
  const openAdmin = () => navigate('admin')
  const openTurathRag = () => navigate('turath_rag')
  const openEngineControl = () => navigate('engine_control')
  const openDataIngestion = () => navigate('data_ingestion')
  const openV2PipelineAdmin = () => navigate('v2_pipeline_admin')
  const openAdminLibrary = () => navigate('admin_library')
  const openYoutubeImporter = () => navigate('youtube_importer')
  const openLessons = () => navigate('lessons')
  const openSystemObservability = () => navigate('system_observability')

  const renderOtherView = () => {
    if (view === 'login' || view === 'signup') {
      return (
        <AuthPage
          initialMode={view}
          onBack={() => navigate('home')}
          onSuccess={() => navigate('home')}
        />
      )
    }
    if (view === 'chat') {
      return (
        <ChatScreen
          onExit={() => navigate('home')}
          onOpenVoice={() => navigate('voice')}
          initialQuestion={pendingQuestion}
          onConsumeInitial={() => setPendingQuestion(undefined)}
        />
      )
    }
    if (view === 'voice') {
      return <VoiceScreen onExit={() => navigate('home')} onOpenText={() => navigate('chat')} />
    }
    if (view === 'study') {
      return <StudyMode onExit={() => navigate('home')} />
    }
    if (view === 'turath_rag') {
      return <TurathRagPage onExit={() => navigate('home')} />
    }
    if (view === 'engine_control') {
      return <EngineControlPage onExit={() => navigate('home')} />
    }
    if (view === 'admin') {
      return (
        <AdminDashboard
          onExit={() => navigate('home')}
          onNavigateToIngestion={() => navigate('v2_pipeline_admin')}
          onNavigateToObservability={() => navigate('system_observability')}
        />
      )
    }
    if (view === 'data_ingestion') {
      return <DataIngestionAdmin onExit={() => navigate('home')} />
    }
    if (view === 'v2_pipeline_admin') {
      return <V2PipelineAdmin onExit={() => navigate('home')} />
    }
    if (view === 'admin_library') {
      return <AdminLibrary onExit={() => navigate('home')} onNavigateToIngestion={() => navigate('v2_pipeline_admin')} />
    }
    if (view === 'youtube_importer') {
      return (
        <div className="min-h-screen bg-black">
          <YoutubeImporter onBack={() => navigate('home')} />
        </div>
      )
    }
    if (view === 'lessons') {
      return (
        <div dir="rtl" className={`min-h-screen bg-background text-foreground transition-colors duration-300 ${isDark ? 'dark' : ''}`}>
          <Navbar
            activeTab="lessons"
            onNavigateHome={() => navigate('home')}
            onTryChat={openChat}
            onOpenKnowledge={openKnowledge}
            onOpenStudy={openStudy}
            onOpenAdmin={openAdmin}
            onOpenTurathRag={openTurathRag}
            onOpenEngineControl={openEngineControl}
            onOpenDataIngestion={openDataIngestion}
            onOpenV2PipelineAdmin={openV2PipelineAdmin}
            onOpenAdminLibrary={openAdminLibrary}
            onOpenYoutubeImporter={openYoutubeImporter}
            onOpenLessons={openLessons}
            onOpenVoiceChat={openVoice}
            onOpenSystemObservability={openSystemObservability}
          />
          <LessonsPage
            onBack={() => navigate('home')}
            onNavigateToScholar={(id) => {
              setSelectedScholar(id)
              navigate('scholar_profile')
            }}
            onNavigateToImporter={() => navigate('youtube_importer')}
            hideHeader={true}
          />
        </div>
      )
    }
    if (view === 'scholar_profile' && selectedScholar) {
      return (
        <div className="min-h-screen bg-black">
          <ScholarProfilePage
            scholarId={selectedScholar}
            onBack={() => navigate('lessons')}
          />
        </div>
      )
    }
    if (view === 'system_observability') {
      return <SystemObservability onExit={() => navigate('home')} />
    }
    return null
  }

  return (
    <StudyProvider>
      <div className="relative min-h-screen w-full overflow-hidden bg-background">
        {/* 1. PERSISTENT HOME VIEW (دائماً في الذاكرة دون إعادة بناء) */}
        <div
          dir="rtl"
          className={`min-h-screen bg-background text-foreground transition-colors duration-300 ${isDark ? 'dark' : ''} ${view === 'home' ? 'block' : 'hidden'}`}
          aria-hidden={view !== 'home'}
        >
          <Navbar
            activeTab="home"
            onNavigateHome={() => navigate('home')}
            onTryChat={openChat}
            onOpenKnowledge={openKnowledge}
            onOpenStudy={openStudy}
            onOpenAdmin={openAdmin}
            onOpenTurathRag={openTurathRag}
            onOpenEngineControl={openEngineControl}
            onOpenDataIngestion={openDataIngestion}
            onOpenV2PipelineAdmin={openV2PipelineAdmin}
            onOpenAdminLibrary={openAdminLibrary}
            onOpenYoutubeImporter={openYoutubeImporter}
            onOpenLessons={openLessons}
            onOpenVoiceChat={openVoice}
            onOpenSystemObservability={openSystemObservability}
          />
          <main>
            <Hero onTryChat={openChat} onTryVoice={openVoice} onAsk={askQuestion} />
            <FeatureCards />
          </main>
          <Footer />
        </div>

        {/* 2. PERSISTENT KNOWLEDGE VIEW (تظل محتفظة بحالتها في الذاكرة بعد أول زيارة ليكون الانتقال فورياً 0ms) */}
        {hasVisitedKnowledge && (
          <div
            dir="rtl"
            className={`relative min-h-screen bg-background text-foreground transition-colors duration-300 ${isDark ? 'dark' : ''} ${view === 'knowledge' ? 'block' : 'hidden'}`}
            aria-hidden={view !== 'knowledge'}
          >
            <div className={libraryTab === 'home' && !isLibraryScrolled ? 'block' : 'hidden'}>
              <Navbar
                headerClassName="absolute inset-x-0 top-4 sm:top-6 z-50 px-3 sm:px-4"
                activeTab="knowledge"
                onNavigateHome={() => navigate('home')}
                onTryChat={openChat}
                onOpenKnowledge={() => {
                  setLibraryTab('home')
                  setIsLibraryScrolled(false)
                  openKnowledge()
                }}
                onOpenStudy={openStudy}
                onOpenAdmin={openAdmin}
                onOpenTurathRag={openTurathRag}
                onOpenEngineControl={openEngineControl}
                onOpenDataIngestion={openDataIngestion}
                onOpenV2PipelineAdmin={openV2PipelineAdmin}
                onOpenAdminLibrary={openAdminLibrary}
                onOpenYoutubeImporter={openYoutubeImporter}
                onOpenLessons={openLessons}
                onOpenVoiceChat={openVoice}
                onOpenSystemObservability={openSystemObservability}
              />
            </div>
            <KnowledgeBase
              onExit={() => {
                setLibraryTab('home')
                setIsLibraryScrolled(false)
                navigate('home')
              }}
              onAskBook={askAboutBook}
              onLogin={() => navigate('login')}
              onNavigateGlobal={(targetView) => {
                setLibraryTab('home')
                setIsLibraryScrolled(false)
                navigate(targetView as View)
              }}
              initialTab={libraryTab}
              onTabChange={(tab) => {
                setLibraryTab(tab)
              }}
              onScrolledPastSearchChange={setIsLibraryScrolled}
            />
          </div>
        )}

        {/* 3. DYNAMIC OTHER VIEWS */}
        {view !== 'home' && view !== 'knowledge' && (
          <div className="min-h-screen w-full">
            {renderOtherView()}
          </div>
        )}

        <TextSelectionToolbar dark={isDark} />
      </div>
    </StudyProvider>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  )
}

