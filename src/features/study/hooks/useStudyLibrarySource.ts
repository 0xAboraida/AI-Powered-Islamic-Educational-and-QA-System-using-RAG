import { useState, useEffect, useRef, useCallback } from 'react'
import { type TreeNode } from '../../../contexts/StudyContext'
import { studyApi } from '../../../api/studyApi'
import {
  idbGetBookTree,
  idbSetBookTree,
  idbGetCachedBookTitles,
  idbGetTurathBookTree,
  idbSetTurathBookTree,
  idbGetCachedTurathBookIds,
  idbDeleteTurathBookTree,
} from '../../../utils/indexedDbStorage'
import {
  fetchTurathBookIndexes,
  convertTurathHeadingsToTree,
} from '../../../api/turathApi'

const TUTOR_ENGINE_URL =
  import.meta.env.VITE_TUTOR_ENGINE_URL ||
  'https://abourida-zad-tutor-engine-space.hf.space'

const API_BASE = TUTOR_ENGINE_URL

export interface UseStudyLibrarySourceOptions {
  treeData: TreeNode[]
  setTreeData: (data: TreeNode[] | ((prev: TreeNode[]) => TreeNode[])) => void
  setTreeLoading: (loading: boolean) => void
  onSelectChunk?: (chunkId: string, title: string, fullPath: string, node?: TreeNode) => void
}

export function updateBookInTree(
  nodes: TreeNode[],
  bookTitle: string,
  chapters: TreeNode[],
  bookId?: number
): TreeNode[] {
  return nodes.map((node) => {
    const isTarget = bookId
      ? node.turath_id === bookId
      : node.title === bookTitle

    if (isTarget) {
      return {
        ...node,
        children: chapters,
        is_loaded: true,
      }
    }

    if (node.children && node.children.length > 0) {
      return {
        ...node,
        children: updateBookInTree(
          node.children,
          bookTitle,
          chapters,
          bookId
        ),
      }
    }

    return node
  })
}

