import { useTheme, type AccentColor } from '@/contexts/ThemeContext'
import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import whiteLogo from '@/assets/images/WhiteLogo.png'
import zadDarkLogo from '@/assets/images/ZadDarkLogo.png'
import { Volume2, VolumeX, Copy, Check, Pause, Play, Square, Loader2, Gauge, Download, Sparkles, Eraser } from 'lucide-react'
import {
  speakText,
  stopAllSpeech,
  pauseSpeech,
  resumeSpeech,
  setMuteState,
  setPlaybackSpeed,
  setVoiceName,
  getVoiceName,
  downloadAudioFile,
  AVAILABLE_VOICES,
  VoiceName
} from '@/services/geminiTtsService'
import {
  highlightRange,
  removeHighlightsFromRange,
  removeHighlightById,
  saveChatMessageHighlight,
  removeChatMessageHighlight
} from '@/utils/highlightUtils'

interface TextSelectionToolbarProps {
  dark?: boolean
}

const SPEED_OPTIONS = [1.0, 1.25, 1.5, 2.0, 0.8]


function getSelectionToolbarTokens(accentColor: AccentColor = 'purple', isDark: boolean = true) {
  switch (accentColor) {
    case 'blue':
      return {
        toolbarBorder: isDark
          ? 'border-sky-400/40 shadow-[0_4px_25px_rgba(56,189,248,0.25)]'
          : 'border-blue-400/80 ring-1 ring-blue-400/20 shadow-xl',
        primaryBtn: isDark
          ? 'text-sky-200 bg-sky-500/20 border border-sky-400/40 hover:bg-sky-500/30'
          : 'text-white bg-blue-600 border border-blue-700 hover:bg-blue-700 shadow-blue-600/20',
        primaryBtnIcon: isDark ? 'text-sky-300' : 'text-white',
        explainBtn: isDark
          ? 'text-sky-300 bg-sky-500/10 border border-sky-400/30 hover:bg-sky-500/25'
          : 'text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100',
        activeControl: isDark
          ? 'text-sky-300 bg-sky-500/15 border border-sky-400/30 hover:bg-sky-500/25'
          : 'text-blue-900 bg-blue-50 border border-blue-200 hover:bg-blue-100',
        activeIcon: isDark ? 'text-sky-400 hover:bg-sky-500/20' : 'text-blue-700 hover:bg-blue-100',
        activeDropdownBorder: isDark ? 'border-sky-400/40' : 'border-blue-300',
        activeOptionBg: isDark ? 'bg-sky-500/25 border-sky-400/40 text-sky-200' : 'bg-blue-50 text-blue-900',
        confirmPrimaryBtn: 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25 text-white',
        confirmIconBox: 'bg-blue-500/20 text-sky-400 border border-sky-400/30',
        confirmAccentText: 'text-sky-400',
      }
    case 'emerald':
      return {
        toolbarBorder: isDark
          ? 'border-teal-400/40 shadow-[0_4px_25px_rgba(45,212,191,0.25)]'
          : 'border-emerald-400/80 ring-1 ring-emerald-400/20 shadow-xl',
        primaryBtn: isDark
          ? 'text-teal-200 bg-teal-500/20 border border-teal-400/40 hover:bg-teal-500/30'
          : 'text-white bg-emerald-600 border border-emerald-700 hover:bg-emerald-700 shadow-emerald-600/20',
        primaryBtnIcon: isDark ? 'text-teal-300' : 'text-white',
        explainBtn: isDark
          ? 'text-teal-300 bg-teal-500/10 border border-teal-400/30 hover:bg-teal-500/25'
          : 'text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100',
        activeControl: isDark
          ? 'text-teal-300 bg-teal-500/15 border border-teal-400/30 hover:bg-teal-500/25'
          : 'text-emerald-900 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100',
        activeIcon: isDark ? 'text-teal-400 hover:bg-teal-500/20' : 'text-emerald-700 hover:bg-emerald-100',
        activeDropdownBorder: isDark ? 'border-teal-400/40' : 'border-emerald-300',
        activeOptionBg: isDark ? 'bg-teal-500/25 border-teal-400/40 text-teal-200' : 'bg-emerald-50 text-emerald-900',
        confirmPrimaryBtn: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25 text-white',
        confirmIconBox: 'bg-teal-500/20 text-teal-300 border border-teal-400/30',
        confirmAccentText: 'text-teal-300',
      }
    case 'amber':
      return {
        toolbarBorder: isDark
          ? 'border-[#dfbf83]/40 shadow-[0_4px_25px_rgba(223,191,131,0.25)]'
          : 'border-[#b88d46]/60 ring-1 ring-[#dfbf83]/30 shadow-xl',
        primaryBtn: isDark
          ? 'text-[#f5ebd7] bg-[#dfbf83]/20 border border-[#dfbf83]/40 hover:bg-[#dfbf83]/30'
          : 'text-stone-950 bg-[#b88d46] border border-[#dfbf83] hover:bg-[#a67c38] shadow-amber-900/20',
        primaryBtnIcon: isDark ? 'text-[#dfbf83]' : 'text-stone-950',
        explainBtn: isDark
          ? 'text-[#dfbf83] bg-[#dfbf83]/10 border border-[#dfbf83]/30 hover:bg-[#dfbf83]/25'
          : 'text-[#8a652a] bg-amber-50 border border-amber-200 hover:bg-amber-100',
        activeControl: isDark
          ? 'text-[#dfbf83] bg-[#dfbf83]/15 border border-[#dfbf83]/30 hover:bg-[#dfbf83]/25'
          : 'text-stone-900 bg-[#fbf8f0] border border-[#ebd9b5] hover:bg-amber-50',
        activeIcon: isDark ? 'text-[#dfbf83] hover:bg-[#dfbf83]/20' : 'text-[#8a652a] hover:bg-amber-100',
        activeDropdownBorder: isDark ? 'border-[#dfbf83]/40' : 'border-[#dfbf83]',
        activeOptionBg: isDark ? 'bg-[#dfbf83]/25 border-[#dfbf83]/40 text-[#f5ebd7]' : 'bg-[#fbf8f0] text-stone-900',
        confirmPrimaryBtn: 'bg-[#b88d46] hover:bg-[#a67c38] shadow-amber-900/25 text-stone-950 font-bold',
        confirmIconBox: 'bg-[#dfbf83]/20 text-[#dfbf83] border border-[#dfbf83]/30',
        confirmAccentText: 'text-[#dfbf83]',
      }
    case 'purple':
    default:
      return {
        toolbarBorder: isDark
          ? 'border-[#b51ee7]/40 shadow-[0_4px_25px_rgba(181,30,231,0.3)]'
          : 'border-[#800080]/50 ring-1 ring-[#800080]/20 shadow-xl',
        primaryBtn: isDark
          ? 'text-white bg-[#b51ee7]/25 border border-[#b51ee7]/40 hover:bg-[#b51ee7]/35'
          : 'text-white bg-[#800080] border border-[#800080] hover:bg-[#6b006b] shadow-purple-900/20',
        primaryBtnIcon: isDark ? 'text-[#b51ee7]' : 'text-white',
        explainBtn: isDark
          ? 'text-[#b51ee7] bg-[#b51ee7]/15 border border-[#b51ee7]/30 hover:bg-[#b51ee7]/25'
          : 'text-[#800080] bg-purple-50 border border-purple-200 hover:bg-purple-100',
        activeControl: isDark
          ? 'text-[#b51ee7] bg-[#b51ee7]/15 border border-[#b51ee7]/30 hover:bg-[#b51ee7]/25'
          : 'text-purple-900 bg-purple-50 border border-purple-200 hover:bg-purple-100',
        activeIcon: isDark ? 'text-[#b51ee7] hover:bg-[#b51ee7]/20' : 'text-[#800080] hover:bg-purple-100',
        activeDropdownBorder: isDark ? 'border-[#b51ee7]/40' : 'border-[#800080]/30',
        activeOptionBg: isDark ? 'bg-[#b51ee7]/25 border-[#b51ee7]/40 text-white' : 'bg-purple-50 text-purple-900',
        confirmPrimaryBtn: 'bg-[#800080] hover:bg-[#6b006b] shadow-purple-900/25 text-white',
        confirmIconBox: 'bg-[#b51ee7]/20 text-[#b51ee7] border border-[#b51ee7]/30',
        confirmAccentText: 'text-[#b51ee7]',
      }
  }
}

