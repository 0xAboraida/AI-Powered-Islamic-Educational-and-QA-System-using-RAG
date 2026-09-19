import React, { useState, useEffect } from 'react'
import { MessageCircle, X } from 'lucide-react'
import TextareaAutosize from 'react-textarea-autosize'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import VoiceRecordButton from '../../../../components/ui/VoiceRecordButton'
import type { Message } from '../../../../contexts/StudyContext'
import whiteLogo from '@/assets/images/WhiteLogo.png'
import { Bubble, TypingBubble } from '../../../chat/components/ChatBubble'
import { StickyStudyPlanHeader } from '../../components/StickyStudyPlanHeader'
import { StudyWelcomeActionCards } from './StudyWelcomeActionCards'
import { PlanApprovalCard } from './PlanApprovalCard'

export function StudyChatPanel({
  messages,
  loading,
  chatEndRef,
  input,
  setInput,
  handleSend,
  currentChunkId,
  sessionId,
  chunkTitle,
  onClose,
  onSelectStartOption,
  pendingPlanSteps = [],
  onApprovePlan,
  onStepComplete,
  panelWidth = 750,
  isDark = true
}: {
  messages: Message[]
  loading: boolean
  chatEndRef: React.RefObject<HTMLDivElement | null>
  input: string
  setInput: (v: string) => void
  handleSend: () => void
  currentChunkId: string | null
  sessionId?: number | string | null
  chunkTitle?: string
  onClose?: () => void
  onSelectStartOption?: (optionKey: 'plan' | 'summary' | 'chat') => void
  pendingPlanSteps?: string[]
  onApprovePlan?: (firstStepTitle: string) => void
  onStepComplete?: (stepId: number) => void
  panelWidth?: number
  startResizing?: (e: React.MouseEvent) => void
  isDark?: boolean
}) {
  const [baseInput, setBaseInput] = useState('')
  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition()

  useEffect(() => {
    if (listening) {
      const newText = baseInput ? `${baseInput} ${transcript}` : transcript
      setInput(newText.trim())
    }
  }, [transcript, listening, baseInput])

  const activeKeyId = sessionId || currentChunkId

  return (
    <>
      <div
        style={{
          width: panelWidth ? panelWidth : '100%',
        }}
        className={`flex-1 w-full min-w-[280px] flex flex-col relative h-full overflow-hidden transition-colors bg-transparent border-l ${isDark
            ? 'border-white/10 text-white'
            : 'border-slate-200 text-slate-900'
          }`}
      >
        {/* Unified Single-Row Merged Header (Title + Progress + Action + Close) */}
        <StickyStudyPlanHeader
          keyId={activeKeyId}
          isDark={isDark}
          loading={loading}
          onClose={onClose}
          onStepComplete={onStepComplete}
        />

        {/* Messages & Welcome Options Scroll Area */}
        <div 
          className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6 space-y-4 sm:space-y-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          style={{
            maskImage: 'linear-gradient(to bottom, black calc(100% - 80px), transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black calc(100% - 80px), transparent 100%)'
          }}
        >
          {/* Initial Welcome 3 Interactive Action Cards */}
          {currentChunkId && onSelectStartOption && messages.length === 0 && !loading && (
            <StudyWelcomeActionCards
              chunkTitle={chunkTitle}
              isDark={isDark}
              onSelectOption={onSelectStartOption}
            />
          )}

          {messages.length === 0 && !currentChunkId && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <span className="brand-gradient flex h-20 w-20 items-center justify-center rounded-3xl shadow-xl shadow-primary/30 p-3">
                <img src={whiteLogo} alt="Zad Logo" className="w-full h-full object-contain drop-shadow-md" />
              </span>
              <h2 className={`mt-6 font-display text-2xl ${isDark ? 'text-white' : 'text-slate-900'}`}>مرحباً بك في زاد</h2>
              <p className={`mt-2 max-w-md ${isDark ? 'text-white/75' : 'text-slate-600'}`}>اختر درساً من الفهرس الجانبي لبدء الدراسة التفاعلية.</p>
            </div>
          )}

          {messages.map((msg) => (
            <Bubble key={msg.id} message={msg as any} dark={isDark} />
          ))}

          {/* Interactive Plan Approval Button Card */}
          {activeKeyId && pendingPlanSteps && pendingPlanSteps.length > 0 && onApprovePlan && (
            <PlanApprovalCard
              keyId={activeKeyId}
              extractedSteps={pendingPlanSteps}
              isDark={isDark}
              onApprovePlan={onApprovePlan}
            />
          )}

          {loading && <TypingBubble dark={isDark} />}
          <div ref={chatEndRef} className="h-28 w-full shrink-0" />
        </div>

        {/* Input Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-20 pb-6 pointer-events-none">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex w-full max-w-2xl mx-auto items-end gap-3 pointer-events-auto"
          >
            <div className="gradient-border min-w-0 flex-1 rounded-[24px] p-[2.5px] shadow-xl shadow-primary/25 transition-all duration-300">
              <div className={`flex items-end gap-2 rounded-[22px] py-1.5 pr-4 pl-2 backdrop-blur-md ${isDark ? 'bg-[#1a0730]/90 text-white' : 'bg-white text-slate-900 border border-slate-200'
                }`}>
                <VoiceRecordButton
                  listening={listening}
                  dark={isDark}
                  browserSupportsSpeechRecognition={browserSupportsSpeechRecognition}
                  onClick={() => {
                    if (listening) {
                      SpeechRecognition.stopListening()
                    } else {
                      setBaseInput(input)
                      resetTranscript()
                      SpeechRecognition.startListening({ language: 'ar-SA', continuous: true })
                    }
                  }}
                />
                <TextareaAutosize
                  minRows={1}
                  maxRows={4}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  placeholder={currentChunkId ? "اكتب سؤالك الشرعي هنا لزاد…" : "اختر درساً أولاً لتبدأ المحادثة…"}
                  disabled={!currentChunkId || loading}
                  aria-label="اكتب سؤالك"
                  className={`font-sans min-w-0 flex-1 resize-none bg-transparent py-2.5 text-base outline-none disabled:opacity-50 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${isDark ? 'text-white placeholder:text-white/50' : 'text-slate-900 placeholder:text-slate-400'
                    }`}
                />
                <button
                  type="submit"
                  aria-label="اسأل زاد"
                  disabled={!input.trim() || !currentChunkId || loading}
                  className="brand-gradient flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white shadow-lg shadow-primary/30 transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50 disabled:hover:translate-y-0 cursor-pointer"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 -scale-x-100">
                    <path
                      d="M6 12h13M13 6l6 6-6 6"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
