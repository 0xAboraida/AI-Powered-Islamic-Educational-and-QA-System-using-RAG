import React, { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'
import { useTheme } from '../../../../contexts/ThemeContext'
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
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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

        {/* Input Bar (مطابق تماماً لمساعد زاد في قارئ المكتبة) */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 z-20 pb-3 sm:pb-5 pointer-events-none">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!input.trim() || !currentChunkId || loading) return
              handleSend()
              if (textareaRef.current) {
                textareaRef.current.style.height = 'auto'
              }
            }}
            className="flex flex-col w-full max-w-2xl mx-auto gap-2 relative pointer-events-auto"
          >
            <div className="gradient-border min-w-0 flex-1 rounded-[22px] p-[2px] shadow-lg shadow-primary/20 transition-all duration-300">
              <div className={`flex items-end gap-2 rounded-[20px] py-1.5 pr-4 pl-2 transition-all duration-300 ${
                isDark ? 'bg-[#0f1422]' : 'bg-white'
              }`}>
                <textarea
                  ref={textareaRef}
                  rows={1}
                  className={`font-sans min-w-0 flex-1 resize-none bg-transparent py-2 text-sm outline-none placeholder:opacity-50 [&::-webkit-scrollbar]:hidden ${
                    isDark ? 'text-white placeholder:text-white/40' : 'text-slate-900 placeholder:text-slate-400'
                  }`}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value)
                    if (textareaRef.current) {
                      textareaRef.current.style.height = 'auto'
                      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      if (!input.trim() || !currentChunkId || loading) return
                      handleSend()
                      if (textareaRef.current) {
                        textareaRef.current.style.height = 'auto'
                      }
                    }
                  }}
                  placeholder="اكتب سؤالك هنا..."
                  disabled={!currentChunkId || loading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || !currentChunkId || loading}
                  onMouseDown={(e) => e.preventDefault()}
                  className="brand-gradient flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-lg shadow-primary/30 transition-transform hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0 cursor-pointer"
                >
                  <Send className="h-4 w-4 rtl:-scale-x-100" />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
