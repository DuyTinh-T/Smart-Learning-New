"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { StudentCourseView } from "@/components/student/student-course-view"
import { courseApi } from "@/lib/api/course-api"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { Loader2, ArrowLeft, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

interface Course {
  _id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  thumbnail?: string;
  price: number;
  visibility: 'public' | 'private';
  enrollmentCount: number;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  modules?: Module[];
  createdAt: string;
}

interface Module {
  _id: string;
  title: string;
  description?: string;
  order: number;
  lessons?: Lesson[];
}

interface Lesson {
  _id: string;
  title: string;
  type: 'text' | 'video' | 'quiz' | 'project';
  content?: string;
  videoUrl?: string;
  resources?: string[];
  duration?: number;
  order: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export default function StudentCoursePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const courseId = params.id as string

  useEffect(() => {
    const loadCourse = async () => {
      if (!user) {
        router.push('/login')
        return
      }

      if (user.role !== 'student') {
        toast({
          title: "Access Denied",
          description: "This page is only accessible to students.",
          variant: "destructive"
        })
        router.push('/dashboard')
        return
      }

      if (!courseId) {
        setError("Course ID is required")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        const response = await courseApi.getById(courseId)
        
        if (response.success && response.data) {
          setCourse(response.data)
        } else {
          throw new Error(response.error || 'Failed to load course')
        }
      } catch (err: any) {
        console.error('Error loading course:', err)
        setError(err.message || 'Failed to load course')
        toast({
          title: "Error",
          description: "Failed to load course. Please try again.",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    loadCourse()
  }, [courseId, user, router, toast])

  const handleBack = () => {
    router.push('/student/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading course...</p>
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-2xl font-bold mb-2">Course Not Found</h2>
          <p className="text-muted-foreground mb-6">
            {error || "The course you're looking for doesn't exist or you don't have access to it."}
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <Button asChild>
              <Link href="/courses">Browse Courses</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header/>
      <StudentCourseView 
        courseId={courseId} 
        onBack={handleBack}
      />
      <Footer/>
    </div>
  )
}