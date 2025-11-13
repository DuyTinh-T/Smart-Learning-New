"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  PlayCircle, 
  FileText, 
  Video, 
  PenTool,
  ArrowLeft,
  GraduationCap,
  Clock,
  Users,
  CheckCircle,
  Lock,
  ChevronRight
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { courseApi } from "@/lib/api/course-api"
import { useAuth } from "@/lib/auth-context"
import { QuizView } from "@/components/quiz/quiz-view"
import { ProjectSubmissionView } from "@/components/project/project-submission-view"

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
  resources?: string[];
  duration?: number;
  order: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

interface StudentCourseViewProps {
  courseId: string;
  onBack: () => void;
}

export function StudentCourseView({ courseId, onBack }: StudentCourseViewProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set())
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [lessonProgress, setLessonProgress] = useState<Record<string, boolean>>({}) // Track lesson completion status

  // Load course details
  const loadCourse = async () => {
    try {
      setLoading(true)
      const response = await courseApi.getById(courseId)
      
      if (response.success && response.data) {
        setCourse(response.data)
        
        // Check if user is enrolled (for now, assume enrolled if can access)
        setIsEnrolled(true)
        
        // Load first lesson by default
        if (response.data.modules && response.data.modules.length > 0) {
          const firstModule = response.data.modules[0]
          if (firstModule.lessons && firstModule.lessons.length > 0) {
            setSelectedLesson(firstModule.lessons[0])
          }
        }
      } else {
        throw new Error(response.error || 'Failed to load course')
      }
    } catch (error: any) {
      console.error('Error loading course:', error)
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải thông tin khóa học",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Mark lesson as completed
  const markLessonCompleted = (lessonId: string) => {
    // Check if lesson can be completed based on type
    if (!canCompleteLesson(lessonId)) {
      toast({
        title: "Chưa thể hoàn thành",
        description: "Vui lòng hoàn thành nội dung bài học trước khi đánh dấu hoàn thành.",
        variant: "destructive",
      })
      return
    }
    
    setCompletedLessons(prev => new Set([...prev, lessonId]))
    toast({
      title: "Hoàn thành!",
      description: "Bài học đã được đánh dấu hoàn thành",
    })
  }

  // Check if a lesson can be completed
  const canCompleteLesson = (lessonId: string): boolean => {
    const lesson = findLessonById(lessonId)
    if (!lesson) return false

    // For quiz lessons, check if quiz was completed with passing score
    if (lesson.type === 'quiz') {
      return lessonProgress[lessonId] === true
    }

    // For video lessons, in a real app you'd check if video was watched completely
    // For now, allow manual completion but show warning
    if (lesson.type === 'video') {
      return true // Will be restricted by video completion later
    }

    // For text and project lessons, allow manual completion
    return true
  }

  // Handle quiz completion
  const handleQuizCompletion = (lessonId: string, score: number) => {
    const passingScore = 70
    if (score >= passingScore) {
      setLessonProgress(prev => ({ ...prev, [lessonId]: true }))
      setCompletedLessons(prev => new Set([...prev, lessonId]))
      toast({
        title: "Quiz hoàn thành!",
        description: `Bạn đạt ${score}% - Bài học đã được đánh dấu hoàn thành.`,
      })
    } else {
      setLessonProgress(prev => ({ ...prev, [lessonId]: false }))
      toast({
        title: "Chưa đạt điểm",
        description: `Bạn đạt ${score}%. Cần đạt ít nhất ${passingScore}% để hoàn thành bài học.`,
        variant: "destructive",
      })
    }
  }

  // Find lesson by ID
  const findLessonById = (lessonId: string): Lesson | null => {
    if (!course?.modules) return null
    
    for (const module of course.modules) {
      if (module.lessons) {
        const lesson = module.lessons.find(l => l._id === lessonId)
        if (lesson) return lesson
      }
    }
    return null
  }

  // Get all lessons in order
  const getAllLessons = (): Lesson[] => {
    if (!course?.modules) return []
    
    const allLessons: Lesson[] = []
    course.modules.forEach(module => {
      if (module.lessons) {
        allLessons.push(...module.lessons)
      }
    })
    return allLessons
  }

  // Navigate to previous lesson
  const goToPreviousLesson = () => {
    const allLessons = getAllLessons()
    const currentIndex = allLessons.findIndex(lesson => lesson._id === selectedLesson?._id)
    
    if (currentIndex > 0) {
      setSelectedLesson(allLessons[currentIndex - 1])
    } else {
      toast({
        title: "Thông báo",
        description: "Đây là bài học đầu tiên.",
      })
    }
  }

  // Navigate to next lesson
  const goToNextLesson = () => {
    const allLessons = getAllLessons()
    const currentIndex = allLessons.findIndex(lesson => lesson._id === selectedLesson?._id)
    
    if (currentIndex < allLessons.length - 1) {
      setSelectedLesson(allLessons[currentIndex + 1])
    } else {
      toast({
        title: "Thông báo",
        description: "Đây là bài học cuối cùng.",
      })
    }
  }

  // Calculate progress
  const calculateProgress = () => {
    if (!course || !course.modules) return 0
    
    const totalLessons = course.modules.reduce((total, module) => {
      return total + (module.lessons?.length || 0)
    }, 0)
    
    if (totalLessons === 0) return 0
    
    const completedCount = completedLessons.size
    return Math.round((completedCount / totalLessons) * 100)
  }

  const getLessonIcon = (type: string, lessonId: string) => {
    const isCompleted = completedLessons.has(lessonId)
    const baseClasses = "h-4 w-4"
    const completedClasses = isCompleted ? "text-green-600" : ""
    
    switch (type) {
      case 'video': return <Video className={`${baseClasses} ${completedClasses}`} />
      case 'quiz': return <PenTool className={`${baseClasses} ${completedClasses}`} />
      case 'project': return <GraduationCap className={`${baseClasses} ${completedClasses}`} />
      default: return <FileText className={`${baseClasses} ${completedClasses}`} />
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const renderLessonContent = () => {
    if (!selectedLesson) {
      return (
        <div className="text-center py-12">
          <GraduationCap className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Chọn một bài học để bắt đầu</h3>
          <p className="text-muted-foreground">
            Chọn bài học từ danh sách bên trái để xem nội dung
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {/* Lesson Header */}
        <div className="border-b pb-4">
          <div className="flex items-center gap-3 mb-2">
            {getLessonIcon(selectedLesson.type, selectedLesson._id)}
            <h1 className="text-2xl font-bold">{selectedLesson.title}</h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Badge variant="outline">{selectedLesson.type}</Badge>
            {selectedLesson.difficulty && (
              <Badge 
                variant="secondary" 
                className={getDifficultyColor(selectedLesson.difficulty)}
              >
                {selectedLesson.difficulty}
              </Badge>
            )}
            {selectedLesson.duration && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {selectedLesson.duration} phút
              </div>
            )}
          </div>
        </div>

        {/* Lesson Content */}
        <div className="prose max-w-none">
          {selectedLesson.type === 'video' && (
            <div className="bg-gray-100 p-8 rounded-lg text-center mb-6">
              <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                Video content would be displayed here
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                (Tích hợp video player sẽ được thêm vào sau)
              </p>
              <p className="text-sm text-blue-600 mt-2">
                Xem hết video để có thể đánh dấu hoàn thành
              </p>
            </div>
          )}
          
          {selectedLesson.type === 'quiz' && (
            <div>
              <QuizView 
                courseId={courseId} 
                lessonId={selectedLesson._id}
                onComplete={(score: number) => {
                  handleQuizCompletion(selectedLesson._id, score)
                }}
                onRetry={() => {
                  // Reset lesson progress for retry
                  setLessonProgress(prev => ({ ...prev, [selectedLesson._id]: false }))
                  toast({
                    title: "Quiz Reset",
                    description: "You can now retake the quiz.",
                  })
                }}
                onContinue={() => {
                  // If quiz passed, go to next lesson, otherwise stay on current lesson
                  const currentProgress = lessonProgress[selectedLesson._id]
                  if (currentProgress) {
                    // Passed - go to next lesson
                    goToNextLesson()
                  } else {
                    // Failed or not completed - show lesson content instead of quiz
                    toast({
                      title: "Quiz incomplete",
                      description: "Review the lesson content before retrying the quiz.",
                    })
                  }
                }}
              />
            </div>
          )}

          {selectedLesson.type === 'project' && (
            <div>
              <ProjectSubmissionView
                courseId={courseId}
                lessonId={selectedLesson._id}
                projectTitle={selectedLesson.title}
                projectDescription={selectedLesson.content}
                onSubmit={(submission) => {
                  markLessonCompleted(selectedLesson._id)
                  toast({
                    title: "Project Submitted!",
                    description: "Your project has been submitted successfully. Your instructor will review it soon.",
                  })
                }}
              />
            </div>
          )}

          <div className="whitespace-pre-wrap">
            {selectedLesson.content || "Nội dung bài học sẽ được hiển thị ở đây."}
          </div>
        </div>

        {/* Lesson Actions */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div className="flex items-center gap-2">
            {completedLessons.has(selectedLesson._id) ? (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Đã hoàn thành
              </Badge>
            ) : (
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => markLessonCompleted(selectedLesson._id)}
                  variant="default"
                  disabled={!canCompleteLesson(selectedLesson._id)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Đánh dấu hoàn thành
                </Button>
                {!canCompleteLesson(selectedLesson._id) && (
                  <span className="text-sm text-muted-foreground">
                    {selectedLesson.type === 'quiz' && 'Hoàn thành quiz với điểm số ≥70% để đánh dấu hoàn thành bài học'}
                    {selectedLesson.type === 'video' && 'Xem hết video để có thể đánh dấu hoàn thành'}
                    {selectedLesson.type === 'project' && 'Hoàn thành project để đánh dấu hoàn thành'}
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={goToPreviousLesson}
              disabled={getAllLessons().findIndex(l => l._id === selectedLesson._id) === 0}
            >
              Bài trước
            </Button>
            <Button
              onClick={goToNextLesson}
              disabled={getAllLessons().findIndex(l => l._id === selectedLesson._id) === getAllLessons().length - 1}
            >
              Bài tiếp theo
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  useEffect(() => {
    loadCourse()
  }, [courseId])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
          <div className="lg:col-span-3">
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Không tìm thấy khóa học</p>
        <Button onClick={onBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{course.title}</h1>
          <p className="text-muted-foreground">Khóa học của {course.createdBy.name}</p>
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tiến độ học tập</CardTitle>
              <CardDescription>
                {completedLessons.size} / {course.modules?.reduce((total, module) => total + (module.lessons?.length || 0), 0) || 0} bài học đã hoàn thành
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{calculateProgress()}%</div>
              <div className="text-sm text-muted-foreground">Hoàn thành</div>
            </div>
          </div>
          <Progress value={calculateProgress()} className="mt-4" />
        </CardHeader>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Course Content */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Nội dung khóa học</CardTitle>
              <CardDescription>
                {course.modules?.length || 0} modules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {course.modules && course.modules.length > 0 ? (
                course.modules.map((module, moduleIndex) => (
                  <div key={module._id} className="space-y-2">
                    <h4 className="font-medium text-sm">
                      Module {moduleIndex + 1}: {module.title}
                    </h4>
                    {module.lessons && module.lessons.length > 0 ? (
                      <div className="space-y-1">
                        {module.lessons.map((lesson, lessonIndex) => (
                          <div
                            key={lesson._id}
                            className={`
                              flex items-center gap-2 p-2 rounded cursor-pointer text-sm
                              hover:bg-gray-100 transition-colors
                              ${selectedLesson?._id === lesson._id ? 'bg-blue-50 border border-blue-200' : ''}
                              ${completedLessons.has(lesson._id) ? 'bg-green-50' : ''}
                            `}
                            onClick={() => setSelectedLesson(lesson)}
                          >
                            <div className="flex items-center gap-2 flex-1">
                              {completedLessons.has(lesson._id) ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                              )}
                              {getLessonIcon(lesson.type, lesson._id)}
                              <span className="flex-1 truncate">
                                {lessonIndex + 1}. {lesson.title}
                              </span>
                            </div>
                            {lesson.duration && (
                              <span className="text-xs text-muted-foreground">
                                {lesson.duration}p
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground ml-4">
                        Chưa có bài học
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <GraduationCap className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    Khóa học chưa có nội dung
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-6">
              {renderLessonContent()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}