import { getSavedQuizzesStorageKey, getSavedMindmapsStorageKey } from '../utils/studyStorage'
import { useState, useCallback } from "react"
import { studyApi } from "../../../api/studyApi"
import { API_BASE, TUTOR_API_KEY } from "../utils/studyConfig"
import type { Question, MindmapNode } from "../../../contexts/StudyContext"
import type { QuizFlowState } from "../quiz/types"

export interface UseStudyAiActionsOptions {
  currentChunkId: string | null
  chunkTitle: string
  chunkText: string
  chunkMeta: any
  headerSubtitle: string
  activeSessionId: number | null
  executeChunkSelect: (
    chunkId: string,
    title: string,
    fullPath: string,
    selectedNode?: any,
    initialMindmapData?: MindmapNode[] | null,
  ) => Promise<void>
  requestTutorChat: (
    message: string,
    mode?: "chat" | "plan" | "summary",
    history?: any[],
  ) => Promise<string>
  setQuizQuestions: React.Dispatch<React.SetStateAction<Question[] | null>>
  setSelectedAnswers: React.Dispatch<React.SetStateAction<Record<number, number>>>
  setQuizFlowState: React.Dispatch<React.SetStateAction<QuizFlowState>>
  setMindmapData: React.Dispatch<React.SetStateAction<MindmapNode[] | null>>
  setIsQuizOpen: (open: boolean) => void
  setIsMindmapOpen: (open: boolean) => void
  setIsChatOpen: (open: boolean) => void
  focusPanel: (panel: "chat" | "document" | "mindmap" | "quiz" | "sidebar") => void
  setMessages: React.Dispatch<React.SetStateAction<any[]>>
  setChatHistory: React.Dispatch<React.SetStateAction<any[]>>
  setLoading: (loading: boolean) => void
}

