"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { BookOpen, Clock, Award, TrendingUp, Play, CheckCircle2, Sparkles, Loader2, TestTube, Calendar, Target, FileText, Star } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { format } from "date-fns"
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
  completedAt?: string;
  quizResults?: Array<{
    lesson: string;
    score: number;
    attempts: number;
    completedAt: string;
  }>;
  projectSubmissions?: Array<{
    lesson: string;
    submission: string;
    submittedAt: string;
    grade?: number;
    feedback?: string;
  }>;
  detailedProjectSubmissions?: Array<{
    lessonId: string;
    lessonTitle: string;
    code: string;
    submittedAt: string;
    score?: number;
    feedback?: string;
    status: string;
  }>;
  averageQuizScore?: number;
  totalQuizzes?: number;
  totalProjects?: number;
  averageProjectScore?: number;
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
  const [completedCourses, setCompletedCourses] = useState<EnrolledCourse[]>([])
  const [stats, setStats] = useState<StudentStats>({
    totalEnrolled: 0,
    averageProgress: 0,
    totalHoursLearned: 0,
    certificatesEarned: 0
  })
  const [loading, setLoading] = useState(true)
  const [completedLoading, setCompletedLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [learningPath, setLearningPath] = useState<string>('')
  const [selectedCompletedCourse, setSelectedCompletedCourse] = useState<any>(null)
  const [showCourseDetails, setShowCourseDetails] = useState(false)

  // Load completed courses
  const loadCompletedCourses = async () => {
    if (!user || user.role !== 'student') return

    try {
      setCompletedLoading(true)
      const response = await enrollmentApi.getAll({ status: 'completed' })
      
      if (response.success && response.data) {
        // Also fetch detailed submissions for each completed course
        const transformedCourses = await Promise.all(
          response.data.enrollments.map(async (enrollment: any) => {
            let detailedSubmissions = []
            
            // Fetch detailed project submissions with feedback
            try {
              const submissionsResponse = await fetch('/api/student/submissions?courseId=' + enrollment.course._id, {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
              })
              
              if (submissionsResponse.ok) {
                const submissionsData = await submissionsResponse.json()
                if (submissionsData.success && submissionsData.data.length > 0) {
                  detailedSubmissions = submissionsData.data[0].submissions || []
                }
              }
            } catch (error) {
              console.error('Error fetching detailed submissions:', error)
            }
            
            const gradedProjects = detailedSubmissions.filter((p: any) => p.score !== undefined && p.score !== null)
            
            return {
              id: enrollment.course._id,
              title: enrollment.course.title,
              instructor: enrollment.course.instructor,
              thumbnail: enrollment.course.thumbnail,
              progress: 100, // Completed courses are 100%
              completedLessons: enrollment.progress.completedLessons.length,
              totalLessons: enrollment.progress.totalLessons,
              nextLesson: 'Đã hoàn thành',
              completedAt: enrollment.completedAt,
              quizResults: enrollment.quizResults || [],
              projectSubmissions: enrollment.projectSubmissions || [],
              detailedProjectSubmissions: detailedSubmissions,
              averageQuizScore: enrollment.quizResults.length > 0 ? 
                Math.round(enrollment.quizResults.reduce((acc: number, quiz: any) => acc + quiz.score, 0) / enrollment.quizResults.length) : null,
              totalQuizzes: enrollment.quizResults.length,
              totalProjects: detailedSubmissions.length, // Use detailedSubmissions for consistency
              averageProjectScore: gradedProjects.length > 0 ?
                Math.round(gradedProjects.reduce((acc: number, proj: any) => acc + proj.score, 0) / gradedProjects.length) : null
            }
          })
        )
        
        setCompletedCourses(transformedCourses)
      }
    } catch (err) {
      console.error('Failed to fetch completed courses:', err)
    } finally {
      setCompletedLoading(false)
    }
  }

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

  // Load completed courses when tab is accessed
  useEffect(() => {
    loadCompletedCourses()
  }, [user])

  // Load completed courses when tab is accessed
  useEffect(() => {
    loadCompletedCourses()
  }, [user])

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
          <h2 className="text-2xl font-bold mb-4">Vui lòng đăng nhập để xem bảng điều khiển</h2>
        </div>
      </div>
    )
  }

  if (user.role !== 'student') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Bảng Điều Khiển Học Sinh</h2>
          <p className="text-muted-foreground">Bảng điều khiển này chỉ dành cho học sinh.</p>
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
            <h1 className="text-3xl font-bold mb-2">Chào mừng trở lại, {user?.name || 'Học sinh'}!</h1>
            <p className="text-muted-foreground">Tiếp tục hành trình học tập của bạn</p>
          </div>
          <div className="flex gap-3">
            <Link href="/student/join">
              <Button className="flex items-center gap-2">
                <TestTube className="h-4 w-4" />
                Tham Gia Phòng Thi
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
              Làm mới
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
              <CardTitle className="text-sm font-medium">Khóa Học Đã Đăng Ký</CardTitle>
              <BookOpen className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.totalEnrolled}
              </div>
              <p className="text-xs text-muted-foreground">Lộ trình học tập đang hoạt động</p>
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
              <CardTitle className="text-sm font-medium">Giờ Học</CardTitle>
              <Clock className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.totalHoursLearned}
              </div>
              <p className="text-xs text-muted-foreground">Tháng này</p>
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
              <CardTitle className="text-sm font-medium">Chứng Chỉ</CardTitle>
              <Award className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.certificatesEarned}
              </div>
              <p className="text-xs text-muted-foreground">Đã đạt được</p>
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
              <CardTitle className="text-sm font-medium">Tiến Độ TB</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : `${stats.averageProgress}%`}
              </div>
              <p className="text-xs text-muted-foreground">Trên tất cả khóa học</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Tabs defaultValue="courses" className="space-y-6">
        <TabsList className="bg-card">
          <TabsTrigger value="courses">Khóa Học Của Tôi</TabsTrigger>
          <TabsTrigger value="completed">Khóa Học Đã Học</TabsTrigger>
          <TabsTrigger value="exam-results">
            <FileText className="h-4 w-4 mr-2" />
            Kết Quả Thi
          </TabsTrigger>
          <TabsTrigger value="recommendations">
            <Sparkles className="h-4 w-4 mr-2" />
            Gợi Ý Từ AI
          </TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Đang tải khóa học của bạn...</span>
              </div>
            </div>
          ) : error ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground mb-4">Không thể tải khóa học</p>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                >
                  Thử Lại
                </Button>
              </CardContent>
            </Card>
          ) : enrolledCourses.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Chưa Đăng Ký Khóa Học Nào</h3>
                <p className="text-muted-foreground mb-4">
                  Bắt đầu hành trình học tập bằng cách đăng ký khóa học đầu tiên!
                </p>
                <Button asChild>
                  <Link href="/courses">Duyệt Khóa Học</Link>
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
                              <span className="text-sm font-medium">Tiến Độ</span>
                              <span className="text-sm text-muted-foreground">
                                {course.completedLessons}/{course.totalLessons} bài học
                              </span>
                            </div>
                            <Progress value={course.progress} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-1">{course.progress}% hoàn thành</p>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Play className="h-4 w-4 text-primary" />
                            <span>Tiếp theo: {course.nextLesson}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                          <Link href={`/student/courses/${course.id}`}>Tiếp Tục Học</Link>
                        </Button>
                        <Button variant="outline" asChild>
                          <Link href={`/courses/${course.id}`}>Xem Chi Tiết</Link>
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

        <TabsContent value="completed" className="space-y-4">
          {completedLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Đang tải khóa học đã hoàn thành...</span>
              </div>
            </div>
          ) : completedCourses.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Award className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Chưa Hoàn Thành Khóa Học Nào</h3>
                <p className="text-muted-foreground mb-4">
                  Hoàn thành khóa học đầu tiên để nhận chứng chỉ và điểm số!
                </p>
                <Button asChild>
                  <Link href="/courses">Duyệt Khóa Học</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            completedCourses.map((course: EnrolledCourse, index: number) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="overflow-hidden transition-all hover:shadow-lg border-l-4 border-l-green-500">
                  <div className="md:flex">
                    <div className="md:w-48 h-48 md:h-auto relative overflow-hidden">
                      <img
                        src={course.thumbnail || "/placeholder.svg"}
                        alt={course.title}
                        className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Hoàn thành
                        </Badge>
                      </div>
                    </div>
                    <div className="flex-1 p-6">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold mb-2">{course.title}</h3>
                          <p className="text-sm text-muted-foreground mb-4">by {course.instructor}</p>
                          
                          {/* Completion Info */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-green-600" />
                              <span>Hoàn thành: {course.completedAt ? new Date(course.completedAt).toLocaleDateString('vi-VN') : 'Không xác định'}</span>
                            </div>
                            
                            {/* Scores Summary */}
                            <div className="grid grid-cols-2 gap-4 mt-4">
                              {course.averageQuizScore !== null && (
                                <div className="bg-blue-50 p-3 rounded-lg">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Target className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-800">Điểm Quiz TB</span>
                                  </div>
                                  <div className="text-2xl font-bold text-blue-900">{course.averageQuizScore}%</div>
                                  <div className="text-xs text-blue-600">{course.totalQuizzes} quiz</div>
                                </div>
                              )}
                              
                              {/* Project Score Section */}
                              {course.totalProjects > 0 && (
                                <div className={`p-3 rounded-lg ${
                                  course.averageProjectScore !== null 
                                    ? 'bg-purple-50' 
                                    : 'bg-yellow-50'
                                }`}>
                                  <div className="flex items-center gap-2 mb-1">
                                    <FileText className={`h-4 w-4 ${
                                      course.averageProjectScore !== null 
                                        ? 'text-purple-600' 
                                        : 'text-yellow-600'
                                    }`} />
                                    <span className={`text-sm font-medium ${
                                      course.averageProjectScore !== null 
                                        ? 'text-purple-800' 
                                        : 'text-yellow-800'
                                    }`}>
                                      {course.averageProjectScore !== null 
                                        ? 'Điểm Project TB' 
                                        : 'Project Status'
                                      }
                                    </span>
                                  </div>
                                  {course.averageProjectScore !== null ? (
                                    <>
                                      <div className="text-2xl font-bold text-purple-900">{course.averageProjectScore}%</div>
                                      <div className="text-xs text-purple-600">{course.totalProjects} project</div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="text-lg font-bold text-yellow-900">Giáo viên đang chấm...</div>
                                      <div className="text-xs text-yellow-600">{course.totalProjects} project chờ chấm</div>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <Button 
                            onClick={() => {
                              setSelectedCompletedCourse(course)
                              setShowCourseDetails(true)
                            }}
                            className="bg-green-600 text-white hover:bg-green-700"
                          >
                            <Star className="h-4 w-4 mr-2" />
                            Xem Chi Tiết Điểm
                          </Button>
                          <Button variant="outline" asChild>
                            <Link href={`/courses/${course.id}`}>Xem Khóa Học</Link>
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

        <TabsContent value="exam-results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Kết Quả Thi Đã Công Bố
              </CardTitle>
              <CardDescription>
                Xem lại kết quả và phân tích chi tiết các bài thi của bạn
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Xem Kết Quả Thi</h3>
                <p className="text-muted-foreground mb-4">
                  Truy cập trang kết quả thi để xem chi tiết các bài thi đã được giáo viên công bố
                </p>
                <Link href="/student/exam-results">
                  <Button>
                    <FileText className="h-4 w-4 mr-2" />
                    Đi đến Kết Quả Thi
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
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

      {/* Course Details Dialog */}
      <Dialog open={showCourseDetails} onOpenChange={setShowCourseDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Chi Tiết Điểm Số - {selectedCompletedCourse?.title}
            </DialogTitle>
            <DialogDescription>
              Xem chi tiết điểm số từ giáo viên cho khóa học đã hoàn thành
            </DialogDescription>
          </DialogHeader>

          {selectedCompletedCourse && (
            <div className="space-y-6">
              {/* Course Overview */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{selectedCompletedCourse.title}</h3>
                    <p className="text-muted-foreground">Giảng viên: {selectedCompletedCourse.instructor}</p>
                    <p className="text-sm text-green-600 font-medium">
                      ✅ Hoàn thành: {selectedCompletedCourse.completedAt ? 
                        new Date(selectedCompletedCourse.completedAt).toLocaleDateString('vi-VN') : 
                        'Không xác định'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">100%</div>
                      <div className="text-sm text-muted-foreground">Hoàn thành khóa học</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quiz Scores */}
              {selectedCompletedCourse.quizResults && selectedCompletedCourse.quizResults.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    Điểm Quiz ({selectedCompletedCourse.quizResults.length} quiz)
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {selectedCompletedCourse.quizResults.map((quiz: any, index: number) => (
                      <Card key={index} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">Quiz #{index + 1}</span>
                            <Badge className={`${quiz.score >= 70 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {quiz.score}%
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Lần làm: {quiz.attempts} | {new Date(quiz.completedAt).toLocaleDateString('vi-VN')}
                          </div>
                          <Progress value={quiz.score} className="mt-2 h-2" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  {selectedCompletedCourse.averageQuizScore && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">Điểm Trung Bình Quiz: </span>
                        <span className="text-lg font-bold text-blue-700">{selectedCompletedCourse.averageQuizScore}%</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Project Scores */}
              {selectedCompletedCourse?.detailedProjectSubmissions && selectedCompletedCourse.detailedProjectSubmissions.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-600" />
                    Điểm Project ({selectedCompletedCourse.detailedProjectSubmissions.length} project)
                  </h4>
                  <div className="space-y-4">
                    {selectedCompletedCourse.detailedProjectSubmissions.map((project: any, index: number) => (
                      <Card key={index} className="border-l-4 border-l-purple-500">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{project.lessonTitle}</span>
                              {project.score !== undefined ? (
                                <div className="flex items-center gap-2">
                                  <Award className="h-4 w-4 text-purple-600" />
                                  <Badge className={`${
                                    project.score >= 70 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {project.score}% - Đã chấm
                                  </Badge>
                                </div>
                              ) : (
                                <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Giáo viên đang chấm...
                                </Badge>
                              )}
                            </div>
                            
                            <div className="text-xs text-muted-foreground">
                              Nộp bài: {format(new Date(project.submittedAt), 'dd/MM/yyyy HH:mm')}
                            </div>
                            
                            {project.score !== undefined && (
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm">Điểm số</span>
                                  <span className="font-bold">{project.score}%</span>
                                </div>
                                <Progress value={project.score} className="h-2" />
                              </div>
                            )}
                            
                            {project.feedback && (
                              <div className="bg-amber-50 p-3 rounded border border-amber-200">
                                <div className="text-sm font-medium text-amber-800 mb-1">Nhận xét từ giáo viên:</div>
                                <div className="text-sm text-amber-700 whitespace-pre-wrap">{project.feedback}</div>
                              </div>
                            )}

                            {!project.feedback && project.score !== undefined && (
                              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                                <div className="text-sm text-blue-700">Đã chấm điểm nhưng chưa có nhận xét</div>
                              </div>
                            )}

                            {project.score === undefined && (
                              <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                                <div className="flex items-center gap-2 text-yellow-700">
                                  <Clock className="h-4 w-4" />
                                  <span className="text-sm font-medium">Giáo viên đang xem xét và chấm điểm cho bài nộp của bạn</span>
                                </div>
                                <p className="text-xs text-yellow-600 mt-1 ml-6">
                                  Vui lòng chờ ít ngày nữa để nhận kết quả chấm điểm và nhận xét
                                </p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  {selectedCompletedCourse.averageProjectScore && (
                    <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-purple-600" />
                        <span className="font-medium">Điểm Trung Bình Project: </span>
                        <span className="text-lg font-bold text-purple-700">{selectedCompletedCourse.averageProjectScore}%</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Overall Performance */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg border border-yellow-200">
                <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-600" />
                  Tổng Kết Thành Tích
                </h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{selectedCompletedCourse.completedLessons}</div>
                    <div className="text-sm text-muted-foreground">Bài học hoàn thành</div>
                  </div>
                  {selectedCompletedCourse.averageQuizScore && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{selectedCompletedCourse.averageQuizScore}%</div>
                      <div className="text-sm text-muted-foreground">Điểm quiz trung bình</div>
                    </div>
                  )}
                  {selectedCompletedCourse.averageProjectScore && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{selectedCompletedCourse.averageProjectScore}%</div>
                      <div className="text-sm text-muted-foreground">Điểm project trung bình</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
