export function getStudyUserId(): string {
  try {
    const raw = localStorage.getItem('zad_user')
    if (raw) {
      const u = JSON.parse(raw)
      if (u?.id) return String(u.id)
    }
  } catch {}
  return 'guest'
}

export function getSavedQuizzesStorageKey(): string {
  const uid = getStudyUserId()
  return `zad_saved_quizzes_${uid}`
}

export function getSavedMindmapsStorageKey(): string {
  const uid = getStudyUserId()
  return `zad_saved_mindmaps_${uid}`
}

export function getStudyPlanStorageKey(): string {
  const uid = getStudyUserId()
  return `zad_study_plan_progress_${uid}`
}

export function getStudySessionsStorageKey(): string {
  const uid = getStudyUserId()
  return `zad_study_sessions_${uid}`
}

export function saveStudySessionToLocalCache(session: any): void {
  if (!session || !session.chunkId) return
  try {
    const key = getStudySessionsStorageKey()
    const raw = localStorage.getItem(key)
    const list = raw ? JSON.parse(raw) : []
    const existing = list.find(
      (s: any) => s.id === session.id || s.chunkId === session.chunkId
    )
    const mergedSession = {
      ...(existing || {}),
      ...session,
      chunkId: session.chunkId || existing?.chunkId,
      bookTitle: session.bookTitle || existing?.bookTitle,
      domain: session.domain || existing?.domain,
      sectionTitle: session.sectionTitle || existing?.sectionTitle,
    }
    const updated = [
      mergedSession,
      ...list.filter((s: any) => s.id !== mergedSession.id && s.chunkId !== mergedSession.chunkId)
    ]
    localStorage.setItem(key, JSON.stringify(updated.slice(0, 100)))
    localStorage.setItem('zad_study_sessions_cache', JSON.stringify(updated.slice(0, 100)))
  } catch (err) {
    console.warn('Failed saving study session to local cache:', err)
  }
}

export function getLocalStudySessions(): any[] {
  const merged: any[] = []
  const seen = new Set<string>()

  const addItems = (items: any[]) => {
    if (!Array.isArray(items)) return
    for (const item of items) {
      if (!item) continue
      const idKey = item.chunkId ? `chunk_${item.chunkId}` : (item.id ? `id_${item.id}` : null)
      if (idKey && !seen.has(idKey)) {
        seen.add(idKey)
        merged.push(item)
      }
    }
  }

  try {
    // 1. Current user key
    const userKey = getStudySessionsStorageKey()
    const rawUser = localStorage.getItem(userKey)
    if (rawUser) addItems(JSON.parse(rawUser))

    // 2. Global fallback cache
    const rawCache = localStorage.getItem('zad_study_sessions_cache')
    if (rawCache) addItems(JSON.parse(rawCache))

    // 3. Scan all keys in localStorage starting with zad_study_sessions_
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith('zad_study_sessions_') && k !== userKey) {
        const raw = localStorage.getItem(k)
        if (raw) {
          try {
            addItems(JSON.parse(raw))
          } catch {}
        }
      }
    }
  } catch (err) {
    console.warn('Error reading local study sessions:', err)
  }

  return merged
}

export function clearStudyStorageOnLogout(): void {
  try {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (
        k &&
        (k.startsWith('zad_saved_quizzes') ||
          k.startsWith('zad_saved_mindmaps') ||
          k.startsWith('zad_study_plan_progress') ||
          k === 'zad_saved_quizzes' ||
          k === 'zad_saved_mindmaps' ||
          k === 'zad_study_plan_progress')
      ) {
        keysToRemove.push(k)
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k))
  } catch (e) {
    console.warn('Failed clearing study storage on logout:', e)
  }
}

