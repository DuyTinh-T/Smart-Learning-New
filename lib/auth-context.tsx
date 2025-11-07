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

  // Helper functions for cookies
  const setCookie = (name: string, value: string, days: number = 7) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  }

  const getCookie = (name: string): string | null => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  const removeCookie = (name: string) => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  }

  // Store token in localStorage, cookies and state
  const storeAuth = (userData: User, authToken: string) => {
    setUser(userData)
    setToken(authToken)
    localStorage.setItem('auth-token', authToken)
    localStorage.setItem('user-data', JSON.stringify(userData))
    // Also store in cookies for middleware access
    setCookie('auth-token', authToken)
  }

  // Clear auth data
  const clearAuth = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('auth-token')
    localStorage.removeItem('user-data')
    // Also remove from cookies
    removeCookie('auth-token')
  }

  // Check authentication status
  const checkAuth = async () => {
    try {
      setIsLoading(true)
      
      // First check localStorage
      let storedToken = localStorage.getItem('auth-token')
      let storedUser = localStorage.getItem('user-data')

      // If localStorage is empty, check cookies (for cases where page was refreshed)
      if (!storedToken) {
        storedToken = getCookie('auth-token')
      }

      if (!storedToken) {
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
        
        // Update localStorage with fresh user data and token
        localStorage.setItem('auth-token', storedToken)
        localStorage.setItem('user-data', JSON.stringify(response.data.user))
        // Ensure cookie is also set
        setCookie('auth-token', storedToken)
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
          const errorMessage = `Access denied. This account is registered as ${response.data.user.role}, not ${expectedRole}.`
          toast.error(errorMessage)
          throw new Error(errorMessage)
        }

        storeAuth(response.data.user, response.data.token)
        toast.success('Login successful!')

        // Auto-redirect based on user role
        const userRole = response.data.user.role
        if (userRole === "admin") {
          router.push("/admin")
        } else if (userRole === "teacher") {
          router.push("/teacher/dashboard")
        } else {
          router.push("/student/dashboard")
        }
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