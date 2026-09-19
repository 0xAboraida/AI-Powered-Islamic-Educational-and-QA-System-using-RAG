import { useState, useRef, useEffect, useCallback } from 'react'
import { useMicrophoneVolume } from '../../../hooks/useMicrophoneVolume'
import { demoReply } from '../data'

export type Status = 'idle' | 'listening' | 'thinking' | 'speaking'

function getRecognition(): any | null {
  const w = window as any
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition
  return Ctor ? new Ctor() : null
}

export function useSpeechRecognition() {
  const [status, setStatus] = useState<Status>('idle')
  const [isCallActive, setIsCallActive] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [reply, setReply] = useState('')
  const [supported, setSupported] = useState(true)

  const recognitionRef = useRef<any>(null)
  const transcriptRef = useRef<string>('')
  const isCallActiveRef = useRef<boolean>(false)

  // Real-time audio volume hook for animation
  const volume = useMicrophoneVolume(isCallActive)

  useEffect(() => {
    isCallActiveRef.current = isCallActive
  }, [isCallActive])

  const speak = useCallback((text: string) => {
    const synth = window.speechSynthesis
    if (!synth) {
      if (isCallActiveRef.current) {
        setTranscript('')
        setReply('')
        setTimeout(() => { try { recognitionRef.current?.start(); setStatus('listening') } catch (e) { } }, 500)
      } else {
        setStatus('idle')
      }
      return
    }
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'ar-SA'
    utter.rate = 0.95
    utter.onend = () => {
      if (isCallActiveRef.current) {
        // Automatically start listening again after Zad finishes speaking
        setTranscript('')
        setReply('')
        setTimeout(() => {
          try {
            recognitionRef.current?.start()
            setStatus('listening')
          } catch (e) { }
        }, 500)
      } else {
        setStatus('idle')
      }
    }
    setStatus('speaking')
    synth.speak(utter)
  }, [])

  const respond = useCallback((question: string) => {
    setStatus('thinking')
    window.setTimeout(() => {
      const answer = demoReply(question, 'auto')
      setReply(answer)
      speak(answer)
    }, 1000)
  }, [speak])

  useEffect(() => {
    transcriptRef.current = transcript
  }, [transcript])

  useEffect(() => {
    const rec = getRecognition()
    if (!rec) {
      setSupported(false)
      return
    }
    rec.lang = 'ar-SA'
    rec.interimResults = true
    rec.continuous = false

    rec.onresult = (event: any) => {
      const text = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join(' ')
      setTranscript(text)
    }
    rec.onerror = () => {
      if (isCallActiveRef.current) {
        // Auto-restart if call is active but an error occurred (e.g. no speech detected)
        setTimeout(() => {
          try { recognitionRef.current?.start() } catch (e) { }
        }, 300)
      } else {
        setStatus('idle')
      }
    }
    rec.onend = () => {
      setStatus((currentStatus) => {
        if (currentStatus === 'listening') {
          const finalTranscript = transcriptRef.current.trim()
          if (finalTranscript) {
            respond(finalTranscript)
            return 'thinking'
          }
          // If no transcript but call is still active, restart listening
          if (isCallActiveRef.current) {
            setTimeout(() => {
              try { recognitionRef.current?.start() } catch (e) { }
            }, 100)
            return 'listening'
          }
          return 'idle'
        }
        return currentStatus
      })
    }

    recognitionRef.current = rec
    return () => {
      try {
        rec.abort()
      } catch {
        /* noop */
      }
      window.speechSynthesis?.cancel()
    }
  }, [respond])

  const handleMic = () => {
    if (!supported) return

    if (isCallActive) {
      // Hang up the call
      setIsCallActive(false)
      window.speechSynthesis?.cancel()
      try { recognitionRef.current?.stop() } catch (e) { }
      setStatus('idle')
      return
    }

    // Start a fresh call
    setIsCallActive(true)
    setTranscript('')
    setReply('')
    try {
      recognitionRef.current?.start()
      setStatus('listening')
    } catch {
      setStatus('idle')
      setIsCallActive(false)
    }
  }

  return {
    status,
    isCallActive,
    transcript,
    reply,
    supported,
    handleMic,
    volume,
    setStatus,
    setIsCallActive
  }
}
