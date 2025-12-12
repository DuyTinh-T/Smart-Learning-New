"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, Users, Star, BookOpen, CheckCircle2, Lock, Play, Loader2, AlertCircle, Bookmark, BookmarkCheck } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { courseApi, enrollmentApi } from "@/lib/api/course-api"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { PurchaseCourseButton, PaymentStatus, PaymentResult, usePaymentStatus } from "@/components/payment"
import { CourseReviews } from "./course-reviews"

interface CourseDetailProps {
  courseId: string
}

interface Lesson {
  id: string
  title: string
  type: "video" | "text" | "project"
  duration?: string
  completed: boolean
  locked?: boolean
  order: number
}

interface Module {
  id: string
  title: string
  lessons: Lesson[]
  order: number
}

interface CourseData {
  id: string
  title: string
  description: string
  instructor: string
  thumbnail?: string
  duration?: string
  level: string
  rating?: number
  reviews?: number
  students?: number
  price?: number
  enrolled: boolean
  progress?: number
  modules: Module[]
}

export default function CourseDetail({ courseId }: CourseDetailProps) {
  const [courseData, setCourseData] = useState<CourseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [bookmarkLoading, setBookmarkLoading] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  const handleEnrollment = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Vui lòng đăng nhập để đăng ký khóa học này.",
        variant: "destructive"
      })
      return
    }

    if (user.role !== 'student') {
      toast({
        title: "Access Denied", 
        description: "Chỉ học viên mới có thể đăng ký khóa học.",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      const response = await enrollmentApi.enroll(courseId)
      
      if (response.success) {
        toast({
          title: "Đăng ký thành công!",
          description: "Bạn đã đăng ký khóa học này thành công. Chào mừng!",
        })
        
        // Update local state to show enrolled status
        if (courseData) {
          setCourseData({
            ...courseData,
            enrolled: true,
            progress: 0
          })
        }
      } else {
        throw new Error(response.error || 'Enrollment failed')
      }
    } catch (error) {
      console.error('Enrollment error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to enroll in course'
      toast({
        title: "Đăng ký thất bại",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBookmark = async () => {
    if (!user) {
      toast({
        title: "Yêu cầu xác thực",
        description: "Vui lòng đăng nhập để đánh dấu khóa học.",
        variant: "destructive"
      })
      return
    }

    if (user.role !== 'student') {
      toast({
        title: "Truy cập bị từ chối",
        description: "Chỉ học viên mới có thể đánh dấu khóa học.",
        variant: "destructive"
      })
      return
    }

    try {
      setBookmarkLoading(true)

      if (isBookmarked) {
        // Remove bookmark
        const response = await fetch(`/api/bookmarks/${courseId}`, {
          method: "DELETE"
        })
        const data = await response.json()

        if (data.success) {
          setIsBookmarked(false)
          toast({
            title: "Đã gỡ",
            description: "Khóa học đã được gỡ khỏi danh sách đánh dấu"
          })
        } else {
          throw new Error(data.error || "Failed to remove bookmark")
        }
      } else {
        // Add bookmark
        const response = await fetch("/api/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseId })
        })
        const data = await response.json()

        if (data.success) {
          setIsBookmarked(true)
          toast({
            title: "Đã đánh dấu!",
            description: "Khóa học đã được thêm vào danh sách đánh dấu"
          })
        } else {
          throw new Error(data.error || "Failed to add bookmark")
        }
      }
    } catch (error) {
      console.error("Bookmark error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to update bookmark"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setBookmarkLoading(false)
    }
  }

  const checkBookmarkStatus = async () => {
    if (!user || user.role !== 'student') return

    try {
      const response = await fetch(`/api/bookmarks/${courseId}`)
      const data = await response.json()

      if (data.success) {
        setIsBookmarked(data.data.isBookmarked)
      }
    } catch (error) {
      console.error("Failed to check bookmark status:", error)
    }
  }

  const loadCourseData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await courseApi.getById(courseId)
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Course not found')
      }
      
      // Check enrollment status for students
      let isEnrolled = false
      let userProgress = 0
      
      if (user?.role === 'student') {
        try {
          const enrollmentResponse = await enrollmentApi.checkEnrollment(courseId)
          if (enrollmentResponse.success && enrollmentResponse.data) {
            isEnrolled = true
            userProgress = enrollmentResponse.data.progress?.percentage || 0
          }
        } catch (enrollmentError) {
          console.warn('Could not check enrollment status:', enrollmentError)
        }
      }
      
      // Transform API response to our component structure
      const course: CourseData = {
        id: response.data._id || response.data.id,
        title: response.data.title || 'Untitled Course',
        description: response.data.description || 'No description available',
        instructor: response.data.instructor || 'Unknown Instructor',
        thumbnail: response.data.thumbnail,
        duration: response.data.duration,
        level: response.data.level || 'Beginner',
        rating: response.data.rating || 0,
        reviews: response.data.reviews || 0,
        students: response.data.students || 0,
        price: response.data.price || 0,
        enrolled: isEnrolled,
        progress: userProgress,
        modules: response.data.modules?.map((module: any, index: number) => ({
          id: module._id || module.id || `module-${index}`,
          title: module.title || `Module ${index + 1}`,
          order: module.order || index,
          lessons: module.lessons?.map((lesson: any, lessonIndex: number) => ({
            id: lesson._id || lesson.id || `lesson-${lessonIndex}`,
            title: lesson.title || `Lesson ${lessonIndex + 1}`,
            type: lesson.type || 'video',
            duration: lesson.duration || '10 min',
            completed: false, // User progress would determine this
            locked: lessonIndex > 0 && !isEnrolled, // Lock lessons for non-enrolled users
            order: lesson.order || lessonIndex
          })) || []
        })) || []
      }
      
      setCourseData(course)
    } catch (err) {
      console.error('Failed to load course:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to load course'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (courseId) {
      loadCourseData()
      checkBookmarkStatus()
    }
  }, [courseId, user])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg">Đang tải khóa học...</p>
        </div>
      </div>
    )
  }

  if (error || !courseData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto" />
          <h2 className="text-2xl font-bold">Không tìm thấy khóa học</h2>
          <p className="text-muted-foreground">{error || "Khóa học bạn tìm kiếm không tồn tại."}</p>
          <Button asChild>
            <Link href="/courses">Duyệt khóa học</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Payment Result Alert */}
      <PaymentResult 
        courseId={courseData?.id}
        onSuccess={() => {
          // Refetch course data to update enrollment status
          loadCourseData();
        }}
      />
      
      {/* Hero Section */}
      <section className="py-12 bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-2"
            >
              <Badge className="mb-4 bg-accent text-accent-foreground">{courseData.level}</Badge>
              <h1 className="text-4xl font-bold mb-4 text-balance">{courseData.title}</h1>
              <p className="text-lg text-muted-foreground mb-6 text-pretty">{courseData.description}</p>
              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-accent text-accent" />
                  <span className="font-semibold">{courseData.rating}</span>
                  <span className="text-muted-foreground">({courseData.reviews} đánh giá)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span>{courseData.students?.toLocaleString() || '0'} học viên</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <span>{courseData.duration}</span>
                </div>
              </div>
              <div className="mt-6">
                <p className="text-sm text-muted-foreground mb-1">Giảng viên</p>
                <p className="font-semibold">{courseData.instructor}</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="sticky top-20">
                <div className="aspect-video overflow-hidden rounded-t-lg">
                  <img
                    src={courseData.thumbnail || "/placeholder.svg"}
                    alt={courseData.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-6">
                  {courseData.enrolled ? (
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Tiến độ của bạn</span>
                          <span className="text-sm text-muted-foreground">{courseData.progress}%</span>
                        </div>
                        <Progress value={courseData.progress} className="h-2" />
                      </div>
                      <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                        <Link href={`/student/courses/${courseData.id}`}>Tiếp tục học</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Payment Status and Result */}
                      <PaymentStatus 
                        courseId={courseData.id} 
                        onStatusChange={(status) => {
                          if (status.isEnrolled) {
                            setCourseData(prev => prev ? {...prev, enrolled: true} : null);
                          }
                        }} 
                      />
                      
                      <div className="text-center">
                        <p className="text-3xl font-bold mb-2">
                          {courseData.price && courseData.price > 0 
                            ? `$${courseData.price}` 
                            : 'Free'
                          }
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {courseData.price && courseData.price > 0 
                            ? 'Thanh toán một lần' 
                            : 'Miễn phí đăng ký'
                          }
                        </p>
                      </div>
                      {courseData.price && courseData.price > 0 ? (
                        <PurchaseCourseButton 
                          course={{
                            _id: courseData.id,
                            title: courseData.title,
                            price: courseData.price,
                            slug: courseData.id
                          }}
                          isEnrolled={courseData.enrolled}
                        />
                      ) : (
                        <Button 
                          className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                          onClick={handleEnrollment}
                        >
                          Đăng ký miễn phí
                        </Button>
                      )}

                      {user?.role === 'student' && (
                        <Button 
                          variant="outline" 
                          className="w-full bg-transparent"
                          onClick={handleBookmark}
                          disabled={bookmarkLoading}
                        >
                          {bookmarkLoading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : isBookmarked ? (
                            <>
                              <BookmarkCheck className="h-4 w-4 mr-2" />
                              Đã đánh dấu
                            </>
                          ) : (
                            <>
                              <Bookmark className="h-4 w-4 mr-2" />
                              Thêm vào danh sách yêu thích
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Course Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="curriculum" className="space-y-6">
            <TabsList className="bg-card">
              <TabsTrigger value="curriculum">Chương trình học</TabsTrigger>
              <TabsTrigger value="reviews">Đánh giá</TabsTrigger>
            </TabsList>

            <TabsContent value="curriculum" className="space-y-4">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Card>
                  <CardHeader>
                    <CardTitle>Chương trình học</CardTitle>
                    <CardDescription>
                      {courseData.modules.length} modules •{" "}
                      {courseData.modules.reduce((acc, m) => acc + m.lessons.length, 0)} bài học
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {courseData.modules.map((module, moduleIndex) => (
                      <motion.div
                        key={module.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: moduleIndex * 0.1 }}
                      >
                        <div className="border rounded-lg overflow-hidden">
                          <div className="bg-muted/50 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <BookOpen className="h-5 w-5 text-primary" />
                              <h3 className="font-semibold">{module.title}</h3>
                            </div>
                            <Badge variant="outline">{module.lessons.length} bài học</Badge>
                          </div>
                          <div className="divide-y">
                            {module.lessons.map((lesson) => (
                              <div
                                key={lesson.id}
                                className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  {lesson.locked ? (
                                    <Lock className="h-4 w-4 text-muted-foreground" />
                                  ) : lesson.completed ? (
                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                  ) : (
                                    <Play className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  <span className={lesson.locked ? "text-muted-foreground" : ""}>{lesson.title}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className="text-sm text-muted-foreground">{lesson.duration}</span>
                                  {!lesson.locked && courseData.enrolled && (
                                    <Button size="sm" variant="ghost" asChild>
                                      <Link href={`/student/courses/${courseData.id}/lessons/${lesson.id}`}>
                                        {lesson.completed ? "Xem lại" : "Bắt đầu"}
                                      </Link>
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="reviews">
              <CourseReviews courseId={courseData.id} />
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  )
}
