import 'regenerator-runtime/runtime'
import React, { useEffect, useState, useCallback } from 'react'
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

const VIEW_TO_PATH: Record<View, string> = {
  home: '/',
  chat: '/chat',
  voice: '/voice',
  knowledge: '/library',
  study: '/study',
  lessons: '/lessons',
  scholar_profile: '/scholar',
  login: '/login',
  signup: '/signup',
  admin: '/admin',
  turath_rag: '/turath-rag',
  engine_control: '/engine-control',
  data_ingestion: '/data-ingestion',
  v2_pipeline_admin: '/pipeline-admin',
  admin_library: '/admin-library',
  youtube_importer: '/youtube-importer',
  system_observability: '/observability',
}

function getInitialView(): View {
  if (typeof window === 'undefined') return 'home'

  const path = window.location.pathname.toLowerCase().replace(/\/+$/, '')
  const hash = window.location.hash.toLowerCase().replace(/^#\/?/, '').replace(/\/+$/, '')
  const target = hash ? `/${hash}` : (path || '/')

  for (const [v, p] of Object.entries(VIEW_TO_PATH)) {
    if (p !== '/' && (target === p || target.startsWith(p + '/'))) {
      return v as View
    }
  }

  // Common aliases
  if (target === '/knowledge' || target.startsWith('/knowledge/')) return 'knowledge'
  if (target === '/turath_rag') return 'turath_rag'
  if (target === '/engine_control') return 'engine_control'
  if (target === '/data_ingestion') return 'data_ingestion'
  if (target === '/v2_pipeline_admin') return 'v2_pipeline_admin'
  if (target === '/admin_library') return 'admin_library'
  if (target === '/youtube_importer') return 'youtube_importer'
  if (target === '/system_observability') return 'system_observability'

  return 'home'
}

function getInitialLibraryTab(): MainTab {
  if (typeof window === 'undefined') return 'home'
  const searchParams = new URLSearchParams(window.location.search)
  const tabParam = searchParams.get('tab')
  const validTabs: MainTab[] = ['home', 'categories', 'authors', 'narrators', 'featured', 'media', 'courses', 'favorites', 'downloads']
  if (tabParam && validTabs.includes(tabParam as MainTab)) {
    return tabParam as MainTab
  }
  return 'home'
}

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
  const initialView = getInitialView()
  const [view, setView] = useState<View>(initialView)
  const [hasVisitedKnowledge, setHasVisitedKnowledge] = useState(initialView === 'knowledge')
  const [libraryTab, setLibraryTab] = useState<MainTab>(getInitialLibraryTab)
  const [isLibraryScrolled, setIsLibraryScrolled] = useState(getInitialLibraryTab() !== 'home')
  const [selectedScholar, setSelectedScholar] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return new URLSearchParams(window.location.search).get('scholar') || null
  })
  const [pendingQuestion, setPendingQuestion] = useState<string | undefined>()
  const [pendingBook, setPendingBook] = useState<{ id: number | string; title: string; author: string } | null>(null)
  const { isAuthenticated } = useAuth()
  const { isDark } = useTheme()

  const navigate = useCallback((newView: View, replace = false) => {
    if (newView === 'knowledge') {
      setHasVisitedKnowledge(true)
    }
    window.scrollTo({ top: 0, behavior: 'instant' })
    setView(newView)

    const newPath = VIEW_TO_PATH[newView] || '/'
    const currentPath = window.location.pathname
    if (currentPath !== newPath || window.location.search) {
      if (replace) {
        window.history.replaceState({ view: newView }, '', newPath)
      } else {
        window.history.pushState({ view: newView }, '', newPath)
      }
    }
  }, [])

  // Sync state with browser back/forward buttons
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const stateView = e.state?.view as View | undefined
      if (stateView && VIEW_TO_PATH[stateView]) {
        setView(stateView)
        if (stateView === 'knowledge') setHasVisitedKnowledge(true)
      } else {
        const detected = getInitialView()
        setView(detected)
        if (detected === 'knowledge') setHasVisitedKnowledge(true)
      }

      if (window.location.pathname.startsWith('/library')) {
        const tab = getInitialLibraryTab()
        setLibraryTab(tab)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Initial URL cleanup/synchronization
  useEffect(() => {
    const expectedPath = VIEW_TO_PATH[view] || '/'
    if (window.location.hash) {
      window.history.replaceState({ view }, '', expectedPath)
    } else if (window.location.pathname !== expectedPath && !window.location.search) {
      window.history.replaceState({ view }, '', expectedPath)
    } else if (!window.history.state?.view) {
      window.history.replaceState({ view }, '', window.location.pathname + window.location.search)
    }
  }, [])

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
  
  const handleLibraryTabChange = useCallback((tab: MainTab) => {
    setLibraryTab((prev: any) => (prev === tab ? prev : tab))
    const search = tab === 'home' ? '' : `?tab=${tab}`
    const targetUrl = `/library${search}`
    window.history.replaceState({ view: 'knowledge', tab }, '', targetUrl)
  }, [])

  const handleLibraryScrolledChange = useCallback((scrolled: boolean) => {
    setIsLibraryScrolled((prev) => (prev === scrolled ? prev : scrolled))
  }, [])

  const openKnowledge = useCallback((tab?: any) => {
    const validTabs: MainTab[] = ['home', 'categories', 'authors', 'narrators', 'featured', 'media', 'courses', 'favorites', 'downloads']
    const resolvedTab: MainTab = (typeof tab === 'string' && validTabs.includes(tab as MainTab)) ? (tab as MainTab) : 'home'
    setLibraryTab(resolvedTab)
    setHasVisitedKnowledge(true)
    if (resolvedTab !== 'home') {
      setIsLibraryScrolled(true)
    } else {
      setIsLibraryScrolled(false)
    }
    window.scrollTo({ top: 0, behavior: 'instant' })
    setView('knowledge')

    const search = resolvedTab === 'home' ? '' : `?tab=${resolvedTab}`
    const targetUrl = `/library${search}`
    if (window.location.pathname !== '/library' || window.location.search !== search) {
      window.history.pushState({ view: 'knowledge', tab: resolvedTab }, '', targetUrl)
    }
  }, [])
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
          pendingBook={pendingBook}
          onNavigateHome={() => navigate('home')}
          onOpenKnowledge={openKnowledge}
          onOpenStudy={openStudy}
          onOpenLessons={openLessons}
          onOpenAdmin={openAdmin}
          onOpenTurathRag={openTurathRag}
          onOpenEngineControl={openEngineControl}
          onOpenDataIngestion={openDataIngestion}
          onOpenV2PipelineAdmin={openV2PipelineAdmin}
          onOpenAdminLibrary={openAdminLibrary}
          onOpenYoutubeImporter={openYoutubeImporter}
          onOpenSystemObservability={openSystemObservability}
          onLogin={() => navigate('login')}
        />
      )
    }
    if (view === 'voice') {
      return <VoiceScreen onExit={() => navigate('home')} onOpenText={() => navigate('chat')} />
    }
    if (view === 'study') {
      return (
        <StudyMode
          onExit={() => navigate('home')}
          onNavigateHome={() => navigate('home')}
          onTryChat={openChat}
          onLogin={() => navigate('login')}
          onOpenKnowledge={openKnowledge}
          onOpenVoiceChat={openVoice}
          onOpenLessons={openLessons}
          onOpenAdmin={openAdmin}
          onOpenTurathRag={openTurathRag}
          onOpenEngineControl={openEngineControl}
          onOpenDataIngestion={openDataIngestion}
          onOpenV2PipelineAdmin={openV2PipelineAdmin}
          onOpenAdminLibrary={openAdminLibrary}
          onOpenYoutubeImporter={openYoutubeImporter}
          onOpenSystemObservability={openSystemObservability}
        />
      )
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
            onLogin={() => navigate('login')}
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
              window.history.pushState({ view: 'scholar_profile', scholar: id }, '', `/scholar?scholar=${encodeURIComponent(id)}`)
              setView('scholar_profile')
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
            onLogin={() => navigate('login')}
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
                librarySubTab={libraryTab}
                onNavigateHome={() => navigate('home')}
                onTryChat={openChat}
                onLogin={() => navigate('login')}
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
              activeTab={libraryTab}
              initialTab={libraryTab}
              onTabChange={handleLibraryTabChange}
              onScrolledPastSearchChange={handleLibraryScrolledChange}
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

