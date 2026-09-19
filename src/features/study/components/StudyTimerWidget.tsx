import React, { useState, useEffect, useRef } from 'react'
import { Timer, Play, Pause, RotateCcw, Coffee, Sparkles, Bell, BellOff, ChevronDown, Plus, Minus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface StudyTimerWidgetProps {
  isDark?: boolean
}

export function StudyTimerWidget({ isDark = true }: StudyTimerWidgetProps) {
  const [mode, setMode] = useState<'stopwatch' | 'pomodoro'>('stopwatch')
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [hasStarted, setHasStarted] = useState<boolean>(false)
  const [stopwatchSeconds, setStopwatchSeconds] = useState<number>(0)
  
  // Custom Pomodoro config (minutes)
  const [pomoWorkDuration, setPomoWorkDuration] = useState<number>(25)
  const [pomoBreakDuration, setPomoBreakDuration] = useState<number>(5)
  const [isBreakPhase, setIsBreakPhase] = useState<boolean>(false)
  const [pomoSecondsLeft, setPomoSecondsLeft] = useState<number>(25 * 60)
  
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true)
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Timer Tick Effect
  useEffect(() => {
    let interval: any = null
    if (isRunning) {
      interval = setInterval(() => {
        if (mode === 'stopwatch') {
          setStopwatchSeconds((prev) => prev + 1)
        } else {
          setPomoSecondsLeft((prev) => {
            if (prev <= 1) {
              // Sound alert
              if (isSoundEnabled) {
                try {
                  const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3')
                  audio.volume = 0.5
                  audio.play().catch(() => {})
                } catch (e) {}
              }
              // Switch phase
              if (!isBreakPhase) {
                setIsBreakPhase(true)
                return pomoBreakDuration * 60
              } else {
                setIsBreakPhase(false)
                return pomoWorkDuration * 60
              }
            }
            return prev - 1
          })
        }
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, mode, isBreakPhase, pomoWorkDuration, pomoBreakDuration, isSoundEnabled])

  // Reset function (only way to return to icon state)
  const handleReset = () => {
    setIsRunning(false)
    setHasStarted(false)
    if (mode === 'stopwatch') {
      setStopwatchSeconds(0)
    } else {
      setIsBreakPhase(false)
      setPomoSecondsLeft(pomoWorkDuration * 60)
    }
  }

  // Toggle Running
  const togglePlayPause = () => {
    if (!isRunning) {
      setIsRunning(true)
      setHasStarted(true)
    } else {
      setIsRunning(false)
    }
  }

  // Format Helper
  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600)
    const mins = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const displayTimeStr = mode === 'stopwatch' 
    ? formatTime(stopwatchSeconds) 
    : formatTime(pomoSecondsLeft)

  return (
    <div className="relative" ref={popoverRef} dir="rtl">
      {/* WHEN NOT STARTED: SIMPLE CIRCULAR BUTTON */}
      {!hasStarted ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="مؤقت الدراسة والتركيز"
          className={`flex h-8 w-8 sm:h-11 sm:w-11 items-center justify-center rounded-full transition-all shadow-lg hover:scale-105 active:scale-95 ${
            isDark
              ? 'bg-[#a855f7]/15 backdrop-blur-md border border-[#a855f7]/30 hover:bg-[#a855f7]/25 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] text-purple-100'
              : 'bg-white border border-purple-200 hover:bg-purple-50 text-purple-700 shadow-md'
          }`}
          title="مؤقت الدراسة والتركيز"
        >
          <div className="transition-all duration-300 hover:rotate-12">
            <Timer size={17} strokeWidth={2.5} className={isDark ? 'text-purple-100' : 'text-purple-700'} />
          </div>
        </button>
      ) : (
        /* WHEN STARTED/ACTIVE (RUNNING OR PAUSED): EXPANDED TIMER BADGE */
        <div className={`flex items-center gap-1 p-1 rounded-full border transition-all duration-300 shadow-md ${
          isDark 
            ? 'bg-[#1e0a38]/90 border-[#a855f7]/40 text-purple-100 backdrop-blur-xl shadow-[0_0_20px_rgba(168,85,247,0.3)]' 
            : 'bg-white border-purple-300 text-purple-950 shadow-md'
        }`}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black transition-all hover:bg-black/5 dark:hover:bg-white/10"
            title="مؤقت الدراسة والتركيز"
          >
            <div className="flex items-center justify-center">
              {mode === 'pomodoro' && isBreakPhase ? (
                <Coffee size={16} className="text-amber-500 dark:text-amber-300" />
              ) : (
                <Timer size={16} className={isDark ? 'text-purple-100' : 'text-purple-700'} />
              )}
            </div>

            <span className={`font-mono text-xs sm:text-sm tracking-wider font-black dir-ltr ${isDark ? 'text-purple-200' : 'text-purple-900'}`}>
              {displayTimeStr}
            </span>

            <ChevronDown size={13} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Quick Play/Pause Button */}
          <button
            type="button"
            onClick={togglePlayPause}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-90 shadow-[0_0_12px_rgba(168,85,247,0.4)] ${
              isRunning 
                ? 'bg-[#a855f7]/30 text-purple-100 hover:bg-[#a855f7]/45' 
                : 'bg-emerald-500/30 text-emerald-200 hover:bg-emerald-500/45'
            }`}
            title={isRunning ? 'إيقاف مؤقت' : 'استئناف التركيز'}
          >
            {isRunning ? (
              <Pause size={14} fill="currentColor" />
            ) : (
              <Play size={14} fill="currentColor" className="ml-0.5" />
            )}
          </button>
        </div>
      )}

      {/* FLOATING CONTROLS POPOVER MENU */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.35, y: -10, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.35, y: -8, filter: 'blur(6px)' }}
            transition={{
              type: 'spring',
              stiffness: 420,
              damping: 26,
              mass: 0.8
            }}
            style={{ transformOrigin: 'top left' }}
            className={`absolute left-0 mt-2.5 w-76 p-4 rounded-3xl border shadow-2xl backdrop-blur-2xl z-50 flex flex-col gap-3.5 ${
              isDark 
                ? 'bg-[#150524]/95 border-purple-500/30 text-white shadow-[0_15px_50px_rgba(0,0,0,0.6)]' 
                : 'bg-white/95 border-purple-200 text-slate-900 shadow-2xl'
            }`}
          >
            {/* Popover Title */}
            <div className="flex items-center justify-between border-b pb-2.5 border-current/10">
              <div className={`flex items-center gap-2 font-extrabold text-sm ${isDark ? 'text-purple-300' : 'text-purple-900'}`}>
                <Sparkles size={16} />
                <span>مؤقت الدراسة والتركيز</span>
              </div>
              <button
                type="button"
                onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                className={`p-1.5 rounded-xl transition-colors ${
                  isSoundEnabled 
                    ? isDark ? 'text-purple-300 bg-purple-500/10 hover:bg-purple-500/20' : 'text-purple-700 bg-purple-100 hover:bg-purple-200'
                    : isDark ? 'text-slate-400 bg-white/5 hover:bg-white/10' : 'text-slate-500 bg-slate-100 hover:bg-slate-200'
                }`}
                title={isSoundEnabled ? 'التنبيه الصوتي مفعل' : 'التنبيه الصوتي مكتوم'}
              >
                {isSoundEnabled ? <Bell size={15} /> : <BellOff size={15} />}
              </button>
            </div>

            {/* Mode Segmented Selector */}
            <div className={`grid grid-cols-2 p-1 rounded-2xl border ${
              isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                type="button"
                onClick={() => {
                  setMode('stopwatch')
                  handleReset()
                }}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                  mode === 'stopwatch' 
                    ? 'bg-purple-600 text-white font-extrabold shadow-md' 
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                عداد الجلسة
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('pomodoro')
                  handleReset()
                }}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                  mode === 'pomodoro' 
                    ? 'bg-purple-600 text-white font-extrabold shadow-md' 
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                بومودورو (تحديد حر)
              </button>
            </div>

            {/* Timer Big Digital Display */}
            <div className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border ${
              isDark ? 'bg-purple-950/30 border-purple-500/20' : 'bg-purple-50/80 border-purple-200'
            }`}>
              {mode === 'pomodoro' && (
                <span className={`text-[11px] font-bold mb-1 px-2.5 py-0.5 rounded-full ${
                  isBreakPhase 
                    ? isDark ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-amber-100 text-amber-800 border border-amber-300'
                    : isDark ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-purple-100 text-purple-800 border border-purple-300'
                }`}>
                  {isBreakPhase ? '☕ فترة استراحة' : '🎯 فترة تركيز ونشاط'}
                </span>
              )}
              <div className={`font-mono text-3xl font-black tracking-widest my-1 dir-ltr ${
                isDark ? 'text-purple-200' : 'text-purple-950'
              }`}>
                {displayTimeStr}
              </div>
            </div>

            {/* CUSTOM POMODORO TIME INPUTS */}
            {mode === 'pomodoro' && (
              <div className="grid grid-cols-2 gap-2">
                {/* Work Duration Custom Input */}
                <div className={`flex flex-col gap-1 p-2.5 rounded-2xl border ${
                  isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className={`text-[11px] font-extrabold ${isDark ? 'text-purple-300' : 'text-purple-900'}`}>التركيز (دقيقة)</span>
                  <div className="flex items-center justify-between gap-1 pt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        const val = Math.max(1, pomoWorkDuration - 5)
                        setPomoWorkDuration(val)
                        if (!isBreakPhase) setPomoSecondsLeft(val * 60)
                        handleReset()
                      }}
                      className={`w-7 h-7 rounded-xl font-extrabold flex items-center justify-center transition-all active:scale-95 ${
                        isDark ? 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30' : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                      }`}
                    >
                      <Minus size={13} />
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={180}
                      value={pomoWorkDuration}
                      onChange={(e) => {
                        const val = Math.max(1, parseInt(e.target.value) || 1)
                        setPomoWorkDuration(val)
                        if (!isBreakPhase) setPomoSecondsLeft(val * 60)
                        handleReset()
                      }}
                      className={`w-12 text-center bg-transparent font-mono text-sm font-black focus:outline-none border-b ${
                        isDark ? 'text-purple-200 border-purple-500/40' : 'text-purple-950 border-purple-400'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = Math.min(180, pomoWorkDuration + 5)
                        setPomoWorkDuration(val)
                        if (!isBreakPhase) setPomoSecondsLeft(val * 60)
                        handleReset()
                      }}
                      className={`w-7 h-7 rounded-xl font-extrabold flex items-center justify-center transition-all active:scale-95 ${
                        isDark ? 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30' : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                      }`}
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>

                {/* Break Duration Custom Input */}
                <div className={`flex flex-col gap-1 p-2.5 rounded-2xl border ${
                  isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className={`text-[11px] font-extrabold ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>الاستراحة (دقيقة)</span>
                  <div className="flex items-center justify-between gap-1 pt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        const val = Math.max(1, pomoBreakDuration - 1)
                        setPomoBreakDuration(val)
                        if (isBreakPhase) setPomoSecondsLeft(val * 60)
                        handleReset()
                      }}
                      className={`w-7 h-7 rounded-xl font-extrabold flex items-center justify-center transition-all active:scale-95 ${
                        isDark ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                      }`}
                    >
                      <Minus size={13} />
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={pomoBreakDuration}
                      onChange={(e) => {
                        const val = Math.max(1, parseInt(e.target.value) || 1)
                        setPomoBreakDuration(val)
                        if (isBreakPhase) setPomoSecondsLeft(val * 60)
                        handleReset()
                      }}
                      className={`w-12 text-center bg-transparent font-mono text-sm font-black focus:outline-none border-b ${
                        isDark ? 'text-amber-200 border-amber-500/40' : 'text-amber-950 border-amber-400'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = Math.min(60, pomoBreakDuration + 1)
                        setPomoBreakDuration(val)
                        if (isBreakPhase) setPomoSecondsLeft(val * 60)
                        handleReset()
                      }}
                      className={`w-7 h-7 rounded-xl font-extrabold flex items-center justify-center transition-all active:scale-95 ${
                        isDark ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                      }`}
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons: Play/Pause/Reset */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={togglePlayPause}
                className={`flex-1 py-2.5 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${
                  isRunning 
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20 font-black' 
                    : 'bg-purple-600 hover:bg-purple-500 text-white font-black shadow-purple-600/30'
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause size={15} fill="currentColor" />
                    <span>إيقاف مؤقت</span>
                  </>
                ) : (
                  <>
                    <Play size={15} fill="currentColor" />
                    <span>{hasStarted ? 'استئناف التركيز' : 'بدء التركيز'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleReset}
                className={`p-2.5 rounded-2xl border transition-all active:scale-95 ${
                  isDark ? 'border-white/10 hover:bg-white/10 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
                title="إعادة ضبط العداد"
              >
                <RotateCcw size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
