import { useState, useCallback, useRef } from "react"
import { studyApi, type StudySessionDto } from "../../../api/studyApi"
import { API_BASE } from "../utils/studyConfig"
import { studyPlanManager } from "../utils/studyPlanManager"
import { saveStudySessionToLocalCache } from "../utils/studyStorage"
import {
  idbGetTurathBookTree,
  idbSetTurathBookTree,
} from "../../../utils/indexedDbStorage"
import {
  fetchTurathBookIndexes,
  fetchTurathChapterText,
  convertTurathHeadingsToTree,
  type ChapterSliceOptions,
} from "../../../api/turathApi"
import {
  parseTurathInfoField,
  calculateHijriCentury,
  resolveMadhhab,
  resolveDomain,
  findTurathBookInTree,
  buildTurathHierarchy,
} from "../utils/turathMetaHelper"
import type { TreeNode, MindmapNode } from "../../../contexts/StudyContext"
import { defaultQuizFlowState } from "../quiz/types"
import type { ChatMessage, HistoryMessage } from "./useStudyChatTutor"

export interface UseStudyDocumentReaderOptions {
  treeData: TreeNode[]
  currentChunkId: string | null
  chunkTitle?: string
  headerSubtitle?: string
  setCurrentChunkId: (id: string | null) => void
  setChunkTitle: (title: string) => void
  setHeaderSubtitle: (subtitle: string) => void
  setChunkText: (text: string) => void
  setChunkMeta: (meta: any) => void
  activeSessionId: number | null
  setActiveSessionId: (id: number | null) => void
  clearStudySession: () => void
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
  setChatHistory: React.Dispatch<React.SetStateAction<HistoryMessage[]>>
  setPendingPlanSteps: (steps: string[]) => void
  setMindmapData: (data: MindmapNode[] | null) => void
  setQuizQuestions: (questions: any) => void
  setSelectedAnswers: (answers: any) => void
  setQuizFlowState: (state: any) => void
  setMindmapLoading: (loading: boolean) => void
  setQuizLoading: (loading: boolean) => void
  setLoading: (loading: boolean) => void
  setActiveQuizId: (id: number | null) => void
  isMobile: boolean
  isDark: boolean
  focusPanel: (panel: "chat" | "document" | "mindmap" | "quiz" | "sidebar") => void
  setIsDocumentOpen: (open: boolean) => void
  setIsChatOpen: (open: boolean) => void
  setIsSidebarOpen: (open: boolean) => void
  setIsMindmapOpen: (open: boolean) => void
  setIsQuizOpen: (open: boolean) => void
  setIsWorkspaceSidebarExpanded: (expanded: boolean) => void
  setStudyView: (view: "hero" | "workspace") => void
  onExit: () => void
}

