'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

// User type from MongoDB schema (matching API response)
export type User = {
  _id: string
  name: string
  email: string
  role: 'student' | 'teacher' | 'admin'
  avatar?: string | null
  bio?: string
  dailyStudyTime?: number
  enrolledCourses?: string[]
  isActive?: boolean
  lastLogin?: string | null
  preferences?: {
    difficulty: 'beginner' | 'intermediate' | 'advanced'
    subjects: string[]
    dailyGoal: number
  }
  progress?: {
    totalLessonsCompleted: number
    totalCoursesEnrolled: number
    totalQuizzesCompleted: number
    averageScore: number
    streak: number
    lastActiveDate: Date
  }
  createdAt: string | Date
  updatedAt: string | Date
  __v?: number
}

// Auth response types
export type AuthResponse = {
  success: boolean
  data: {
    user: User
    token: string
  }
  message?: string
}

export type AuthContextType = {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string, expectedRole?: "student" | "teacher" | "admin") => Promise<void>
  register: (name: string, email: string, password: string, role: "student" | "teacher" | "admin") => Promise<void>
  logout: () => Promise<void>
  updateProfile: (data: Partial<User> & { currentPassword?: string; newPassword?: string }) => Promise<void>
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// API Base URL
const API_BASE = '/api/auth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Check if user is authenticated
  const isAuthenticated = !!user && !!token

  // API call helper
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const url = `${API_BASE}${endpoint}`
    
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    }

    // Add auth token if available
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Network error' }))
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  // Store token in localStorage and state
  const storeAuth = (userData: User, authToken: string) => {
    setUser(userData)
    setToken(authToken)
    localStorage.setItem('auth-token', authToken)
    localStorage.setItem('user-data', JSON.stringify(userData))
  }

  // Clear auth data
  const clearAuth = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('auth-token')
    localStorage.removeItem('user-data')
  }

  // Check authentication status
  const checkAuth = async () => {
    try {
      setIsLoading(true)
      
      // First check localStorage
      const storedToken = localStorage.getItem('auth-token')
      const storedUser = localStorage.getItem('user-data')

      if (!storedToken || !storedUser) {
        clearAuth()
        return
      }

      // Verify token with server
      setToken(storedToken)
      const response = await apiCall('/me', {
        headers: { 'Authorization': `Bearer ${storedToken}` }
      })

      if (response.success && response.data.authenticated) {
        setUser(response.data.user)
        setToken(storedToken)
        
        // Update localStorage with fresh user data
        localStorage.setItem('user-data', JSON.stringify(response.data.user))
      } else {
        clearAuth()
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      clearAuth()
    } finally {
      setIsLoading(false)
    }
  }

  // Login function
  const login = async (email: string, password: string, expectedRole?: "student" | "teacher" | "admin") => {
    try {
      setIsLoading(true)

      const response: AuthResponse = await apiCall('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })

      if (response.success) {
        // Check if role matches expected role (if provided)
        if (expectedRole && response.data.user.role !== expectedRole) {
          toast.error(`Access denied. This account is not registered as ${expectedRole}.`)
          return
        }

        storeAuth(response.data.user, response.data.token)
        toast.success('Login successful!')
      }
    } catch (error: any) {
      console.error('Login failed:', error)
      toast.error(error.message || 'Login failed. Please check your credentials.')
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Register function
  const register = async (name: string, email: string, password: string, role: "student" | "teacher" | "admin") => {
    try {
      setIsLoading(true)

      const response: AuthResponse = await apiCall('/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role }),
      })

      if (response.success) {
        storeAuth(response.data.user, response.data.token)
        toast.success('Registration successful! Welcome to LearnHub!')
      }
    } catch (error: any) {
      console.error('Registration failed:', error)
      toast.error(error.message || 'Registration failed. Please try again.')
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Logout function
  const logout = async () => {
    try {
      // Call logout API to clear server-side session/cookie
      await apiCall('/logout', { method: 'POST' }).catch(() => {
        // Ignore API errors during logout
      })
    } catch (error) {
      console.error('Logout API call failed:', error)
    } finally {
      // Always clear local auth data
      clearAuth()
      toast.success('Logged out successfully')
      router.push('/')
    }
  }

  // Update profile function
  const updateProfile = async (data: Partial<User> & { currentPassword?: string; newPassword?: string }) => {
    try {
      setIsLoading(true)

      const response = await apiCall('/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      })

      if (response.success) {
        const updatedUser = response.data.user
        setUser(updatedUser)
        localStorage.setItem('user-data', JSON.stringify(updatedUser))
        toast.success('Profile updated successfully!')
      }
    } catch (error: any) {
      console.error('Profile update failed:', error)
      toast.error(error.message || 'Failed to update profile. Please try again.')
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Check auth on mount
  useEffect(() => {
    checkAuth()
  }, [])

  // Auto-refresh auth every 30 minutes
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(checkAuth, 30 * 60 * 1000) // 30 minutes
      return () => clearInterval(interval)
    }
  }, [isAuthenticated])

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    checkAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}