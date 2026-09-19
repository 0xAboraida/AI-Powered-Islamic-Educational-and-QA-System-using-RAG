export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://abourida-zad-backend.hf.space'

interface FetchOptions extends RequestInit {
  requireAuth?: boolean
}

const requestCache = new Map<string, Promise<any>>()

export async function apiClient<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { requireAuth = true, headers: customHeaders, ...customOptions } = options
  const method = customOptions.method || 'GET'
  
  // Only cache GET requests for sessions (chat & study) to prevent waiting
  const isCacheable = method === 'GET' && (endpoint.includes('/api/Chat/sessions') || endpoint.includes('/api/study/sessions'))
  const cacheKey = endpoint

  if (isCacheable && requestCache.has(cacheKey)) {
    return requestCache.get(cacheKey) as Promise<T>
  }

  // Clear cache if a mutation happens on sessions
  if (method !== 'GET' && (endpoint.includes('/api/Chat/sessions') || endpoint.includes('/api/study/sessions'))) {
    requestCache.clear()
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  }

  if (requireAuth) {
    const token = localStorage.getItem('zad_token')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`

  try {
    const fetchPromise = (async () => {
      const response = await fetch(url, {
        headers,
        ...customOptions,
      })

      if (!response.ok) {
        let errorMessage = 'حدث خطأ غير متوقع'
        try {
          const errorData = await response.json()
          if (errorData.message || errorData.Message) {
            errorMessage = errorData.message || errorData.Message
          } else if (errorData.errors && typeof errorData.errors === 'object') {
            const firstErrorArray = Object.values(errorData.errors)[0] as any
            if (Array.isArray(firstErrorArray) && firstErrorArray.length > 0) {
              errorMessage = firstErrorArray[0]
            } else {
              errorMessage = errorData.title || errorData.Title || response.statusText || 'حدث خطأ في الاستجابة'
            }
          } else if (errorData.error || errorData.Error) {
            errorMessage = errorData.error || errorData.Error
          } else {
            errorMessage = response.statusText || `خطأ برقم (${response.status})`
          }
        } catch {
          errorMessage = response.statusText || `خطأ برقم (${response.status})`
        }

        if (!errorMessage || !errorMessage.trim()) {
          errorMessage = `خطأ في الخادم برقم (${response.status})`
        }

        throw new Error(errorMessage)
      }

      const text = await response.text()
      if (!text) return null as any
      try {
        return JSON.parse(text)
      } catch {
        return text as any
      }
    })()

    if (isCacheable) {
      requestCache.set(cacheKey, fetchPromise)
    }

    try {
      return await fetchPromise
    } catch (err) {
      if (isCacheable) {
        requestCache.delete(cacheKey)
      }
      throw err
    }
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error)
    throw error
  }
}
