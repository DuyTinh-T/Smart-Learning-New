"use client"

import React, { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
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
import { courseApi, enrollmentApi } from "@/lib/api/course-api"
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
  videoUrl?: string;
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

  // Helper functions for video URLs
  const getYouTubeEmbedUrl = (url: string): string => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    const match = url.match(regex)
    return match ? `https://www.youtube.com/embed/${match[1]}` : url
  }

  const getVimeoEmbedUrl = (url: string): string => {
    const regex = /vimeo\.com\/(\d+)/
    const match = url.match(regex)
    return match ? `https://player.vimeo.com/video/${match[1]}` : url
  }
  
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set())
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [lessonProgress, setLessonProgress] = useState<Record<string, boolean>>({})
  const [enrollment, setEnrollment] = useState<any>(null) // Track lesson completion status

  // Load course details and enrollment data
  const loadCourse = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // First check if user is enrolled
      const enrollmentResponse = await enrollmentApi.checkEnrollment(courseId)
      if (!enrollmentResponse.success || !enrollmentResponse.data) {
        throw new Error('Bạn chưa đăng ký khóa học này hoặc khóa học không tồn tại')
      }
      
      // Load enrollment progress
      const progressResponse = await enrollmentApi.getProgress(enrollmentResponse.data._id)
      if (!progressResponse.success) {
        const errorMsg = progressResponse.error || 'Failed to load course progress'
        throw new Error(errorMsg === 'Course no longer exists or has been deleted' 
          ? 'Khóa học này đã bị xóa hoặc không còn tồn tại' 
          : 'Không thể tải tiến trình khóa học')
      }
      
      setEnrollment(enrollmentResponse.data)
      setIsEnrolled(true)
      
      // Set course data from enrollment response
      const courseData = progressResponse.data.course
      const lessons = progressResponse.data.lessons || []
      
      // Transform data to match Course interface
      const transformedCourse: Course = {
        _id: courseData._id,
        title: courseData.title,
        description: courseData.description,
        category: 'Programming', // Mock data
        tags: [],
        thumbnail: courseData.thumbnail,
        price: 0,
        visibility: 'public',
        enrollmentCount: 0,
        createdBy: {
          _id: 'instructor-id',
          name: courseData.instructor || 'Instructor',
          email: 'instructor@example.com'
        },
        createdAt: new Date().toISOString(),
        modules: []
      }
      
      // Group lessons by module and transform
      const moduleMap = new Map()
      lessons.forEach((lesson: any) => {
        if (!moduleMap.has(lesson.moduleId)) {
          moduleMap.set(lesson.moduleId, {
            _id: lesson.moduleId,
            title: lesson.moduleTitle,
            order: lesson.moduleOrder,
            lessons: []
          })
        }
        moduleMap.get(lesson.moduleId).lessons.push(lesson)
      })
      
      transformedCourse.modules = Array.from(moduleMap.values())
      setCourse(transformedCourse)
      
      // Set completed lessons
      const completedLessonIds = lessons
        .filter((lesson: any) => lesson.completed)
        .map((lesson: any) => lesson._id)
      setCompletedLessons(new Set(completedLessonIds))
      
      // Set lesson progress
      const progressMap: Record<string, boolean> = {}
      lessons.forEach((lesson: any) => {
        progressMap[lesson._id] = lesson.completed
      })
      setLessonProgress(progressMap)
      
      // Load first uncompleted lesson or first lesson
      const firstIncompleteLesson = lessons.find((lesson: any) => !lesson.completed)
      const lessonToSelect = firstIncompleteLesson || lessons[0]
      
      if (lessonToSelect) {
        setSelectedLesson(lessonToSelect)
      }
      
    } catch (error: any) {
      console.error('Error loading course:', error)
      const errorMessage = error.message || "Không thể tải thông tin khóa học"
      setError(errorMessage)
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Mark lesson as completed
  const markLessonCompleted = async (lessonId: string) => {
    // Check if lesson can be completed based on type
    if (!canCompleteLesson(lessonId)) {
      toast({
        title: "Chưa thể hoàn thành",
        description: "Vui lòng hoàn thành nội dung bài học trước khi đánh dấu hoàn thành.",
        variant: "destructive",
      })
      return
    }

    if (!enrollment) {
      toast({
        title: "Lỗi",
        description: "Không tìm thấy thông tin đăng ký khóa học.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await enrollmentApi.updateProgress(
        enrollment._id,
        lessonId,
        'complete'
      )

      if (response.success) {
        setCompletedLessons(prev => new Set([...prev, lessonId]))
        setLessonProgress(prev => ({ ...prev, [lessonId]: true }))
        toast({
          title: "Hoàn thành!",
          description: "Bài học đã được đánh dấu hoàn thành",
        })
      } else {
        throw new Error(response.error || 'Failed to update progress')
      }
    } catch (error) {
      console.error('Error marking lesson completed:', error)
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật tiến độ học tập.",
        variant: "destructive",
      })
    }
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
  const handleQuizCompletion = async (lessonId: string, score: number) => {
    const passingScore = 70
    
    if (!enrollment) {
      toast({
        title: "Lỗi",
        description: "Không tìm thấy thông tin đăng ký khóa học.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await enrollmentApi.updateProgress(
        enrollment._id,
        lessonId,
        'quiz_result',
        { score }
      )

      if (response.success) {
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
      } else {
        throw new Error(response.error || 'Failed to save quiz result')
      }
    } catch (error) {
      console.error('Error saving quiz result:', error)
      toast({
        title: "Lỗi",
        description: "Không thể lưu kết quả quiz.",
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
            <div className="space-y-4 mb-6">
              {selectedLesson.videoUrl ? (
                <div className="relative">
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    {/* YouTube embed */}
                    {(selectedLesson.videoUrl.includes('youtube.com') || selectedLesson.videoUrl.includes('youtu.be')) ? (
                      <iframe
                        src={getYouTubeEmbedUrl(selectedLesson.videoUrl)}
                        className="w-full h-full"
                        frameBorder="0"
                        allowFullScreen
                        title={selectedLesson.title}
                      />
                    ) : selectedLesson.videoUrl.includes('vimeo.com') ? (
                      <iframe
                        src={getVimeoEmbedUrl(selectedLesson.videoUrl)}
                        className="w-full h-full"
                        frameBorder="0"
                        allowFullScreen
                        title={selectedLesson.title}
                      />
                    ) : (
                      <video
                        src={selectedLesson.videoUrl}
                        className="w-full h-full"
                        controls
                        title={selectedLesson.title}
                      />
                    )}
                  </div>
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800 font-medium">
                      📺 Xem hết video để có thể đánh dấu hoàn thành bài học
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-100 p-8 rounded-lg text-center">
                  <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">
                    Chưa có video cho bài học này
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Giảng viên chưa upload video nội dung
                  </p>
                </div>
              )}
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

          {selectedLesson.type !== 'quiz' && selectedLesson.type !== 'project' && (
            <div className="prose prose-lg dark:prose-invert max-w-none">
              {selectedLesson.content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {selectedLesson.content}
                </ReactMarkdown>
              ) : (
                <p className="text-muted-foreground">Nội dung bài học sẽ được hiển thị ở đây.</p>
              )}
            </div>
          )}
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
        <div className="max-w-md mx-auto">
          {error ? (
            <>
              <div className="text-red-500 mb-4 text-lg font-semibold">⚠️ Lỗi</div>
              <p className="text-muted-foreground mb-6">{error}</p>
            </>
          ) : (
            <p className="text-muted-foreground mb-6">Không tìm thấy khóa học</p>
          )}
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        </div>
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
                              <span className="flex-1 truncate title-module">
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