export function TextSelectionToolbar({ dark }: TextSelectionToolbarProps) {
  const { accentColor, isDark: themeIsDark } = useTheme()
  const isDark = dark ?? themeIsDark ?? true
  const themeTokens = getSelectionToolbarTokens(accentColor, isDark)
  const [selectedText, setSelectedText] = useState('')
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const [copied, setCopied] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isDownloaded, setIsDownloaded] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  // Audio State
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentSpeed, setCurrentSpeed] = useState(1.0)
  const [currentVoice, setCurrentVoice] = useState<VoiceName>(getVoiceName())
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [showVoiceMenu, setShowVoiceMenu] = useState(false)

  const toolbarRef = useRef<HTMLDivElement>(null)
  const isInteractingRef = useRef(false)
  const collapseTimerRef = useRef<number | null>(null)
  const scrollAnimFrameRef = useRef<number | null>(null)

  const [isLibrarySelection, setIsLibrarySelection] = useState(false)
  const [hasHighlightSelected, setHasHighlightSelected] = useState(false)

  // Global double-click event listener to un-highlight text
  useEffect(() => {
    const handleDoubleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      const highlightSpan = target?.closest('[data-user-highlight="true"]') as HTMLElement | null
      if (highlightSpan) {
        e.stopPropagation()
        const removedText = highlightSpan.textContent || ''
        const highlightId = highlightSpan.getAttribute('data-highlight-id')
        const messageContainer = highlightSpan.closest('[data-message-id]')
        const messageId = messageContainer?.getAttribute('data-message-id')

        if (highlightId) {
          removeHighlightById(highlightId)
        } else {
          const parent = highlightSpan.parentNode
          if (parent) {
            while (highlightSpan.firstChild) {
              parent.insertBefore(highlightSpan.firstChild, highlightSpan)
            }
            parent.removeChild(highlightSpan)
            parent.normalize()
          }
        }

        if (messageId && (highlightId || removedText)) {
          removeChatMessageHighlight(messageId, highlightId || removedText)
        }

        window.dispatchEvent(new CustomEvent('textHighlightRemoved', {
          detail: { text: removedText, id: highlightId }
        }))
        window.getSelection()?.removeAllRanges()
        setPosition(null)
        setSelectedText('')
      }
    }

    document.addEventListener('dblclick', handleDoubleClick)
    return () => {
      document.removeEventListener('dblclick', handleDoubleClick)
    }
  }, [])

  useEffect(() => {
    const computePosition = (range: Range): { top: number; left: number } | null => {
      const rect = range.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return null

      // Check if scrolled completely out of screen bounds
      if (rect.bottom < 15 || rect.top > window.innerHeight + 15) {
        return null
      }

      const isMobile = window.innerWidth < 640
      const approxToolbarWidth = isMobile ? 260 : 350
      const topOffset = isMobile ? 42 : 52
      const top = rect.top < (topOffset + 15) ? Math.max(50, rect.bottom + 6) : rect.top - topOffset
      const halfWidth = approxToolbarWidth / 2
      const left = Math.max(8, Math.min(window.innerWidth - approxToolbarWidth - 8, rect.left + rect.width / 2 - halfWidth))
      return { top, left }
    }

    const handleSelectionChange = () => {
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed) {
        if (!isPlaying && !isPaused && !isLoading && !isInteractingRef.current) {
          if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current)
          collapseTimerRef.current = window.setTimeout(() => {
            const currentSel = window.getSelection()
            if ((!currentSel || currentSel.isCollapsed) && !isInteractingRef.current) {
              setPosition(null)
              setSelectedText('')
              setIsLibrarySelection(false)
              setHasHighlightSelected(false)
            }
          }, 140)
        }
        return
      }

      // Valid active selection - cancel any pending collapse
      if (collapseTimerRef.current) {
        clearTimeout(collapseTimerRef.current)
      }

      const text = selection.toString().trim()
      if (text.length < 2) {
        if (!isPlaying && !isPaused && !isLoading && !isInteractingRef.current) {
          if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current)
          collapseTimerRef.current = window.setTimeout(() => {
            const currentSel = window.getSelection()
            if ((!currentSel || currentSel.toString().trim().length < 2) && !isInteractingRef.current) {
              setPosition(null)
              setSelectedText('')
              setIsLibrarySelection(false)
              setHasHighlightSelected(false)
            }
          }, 140)
        }
        return
      }

      if (selection.rangeCount === 0) return
      const range = selection.getRangeAt(0)

      let containerNode: Node | null = range.commonAncestorContainer
      if (containerNode.nodeType === Node.TEXT_NODE) {
        containerNode = containerNode.parentElement
      }
      const targetElement = containerNode as HTMLElement | null

      // Check if selection is within an allowed selectable container (AI response bubble or library text)
      const selectableParent = targetElement?.closest('[data-selectable="true"]') ||
                               targetElement?.closest('.selectable-content') ||
                               targetElement?.closest('.ai-response-bubble') ||
                               targetElement?.closest('.library-reader-content') ||
                               targetElement?.closest('.study-reader-content') ||
                               targetElement?.closest('.turath-content') ||
                               range.startContainer.parentElement?.closest('[data-selectable="true"]') ||
                               range.endContainer.parentElement?.closest('[data-selectable="true"]')

      if (!selectableParent) {
        if (!isPlaying && !isPaused && !isLoading && !isInteractingRef.current) {
          setPosition(null)
          setSelectedText('')
          setIsLibrarySelection(false)
          setHasHighlightSelected(false)
        }
        return
      }

      // Check if selection is within Library reader specifically (to show "اشرح لي")
      const isLibrary = targetElement?.closest('[data-library-content="true"]') !== null ||
                        targetElement?.closest('.library-reader-content') !== null ||
                        targetElement?.closest('.study-reader-content') !== null ||
                        targetElement?.closest('.turath-content') !== null ||
                        selectableParent?.closest('[data-library-content="true"]') !== null

      setIsLibrarySelection(isLibrary)

      // Check if current selection contains or is inside a highlight
      let isHighlighted = targetElement?.closest('[data-user-highlight="true"]') !== null
      if (!isHighlighted && targetElement) {
        const marks = targetElement.querySelectorAll('[data-user-highlight="true"]')
        for (let i = 0; i < marks.length; i++) {
          if (range.intersectsNode(marks[i])) {
            isHighlighted = true
            break
          }
        }
      }
      setHasHighlightSelected(isHighlighted)

      const newPos = computePosition(range)
      if (newPos) {
        setSelectedText(text)
        setPosition(newPos)
      }
    }

    const handleScroll = () => {
      if (scrollAnimFrameRef.current) {
        cancelAnimationFrame(scrollAnimFrameRef.current)
      }
      scrollAnimFrameRef.current = window.requestAnimationFrame(() => {
        const selection = window.getSelection()
        if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0)
          const newPos = computePosition(range)
          if (newPos) {
            setPosition(newPos)
          }
        }
      })
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    document.addEventListener('mouseup', handleSelectionChange)
    document.addEventListener('touchend', handleSelectionChange)
    document.addEventListener('keyup', handleSelectionChange)
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true })

    return () => {
      if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current)
      if (scrollAnimFrameRef.current) cancelAnimationFrame(scrollAnimFrameRef.current)
      document.removeEventListener('selectionchange', handleSelectionChange)
      document.removeEventListener('mouseup', handleSelectionChange)
      document.removeEventListener('touchend', handleSelectionChange)
      document.removeEventListener('keyup', handleSelectionChange)
      window.removeEventListener('scroll', handleScroll, { capture: true })
    }
  }, [isPlaying, isPaused, isLoading])

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      if (isPlaying) {
        stopAllSpeech()
      }
    }
  }, [isPlaying])

  // Dismiss menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setShowSpeedMenu(false)
        setShowVoiceMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!position || !selectedText) return null

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(selectedText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const applyHighlight = (color: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0) return

      const range = selection.getRangeAt(0)
      let containerNode: Node | null = range.commonAncestorContainer
      if (containerNode.nodeType === Node.TEXT_NODE) {
        containerNode = containerNode.parentElement
      }
      const targetEl = containerNode as HTMLElement | null
      const pageEl = targetEl?.closest('[data-page]')
      const pageNum = pageEl?.getAttribute('data-page') ? parseInt(pageEl.getAttribute('data-page')!, 10) : undefined

      const msgBubbleEl = targetEl?.closest('[data-message-id]')
      const messageId = msgBubbleEl?.getAttribute('data-message-id')

      const textHighlighted = selectedText
      const highlightId = `hl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

      // 1. Physically apply highlight marks across the DOM selection
      highlightRange(range, color, highlightId)

      // 2. Persist in localStorage if inside a chat message
      if (messageId) {
        saveChatMessageHighlight(messageId, {
          id: highlightId,
          text: textHighlighted,
          color
        })
      }

      // 3. Dispatch custom event for readers / listeners (like TurathReader)
      window.dispatchEvent(new CustomEvent('textHighlightCreated', {
        detail: {
          text: textHighlighted,
          color,
          page: pageNum,
          id: highlightId
        }
      }))

      selection.removeAllRanges()
      setPosition(null)
      setHasHighlightSelected(false)
    } catch (err) {
      console.warn("Could not highlight text.", err)
    }
  }

  const removeHighlight = (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0) return

      const range = selection.getRangeAt(0)
      let containerNode: Node | null = range.commonAncestorContainer
      if (containerNode.nodeType === Node.TEXT_NODE) {
        containerNode = containerNode.parentElement
      }
      const targetEl = containerNode as HTMLElement | null
      const msgBubbleEl = targetEl?.closest('[data-message-id]')
      const messageId = msgBubbleEl?.getAttribute('data-message-id')

      const removedTexts = removeHighlightsFromRange(range)

      if (messageId && removedTexts.length > 0) {
        removedTexts.forEach(t => removeChatMessageHighlight(messageId, t))
      }

      removedTexts.forEach(text => {
        window.dispatchEvent(new CustomEvent('textHighlightRemoved', {
          detail: { text }
        }))
      })

      selection.removeAllRanges()
      setPosition(null)
      setHasHighlightSelected(false)
    } catch (err) {
      console.warn("Could not remove highlight.", err)
    }
  }

  const triggerDownloadConfirmation = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowConfirmModal(true)
  }

  const executeConfirmedDownload = async () => {
    setShowConfirmModal(false)
    if (!selectedText || isDownloading) return
    setIsDownloading(true)
    try {
      const ok = await downloadAudioFile(selectedText, 'زاد_مقطع_محدد.wav', currentVoice)
      if (ok) {
        setIsDownloaded(true)
        setTimeout(() => setIsDownloaded(false), 3000)
      }
    } catch (err) {
      console.error('Failed to download audio selection:', err)
    } finally {
      setIsDownloading(false)
    }
  }

  const handleStartOrToggleSpeech = async (overrideVoice?: VoiceName) => {
    if (!selectedText) return

    if (isPaused && !overrideVoice) {
      resumeSpeech()
      setIsPaused(false)
      setIsPlaying(true)
      return
    }

    if (isPlaying && !overrideVoice) {
      pauseSpeech()
      setIsPaused(true)
      return
    }

    const voiceToUse = overrideVoice || currentVoice

    setIsLoading(true)
    setIsMuted(false)
    setIsPaused(false)
    setMuteState(false)
    setPlaybackSpeed(currentSpeed)

    try {
      await speakText(selectedText, {
        voiceName: voiceToUse,
        playbackRate: currentSpeed,
        onStart: () => {
          setIsLoading(false)
          setIsPlaying(true)
          setIsPaused(false)
        },
        onEnd: () => {
          setIsPlaying(false)
          setIsPaused(false)
          setIsLoading(false)
          setIsMuted(false)
        },
        onError: (err) => {
          console.error('Selection audio playback error:', err)
          setIsPlaying(false)
          setIsPaused(false)
          setIsLoading(false)
          setIsMuted(false)
        },
      })
    } catch (err) {
      console.error('Failed to speak selected text:', err)
      setIsPlaying(false)
      setIsPaused(false)
      setIsLoading(false)
      setIsMuted(false)
    }
  }

  const handleFullStopSpeech = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    stopAllSpeech()
    setIsPlaying(false)
    setIsPaused(false)
    setIsLoading(false)
    setIsMuted(false)
    setShowSpeedMenu(false)
    setShowVoiceMenu(false)
  }

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation()
    const nextMute = !isMuted
    setIsMuted(nextMute)
    setMuteState(nextMute)
  }

  const handleSelectSpeed = (speed: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentSpeed(speed)
    setPlaybackSpeed(speed)
    setShowSpeedMenu(false)
  }

  const handleSelectVoice = (voiceId: VoiceName, e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentVoice(voiceId)
    setVoiceName(voiceId)
    setShowVoiceMenu(false)

    if (isPlaying || isPaused) {
      handleStartOrToggleSpeech(voiceId)
    }
  }

  const selectedVoiceObj = AVAILABLE_VOICES.find(v => v.id === currentVoice) || AVAILABLE_VOICES[0]

  return (
    <div
      ref={toolbarRef}
      onMouseDown={(e) => { e.preventDefault(); isInteractingRef.current = true; }}
      onPointerDown={(e) => { e.preventDefault(); isInteractingRef.current = true; }}
      onTouchStart={(e) => { e.preventDefault(); isInteractingRef.current = true; }}
      onMouseUp={() => { setTimeout(() => { isInteractingRef.current = false; }, 120); }}
      onPointerUp={() => { setTimeout(() => { isInteractingRef.current = false; }, 120); }}
      onTouchEnd={() => { setTimeout(() => { isInteractingRef.current = false; }, 120); }}
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
      className="fixed z-[9999] animate-in fade-in zoom-in-95 duration-150 select-none"
    >
      <div
        className={`flex items-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl shadow-2xl border backdrop-blur-xl max-w-[calc(100vw-16px)] select-none ${
          isDark
            ? 'bg-[#090b10]/95 text-white'
            : 'bg-white text-slate-900'
        } ${themeTokens.toolbarBorder}`}
      >
        {isPlaying || isPaused ? (
          /* Active Playing Controls */
          <div className="flex items-center gap-1.5">
            {/* Play/Pause Button */}
            <button
              onClick={() => handleStartOrToggleSpeech()}
              type="button"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                dark
                  ? 'text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 hover:bg-emerald-500/30'
                  : 'text-emerald-900 bg-emerald-100 border border-emerald-300 hover:bg-emerald-200'
              }`}
            >
              {isPaused ? <Play size={13} className="fill-amber-500 text-amber-500" /> : <Pause size={13} className="fill-emerald-600 text-emerald-600" />}
              <span>{isPaused ? 'استئناف' : 'مؤقت'}</span>
            </button>

            {/* Voice Switcher */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowVoiceMenu(!showVoiceMenu)
                setShowSpeedMenu(false)
              }}
              type="button"
              className={`px-2 py-1 rounded-xl text-xs font-bold transition-all ${
                dark
                  ? 'text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20'
                  : 'text-emerald-900 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <span>{selectedVoiceObj.name}</span>
            </button>

            {/* Mute Toggle */}
            <button
              onClick={handleToggleMute}
              type="button"
              className={`p-1.5 rounded-xl text-xs font-bold transition-all ${
                dark ? 'text-emerald-400 hover:bg-emerald-500/20' : 'text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              {isMuted ? <VolumeX size={14} className="text-amber-500" /> : <Volume2 size={14} />}
            </button>

            {/* Speed Toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowSpeedMenu(!showSpeedMenu)
                setShowVoiceMenu(false)
              }}
              type="button"
              className={`flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-extrabold transition-all ${
                dark
                  ? 'text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20'
                  : 'text-emerald-900 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <Gauge size={12} className={dark ? "text-emerald-400" : "text-emerald-700"} />
              <span>{currentSpeed}x</span>
            </button>

            {/* Download Button */}
            <button
              onClick={triggerDownloadConfirmation}
              type="button"
              title="تحميل المقطع الصوتي كـ WAV"
              className={`p-1.5 rounded-xl text-xs font-bold transition-all ${
                dark ? 'text-emerald-400 hover:bg-emerald-500/20' : 'text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              {isDownloading ? (
                <Loader2 size={13} className={`animate-spin ${dark ? 'text-emerald-400' : 'text-emerald-700'}`} />
              ) : isDownloaded ? (
                <Check size={13} className={dark ? 'text-emerald-400' : 'text-emerald-700'} />
              ) : (
                <Download size={13} />
              )}
            </button>

            {/* Stop Button */}
            <button
              onClick={handleFullStopSpeech}
              type="button"
              className={`p-1.5 rounded-xl text-xs font-bold transition-all ${
                dark ? 'text-rose-400 hover:bg-rose-500/20' : 'text-rose-600 hover:bg-rose-100'
              }`}
            >
              <Square size={12} className="fill-current" />
            </button>
          </div>
        ) : (
          /* Idle Action Menu (Listen + Copy + Highlight) */
          <div className="flex items-center gap-1">
            {/* Highlights */}
            <div className="flex items-center gap-1 sm:gap-1.5 px-1 sm:px-2 py-0.5 sm:py-1 border-l border-r border-transparent">
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onClick={(e) => applyHighlight('#ffb36b', e)}
                style={{ backgroundColor: '#ffb36b', borderColor: '#e5a160' }}
                className="w-4 h-4 sm:w-5 sm:h-5 rounded-full hover:scale-115 hover:shadow-md transition-all shadow-xs border"
                title="تمييز باللون البرتقالي الهادئ"
              />
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onClick={(e) => applyHighlight('#78beff', e)}
                style={{ backgroundColor: '#78beff', borderColor: '#5ea4ec' }}
                className="w-4 h-4 sm:w-5 sm:h-5 rounded-full hover:scale-115 hover:shadow-md transition-all shadow-xs border"
                title="تمييز باللون الأزرق الهادئ"
              />
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onClick={(e) => applyHighlight('#78dc8c', e)}
                style={{ backgroundColor: '#78dc8c', borderColor: '#5bc571' }}
                className="w-4 h-4 sm:w-5 sm:h-5 rounded-full hover:scale-115 hover:shadow-md transition-all shadow-xs border"
                title="تمييز باللون الأخضر الهادئ"
              />
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onClick={(e) => applyHighlight('#ffdc50', e)}
                style={{ backgroundColor: '#ffdc50', borderColor: '#e5c648' }}
                className="w-4 h-4 sm:w-5 sm:h-5 rounded-full hover:scale-115 hover:shadow-md transition-all shadow-xs border"
                title="تمييز باللون الأصفر الهادئ"
              />
              {hasHighlightSelected && (
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onClick={(e) => removeHighlight(e)}
                  className={`p-0.5 sm:p-1 rounded-lg transition-all hover:scale-110 ${
                    isDark ? 'text-rose-400 hover:bg-rose-500/20' : 'text-rose-600 hover:bg-rose-100'
                  }`}
                  title="إزالة التظليل"
                >
                  <Eraser size={13} className="sm:w-[15px] sm:h-[15px]" />
                </button>
              )}
            </div>

            <div className={`h-3.5 sm:h-4 w-[1px] my-auto mx-0.5 sm:mx-1 ${isDark ? 'bg-white/15' : 'bg-slate-300'}`} />

            {/* Explain Button (Library Only) */}
            {isLibrarySelection && (
              <>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.dispatchEvent(new CustomEvent('explainSelectedText', { detail: selectedText }));
                  }}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all shadow-xs ${themeTokens.explainBtn}`}
                >
                  <img src={isDark ? whiteLogo : zadDarkLogo} alt="Zad" className="h-[11px] sm:h-[13px] object-contain opacity-90" />
                  <span>اشرح لي</span>
                </button>
                <div className={`h-3.5 sm:h-4 w-[1px] my-auto mx-0.5 sm:mx-1 ${isDark ? 'bg-white/15' : 'bg-slate-300'}`} />
              </>
            )}

            {/* Listen to Selection Button */}
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onClick={() => handleStartOrToggleSpeech()}
              disabled={isLoading}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-extrabold transition-all shadow-xs ${themeTokens.primaryBtn}`}
            >
              {isLoading ? (
                <Loader2 size={13} className={`animate-spin ${themeTokens.primaryBtnIcon} sm:w-[14px] sm:h-[14px]`} />
              ) : (
                <Volume2 size={13} className={`${themeTokens.primaryBtnIcon} sm:w-[14px] sm:h-[14px]`} />
              )}
              <span className="hidden sm:inline">{isLoading ? 'جاري التحميل...' : 'استمع لهذا الجزء'}</span>
              <span className="sm:hidden">{isLoading ? 'تحميل...' : 'استمع'}</span>
            </button>

            <div className={`h-3.5 sm:h-4 w-[1px] my-auto mx-0.5 sm:mx-1 ${isDark ? 'bg-white/15' : 'bg-slate-300'}`} />

            {/* Copy Selection Button */}
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onClick={handleCopy}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all ${
                isDark
                  ? 'text-slate-300 hover:text-white hover:bg-white/10'
                  : 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200/80'
              }`}
            >
              {copied ? (
                <>
                  <Check size={13} className="text-emerald-400 sm:w-[14px] sm:h-[14px]" />
                  <span className="text-emerald-400">تم!</span>
                </>
              ) : (
                <>
                  <Copy size={13} className={`${isDark ? "text-slate-300" : "text-slate-600"} sm:w-[14px] sm:h-[14px]`} />
                  <span>نسخ</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Speed Dropdown Menu */}
      {showSpeedMenu && (
        <div
          className={`absolute bottom-full mb-1.5 right-0 z-[10000] p-1.5 rounded-xl shadow-2xl border flex gap-1 animate-in fade-in zoom-in-95 ${
            isDark ? `bg-[#090b10]/95 ${themeTokens.activeDropdownBorder} text-slate-200 backdrop-blur-md` : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          {SPEED_OPTIONS.map((speed) => (
            <button
              key={speed}
              onClick={(e) => handleSelectSpeed(speed, e)}
              type="button"
              className={`px-2 py-1 text-xs font-bold rounded-lg transition-all ${
                currentSpeed === speed
                  ? `${themeTokens.confirmPrimaryBtn} shadow-sm`
                  : isDark
                  ? 'hover:bg-white/10 text-slate-300'
                  : 'hover:bg-slate-100 text-slate-800'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      )}

      {/* Voice Dropdown Menu */}
      {showVoiceMenu && (
        <div
          className={`absolute bottom-full mb-1.5 right-0 z-[10000] w-52 p-2 rounded-2xl shadow-2xl border flex flex-col gap-1 animate-in fade-in zoom-in-95 ${
            isDark ? `bg-[#090b10]/95 ${themeTokens.activeDropdownBorder} text-slate-100 backdrop-blur-md` : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <div className={`px-2 py-1 text-[11px] font-bold ${themeTokens.confirmAccentText} border-b border-white/10 mb-1`}>
            اختر صوت المعلم:
          </div>
          {AVAILABLE_VOICES.map((v) => (
            <button
              key={v.id}
              onClick={(e) => handleSelectVoice(v.id, e)}
              type="button"
              className={`flex flex-col text-right p-2 rounded-xl transition-all ${
                currentVoice === v.id
                  ? themeTokens.activeOptionBg
                  : isDark
                  ? 'hover:bg-white/10 text-slate-300'
                  : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <span className="text-xs font-bold">{v.name}</span>
              <span className="text-[10px] text-slate-400 font-medium">{v.description}</span>
            </button>
          ))}
        </div>
      )}

      {/* Download Confirmation Modal anchored globally to document.body */}
      {showConfirmModal &&
        createPortal(
          <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div
              className={`w-full max-w-sm rounded-3xl border p-6 shadow-2xl backdrop-blur-xl transform transition-all duration-300 scale-100 text-center ${
                isDark ? `bg-[#090b10]/95 ${themeTokens.toolbarBorder} text-white` : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${themeTokens.confirmIconBox}`}>
                <Download size={28} />
              </div>

              <h3 className="mb-2 font-display text-lg font-bold">تأكيد تحميل الجزء المحدد</h3>

              <p className="mb-6 text-sm leading-relaxed opacity-90">
                هل أنت تأكد من رغبتك في تحميل هذا المقطع الصوتي بصوت المعلم <span className={`font-bold ${themeTokens.confirmAccentText}`}>"{selectedVoiceObj.name}"</span>؟
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  type="button"
                  className={`flex-1 rounded-xl border py-2.5 text-xs font-bold transition-all ${
                    isDark
                      ? 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                      : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  إلغاء
                </button>
                <button
                  onClick={executeConfirmedDownload}
                  type="button"
                  className={`flex-1 rounded-xl ${themeTokens.confirmPrimaryBtn} py-2.5 text-xs font-bold shadow-lg transition-all hover:scale-[1.02]`}
                >
                  نعم، تحميل
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}

export default TextSelectionToolbar
