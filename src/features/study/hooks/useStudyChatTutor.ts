import { useState, useCallback } from "react"
import { studyApi } from "../../../api/studyApi"
import { API_BASE, TUTOR_API_KEY } from "../utils/studyConfig"
import { studyPlanManager } from "../utils/studyPlanManager"
import { STUDY_PROMPTS } from "../utils/studyPrompts"

export interface ChatMessage {
  id: string
  role: "user" | "tutor"
  text: string
}

export interface HistoryMessage {
  role: "user" | "assistant"
  content: string
}

export interface UseStudyChatTutorOptions {
  currentChunkId: string | null
  chunkTitle: string
  chunkText: string
  activeSessionId: number | null
  chatHistory: HistoryMessage[]
  setChatHistory: React.Dispatch<React.SetStateAction<HistoryMessage[]>>
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
}

export function useStudyChatTutor({
  currentChunkId,
  chunkTitle,
  chunkText,
  activeSessionId,
  chatHistory,
  setChatHistory,
  setMessages,
}: UseStudyChatTutorOptions) {
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [pendingPlanSteps, setPendingPlanSteps] = useState<string[]>([])

  /**
   * Unified Tutor Chat Dispatcher:
   * - For Turath chunks: sends live chapter text directly to /chat/raw, bypassing MongoDB
   * - For Mongo chunks: sends chunk_id to /chat, falling back to /chat/raw
   */
  const requestTutorChat = useCallback(
    async (
      message: string,
      mode: "chat" | "plan" | "summary" = "chat",
      history: HistoryMessage[] = chatHistory,
    ): Promise<string> => {
      const isTurath = currentChunkId?.startsWith("turath_")

      // 1. Try SQL backend session if available and not Turath
      if (activeSessionId && !isTurath) {
        try {
          const chatMsgDto = await studyApi.sendMessage(
            activeSessionId,
            message,
            mode,
          )
          if (chatMsgDto && chatMsgDto.content) {
            return chatMsgDto.content
          }
        } catch (e) {
          console.warn(
            "Backend session send failed, fallback to direct tutor engine:",
            e,
          )
        }
      }

      // 2. For Turath: Use /chat/raw directly with live chapter text
      if (isTurath) {
        const res = await fetch(`${API_BASE}/api/v1/tutor/chat/raw`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": TUTOR_API_KEY,
          },
          body: JSON.stringify({
            text: chunkText || "نص الدرس الشرعي",
            message: message,
            mode: mode,
            history: history,
          }),
        })

        const data = await res.json()
        if (data.success && data.reply) {
          return data.reply
        }
        throw new Error(data.detail || "فشل توليد الرد من المعلم")
      }

      // 3. For Mongo RAG chunks: try standard /chat
      try {
        const res = await fetch(`${API_BASE}/api/v1/tutor/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": TUTOR_API_KEY,
          },
          body: JSON.stringify({
            chunk_id: currentChunkId,
            message: message,
            mode: mode,
            history: history,
          }),
        })

        const data = await res.json()
        if (data.success && data.reply) {
          return data.reply
        }

        // If Mongo lookup failed, fallback to /chat/raw with chunkText
        if (chunkText) {
          const rawRes = await fetch(`${API_BASE}/api/v1/tutor/chat/raw`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-API-Key": TUTOR_API_KEY,
            },
            body: JSON.stringify({
              text: chunkText,
              message: message,
              mode: mode,
              history: history,
            }),
          })

          const rawData = await rawRes.json()
          if (rawData.success && rawData.reply) {
            return rawData.reply
          }
        }

        throw new Error(data.detail || "فشل الاتصال بالمعلم")
      } catch (err: any) {
        if (chunkText) {
          const rawRes = await fetch(`${API_BASE}/api/v1/tutor/chat/raw`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-API-Key": TUTOR_API_KEY,
            },
            body: JSON.stringify({
              text: chunkText,
              message: message,
              mode: mode,
              history: history,
            }),
          })

          const rawData = await rawRes.json()
          if (rawData.success && rawData.reply) {
            return rawData.reply
          }
        }
        throw err
      }
    },
    [currentChunkId, activeSessionId, chunkText, chatHistory],
  )

  const handleSelectStartOption = useCallback(
    async (optionKey: "plan" | "summary" | "chat") => {
      if (!currentChunkId) return

      let promptMsg = ""
      let userDisplayMsg = ""

      if (optionKey === "plan") {
        promptMsg = STUDY_PROMPTS.CREATE_STUDY_PLAN(chunkTitle)
        userDisplayMsg = "أود الحصول على خطة تفاعلية لمذاكرة هذا الدرس."
      } else if (optionKey === "summary") {
        promptMsg = STUDY_PROMPTS.BALANCED_SUMMARY(chunkTitle)
        userDisplayMsg =
          "أود الحصول على تلخيص مركز ومُتوازن لهذا الدرس (لا إفراط ولا تفريط)."
      } else {
        promptMsg = STUDY_PROMPTS.DIRECT_DISCUSSION(chunkTitle)
        userDisplayMsg =
          "أود بدء التحاور المباشر مع زاد وطرح أسئلتي في هذا الدرس."
      }

      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "user", text: userDisplayMsg },
      ])

      setLoading(true)

      try {
        const replyText = await requestTutorChat(promptMsg, optionKey)

        if (replyText) {
          const keyId = activeSessionId || currentChunkId
          const { cleanText, extractedSteps } =
            studyPlanManager.parseLLMResponse(replyText, keyId, false)

          if (
            optionKey === "plan" &&
            extractedSteps &&
            extractedSteps.length > 0
          ) {
            setPendingPlanSteps(extractedSteps)
          }

          setMessages((prev) => [
            ...prev,
            { id: Date.now().toString(), role: "tutor", text: cleanText },
          ])

          setChatHistory((prev) => [
            ...prev,
            { role: "user", content: userDisplayMsg },
            { role: "assistant", content: cleanText },
          ])
        }
      } catch (e: any) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "tutor",
            text: "خطأ: " + (e.message || "فشل الاتصال بالسيرفر."),
          },
        ])
      } finally {
        setLoading(false)
      }
    },
    [currentChunkId, chunkTitle, activeSessionId, requestTutorChat, setMessages, setChatHistory],
  )

  const handleApprovePlan = useCallback(
    async (firstStepTitle: string) => {
      if (!currentChunkId) return

      const keyId = activeSessionId || currentChunkId

      if (pendingPlanSteps.length > 0) {
        studyPlanManager.saveSessionPlan(keyId, pendingPlanSteps)
        setPendingPlanSteps([])
      }

      const userText = `ممتاز أخي زاد، اعتمدت الخطة! ابدأ فوراً بشرح المحور الأول: "${firstStepTitle}".`

      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "user", text: userText },
      ])

      setLoading(true)

      try {
        const replyText = await requestTutorChat(userText, "chat")

        if (replyText) {
          const { cleanText } = studyPlanManager.parseLLMResponse(
            replyText,
            keyId,
            true,
          )

          setMessages((prev) => [
            ...prev,
            { id: Date.now().toString(), role: "tutor", text: cleanText },
          ])

          setChatHistory((prev) => [
            ...prev,
            { role: "user", content: userText },
            { role: "assistant", content: cleanText },
          ])
        }
      } catch (e: any) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "tutor",
            text: "خطأ: " + (e.message || "فشل الاتصال بالسيرفر."),
          },
        ])
      } finally {
        setLoading(false)
      }
    },
    [currentChunkId, activeSessionId, pendingPlanSteps, requestTutorChat, setMessages, setChatHistory],
  )

  const handleStepComplete = useCallback(
    async (completedStepId: number) => {
      if (!currentChunkId) return

      const keyId = activeSessionId || currentChunkId

      studyPlanManager.markStepCompleted(keyId, completedStepId, true)

      const currentProgress = studyPlanManager.getSessionProgress(keyId)
      if (!currentProgress) return

      const completedStep = currentProgress.steps.find(
        (s) => s.id === completedStepId,
      )
      const nextStep = currentProgress.steps.find((s) => !s.isCompleted)

      let userPromptMsg = ""
      if (nextStep) {
        userPromptMsg = `ممتاز أخي زاد، استوعبت محور "${completedStep?.title || completedStepId}" بفضل الله. يرجى البدء فوراً في شرح المحور التالي: "${nextStep.title}".`
      } else {
        userPromptMsg = `ممتاز أخي زاد، استوعبت بفضل الله جميع محاور هذا الدرس! قدم لي ملخصاً ختامياً شاملاً لأهم الفوائد والتطبيقات.`
      }

      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "user", text: userPromptMsg },
      ])

      setLoading(true)

      try {
        const replyText = await requestTutorChat(userPromptMsg, "chat")

        if (replyText) {
          const { cleanText } = studyPlanManager.parseLLMResponse(
            replyText,
            keyId,
            false,
          )

          setMessages((prev) => [
            ...prev,
            { id: Date.now().toString(), role: "tutor", text: cleanText },
          ])

          setChatHistory((prev) => [
            ...prev,
            { role: "user", content: userPromptMsg },
            { role: "assistant", content: cleanText },
          ])
        }
      } catch (e: any) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "tutor",
            text: "خطأ: " + (e.message || "فشل الاتصال بالسيرفر."),
          },
        ])
      } finally {
        setLoading(false)
      }
    },
    [currentChunkId, activeSessionId, requestTutorChat, setMessages, setChatHistory],
  )

  const handleSend = useCallback(async () => {
    if (!input.trim()) return

    if (!currentChunkId) {
      alert("الرجاء اختيار درس من الفهرس الجانبي أولاً لتبدأ المحادثة حوله.")
      return
    }

    const userText = input.trim()
    setInput("")

    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", text: userText },
    ])

    setLoading(true)

    try {
      const replyText = await requestTutorChat(userText, "chat")

      if (replyText) {
        const keyId = activeSessionId || currentChunkId || "current_session"
        const { cleanText, extractedSteps } =
          studyPlanManager.parseLLMResponse(replyText, keyId, false)

        if (extractedSteps && extractedSteps.length > 0) {
          const existingPlan = studyPlanManager.getSessionProgress(keyId)
          if (!existingPlan || existingPlan.totalSteps === 0) {
            setPendingPlanSteps(extractedSteps)
          }
        }

        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), role: "tutor", text: cleanText },
        ])

        setChatHistory((prev) => [
          ...prev,
          { role: "user", content: userText },
          { role: "assistant", content: cleanText },
        ])
      }
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "tutor",
          text: "خطأ: " + (e.message || "فشل الاتصال بالسيرفر."),
        },
      ])
    } finally {
      setLoading(false)
    }
  }, [input, currentChunkId, activeSessionId, requestTutorChat, setMessages, setChatHistory])

  return {
    input,
    setInput,
    loading,
    setLoading,
    pendingPlanSteps,
    setPendingPlanSteps,
    requestTutorChat,
    handleSelectStartOption,
    handleApprovePlan,
    handleStepComplete,
    handleSend,
  }
}
