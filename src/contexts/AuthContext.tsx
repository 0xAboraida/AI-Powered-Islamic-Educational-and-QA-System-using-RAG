import React, { createContext, useContext, useState, useEffect } from 'react'
import { apiClient } from '../api/client'

export interface User {
  id: string
  email: string
  name?: string
  role?: string
  avatarUrl?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (token: string, userData: User) => void
  logout: () => void
  updateUser: (updatedData: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load from local storage on mount
    const savedToken = localStorage.getItem('zad_token')
    const savedUser = localStorage.getItem('zad_user')

    if (savedToken && savedUser) {
      try {
        setToken(savedToken)
        setUser(JSON.parse(savedUser))
      } catch (e) {
        console.error('Failed to parse user from local storage', e)
        localStorage.removeItem('zad_token')
        localStorage.removeItem('zad_user')
      }
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (token) {
      // Sync fresh user profile (avatar, name, role) from server
      apiClient<User>('/api/user/profile')
        .then((freshUser) => {
          if (freshUser) {
            updateUser({
              name: freshUser.name,
              avatarUrl: freshUser.avatarUrl,
              role: freshUser.role,
            })
          }
        })
        .catch(() => {})

      // Prefetch sessions into cache for instant history loading without waiting
      apiClient('/api/Chat/sessions').catch(() => {})
      apiClient('/api/study/sessions').catch(() => {})
    }
  }, [token])

  const login = (newToken: string, userData: User) => {
    setToken(newToken)
    setUser(userData)
    localStorage.setItem('zad_token', newToken)
    localStorage.setItem('zad_user', JSON.stringify(userData))
  }

  const updateUser = (updatedData: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null
      const updated = { ...prev, ...updatedData }
      localStorage.setItem('zad_user', JSON.stringify(updated))
      return updated
    })
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('zad_token')
    localStorage.removeItem('zad_user')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