export function useStudyDocumentReader({
  treeData,
  currentChunkId,
  chunkTitle = "",
  headerSubtitle = "",
  setCurrentChunkId,
  setChunkTitle,
  setHeaderSubtitle,
  setChunkText,
  setChunkMeta,
  setActiveSessionId,
  clearStudySession,
  setMessages,
  setChatHistory,
  setPendingPlanSteps,
  setMindmapData,
  setQuizQuestions,
  setSelectedAnswers,
  setQuizFlowState,
  setMindmapLoading,
  setQuizLoading,
  setLoading,
  setActiveQuizId,
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
}: UseStudyDocumentReaderOptions) {
  const [isChunkLoading, setIsChunkLoading] = useState(false)
  const [chunkLoadError, setChunkLoadError] = useState<string | null>(null)
  const [confirmClose, setConfirmClose] = useState(false)
  const [pendingChunkSwitch, setPendingChunkSwitch] = useState<{
    chunkId: string
    title: string
    fullPath: string
    node?: TreeNode
  } | null>(null)
  const lastAttemptRef = useRef<
    | {
        kind: "chunk"
        chunkId: string
        title: string
        fullPath: string
        selectedNode?: TreeNode
        initialMindmapData?: MindmapNode[] | null
      }
    | {
        kind: "savedSession"
        sess: StudySessionDto
      }
    | null
  >(null)

  const executeChunkSelect = useCallback(
    async (
      chunkId: string,
      title: string,
      fullPath: string,
      selectedNode?: TreeNode,
      initialMindmapData?: MindmapNode[] | null,
    ) => {
      lastAttemptRef.current = {
        kind: "chunk",
        chunkId,
        title,
        fullPath,
        selectedNode,
        initialMindmapData,
      }
      setChunkLoadError(null)
      setStudyView("workspace")
      setIsChunkLoading(true)
      setCurrentChunkId(chunkId)
      setActiveSessionId(null)
      setPendingPlanSteps([])
      studyPlanManager.resetPlanProgress(chunkId)
      setChunkTitle(title)
      setHeaderSubtitle(fullPath)
      setChunkText("جاري تحميل النص من الكتاب...")
      setChunkMeta(null)

      // Reset interactive states & Ensure Document + Chat panels are open
      setMessages([])
      setChatHistory([])

      if (initialMindmapData && initialMindmapData.length > 0) {
        setMindmapData(initialMindmapData)
      } else {
        setMindmapData(null)
      }

      setQuizQuestions(null)
      setSelectedAnswers({})
      setQuizFlowState(defaultQuizFlowState(null))
      setMindmapLoading(false)
      setQuizLoading(false)

      if (isMobile) {
        setIsDocumentOpen(true)
        setIsSidebarOpen(false)
        setIsQuizOpen(false)

        if (initialMindmapData && initialMindmapData.length > 0) {
          setIsMindmapOpen(true)
          setIsChatOpen(false)
          focusPanel("mindmap")
        } else {
          setIsMindmapOpen(false)
          setIsChatOpen(false)
          focusPanel("document")
        }
      } else {
        setIsDocumentOpen(true)
        if (initialMindmapData && initialMindmapData.length > 0) {
          setIsMindmapOpen(true)
          setIsChatOpen(false)
          focusPanel("mindmap")
        } else {
          setIsMindmapOpen(false)
          setIsChatOpen(true)
        }
      }

      // 1. TURATH FULL CHAPTER RETRIEVAL (Pulls entire section / chapter across its pages)
      if (chunkId.startsWith("turath_")) {
        try {
          const parts = chunkId.split("_")
          const turathId = parseInt(parts[1], 10)
          if (!Number.isFinite(turathId) || turathId <= 0) {
            const invalidMsg =
              "تعذر تحديد بيانات هذا الدرس المحفوظ، يرجى اختياره من الفهرس مجدداً."
            setChunkLoadError(invalidMsg)
            setChunkText(invalidMsg)
            return
          }

          const startPage = parseInt(parts[3], 10) || 1
          let endPage = parts[5] ? parseInt(parts[5], 10) : startPage
          const startTocIndex = parts[7] ? parseInt(parts[7], 10) : undefined
          const endTocIndex = parts[9] ? parseInt(parts[9], 10) : undefined

          let resolvedStartTocId =
            selectedNode?.toc_id ||
            (startTocIndex ? `toc-${startTocIndex}` : undefined)
          let resolvedEndTocId =
            selectedNode?.next_toc_id ||
            (endTocIndex && endTocIndex > 0 ? `toc-${endTocIndex}` : undefined)
          let nextChapterTitle = selectedNode?.next_title

          if (!resolvedStartTocId || !resolvedEndTocId || !selectedNode) {
            const { bookNode } = findTurathBookInTree(treeData, turathId)
            let bookChapters = bookNode?.children

            if (!bookChapters || bookChapters.length === 0) {
              try {
                const cachedBookData = await idbGetTurathBookTree(turathId)
                const isCachedBookStale =
                  !cachedBookData?.children ||
                  cachedBookData.children.length === 0 ||
                  (cachedBookData.children.length === 1 &&
                    cachedBookData.children[0].title ===
                      "قراءة الكتاب (من البداية)") ||
                  !cachedBookData.children[0].toc_id ||
                  !cachedBookData.children[0].chunk_id?.includes("_v5")

                if (!isCachedBookStale) {
                  bookChapters = cachedBookData.children
                } else {
                  const liveIndexes = await fetchTurathBookIndexes(turathId)
                  const headings = liveIndexes?.indexes?.headings || []
                  if (headings.length > 0) {
                    bookChapters = convertTurathHeadingsToTree(
                      headings,
                      turathId,
                      bookNode?.title || fullPath,
                    )
                    await idbSetTurathBookTree(turathId, {
                      children: bookChapters,
                      meta: liveIndexes?.meta,
                      indexes: liveIndexes?.indexes,
                    })
                  }
                }
              } catch {}
            }

            if (bookChapters) {
              const flattenNodes = (nodes: TreeNode[]): TreeNode[] => {
                const list: TreeNode[] = []
                for (const n of nodes) {
                  list.push(n)
                  if (n.children && n.children.length > 0) {
                    list.push(...flattenNodes(n.children))
                  }
                }
                return list
              }

              const flat = flattenNodes(bookChapters)
              const matched =
                flat.find((n) => n.chunk_id === chunkId) ||
                flat.find((n) => n.title === title && n.page === startPage) ||
                (title ? flat.find((n) => n.title === title) : undefined)

              if (matched) {
                if (!selectedNode) selectedNode = matched
                if (!resolvedStartTocId) resolvedStartTocId = matched.toc_id
                if (!resolvedEndTocId) resolvedEndTocId = matched.next_toc_id
                if (!nextChapterTitle) nextChapterTitle = matched.next_title
              }
            }
          }

          if (selectedNode?.children && selectedNode.children.length > 0) {
            const firstChild = selectedNode.children[0]
            if (firstChild) {
              endPage = Math.max(startPage, firstChild.page || startPage)
              if (firstChild.toc_id) resolvedEndTocId = firstChild.toc_id
              if (firstChild.title) nextChapterTitle = firstChild.title
            }
          }

          const sliceOptions: ChapterSliceOptions = {
            startTocId: resolvedStartTocId,
            endTocId: resolvedEndTocId,
            chapterTitle: title,
            nextChapterTitle: nextChapterTitle,
          }

          const turathData = await fetchTurathChapterText(
            turathId,
            startPage,
            endPage,
            sliceOptions,
          )

          if (turathData) {
            const rawText = turathData.text || ""
            const cleanRawText = rawText
              .replace(/<!--[\s\S]*?-->/g, "")
              .replace(/<[^>]+>/g, "")
              .replace(/[^\u0621-\u064A\u0671-\u06D3\w]/g, "")
              .trim()

            const normalizedTitle = title
              .replace(/[^\u0621-\u064A\u0671-\u06D3\w]/g, "")
              .trim()

            const isOnlyHeading =
              cleanRawText.length < 15 ||
              cleanRawText === normalizedTitle ||
              (cleanRawText.startsWith(normalizedTitle) &&
                cleanRawText.length - normalizedTitle.length < 15)

            if (
              isOnlyHeading &&
              selectedNode?.children &&
              selectedNode.children.length > 0
            ) {
              const firstChild = selectedNode.children[0]
              const nextHeadingName =
                firstChild?.title || nextChapterTitle || "الدرس الأول"

              const noticeHtml = `
                <div class="turath-empty-parent-notice" style="margin: 3em auto; max-width: 580px; padding: 2.2em 1.8em; border-radius: 1.5rem; text-align: center; background: ${
                  isDark
                    ? "rgba(56, 189, 248, 0.05)"
                    : "rgba(2, 132, 199, 0.04)"
                }; border: 1.5px dashed ${
                  isDark
                    ? "rgba(56, 189, 248, 0.3)"
                    : "rgba(2, 132, 199, 0.25)"
                }; backdrop-filter: blur(10px);">
                  <div style="display: inline-flex; align-items: center; justify-content: center; width: 54px; height: 54px; border-radius: 9999px; margin-bottom: 1.2em; background: ${
                    isDark
                      ? "rgba(56, 189, 248, 0.15)"
                      : "rgba(2, 132, 199, 0.1)"
                  }; color: ${isDark ? "#38bdf8" : "#0284c7"};">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/></svg>
                  </div>
                  <h3 style="font-size: 1.25em; font-weight: 700; margin-bottom: 0.6em; color: ${
                    isDark ? "#ffffff" : "#0f172a"
                  }; font-family: 'Amiri', serif;">${title}</h3>
                  <p style="font-size: 0.95em; line-height: 1.8; color: ${
                    isDark
                      ? "rgba(255, 255, 255, 0.7)"
                      : "rgba(15, 23, 42, 0.7)"
                  }; margin-bottom: 1.6em;">
                    هذا العنوان عبارة عن باب وتصنيف رئيسي تبدأ موضوعاته التفصيلية مباشرة من:
                    <br />
                    <strong style="color: ${
                      isDark ? "#38bdf8" : "#0284c7"
                    }; font-size: 1.05em;">«${nextHeadingName}»</strong>
                  </p>
                  ${
                    firstChild?.chunk_id
                      ? `
                    <button
                      type="button"
                      onclick="window.dispatchEvent(new CustomEvent('zad_select_chunk', { detail: { chunkId: '${firstChild.chunk_id}', title: '${firstChild.title.replace(/'/g, "\\'")}', fullPath: '${fullPath} ← ${firstChild.title.replace(/'/g, "\\'")}' } }))"
                      style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 22px; border-radius: 9999px; font-weight: 700; font-size: 0.92em; cursor: pointer; border: none; background: #0284c7; color: #ffffff; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35); transition: all 0.2s;"
                    >
                      <span>الانتقال إلى ${firstChild.title}</span>
                      <span style="font-size: 1.1em;">←</span>
                    </button>
                  `
                      : ""
                  }
                </div>
              `
              setChunkText(noticeHtml)
            } else {
              setChunkText(rawText || "لا يوجد نص متوفر لهذا الفصل.")
            }

            const { bookNode, categoryTitle } = findTurathBookInTree(
              treeData,
              turathId,
            )

            let bookIndexesMeta: any = null
            try {
              const cachedBook = await idbGetTurathBookTree(turathId)
              if (cachedBook?.meta) {
                bookIndexesMeta = cachedBook.meta
              } else {
                const liveIndexes = await fetchTurathBookIndexes(turathId)
                if (liveIndexes?.meta) {
                  bookIndexesMeta = liveIndexes.meta
                  if (cachedBook && cachedBook.children) {
                    await idbSetTurathBookTree(turathId, {
                      ...cachedBook,
                      meta: liveIndexes.meta,
                    })
                  }
                }
              }
            } catch (e) {
              console.warn("Turath metadata resolution notice:", e)
            }

            const parsedInfo = parseTurathInfoField(bookIndexesMeta?.info)
            const resolvedBookTitle =
              bookIndexesMeta?.name ||
              bookNode?.title ||
              (turathData.meta as any)?.book_name ||
              fullPath.split("←")[1]?.trim() ||
              "اسم الكتاب"

            const resolvedAuthor =
              parsedInfo.author ||
              bookNode?.author ||
              (turathData.meta as any)?.author_name ||
              "غير محدد"

            const resolvedAuthorDeath = parsedInfo.authorDeath || ""
            const resolvedCentury = parsedInfo.deathYear
              ? calculateHijriCentury(parsedInfo.deathYear)
              : ""

            const resolvedDomain = resolveDomain(
              categoryTitle,
              resolvedBookTitle,
            )
            const resolvedMadhhab = resolveMadhhab(
              categoryTitle,
              resolvedAuthor,
              resolvedBookTitle,
              parsedInfo.madhhabHint,
            )

            const currentVol = (turathData.meta as any)?.vol || "1"
            const totalParts = parsedInfo.totalParts || 1

            const resolvedFullPath = fullPath.includes("←")
              ? fullPath
              : [resolvedDomain || categoryTitle, resolvedBookTitle, title]
                  .filter(Boolean)
                  .join(" ← ")

            if (resolvedFullPath && resolvedFullPath !== fullPath) {
              setHeaderSubtitle(resolvedFullPath)
            }

            const resolvedHierarchy = buildTurathHierarchy(
              resolvedFullPath,
              resolvedBookTitle,
              title,
            )

            const sourceUrl = `https://app.turath.io/book/${turathId}?page=${startPage}`

            setChunkMeta({
              book_title: resolvedBookTitle,
              author: resolvedAuthor,
              author_death: resolvedAuthorDeath,
              domain: resolvedDomain,
              madhhab: resolvedMadhhab,
              hijri_century: resolvedCentury,
              part: currentVol,
              total_parts: totalParts,
              page_id: startPage,
              end_page: endPage,
              hierarchy: resolvedHierarchy,
              source_url: sourceUrl,
            })

            // Always save active session metadata locally so history modal & resume work cleanly
            const fallbackSessionId = Date.now()
            const localSessionObj = {
              id: fallbackSessionId,
              chunkId,
              bookTitle: resolvedBookTitle,
              author:
                resolvedAuthor && resolvedAuthor !== "غير محدد"
                  ? resolvedAuthor
                  : undefined,
              domain: resolvedDomain || categoryTitle || resolvedFullPath,
              sectionTitle: title,
              fullPath: resolvedFullPath,
              turathId,
              startPage,
              endPage,
              createdAt: new Date().toISOString(),
              lastAccessedAt: new Date().toISOString(),
              isActive: true,
            }
            saveStudySessionToLocalCache(localSessionObj)

            try {
              const session = await studyApi.startSession(
                chunkId,
                resolvedBookTitle,
                resolvedDomain || resolvedFullPath,
                title,
              )

              if (session && session.id) {
                setActiveSessionId(session.id)
                saveStudySessionToLocalCache({
                  ...localSessionObj,
                  ...session,
                  chunkId: session.chunkId || chunkId,
                  bookTitle: session.bookTitle || resolvedBookTitle,
                  domain: session.domain || localSessionObj.domain,
                  sectionTitle: session.sectionTitle || title,
                })
                const savedMessages = await studyApi
                  .getSessionMessages(session.id)
                  .catch(() => [])

                if (savedMessages && savedMessages.length > 0) {
                  const uiMsgs = savedMessages.map((m) => {
                    let cleanText = m.content
                    if (m.role === "user") {
                      if (
                        cleanText.includes("ملاحظات حتمية للعمل") ||
                        cleanText.includes("أنا كطالب أود البدء في دراسة درس")
                      ) {
                        cleanText =
                          "أود الحصول على خطة تفاعلية لمذاكرة هذا الدرس."
                      } else if (
                        cleanText.includes(
                          "أنا كطالب أود الحصول على تلخيص مركز وشامل لدرس",
                        )
                      ) {
                        cleanText =
                          "أود الحصول على تلخيص مركز ومُتوازن لهذا الدرس (لا إفراط ولا تفريط)."
                      } else if (
                        cleanText.includes(
                          "مرحباً يا زاد، أود فتح باب النقاش المباشر والأسئلة حول درس",
                        )
                      ) {
                        cleanText =
                          "أود بدء التحاور المباشر مع زاد وطرح أسئلتي في هذا الدرس."
                      }
                    } else {
                      const { cleanText: parsed } =
                        studyPlanManager.parseLLMResponse(
                          cleanText,
                          session.id,
                          true,
                        )
                      cleanText = parsed
                    }

                    return {
                      id: m.id.toString(),
                      role: (m.role === "user" ? "user" : "tutor") as
                        | "user"
                        | "tutor",
                      text: cleanText,
                    }
                  })

                  setMessages(uiMsgs)
                  setChatHistory(
                    savedMessages.map((m) => ({
                      role: m.role as "user" | "assistant",
                      content: m.content,
                    })),
                  )
                }
              }
            } catch (err) {
              console.warn("Backend study session start for Turath failed:", err)
            }
          } else {
            const isOffline =
              typeof navigator !== "undefined" && navigator.onLine === false
            const errorMsg = isOffline
              ? "يبدو أنك غير متصل بالإنترنت. تعذر تحميل الفصل، يرجى التحقق من الشبكة والمحاولة مرة أخرى."
              : "تعذر جلب نص الفصل من مصدر الكتاب حالياً رغم توفر الاتصال، يرجى المحاولة مرة أخرى."
            setChunkLoadError(errorMsg)
            setChunkText(errorMsg)
          }
        } catch (err) {
          console.error("Error fetching Turath chapter:", err)
          const errorMsg =
            "حدث خطأ أثناء تحميل فصل الكتاب من تراث، يرجى المحاولة مرة أخرى."
          setChunkLoadError(errorMsg)
          setChunkText(errorMsg)
        } finally {
          setIsChunkLoading(false)
          setLoading(false)
        }
        return
      }

      // 2. MONGO RAG CHUNK HANDLING
      try {
        const fallbackMongoSessionId = Date.now()
        saveStudySessionToLocalCache({
          id: fallbackMongoSessionId,
          chunkId,
          bookTitle: title,
          domain: fullPath,
          sectionTitle: title,
          createdAt: new Date().toISOString(),
          lastAccessedAt: new Date().toISOString(),
          isActive: true,
        })

        try {
          const session = await studyApi.startSession(
            chunkId,
            title,
            fullPath,
            title,
          )
          if (session && session.id) {
            setActiveSessionId(session.id)
            saveStudySessionToLocalCache(session)
          }
        } catch (err) {
          console.warn(
            "Backend study session start failed, operating in offline/direct mode:",
            err,
          )
        }

        let data: any = null
        try {
          data = await studyApi.getChunkById(chunkId)
        } catch {
          const res = await fetch(
            `${API_BASE}/api/v1/library/chunks/${chunkId}`,
          )
          if (res.ok) data = await res.json()
        }

        if (data) {
          setChunkText(
            data.text ||
              data.content ||
              "تم تحميل الدرس بنجاح، لكن لا يوجد نص متوفر.",
          )
          if (data.metadata) setChunkMeta(data.metadata)
        } else {
          const errorMsg =
            "تعذر تحميل نص الدرس حالياً، يرجى المحاولة مرة أخرى."
          setChunkLoadError(errorMsg)
          setChunkText(errorMsg)
        }
      } catch (e) {
        console.error(e)
        const errorMsg = "تعذر تحميل نص الدرس حالياً، يرجى المحاولة مرة أخرى."
        setChunkLoadError(errorMsg)
        setChunkText(errorMsg)
      } finally {
        setIsChunkLoading(false)
        setLoading(false)
      }
    },
    [
      treeData,
      isDark,
      isMobile,
      focusPanel,
      setCurrentChunkId,
      setActiveSessionId,
      setPendingPlanSteps,
      setChunkTitle,
      setHeaderSubtitle,
      setChunkText,
      setChunkMeta,
      setMessages,
      setChatHistory,
      setMindmapData,
      setQuizQuestions,
      setSelectedAnswers,
      setQuizFlowState,
      setMindmapLoading,
      setQuizLoading,
      setLoading,
      setIsDocumentOpen,
      setIsSidebarOpen,
      setIsQuizOpen,
      setIsMindmapOpen,
      setIsChatOpen,
      setStudyView,
    ],
  )

  const handleSelectSavedSession = useCallback(
    async (sess: StudySessionDto) => {
      setChunkLoadError(null)
      setStudyView("workspace")

      if (sess.chunkId && sess.chunkId.startsWith("turath_")) {
        await executeChunkSelect(
          sess.chunkId,
          sess.sectionTitle || sess.bookTitle,
          (sess as any).fullPath || sess.domain || sess.bookTitle,
        )
        return
      }

      lastAttemptRef.current = { kind: "savedSession", sess }

      setCurrentChunkId(sess.chunkId)
      setChunkTitle(sess.bookTitle || "جلسة دراسية")
      setHeaderSubtitle(sess.sectionTitle || sess.domain || "")
      setActiveSessionId(sess.id)
      setPendingPlanSteps([])
      setChunkText("جاري تحميل بيانات الجلسة والنص الاصلي...")
      setLoading(true)

      if (isMobile) {
        setIsDocumentOpen(true)
        setIsChatOpen(false)
        setIsSidebarOpen(false)
        setIsMindmapOpen(false)
        setIsQuizOpen(false)
        focusPanel("document")
      } else {
        setIsDocumentOpen(true)
        setIsChatOpen(true)
      }

      try {
        let data: any = null
        try {
          data = await studyApi.getChunkById(sess.chunkId)
        } catch {
          const res = await fetch(
            `${API_BASE}/api/v1/library/chunks/${sess.chunkId}`,
          )
          if (res.ok) data = await res.json()
        }

        if (data) {
          setChunkText(data.text || data.content || "تم تحميل الدرس بنجاح.")
          if (data.metadata) setChunkMeta(data.metadata)
        } else {
          const errorMsg =
            "تعذر تحميل نص الدرس المحفوظ حالياً، يرجى المحاولة مرة أخرى."
          setChunkLoadError(errorMsg)
          setChunkText(errorMsg)
        }

        const savedMessages = await studyApi
          .getSessionMessages(sess.id)
          .catch(() => [])

        if (savedMessages && savedMessages.length > 0) {
          const uiMsgs = savedMessages.map((m) => {
            let cleanText = m.content
            if (m.role === "user") {
              if (
                cleanText.includes("ملاحظات حتمية للعمل") ||
                cleanText.includes("أنا كطالب أود البدء في دراسة درس")
              ) {
                cleanText = "أود الحصول على خطة تفاعلية لمذاكرة هذا الدرس."
              } else if (
                cleanText.includes(
                  "أنا كطالب أود الحصول على تلخيص مركز وشامل لدرس",
                )
              ) {
                cleanText =
                  "أود الحصول على تلخيص مركز ومُتوازن لهذا الدرس (لا إفراط ولا تفريط)."
              } else if (
                cleanText.includes(
                  "مرحباً يا زاد، أود فتح باب النقاش المباشر والأسئلة حول درس",
                )
              ) {
                cleanText =
                  "أود بدء التحاور المباشر مع زاد وطرح أسئلتي في هذا الدرس."
              }
            } else {
              const { cleanText: parsed } = studyPlanManager.parseLLMResponse(
                cleanText,
                sess.id,
                true,
              )
              cleanText = parsed
            }

            return {
              id: m.id.toString(),
              role: (m.role === "user" ? "user" : "tutor") as "user" | "tutor",
              text: cleanText,
            }
          })

          setMessages(uiMsgs)
          setChatHistory(
            savedMessages.map((m) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
            })),
          )
        } else {
          setMessages([])
          setChatHistory([])
        }
      } catch (err) {
        console.error("فشل في استرجاع الجلسة المحفوظة:", err)
        const errorMsg =
          "تعذر تحميل بيانات الدرس المحفوظ، يرجى المحاولة مرة أخرى."
        setChunkLoadError(errorMsg)
        setChunkText(errorMsg)
      } finally {
        setLoading(false)
      }
    },
    [
      executeChunkSelect,
      setCurrentChunkId,
      setChunkTitle,
      setHeaderSubtitle,
      setActiveSessionId,
      setPendingPlanSteps,
      setChunkText,
      setLoading,
      isMobile,
      setIsDocumentOpen,
      setIsChatOpen,
      setIsSidebarOpen,
      setIsMindmapOpen,
      setIsQuizOpen,
      focusPanel,
      setChunkMeta,
      setMessages,
      setChatHistory,
      setStudyView,
    ],
  )

  const handleTurathPageChange = useCallback(
    (direction: "next" | "prev", headerSubtitleStr: string) => {
      if (!currentChunkId || !currentChunkId.startsWith("turath_")) return

      const parts = currentChunkId.split("_")
      const turathId = parseInt(parts[1], 10)
      const currentPage = parseInt(parts[3], 10) || 1
      const currentEndPage = parts[5] ? parseInt(parts[5], 10) : currentPage
      const targetPage =
        direction === "next" ? currentEndPage + 1 : Math.max(1, currentPage - 1)
      const targetChunkId = `turath_${turathId}_pg_${targetPage}_to_${targetPage}`

      executeChunkSelect(targetChunkId, `صفحة ${targetPage}`, headerSubtitleStr)
    },
    [currentChunkId, executeChunkSelect],
  )

  const handleChunkSelect = useCallback(
    (chunkId: string, title: string, fullPath: string, node?: TreeNode) => {
      executeChunkSelect(chunkId, title, fullPath, node)
    },
    [executeChunkSelect],
  )

  const handleConfirmChunkSwitch = useCallback(() => {
    if (pendingChunkSwitch) {
      executeChunkSelect(
        pendingChunkSwitch.chunkId,
        pendingChunkSwitch.title,
        pendingChunkSwitch.fullPath,
        pendingChunkSwitch.node,
      )
      setPendingChunkSwitch(null)
    }
  }, [pendingChunkSwitch, executeChunkSelect])

  const handleConfirmExit = useCallback(() => {
    setChunkLoadError(null)
    clearStudySession()
    setIsSidebarOpen(true)
    setIsDocumentOpen(true)
    setIsChatOpen(true)
    setIsMindmapOpen(false)
    setIsQuizOpen(false)
    setConfirmClose(false)
    onExit()
  }, [
    clearStudySession,
    setIsSidebarOpen,
    setIsDocumentOpen,
    setIsChatOpen,
    setIsMindmapOpen,
    setIsQuizOpen,
    onExit,
  ])

  const handleStartNewSession = useCallback(() => {
    setChunkLoadError(null)
    clearStudySession()
    setIsWorkspaceSidebarExpanded(true)
    setIsSidebarOpen(true)
    setIsDocumentOpen(true)
    setIsChatOpen(false)
    setIsMindmapOpen(false)
    setIsQuizOpen(false)
    setStudyView("workspace")
    setActiveQuizId(null)
    setPendingPlanSteps([])
    setLoading(false)
    setIsChunkLoading(false)
    setMindmapLoading(false)
    setQuizLoading(false)
    focusPanel("sidebar")
  }, [
    clearStudySession,
    setIsWorkspaceSidebarExpanded,
    setIsSidebarOpen,
    setIsDocumentOpen,
    setIsChatOpen,
    setIsMindmapOpen,
    setIsQuizOpen,
    setStudyView,
    setActiveQuizId,
    setPendingPlanSteps,
    setLoading,
    setMindmapLoading,
    setQuizLoading,
    focusPanel,
  ])

  const retryChunkLoad = useCallback(() => {
    const last = lastAttemptRef.current
    if (last?.kind === "savedSession") {
      handleSelectSavedSession(last.sess)
      return
    }
    if (last?.kind === "chunk") {
      executeChunkSelect(
        last.chunkId,
        last.title,
        last.fullPath,
        last.selectedNode,
        last.initialMindmapData,
      )
      return
    }
    if (currentChunkId) {
      executeChunkSelect(
        currentChunkId,
        chunkTitle || "الدرس المختار",
        headerSubtitle || "",
      )
    }
  }, [
    currentChunkId,
    chunkTitle,
    headerSubtitle,
    executeChunkSelect,
    handleSelectSavedSession,
  ])

  return {
    isChunkLoading,
    setIsChunkLoading,
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
  }
}

