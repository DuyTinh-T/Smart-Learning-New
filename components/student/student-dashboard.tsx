"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Clock, Award, TrendingUp, Play, CheckCircle2, Sparkles, Loader2, TestTube } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { studentApi, enrollmentApi } from "@/lib/api/course-api"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"

interface EnrolledCourse {
  id: string;
  title: string;
  description: string;
  instructor: string;
  instructorEmail: string;
  thumbnail?: string;
  category: string;
  tags: string[];
  price: number;
  enrollmentCount: number;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  nextLesson: string;
  createdAt: string;
  enrolledAt: string;
}

interface StudentStats {
  totalEnrolled: number;
  averageProgress: number;
  totalHoursLearned: number;
  certificatesEarned: number;
}

interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  reason: string;
  priority: number;
}

// Generate recent activity from enrolled courses
const generateRecentActivity = (courses: EnrolledCourse[]) => {
  const activities = []
  
  for (const course of courses.slice(0, 3)) {
    // Generate mock activities based on course progress
    if (course.progress > 0) {
      activities.push({
        id: `activity-${course.id}-1`,
        action: course.progress === 100 ? "Completed course" : "In progress",
        course: course.title,
        time: new Date(course.enrolledAt).toLocaleDateString()
      })
    }
    
    if (course.completedLessons > 0) {
      activities.push({
        id: `activity-${course.id}-2`, 
        action: `Completed ${course.completedLessons} lessons`,
        course: course.title,
        time: "Recently"
      })
    }
  }
  
  return activities.slice(0, 3) // Limit to 3 activities
}

