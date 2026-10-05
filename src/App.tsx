import 'regenerator-runtime/runtime'
import React, { useEffect, useState } from 'react'
import darkLogo from '@/assets/images/ZadDarkLogo.png'
import Navbar from './components/layout/Navbar'
import Hero from './components/layout/Hero'
import FeatureCards from './components/layout/FeatureCards'
import HowItWorks from './components/layout/HowItWorks'
import Showcase from './components/layout/Showcase'
import CTA from './components/layout/CTA'
import Footer from './components/layout/Footer'
import ChatScreen from './features/chat/ChatScreen'
import VoiceScreen from './features/voice/VoiceScreen'
import KnowledgeBase from './features/knowledge/KnowledgeBase'
import StudyMode from './features/study/StudyMode'
import AdminDashboard from './features/admin/AdminDashboard'
import AuthPage from './features/auth/AuthPage'
import type { Book } from './features/knowledge/data'
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

type View = 'home' | 'chat' | 'voice' | 'knowledge' | 'study' | 'admin' | 'turath_rag' | 'data_ingestion' | 'v2_pipeline_admin' | 'admin_library' | 'youtube_importer' | 'lessons' | 'scholar_profile' | 'system_observability' | 'login' | 'signup'

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
  const [selectedScholar, setSelectedScholar] = useState<string | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)
  const [pendingQuestion, setPendingQuestion] = useState<string | undefined>()
  const [pendingBook, setPendingBook] = useState<{ id: number | string; title: string; author: string } | null>(null)
  const { isAuthenticated } = useAuth()
  const { isDark } = useTheme()

  const navigate = (newView: View) => {
    if (view === newView) return
    setIsNavigating(true)
    setTimeout(() => {
      // @ts-ignore - View Transitions API
      if (document.startViewTransition) {
        // @ts-ignore
        document.startViewTransition(() => {
          setView(newView)
          setIsNavigating(false)
        })
      } else {
        setView(newView)
        setIsNavigating(false)
      }
    }, 300)
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
  const openKnowledge = () => navigate('knowledge')
  const openStudy = () => isAuthenticated ? navigate('study') : navigate('login')
  const openAdmin = () => navigate('admin')
  const openTurathRag = () => navigate('turath_rag')
  const openDataIngestion = () => navigate('data_ingestion')
  const openV2PipelineAdmin = () => navigate('v2_pipeline_admin')
  const openAdminLibrary = () => navigate('admin_library')
  const openYoutubeImporter = () => navigate('youtube_importer')
  const openLessons = () => navigate('lessons')
  const openSystemObservability = () => navigate('system_observability')

  const renderView = () => {
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
    if (view === 'knowledge') {
      return (
        <KnowledgeBase
          onExit={() => navigate('home')}
          onAskBook={askAboutBook}
          onLogin={() => navigate('login')}
          onNavigateGlobal={(targetView) => navigate(targetView as View)}
        />
      )
    }
    if (view === 'study') {
      return <StudyMode onExit={() => navigate('home')} />
    }
    if (view === 'turath_rag') {
      return <TurathRagPage onExit={() => navigate('home')} />
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
        <div className="min-h-screen bg-black">
          <LessonsPage 
            onBack={() => navigate('home')}
            onNavigateToScholar={(id) => {
              setSelectedScholar(id)
              navigate('scholar_profile')
            }} 
            onNavigateToImporter={() => navigate('youtube_importer')}
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

    return (
      <div dir="rtl" className={`min-h-screen bg-background text-foreground transition-colors duration-300 ${isDark ? 'dark' : ''}`}>
        <Navbar
          onTryChat={openChat}
          onOpenKnowledge={openKnowledge}
          onOpenStudy={openStudy}
          onOpenAdmin={openAdmin}
          onOpenTurathRag={openTurathRag}
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
          <HowItWorks />
          <Showcase />
          <CTA onTryChat={openChat} />
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <StudyProvider>
      <div className="relative min-h-screen w-full overflow-hidden bg-background">
        <div
          key={view === 'login' || view === 'signup' ? 'auth' : view}
          className="min-h-screen w-full"
        >
          {renderView()}
        </div>
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