export function useStudyAiActions({
  currentChunkId,
  chunkTitle,
  chunkText,
  chunkMeta,
  headerSubtitle,
  executeChunkSelect,
  requestTutorChat,
  setQuizQuestions,
  setSelectedAnswers,
  setQuizFlowState,
  setMindmapData,
  setIsQuizOpen,
  setIsMindmapOpen,
  setIsChatOpen,
  focusPanel,
  setMessages,
  setChatHistory,
  setLoading,
}: UseStudyAiActionsOptions) {
  const [mindmapLoading, setMindmapLoading] = useState(false)
  const [quizLoading, setQuizLoading] = useState(false)
  const [activeQuizId, setActiveQuizId] = useState<number | null>(null)

  const handleGenerateQuiz = useCallback(
    async (options?: {
      numQuestions?: number | "auto"
      aiMode?: "comprehensive" | "random"
      difficulty?: "easy" | "medium" | "hard"
      questionTypes?: string[]
      isAppend?: boolean
    }) => {
      if (!currentChunkId) return alert("الرجاء اختيار درس من الفهرس أولاً")

      setIsQuizOpen(true)
      focusPanel("quiz")
      setQuizLoading(true)

      if (!options?.isAppend) {
        setQuizQuestions(null)
        setSelectedAnswers({})
      }

      const num_questions =
        options?.numQuestions === "auto" ? 0 : options?.numQuestions || 5
      const mode = options?.aiMode || "comprehensive"
      const difficulty = options?.difficulty || "medium"

      try {
        let questionsList: any = null
        let alreadySavedInDb = false
        let dbQuizDto: any = null

        // 1. Call .NET backend API to generate and save quiz in database for all users
        try {
          const quizDto = await studyApi.generateQuiz(
            currentChunkId,
            num_questions,
            mode,
            difficulty,
            chunkTitle,
            chunkText,
            (chunkMeta as any)?.book_title || headerSubtitle,
          )

          if (quizDto?.id) {
            setActiveQuizId(quizDto.id)
            alreadySavedInDb = true
            dbQuizDto = quizDto
          }

          questionsList =
            quizDto.questionsData?.questions || quizDto.questionsData
        } catch (err) {
          console.warn(
            ".NET Backend generate quiz failed, trying tutor engine API:",
            err,
          )
        }

        // 2. Try calling dedicated /api/v1/tutor/quiz/generate
        if (!questionsList && (chunkText || currentChunkId)) {
          try {
            const res = await fetch(`${API_BASE}/api/v1/tutor/quiz/generate`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-API-Key": TUTOR_API_KEY,
              },
              body: JSON.stringify({
                chunk_id: currentChunkId,
                text: chunkText || undefined,
                metadata: {
                  book_title:
                    (chunkMeta as any)?.book_title ||
                    headerSubtitle ||
                    chunkTitle,
                },
                num_questions,
                mode,
                difficulty,
                question_types: options?.questionTypes || [
                  "mcq",
                  "true_false",
                  "fill_blank",
                  "matching",
                ],
              }),
            })

            if (res.ok) {
              const data = await res.json()
              if (data.success && data.quiz) {
                questionsList = data.quiz.questions || data.quiz
              }
            }
          } catch (tutorErr) {
            console.warn(
              "Backend tutor quiz/generate failed, falling back to direct prompt:",
              tutorErr,
            )
          }
        }

        // 3. Direct Fallback: generate quiz questions directly via /chat/raw
        if (!questionsList && chunkText) {
          try {
            const allowedTypes =
              options?.questionTypes && options.questionTypes.length > 0
                ? options.questionTypes
                : ["mcq", "true_false", "fill_blank", "matching"]

            const typesGuide = []
            if (allowedTypes.includes("mcq")) {
              typesGuide.push(
                `- 'mcq' (اختيار من متعدد): 4 خيارات رصينة (أحدها صحيح تماماً و3 مشتتات علمية واقعية)، يقيس الفهم العميق والتحليل والاستنباط.`,
              )
            }
            if (allowedTypes.includes("true_false")) {
              typesGuide.push(
                `- 'true_false' (صح أو خطأ): الخيارات دائماً حصراً ["صواب", "خطأ"]، يقيس الدقة في ضبط القواعد والشروط وصحة نسبة الأقوال ونفي الأوهام.`,
              )
            }
            if (allowedTypes.includes("fill_blank")) {
              typesGuide.push(
                `- 'fill_blank' (إكمال الفراغ): يجب أن يحتوي نص السؤال وجوباً على كلمة '[فراغ]'، والخيارات 4 مصطلحات مقتضبة، لضبط المصطلحات الدقيقة وألفاظ المتون والقواعد.`,
              )
            }
            if (allowedTypes.includes("matching")) {
              typesGuide.push(
                `- 'matching' (توصيل ومطابقة): يجب أن يحتوي السؤال على خاصية 'matching_pairs' بها من 3 إلى 5 أزواج متناسقة [{"left": "...", "right": "..."}]، لمطابقة المصطلحات بتعريفاتها، أو الأقوال بقائليها، أو الأقسام بضوابطها.`,
              )
            }

            const countInstruction =
              num_questions <= 0
                ? `1. استقصاء شامل وحصري (Exhaustive Knowledge Scan): هذا النص قد ينتمي لأي فرع من العلوم الإسلامية والعربية والتاريخية (عقيدة وتوحيد، تفسير وعلوم قرآن، حديث ومصطلحه وشروحه، فقه وأصول وقواعد، سيرة وتاريخ وتراجم، علوم اللغة من نحو وصرف وبلاغة، تزكية وآداب).\nقم بعمل مسح دقيق للنص من أوله إلى آخره، واستخرج سؤالاً مستقلاً لكل مسألة، تعريف، مصطلح، تقسيم، حكم، علة، دليل، شاهد، أو فائدة علمية وردت في النص، دون أن تترك أي معلومة ذات بال بدون سؤال، واجعل عدد الأسئلة الإجمالي متطابقاً مع عدد النقاط المعرفية المستخلصة دون تحديد سقف مصطنع.`
                : `1. التزم باستخراج بالضبط (${num_questions}) أسئلة تقييمية تغطي أهم وأبرز المحاور والفوائد العلمية في النص.`

            const quizPrompt = `أنت خبير تربوي ومحقق متخصص في العلوم الإسلامية واللغوية والتاريخية.

المطلوب إنشاء اختبار تقييمي احترافي تفاعلي للنص التالي المأخوذ من: "${chunkTitle || "الدرس المختار"}".

مستوى الصعوبة المطلوب: ${difficulty === "easy"
                ? "مباشر وواضح"
                : difficulty === "hard"
                  ? "متقدم ودقيق يقيس الاستنباط"
                  : "متوسط يقيس الاستيعاب والفهم"
              }.

التعليمات والقواعد الصارمة:

${countInstruction}

2. تنويع الأنماط بذكاء: وزّع الأسئلة بين الأنماط المتاحة أدناه بحسب ما يناسب طبيعة كل معلومة وفائدة، ولا تقصر الاختبار على نمط واحد:

${typesGuide.join("\n")}

3. التعليل العلمي (explanation): لكل سؤال، اكتب شرحاً علمياً دقيقاً في حقل explanation يوضح وجه صحة الإجابة مستنداً إلى النص المعروض ومبيناً دليله أو تعليله وعزوه للمصنف إن وُجد.

4. التنسيق: أخرج الناتج فقط وحصرياً ككائن JSON صالح 100% بدون أي نصوص أو شروحات خارج الكود، بالهيكل التالي:

\`\`\`json
{
  "questions": [
    {
      "id": "1",
      "type": "mcq",
      "question": "نص السؤال الاستنباطي أو التحليلي؟",
      "options": ["الخيار الصحيح", "مشتت 1", "مشتت 2", "مشتت 3"],
      "correct_answer_index": 0,
      "explanation": "بيان وجه الصحة والتعليل من النص."
    },
    {
      "id": "2",
      "type": "true_false",
      "question": "نص العبارة التقريرية المراد الحكم عليها من واقع النص؟",
      "options": ["صواب", "خطأ"],
      "correct_answer_index": 0,
      "explanation": "توضيح الصواب والتعليل."
    },
    {
      "id": "3",
      "type": "fill_blank",
      "question": "المقصود بـ [فراغ] في هذا السياق هو كذا وكذا.",
      "options": ["المصطلح الصحيح", "بديل 1", "بديل 2", "بديل 3"],
      "correct_answer_index": 0,
      "explanation": "شرح المصطلح وسياقه في النص."
    },
    {
      "id": "4",
      "type": "matching",
      "question": "صل بين المفاهيم في القائمة (أ) وما يطابقها في القائمة (ب):",
      "options": ["الربط الصحيح الكامل", "ربط غير صحيح"],
      "correct_answer_index": 0,
      "explanation": "شرح التوافق والمطابقة بين العناصر.",
      "matching_pairs": [
        {"left": "العنصر أو المفهوم 1", "right": "البيان أو التعريف 1"},
        {"left": "العنصر أو المفهوم 2", "right": "البيان أو التعريف 2"},
        {"left": "العنصر أو المفهوم 3", "right": "البيان أو التعريف 3"}
      ]
    }
  ]
}
\`\`\``

            const res = await fetch(`${API_BASE}/api/v1/tutor/chat/raw`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-API-Key": TUTOR_API_KEY,
              },
              body: JSON.stringify({
                text: chunkText,
                message: quizPrompt,
                mode: "chat",
                history: [],
              }),
            })

            const data = await res.json()
            if (data.success && data.reply) {
              const raw = data.reply
              let parsed: any = null
              const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
              const candidateStr = (jsonMatch ? jsonMatch[1] : raw).trim()

              try {
                parsed = JSON.parse(candidateStr)
              } catch {
                try {
                  const sObj = candidateStr.indexOf("{")
                  const eObj = candidateStr.lastIndexOf("}")
                  if (sObj !== -1 && eObj !== -1 && eObj > sObj) {
                    parsed = JSON.parse(candidateStr.slice(sObj, eObj + 1))
                  }
                } catch {
                  try {
                    const sArr = candidateStr.indexOf("[")
                    const eArr = candidateStr.lastIndexOf("]")
                    if (sArr !== -1 && eArr !== -1 && eArr > sArr) {
                      parsed = JSON.parse(candidateStr.slice(sArr, eArr + 1))
                    }
                  } catch { }
                }
              }

              if (parsed) {
                questionsList = parsed.questions || parsed
              }
            }
          } catch (rawQuizErr) {
            console.warn("Raw quiz generation fallback failed:", rawQuizErr)
          }
        }

        if (questionsList && Array.isArray(questionsList)) {
          questionsList = questionsList.map((q: any, i: number) => ({
            ...q,
            id: q.id || String(i + 1),
            type: q.type || "mcq",
            options: Array.isArray(q.options) ? q.options : [],
            correct_answer_index:
              typeof q.correct_answer_index === "number"
                ? q.correct_answer_index
                : 0,
            explanation: q.explanation || "",
          }))

          if (options?.isAppend) {
            setQuizQuestions((prev) =>
              prev ? [...prev, ...questionsList] : questionsList,
            )
          } else {
            setQuizQuestions(questionsList)
          }

          const bookTitleStr =
            (chunkMeta as any)?.book_title || headerSubtitle || "درس شرعي"
          const lessonTitleStr = chunkTitle || "درس دراسي"
          const finalQuizTitle = `اختبار: ${lessonTitleStr}`

          const quizObjToStore = dbQuizDto || {
            id: Date.now(),
            chunkId: currentChunkId,
            title: finalQuizTitle,
            sectionTitle: lessonTitleStr,
            bookTitle: bookTitleStr,
            lessonTitle: lessonTitleStr,
            mode: mode,
            difficulty: difficulty,
            questionsData: questionsList,
            authorName: "طالب في زاد (أنت)",
            createdAt: new Date().toISOString(),
            isSharedInCommunity: false,
          }

          // Save generated quiz to localStorage cache as immediate fallback
          try {
            const storedStr = localStorage.getItem(getSavedQuizzesStorageKey())
            const storedList: any[] = storedStr ? JSON.parse(storedStr) : []
            const exists = storedList.some(
              (q) =>
                (quizObjToStore.id && q.id === quizObjToStore.id) ||
                (q.chunkId === currentChunkId && q.title === finalQuizTitle),
            )

            if (!exists) {
              storedList.unshift(quizObjToStore)
              localStorage.setItem(getSavedQuizzesStorageKey(),
                JSON.stringify(storedList.slice(0, 50)),
              )
            }
            window.dispatchEvent(new CustomEvent("zad_quizzes_updated"))
          } catch (e) {
            console.warn("Failed saving quiz to localStorage fallback:", e)
          }

          // Persist to backend database ONLY if not already saved by generateQuiz
          if (!alreadySavedInDb) {
            try {
              const savedDto = await studyApi.saveQuiz(
                currentChunkId,
                finalQuizTitle,
                lessonTitleStr,
                mode,
                difficulty,
                questionsList,
                bookTitleStr,
              )
              if (savedDto && savedDto.id) {
                setActiveQuizId(savedDto.id)
                try {
                  const raw = localStorage.getItem(getSavedQuizzesStorageKey())
                  if (raw) {
                    const list = JSON.parse(raw)
                    const updated = list.map((q: any) =>
                      q.id === quizObjToStore.id ||
                        (q.chunkId === currentChunkId && q.title === finalQuizTitle)
                        ? savedDto
                        : q,
                    )
                    localStorage.setItem(getSavedQuizzesStorageKey(),
                      JSON.stringify(updated),
                    )
                  }
                } catch { }
              }
              window.dispatchEvent(new CustomEvent("zad_quizzes_updated"))
            } catch (saveErr) {
              console.warn("Backend saveQuiz notice:", saveErr)
            }
          }
        } else {
          alert(
            "تعذر استخراج أسئلة التقييم لهذا الدرس حالياً نظراً للضغط على الخدمة، يرجى إعادة المحاولة.",
          )
        }
      } catch (e: any) {
        const errorMsg =
          e?.message && e.message !== "Failed to fetch"
            ? e.message
            : "خوادم الذكاء الاصطناعي تشهد ضغطاً مؤقتاً حالياً، يرجى المحاولة مرة أخرى بعد لحظات."
        alert(errorMsg)
      } finally {
        setQuizLoading(false)
      }
    },
    [
      currentChunkId,
      chunkTitle,
      chunkText,
      chunkMeta,
      headerSubtitle,
      setIsQuizOpen,
      focusPanel,
      setQuizQuestions,
      setSelectedAnswers,
    ],
  )

  const handleLoadQuiz = useCallback(
    async (quizDto: any) => {
      if (!quizDto) return

      setActiveQuizId(quizDto.id)

      const targetChunkId = quizDto.chunkId || quizDto.chunk_id
      if (targetChunkId && targetChunkId !== currentChunkId) {
        const cleanLessonTitle =
          quizDto.sectionTitle ||
          quizDto.lessonTitle ||
          quizDto.title?.replace(/^اختبار:\s*/, "") ||
          "درس دراسي"
        const cleanBookTitle = quizDto.bookTitle || "كتاب شرعي"
        await executeChunkSelect(targetChunkId, cleanLessonTitle, cleanBookTitle)
      }

      let questionsList =
        quizDto.questionsData?.questions || quizDto.questionsData

      if (typeof questionsList === "string") {
        try {
          const parsed = JSON.parse(questionsList)
          questionsList = parsed.questions || parsed
        } catch (e) {
          console.warn("Failed parsing quiz questionsData string:", e)
        }
      }

      setQuizQuestions(Array.isArray(questionsList) ? questionsList : null)

      setQuizFlowState((prev) => ({
        ...prev,
        hasExited: false,
        isHomeScreen: false,
        isSetupMode: false,
        isReadyScreen: true,
        isQuizStarted: false,
      }))
    },
    [currentChunkId, executeChunkSelect, setQuizQuestions, setQuizFlowState],
  )

  const handleOpenQuizSetup = useCallback(() => {
    if (!currentChunkId) return alert("الرجاء اختيار درس من الفهرس أولاً")

    setIsQuizOpen(true)
    focusPanel("quiz")

    setQuizFlowState((prev) => ({
      ...prev,
      hasExited: false,
      isHomeScreen: false,
      isSetupMode: true,
      isReadyScreen: false,
      isQuizStarted: false,
    }))
  }, [currentChunkId, setIsQuizOpen, focusPanel, setQuizFlowState])

  const handleGenerateMindmap = useCallback(async () => {
    if (!currentChunkId) return alert("الرجاء اختيار درس من الفهرس أولاً")

    setIsMindmapOpen(true)
    focusPanel("mindmap")
    setMindmapLoading(true)
    setMindmapData(null)

    try {
      let tree: any = null
      let alreadySavedInDb = false
      let dbMindmapDto: any = null

      // 1. Call .NET Backend first to generate and save mindmap in database
      try {
        const mindmapDto = await studyApi.generateMindmap(
          currentChunkId,
          chunkText,
          chunkTitle,
          chunkMeta,
        )
        if (mindmapDto && mindmapDto.treeData) {
          tree = mindmapDto.treeData
          if (mindmapDto.id) {
            alreadySavedInDb = true
            dbMindmapDto = mindmapDto
          }
        }
      } catch (err) {
        console.warn(
          ".NET Backend mindmap failed, fallback to direct tutor engine:",
          err,
        )
      }

      // 2. Direct tutor engine
      if (!tree) {
        try {
          const res = await fetch(`${API_BASE}/api/v1/tutor/mindmap/generate`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-API-Key": TUTOR_API_KEY,
            },
            body: JSON.stringify({
              chunk_id: currentChunkId,
              text: chunkText,
              metadata: {
                ...chunkMeta,
                chunk_title: chunkTitle,
              },
            }),
          })

          const data = await res.json()
          if (data.success && data.tree) {
            tree = data.tree
          }
        } catch (mindmapErr) {
          console.warn(
            "Direct mindmap API failed, fallback to raw generation:",
            mindmapErr,
          )
        }
      }

      // 3. Fallback: generate Mindmap directly from raw chapter text via /chat/raw
      if (!tree && chunkText) {
        try {
          const mindmapPrompt =
            `قم باستخراج خريطة ذهنية هيكلية لهذا الدرس الشرعي: "${chunkTitle || ""}".\n` +
            `أخرج النتيجة حصراً بصيغة كود JSON فقط تمثل الشجرة الهيكلية بهذا الشكل وبدون أي نصوص إضافية:\n` +
            `\`\`\`json\n` +
            `{\n  "id": "1",\n  "label": "${chunkTitle || "عنوان الدرس"}",\n  "content": "ملخص عام للدرس",\n  "children": [\n    {\n      "id": "2",\n      "label": "المحور الأول",\n      "content": "شرح وتفاصيل المحور الأول",\n      "children": []\n    }\n  ]\n}\n\`\`\``

          const res = await fetch(`${API_BASE}/api/v1/tutor/chat/raw`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-API-Key": TUTOR_API_KEY,
            },
            body: JSON.stringify({
              text: chunkText,
              message: mindmapPrompt,
              mode: "chat",
              history: [],
            }),
          })

          const data = await res.json()
          if (data.success && data.reply) {
            const raw = data.reply
            const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [
              null,
              raw,
            ]
            const cleaned = (jsonMatch[1] || raw).trim()
            tree = JSON.parse(cleaned)
          }
        } catch (rawMindmapErr) {
          console.warn("Raw mindmap fallback failed:", rawMindmapErr)
        }
      }

      if (tree) {
        const nodes = Array.isArray(tree) ? tree : [tree]
        setMindmapData(nodes)

        const bookTitleStr =
          (chunkMeta as any)?.book_title || headerSubtitle || "درس شرعي"
        const lessonTitleStr = chunkTitle || "عنوان الدرس"
        const finalMindmapTitle = chunkTitle ? `خريطة: ${chunkTitle}` : "خريطة مفاهيم الدرس"

        const mindmapObjToStore = dbMindmapDto || {
          id: Date.now(),
          chunkId: currentChunkId,
          title: finalMindmapTitle,
          bookTitle: bookTitleStr,
          lessonTitle: lessonTitleStr,
          treeData: nodes,
          authorName: "طالب في زاد (أنت)",
          createdAt: new Date().toISOString(),
        }

        // Save generated mindmap to localStorage cache as immediate fallback
        try {
          const storedStr = localStorage.getItem(getSavedMindmapsStorageKey())
          const storedList: any[] = storedStr ? JSON.parse(storedStr) : []
          const exists = storedList.some(
            (m) =>
              (mindmapObjToStore.id && m.id === mindmapObjToStore.id) ||
              (m.chunkId === currentChunkId && m.title === finalMindmapTitle),
          )

          if (!exists) {
            storedList.unshift(mindmapObjToStore)
            localStorage.setItem(getSavedMindmapsStorageKey(),
              JSON.stringify(storedList.slice(0, 50)),
            )
          }
          window.dispatchEvent(new CustomEvent("zad_mindmaps_updated"))
        } catch (e) {
          console.warn("Failed saving mindmap to localStorage:", e)
        }

        // Persist to backend database ONLY if not already saved by generateMindmap
        if (!alreadySavedInDb) {
          studyApi
            .saveMindmap(
              currentChunkId,
              finalMindmapTitle,
              nodes,
              bookTitleStr,
              lessonTitleStr,
            )
            .then((savedDto) => {
              if (savedDto && savedDto.id) {
                try {
                  const raw = localStorage.getItem(getSavedMindmapsStorageKey())
                  if (raw) {
                    const list = JSON.parse(raw)
                    const updated = list.map((m: any) =>
                      m.id === mindmapObjToStore.id ||
                        (m.chunkId === currentChunkId && m.title === finalMindmapTitle)
                        ? savedDto
                        : m,
                    )
                    localStorage.setItem(getSavedMindmapsStorageKey(),
                      JSON.stringify(updated),
                    )
                  }
                } catch { }
              }
              window.dispatchEvent(new CustomEvent("zad_mindmaps_updated"))
            })
            .catch((saveErr) => {
              console.warn("Backend saveMindmap notice:", saveErr)
            })
        }
      } else {
        alert(
          "تعذر استخراج الخريطة الذهنية لهذا الدرس حالياً نظراً للضغط على الخدمة، يرجى إعادة المحاولة.",
        )
      }
    } catch (e: any) {
      const errorMsg =
        e?.message && e.message !== "Failed to fetch"
          ? e.message
          : "خوادم الذكاء الاصطناعي تشهد ضغطاً مؤقتاً حالياً، يرجى المحاولة مرة أخرى بعد لحظات."
      alert(errorMsg)
    } finally {
      setMindmapLoading(false)
    }
  }, [
    currentChunkId,
    chunkTitle,
    chunkText,
    chunkMeta,
    headerSubtitle,
    setIsMindmapOpen,
    focusPanel,
    setMindmapData,
  ])

  const handleDiscussQuestion = useCallback(
    async (q: Question, wrongOpt: string) => {
      let hiddenMsg = ""

      if (q.question.startsWith("أسئلة الاختبار الخاطئة")) {
        hiddenMsg = `أنا كطالب أواجه صعوبة في فهم بعض الأسئلة التي أخطأت فيها خلال الاختبار:\n\n${q.explanation}\n\nهل يمكنك مراجعة هذه الأخطاء معي وتوضيح المفاهيم الشرعية الصحيحة ببساطة وإيجاز؟`
      } else {
        hiddenMsg = `أنا كطالب أواجه صعوبة في فهم هذا السؤال:\n• السؤال: "${q.question}"\n• إجابتي: "${wrongOpt}"\n• الإجابة الصحيحة: "${q.options[q.correct_answer_index]}"\n• التفسير المرفق: "${q.explanation}"\n\nهل يمكنك أن تبسط لي الأمر وتتناقش معي فيه؟`
      }

      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "user", text: hiddenMsg },
      ])

      setIsChatOpen(true)
      focusPanel("chat")
      setLoading(true)

      try {
        const replyText = await requestTutorChat(hiddenMsg, "chat")

        if (replyText) {
          setMessages((prev) => [
            ...prev,
            { id: Date.now().toString(), role: "tutor", text: replyText },
          ])

          setChatHistory((prev) => [
            ...prev,
            { role: "user", content: hiddenMsg },
            { role: "assistant", content: replyText },
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
    [requestTutorChat, setMessages, setChatHistory, setIsChatOpen, focusPanel, setLoading],
  )

  return {
    quizLoading,
    setQuizLoading,
    mindmapLoading,
    setMindmapLoading,
    activeQuizId,
    setActiveQuizId,
    handleGenerateQuiz,
    handleLoadQuiz,
    handleOpenQuizSetup,
    handleGenerateMindmap,
    handleDiscussQuestion,
  }
}