export function useStudyLibrarySource({
  setTreeData,
  setTreeLoading,
  onSelectChunk,
}: UseStudyLibrarySourceOptions) {
  const [librarySource, setLibrarySource] = useState<'mongo' | 'turath'>(() => {
    return (
      (localStorage.getItem('zad_study_library_source') as 'mongo' | 'turath') ||
      'turath'
    )
  })

  const librarySourceRef = useRef(librarySource)
  useEffect(() => {
    librarySourceRef.current = librarySource
  }, [librarySource])

  const onSelectChunkRef = useRef(onSelectChunk)
  useEffect(() => {
    onSelectChunkRef.current = onSelectChunk
  }, [onSelectChunk])

  const fetchTreeRequestId = useRef(0)

  const fetchTree = useCallback(
    async (sourceOverride?: 'mongo' | 'turath') => {
      const requestId = ++fetchTreeRequestId.current

      try {
        setTreeLoading(true)

        const currentSource =
          sourceOverride ||
          (localStorage.getItem('zad_study_library_source') as 'mongo' | 'turath') ||
          librarySourceRef.current ||
          'turath'

        // ==============================================================
        // 1. TURATH GLOBAL ENGINE PIPELINE (8,589 books across 40 domains)
        // ==============================================================
        if (currentSource === 'turath') {
          let turathCatalog: TreeNode[] | null = null

          try {
            const res = await fetch('/data/turath_catalog.json')
            if (res.ok) {
              turathCatalog = await res.json()
            }
          } catch (e) {
            console.warn('Failed to load /data/turath_catalog.json:', e)
          }

          if (turathCatalog && turathCatalog.length > 0) {
            // Apply Admin Turath Visibility Filtering if configured
            try {
              const rawConfig = localStorage.getItem('zad_turath_visibility_config')
              if (rawConfig) {
                const cfg = JSON.parse(rawConfig)
                if (cfg.mode === 'custom' && Array.isArray(cfg.allowedBookIds)) {
                  const allowedSet = new Set(cfg.allowedBookIds.map(String))
                  turathCatalog = turathCatalog
                    .map((cat) => ({
                      ...cat,
                      children: (cat.children || []).filter((b) =>
                        allowedSet.has(String(b.turath_id))
                      ),
                    }))
                    .filter((cat) => cat.children && cat.children.length > 0)
                } else if (
                  cfg.mode === 'all' &&
                  Array.isArray(cfg.hiddenBookIds) &&
                  cfg.hiddenBookIds.length > 0
                ) {
                  const hiddenSet = new Set(cfg.hiddenBookIds.map(String))
                  turathCatalog = turathCatalog
                    .map((cat) => ({
                      ...cat,
                      children: (cat.children || []).filter(
                        (b) => !hiddenSet.has(String(b.turath_id))
                      ),
                    }))
                    .filter((cat) => cat.children && cat.children.length > 0)
                }
              }
            } catch (cfgErr) {
              console.warn('Turath visibility filtering notice:', cfgErr)
            }

            // Hydrate only books that were previously clicked & cached in IndexedDB
            try {
              const cachedIds = await idbGetCachedTurathBookIds()
              if (cachedIds.length > 0) {
                const cachedSet = new Set(cachedIds.map(String))

                for (const cat of turathCatalog) {
                  for (const book of cat.children || []) {
                    const bId = String(book.turath_id || '')
                    if (bId && cachedSet.has(bId)) {
                      const cachedBook = await idbGetTurathBookTree(bId)
                      const isFallback =
                        cachedBook?.children?.length === 1 &&
                        cachedBook.children[0].title === 'قراءة الكتاب (من البداية)'

                      const isOldFormat = Boolean(
                        cachedBook?.children &&
                        cachedBook.children.length > 0 &&
                        (!cachedBook.children[0].toc_id ||
                          !cachedBook.children[0].chunk_id?.includes('_v2'))
                      )

                      if (isFallback || isOldFormat) {
                        await idbDeleteTurathBookTree(bId)
                      } else if (
                        cachedBook &&
                        cachedBook.children &&
                        cachedBook.children.length > 0
                      ) {
                        book.children = cachedBook.children
                        book.is_loaded = true
                      }
                    }
                  }
                }
              }
            } catch (idbErr) {
              console.warn('Turath IndexedDB hydration notice:', idbErr)
            }

            if (requestId !== fetchTreeRequestId.current) return
            setTreeData(turathCatalog)
          }

          return
        }

        // ==============================================================
        // 2. MONGO RAG CLASSIC PIPELINE (198 books - completely intact)
        // ==============================================================
        let catalog: TreeNode[] | null = null

        try {
          const res = await fetch('/data/catalog.json')
          if (res.ok) {
            catalog = await res.json()
          }
        } catch (e) {
          console.warn('Failed to load /data/catalog.json, falling back to API:', e)
        }

        if (!catalog) {
          try {
            const res = await fetch(
              `${API_BASE}/api/v1/library/trees?catalog_only=true`
            )
            if (res.ok) {
              const data = await res.json()
              if (data.success && data.tree) catalog = data.tree
            }
          } catch (e) {
            console.warn('Failed to fetch catalog from API:', e)
          }
        }

        if (catalog && catalog.length > 0) {
          try {
            const cachedTitles = await idbGetCachedBookTitles()
            if (cachedTitles.length > 0) {
              const cachedSet = new Set(cachedTitles)

              for (const domain of catalog) {
                for (const sub of domain.children || []) {
                  for (const book of sub.children || []) {
                    if (cachedSet.has(book.title)) {
                      const cachedBook = await idbGetBookTree(book.title)
                      if (cachedBook && cachedBook.children) {
                        book.children = cachedBook.children
                        book.is_loaded = true
                      }
                    }
                  }
                }
              }
            }
          } catch (idbErr) {
            console.warn('IndexedDB hydration notice:', idbErr)
          }

          if (requestId !== fetchTreeRequestId.current) return
          setTreeData(catalog)
        }
      } catch (error) {
        console.error('Error in fetchTree pipeline:', error)
      } finally {
        if (requestId === fetchTreeRequestId.current) {
          setTreeLoading(false)
        }
      }
    },
    [setTreeData, setTreeLoading]
  )

  const handleLoadBookTree = useCallback(
    async (bookNode: TreeNode): Promise<TreeNode[] | undefined> => {
      const isTurath =
        bookNode.is_turath || !!bookNode.turath_id || librarySourceRef.current === 'turath'
      const turathId = bookNode.turath_id

      // PATH A: TURATH ON-DEMAND BOOK TOC LOADING
      if (isTurath && turathId) {
        try {
          const cached = await idbGetTurathBookTree(turathId)
          if (cached && cached.children && cached.children.length > 0) {
            const isFallback =
              cached.children.length === 1 &&
              cached.children[0].title === 'قراءة الكتاب (من البداية)'

            const isOldFormat = Boolean(
              !cached.children[0].toc_id ||
              !cached.children[0].chunk_id?.includes('_v5')
            )

            if (!isFallback && !isOldFormat) {
              setTreeData((prev) =>
                updateBookInTree(
                  prev,
                  bookNode.title,
                  cached.children,
                  turathId
                )
              )
              return cached.children
            } else {
              await idbDeleteTurathBookTree(turathId)
            }
          }
        } catch (e) {
          console.warn('IndexedDB Turath read error:', e)
        }

        try {
          const data = await fetchTurathBookIndexes(turathId)
          const headings = data?.indexes?.headings || []

          if (headings && headings.length > 0) {
            const chapters = convertTurathHeadingsToTree(
              headings,
              turathId,
              bookNode.title
            )

            await idbSetTurathBookTree(turathId, {
              children: chapters,
              meta: data?.meta,
              indexes: data?.indexes,
            })

            setTreeData((prev) =>
              updateBookInTree(prev, bookNode.title, chapters, turathId)
            )
            return chapters
          } else {
            const chapters = convertTurathHeadingsToTree(
              [],
              turathId,
              bookNode.title
            )
            setTreeData((prev) =>
              updateBookInTree(prev, bookNode.title, chapters, turathId)
            )
            return chapters
          }
        } catch (err) {
          console.error(`Failed to load Turath book ${turathId}:`, err)
        }

        return undefined
      }

      // PATH B: MONGO RAG BOOK TOC LOADING
      const bookTitle = bookNode.title

      try {
        const cached = await idbGetBookTree(bookTitle)
        if (cached && cached.children && cached.children.length > 0) {
          setTreeData((prev) =>
            updateBookInTree(prev, bookTitle, cached.children)
          )
          return cached.children
        }
      } catch (e) {
        console.warn('IndexedDB read error:', e)
      }

      let bookData: any = null
      const filename =
        bookNode.book_file ||
        bookTitle.replace(/ /g, '_').replace(/[/\\\\]/g, '_') + '.json'

      try {
        const res = await fetch(`/data/books/${encodeURIComponent(filename)}`)
        if (res.ok) {
          bookData = await res.json()
        }
      } catch (err) {
        console.warn('Fetch from /data/books/ failed, trying API fallback:', err)
      }

      if (!bookData) {
        try {
          const res = await fetch(
            `${API_BASE}/api/v1/library/trees?book_names=${encodeURIComponent(
              bookTitle
            )}`
          )
          if (res.ok) {
            const data = await res.json()
            if (data.success && data.tree) {
              const findBook = (nodes: any[]): any => {
                for (const n of nodes) {
                  if (n.title === bookTitle && n.children) return n
                  if (n.children) {
                    const found = findBook(n.children)
                    if (found) return found
                  }
                }
                return null
              }
              bookData = findBook(data.tree)
            }
          }
        } catch (err) {
          console.error('Failed to fetch book from API:', err)
        }
      }

      if (bookData && bookData.children) {
        try {
          await idbSetBookTree(bookTitle, bookData)
        } catch (e) {
          console.warn('Failed saving book to IndexedDB:', e)
        }

        setTreeData((prev) =>
          updateBookInTree(prev, bookTitle, bookData.children)
        )
        return bookData.children
      }

      return undefined
    },
    [setTreeData]
  )

  useEffect(() => {
    let isMounted = true

    const initialSource =
      (localStorage.getItem('zad_study_library_source') as 'mongo' | 'turath') ||
      'turath'
    fetchTree(initialSource)

    studyApi
      .getGlobalLibrarySource()
      .then((serverSource) => {
        if (!isMounted) return
        if (
          serverSource &&
          (serverSource === 'turath' || serverSource === 'mongo')
        ) {
          const local = localStorage.getItem('zad_study_library_source')
          localStorage.setItem('zad_study_library_source', serverSource)
          setLibrarySource(serverSource)
          if (local !== serverSource) {
            fetchTree(serverSource)
          }
        }
      })
      .catch(() => { })

    const handleTreeUpdated = () => {
      const cur =
        (localStorage.getItem('zad_study_library_source') as 'mongo' | 'turath') ||
        librarySourceRef.current ||
        'turath'
      fetchTree(cur)
    }

    const handleSourceChanged = (e: any) => {
      const nextSource =
        e.detail?.source ||
        (localStorage.getItem('zad_study_library_source') as 'mongo' | 'turath') ||
        'turath'
      localStorage.setItem('zad_study_library_source', nextSource)
      setLibrarySource(nextSource)
      fetchTree(nextSource)
    }

    const handleCustomChunkSelect = (e: any) => {
      if (e.detail?.chunkId && onSelectChunkRef.current) {
        onSelectChunkRef.current(
          e.detail.chunkId,
          e.detail.title,
          e.detail.fullPath,
          e.detail.node
        )
      }
    }

    window.addEventListener('zad_library_updated', handleTreeUpdated)
    window.addEventListener('zad_library_source_changed', handleSourceChanged)
    window.addEventListener('zad_select_chunk', handleCustomChunkSelect)

    return () => {
      isMounted = false
      window.removeEventListener('zad_library_updated', handleTreeUpdated)
      window.removeEventListener(
        'zad_library_source_changed',
        handleSourceChanged
      )
      window.removeEventListener('zad_select_chunk', handleCustomChunkSelect)
    }
  }, [fetchTree])

  return {
    librarySource,
    setLibrarySource,
    fetchTree,
    handleLoadBookTree,
  }
}
