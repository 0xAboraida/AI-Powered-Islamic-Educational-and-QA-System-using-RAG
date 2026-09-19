export interface StudyPlanStep {
  id: number
  title: string
  isCompleted: boolean
}

export interface SessionPlanProgress {
  sessionId: number | string
  chunkId?: string
  bookTitle?: string
  totalSteps: number
  completedSteps: number
  steps: StudyPlanStep[]
  updatedAt: string
}

export const studyPlanManager = {
  STORAGE_KEY: 'zad_study_plan_progress_v2',

  getAllProgress(): Record<string, SessionPlanProgress> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY)
      return data ? JSON.parse(data) : {}
    } catch {
      return {}
    }
  },

  getSessionProgress(keyId?: number | string | null): SessionPlanProgress | null {
    if (!keyId) return null
    const all = this.getAllProgress()
    return all[keyId] || null
  },

  saveSessionPlan(keyId: number | string, steps: string[], chunkId?: string, bookTitle?: string): SessionPlanProgress {
    const all = this.getAllProgress()
    const planSteps: StudyPlanStep[] = steps.map((s, idx) => ({
      id: idx + 1,
      title: String(s).replace(/^[0-9]+[\.\-\)]\s*/, '').trim(),
      isCompleted: false
    }))
    const newProgress: SessionPlanProgress = {
      sessionId: keyId,
      chunkId,
      bookTitle,
      totalSteps: planSteps.length,
      completedSteps: 0,
      steps: planSteps,
      updatedAt: new Date().toISOString()
    }
    all[keyId] = newProgress
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(all))
    window.dispatchEvent(new Event('storage'))
    return newProgress
  },

  resetPlanProgress(keyId?: number | string | null) {
    if (!keyId) return
    const all = this.getAllProgress()
    if (all[keyId]) {
      delete all[keyId]
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(all))
      window.dispatchEvent(new Event('storage'))
      window.dispatchEvent(new Event('zad_plan_updated'))
    }
  },

  markStepCompleted(keyId: number | string, stepId: number, isCompleted = true): SessionPlanProgress | null {
    const all = this.getAllProgress()
    const sessionProgress = all[keyId]
    if (!sessionProgress) return null

    // Ensure sequential progression: mark target step AND all preceding steps as completed
    sessionProgress.steps.forEach(s => {
      if (s.id <= stepId) {
        s.isCompleted = isCompleted
      }
    })

    sessionProgress.completedSteps = sessionProgress.steps.filter(s => s.isCompleted).length
    sessionProgress.updatedAt = new Date().toISOString()
    all[keyId] = sessionProgress
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(all))
    window.dispatchEvent(new Event('storage'))
    window.dispatchEvent(new Event('zad_plan_updated'))
    return sessionProgress
  },

  markStepActive(keyId: number | string, activeStepId: number): SessionPlanProgress | null {
    const all = this.getAllProgress()
    const sessionProgress = all[keyId]
    if (!sessionProgress) return null

    // Mark all preceding steps completed. NEVER un-complete a step to prevent progress bar from going backwards!
    sessionProgress.steps.forEach(s => {
      if (s.id < activeStepId) {
        s.isCompleted = true
      }
    })

    sessionProgress.completedSteps = sessionProgress.steps.filter(s => s.isCompleted).length
    sessionProgress.updatedAt = new Date().toISOString()
    all[keyId] = sessionProgress
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(all))
    window.dispatchEvent(new Event('storage'))
    window.dispatchEvent(new Event('zad_plan_updated'))
    return sessionProgress
  },

  getCompletionPercentage(keyId?: number | string | null): number {
    if (!keyId) return 0
    const sessionProgress = this.getSessionProgress(keyId)
    if (!sessionProgress || sessionProgress.totalSteps === 0) return 0
    return Math.round((sessionProgress.completedSteps / sessionProgress.totalSteps) * 100)
  },

  parseLLMResponse(content: string, keyId: number | string, autoActivate = false) {
    let cleanText = content
    let stepCompletedId: number | null = null
    let activeStepId: number | null = null
    let extractedSteps: string[] = []

    // 1. Parse JSON metadata block from native Gemini Tool Function call or inline JSON
    const jsonMatch =
      content.match(/```json\s*([\s\S]*?)\s*```/i) ||
      content.match(/(\{[\s\S]*?"(?:plan_steps|active_step_id|completed_step_id|completed_step_index|next_step_index|action)"[\s\S]*?\})/i)

    if (jsonMatch) {
      try {
        const jsonStr = jsonMatch[1] || jsonMatch[0]
        const parsed = JSON.parse(jsonStr)

        if (parsed.plan_steps && Array.isArray(parsed.plan_steps)) {
          extractedSteps = parsed.plan_steps.map((s: any) => String(s).trim()).filter(Boolean)
        }

        // Handle 1-indexed (completed_step_id) vs 0-indexed (completed_step_index)
        if (parsed.completed_step_id !== undefined && parsed.completed_step_id !== null) {
          stepCompletedId = parseInt(parsed.completed_step_id, 10)
        } else if (parsed.completed_step_index !== undefined && parsed.completed_step_index !== null) {
          stepCompletedId = parseInt(parsed.completed_step_index, 10) + 1
        }

        // Handle 1-indexed (active_step_id) vs 0-indexed (next_step_index)
        if (parsed.active_step_id !== undefined && parsed.active_step_id !== null) {
          activeStepId = parseInt(parsed.active_step_id, 10)
        } else if (parsed.next_step_index !== undefined && parsed.next_step_index !== null) {
          activeStepId = parseInt(parsed.next_step_index, 10) + 1
        }

        if (parsed.reply) {
          cleanText = parsed.reply
        } else {
          cleanText = cleanText
            .replace(/```json\s*[\s\S]*?\s*```/gi, '')
            .replace(/\{[\s\S]*?"(?:plan_steps|active_step_id|completed_step_id|completed_step_index|next_step_index|action)"[\s\S]*?\}/gi, '')
            .trim()
        }
      } catch (e) {
        console.warn('Failed parsing JSON plan block from LLM:', e)
      }
    }

    // 2. Strict Sequential State Updates based on JSON Metadata
    const currentProgress = this.getSessionProgress(keyId)
    if (currentProgress && currentProgress.steps.length > 0) {
      if (stepCompletedId && stepCompletedId > 0) {
        this.markStepCompleted(keyId, stepCompletedId, true)
      }

      if (activeStepId && activeStepId > 1) {
        this.markStepActive(keyId, activeStepId)
      }
    }

    // Auto-save plan if autoActivate is true and extractedSteps present
    if (extractedSteps.length > 0 && autoActivate) {
      this.saveSessionPlan(keyId, extractedSteps)
    }

    return {
      cleanText: cleanText.trim(),
      stepCompletedId,
      activeStepId,
      extractedSteps
    }
  }
}
