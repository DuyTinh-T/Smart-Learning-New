'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: Array<'student' | 'teacher' | 'admin'>
  fallbackRedirect?: string
  showLoading?: boolean
}

export function RoleGuard({ 
  children, 
  allowedRoles, 
  fallbackRedirect,
  showLoading = true 
}: RoleGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If still loading, wait
    if (isLoading) return

    // If not authenticated, redirect to login
    if (!isAuthenticated || !user) {
      toast.error('Please login to access this page')
      router.push('/login')
      return
    }

    // If user doesn't have required role, redirect and show error
    if (!allowedRoles.includes(user.role)) {
      toast.error(`Access denied. This page is for ${allowedRoles.join(', ')} only.`)
      
      // Redirect based on user role
      if (fallbackRedirect) {
        router.push(fallbackRedirect)
      } else {
        // Default redirects based on role
        switch (user.role) {
          case 'student':
            router.push('/student/dashboard')
            break
          case 'teacher':
            router.push('/teacher/dashboard')
            break
          case 'admin':
            router.push('/admin')
            break
          default:
            router.push('/')
        }
      }
      return
    }
  }, [isLoading, isAuthenticated, user, allowedRoles, fallbackRedirect, router])

  // Show loading while checking auth
  if (isLoading) {
    if (!showLoading) return null
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    )
  }

  // If not authenticated, don't render anything (will redirect)
  if (!isAuthenticated || !user) {
    return null
  }

  // If user doesn't have required role, don't render anything (will redirect)
  if (!allowedRoles.includes(user.role)) {
    return null
  }

  // User is authenticated and has required role, render children
  return <>{children}</>
}