"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Clock, Award, TrendingUp, Play, CheckCircle2, Sparkles, Loader2 } from "lucide-react"
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

const aiRecommendations = [
  {
    id: 4,
    title: "TypeScript Essentials",
    reason: "Based on your React progress",
    duration: "6 weeks",
    level: "Intermediate",
    thumbnail: "/typescript-code.png",
  },
  {
    id: 5,
    title: "Responsive Web Design",
    reason: "Complements your UI/UX course",
    duration: "4 weeks",
    level: "Beginner",
    thumbnail: "/responsive-design.png",
  },
]

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
          const transformedCourses = enrollmentData.map((enrollment: any) => ({
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
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
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
            <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <CardTitle>AI-Powered Recommendations</CardTitle>
                </div>
                <CardDescription>Based on your learning history and goals, we recommend these courses</CardDescription>
              </CardHeader>
            </Card>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2">
            {aiRecommendations.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <Card className="h-full flex flex-col overflow-hidden transition-shadow hover:shadow-lg">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={course.thumbnail || "/placeholder.svg"}
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                    />
                    <Badge className="absolute top-4 right-4 bg-accent text-accent-foreground">{course.level}</Badge>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg">{course.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Sparkles className="h-3 w-3" />
                      {course.reason}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <Clock className="h-4 w-4" />
                      <span>{course.duration}</span>
                    </div>
                  </CardContent>
                  <div className="p-6 pt-0">
                    <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" asChild>
                      <Link href={`/courses/${course.id}`}>Explore Course</Link>
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest learning milestones</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : generateRecentActivity(enrolledCourses).length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="font-semibold mb-2">No Recent Activity</h3>
                  <p className="text-muted-foreground text-sm">
                    Start learning to see your progress here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {generateRecentActivity(enrolledCourses).map((activity: any, index: number) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0"
                    >
                      <div className="rounded-full bg-primary/10 p-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{activity.action}</p>
                        <p className="text-sm text-muted-foreground">{activity.course}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{activity.time}</span>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