export function StudentDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([])
  const [stats, setStats] = useState<StudentStats>({
    totalEnrolled: 0,
    averageProgress: 0,
    totalHoursLearned: 0,
    certificatesEarned: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [learningPath, setLearningPath] = useState<string>('')

  // Load enrolled courses
  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      if (!user || user.role !== 'student') {
        setLoading(false)
        return
      }

      try {
        setError(null)
        const response = await enrollmentApi.getAll({ status: 'active' })
        
        if (response.success && response.data) {
          // Transform enrollment data to course format expected by UI
          const enrollmentData = response.data.enrollments || []
          // Filter out enrollments with null/deleted courses
          const validEnrollments = enrollmentData.filter((enrollment: any) => enrollment.course != null)
          
          // Show warning if there are invalid enrollments
          if (validEnrollments.length < enrollmentData.length) {
            const invalidCount = enrollmentData.length - validEnrollments.length
            toast({
              title: "Warning",
              description: `${invalidCount} enrollment(s) have missing or deleted courses and were hidden.`,
              variant: "default"
            })
          }
          
          const transformedCourses = validEnrollments.map((enrollment: any) => ({
            id: enrollment.course._id || enrollment.course.id,
            title: enrollment.course.title,
            instructor: enrollment.course.instructor,
            instructorEmail: 'instructor@example.com', // Mock data
            progress: enrollment.progress?.percentage || 0,
            thumbnail: enrollment.course.thumbnail,
            level: enrollment.course.level,
            duration: enrollment.course.duration || '8 weeks',
            category: enrollment.course.category || 'Programming',
            tags: enrollment.course.tags || [],
            price: enrollment.course.price || 0,
            enrollmentCount: 0, // Mock data
            totalLessons: enrollment.progress?.totalLessons || 0,
            completedLessons: enrollment.progress?.completedLessons?.length || 0,
            nextLesson: 'Next Lesson', // Mock data
            enrolledAt: enrollment.enrolledAt,
            createdAt: enrollment.course.createdAt || enrollment.enrolledAt
          }))
          
          setEnrolledCourses(transformedCourses)
          
          // Update stats from enrollment data
          const stats = response.data.stats
          setStats({
            totalEnrolled: stats?.active || transformedCourses.length,
            averageProgress: transformedCourses.reduce((acc: number, course: any) => acc + course.progress, 0) / Math.max(transformedCourses.length, 1),
            totalHoursLearned: Math.round(transformedCourses.reduce((acc: number, course: any) => acc + (course.progress / 100 * 10), 0)),
            certificatesEarned: stats?.completed || 0
          })
        } else {
          throw new Error(response.error || 'Failed to fetch courses')
        }
      } catch (err) {
        console.error('Failed to fetch enrolled courses:', err)
        const errorMessage = err instanceof Error ? err.message : 'Failed to load courses'
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

    fetchEnrolledCourses()
  }, [user, toast])

  // Fetch AI recommendations
  useEffect(() => {
    const fetchAIRecommendations = async () => {
      if (!user || user.role !== 'student' || loading) {
        return
      }

      setAiLoading(true)
      try {
        const response = await fetch('/api/ai/recommend-courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user._id })
        })

        const data = await response.json()

        if (data.success) {
          setAiRecommendations(data.data.recommendations || [])
          setLearningPath(data.data.learningPath || '')
        } else {
          console.error('Failed to fetch AI recommendations:', data.error)
          
          // Show user-friendly error for quota exceeded
          if (data.errorCode === 'QUOTA_EXCEEDED') {
            toast({
              title: "⏳ Vui lòng thử lại sau",
              description: "AI đang bận xử lý nhiều yêu cầu. Hãy thử lại sau 30 giây.",
              variant: "default"
            })
          }
        }
      } catch (error) {
        console.error('Error fetching AI recommendations:', error)
      } finally {
        setAiLoading(false)
      }
    }

    // Only fetch after enrollments are loaded
    if (!loading && enrolledCourses.length > 0) {
      fetchAIRecommendations()
    }
  }, [user, loading, enrolledCourses.length])

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please log in to view your dashboard</h2>
        </div>
      </div>
    )
  }

  if (user.role !== 'student') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Student Dashboard</h2>
          <p className="text-muted-foreground">This dashboard is only available for students.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name || 'Student'}!</h1>
            <p className="text-muted-foreground">Continue your learning journey</p>
          </div>
          <div className="flex gap-3">
            <Link href="/student/join">
              <Button className="flex items-center gap-2">
                <TestTube className="h-4 w-4" />
                Join Exam Room
              </Button>
            </Link>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TrendingUp className="h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.totalEnrolled}
              </div>
              <p className="text-xs text-muted-foreground">Active learning paths</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Hours Learned</CardTitle>
              <Clock className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.totalHoursLearned}
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Certificates</CardTitle>
              <Award className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.certificatesEarned}
              </div>
              <p className="text-xs text-muted-foreground">Earned so far</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg. Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : `${stats.averageProgress}%`}
              </div>
              <p className="text-xs text-muted-foreground">Across all courses</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Tabs defaultValue="courses" className="space-y-6">
        <TabsList className="bg-card">
          <TabsTrigger value="courses">My Courses</TabsTrigger>
          <TabsTrigger value="recommendations">
            <Sparkles className="h-4 w-4 mr-2" />
            AI Recommendations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Loading your courses...</span>
              </div>
            </div>
          ) : error ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground mb-4">Failed to load courses</p>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : enrolledCourses.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Courses Enrolled</h3>
                <p className="text-muted-foreground mb-4">
                  Start your learning journey by enrolling in your first course!
                </p>
                <Button asChild>
                  <Link href="/courses">Browse Courses</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            enrolledCourses.map((course: EnrolledCourse, index: number) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="overflow-hidden transition-all hover:shadow-lg">
                <div className="md:flex">
                  <div className="md:w-48 h-48 md:h-auto relative overflow-hidden">
                    <img
                      src={course.thumbnail || "/placeholder.svg"}
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                    />
                  </div>
                  <div className="flex-1 p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2">{course.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4">by {course.instructor}</p>
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">Progress</span>
                              <span className="text-sm text-muted-foreground">
                                {course.completedLessons}/{course.totalLessons} lessons
                              </span>
                            </div>
                            <Progress value={course.progress} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-1">{course.progress}% complete</p>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Play className="h-4 w-4 text-primary" />
                            <span>Next: {course.nextLesson}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                          <Link href={`/student/courses/${course.id}`}>Continue Learning</Link>
                        </Button>
                        <Button variant="outline" asChild>
                          <Link href={`/courses/${course.id}`}>View Details</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <Card className="bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10 border-purple-500/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                      <CardTitle>✨ Gợi Ý Khóa Học Từ AI</CardTitle>
                    </div>
                    <CardDescription className="mt-2">
                      Dựa trên lịch sử học tập và tiến độ của bạn, AI gợi ý các khóa học phù hợp nhất
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      if (!user) return
                      setAiLoading(true)
                      try {
                        const response = await fetch('/api/ai/recommend-courses', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ userId: user._id })
                        })
                        const data = await response.json()
                        if (data.success) {
                          setAiRecommendations(data.data.recommendations || [])
                          setLearningPath(data.data.learningPath || '')
                          toast({
                            title: "✨ Cập nhật thành công!",
                            description: "Đã tải lại gợi ý từ AI"
                          })
                        } else if (data.errorCode === 'QUOTA_EXCEEDED') {
                          toast({
                            title: "⏳ Vui lòng thử lại sau",
                            description: "AI đang bận xử lý nhiều yêu cầu. Hãy thử lại sau 30 giây.",
                            variant: "default"
                          })
                        } else {
                          toast({
                            title: "Lỗi",
                            description: data.error || "Không thể tải gợi ý",
                            variant: "destructive"
                          })
                        }
                      } catch (error) {
                        toast({
                          title: "Lỗi",
                          description: "Không thể tải gợi ý",
                          variant: "destructive"
                        })
                      } finally {
                        setAiLoading(false)
                      }
                    }}
                    disabled={aiLoading}
                    className="flex items-center gap-2"
                  >
                    {aiLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <TrendingUp className="h-4 w-4" />
                    )}
                    Làm mới
                  </Button>
                </div>
              </CardHeader>
            </Card>
          </motion.div>

          {learningPath && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    🎯 Lộ Trình Học Tập Được Đề Xuất
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed pt-2">
                    {learningPath}
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          )}

          {aiLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                <span className="text-sm text-muted-foreground">AI đang phân tích lịch sử học tập của bạn...</span>
              </div>
            </div>
          ) : aiRecommendations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Sparkles className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Chưa có gợi ý</h3>
                <p className="text-muted-foreground mb-4">
                  {enrolledCourses.length === 0 
                    ? 'Hãy đăng ký khóa học đầu tiên để nhận gợi ý từ AI!'
                    : 'AI đang chuẩn bị gợi ý cho bạn...'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {aiRecommendations.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                >
                  <Card className="h-full flex flex-col overflow-hidden transition-shadow hover:shadow-lg border-2 hover:border-purple-300">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Badge 
                          variant="secondary" 
                          className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100"
                        >
                          #{index + 1} Ưu tiên
                        </Badge>
                        <Badge variant="outline">{course.category}</Badge>
                      </div>
                      <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-3">
                      <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <Sparkles className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-yellow-800 dark:text-yellow-200 leading-relaxed">
                            <strong>Lý do: </strong>{course.reason}
                          </p>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {course.description}
                      </p>

                      {course.tags && course.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {course.tags.slice(0, 3).map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                    <div className="p-6 pt-0">
                      <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white" asChild>
                        <Link href={`/courses/${course.id}`}>Xem Chi Tiết</Link>
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

      </Tabs>
    </div>
  )
}
