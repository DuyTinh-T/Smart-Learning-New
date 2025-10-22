"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Clock, Award, TrendingUp, Play, CheckCircle2, Sparkles } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"

const enrolledCourses = [
  {
    id: 1,
    title: "Introduction to Web Development",
    progress: 65,
    totalLessons: 24,
    completedLessons: 16,
    nextLesson: "JavaScript Functions",
    instructor: "Sarah Johnson",
    thumbnail: "/web-development-coding-on-laptop-screen.jpg",
  },
  {
    id: 2,
    title: "UI/UX Design Fundamentals",
    progress: 40,
    totalLessons: 30,
    completedLessons: 12,
    nextLesson: "Color Theory Basics",
    instructor: "Emily Rodriguez",
    thumbnail: "/ui-ux-design-wireframes-and-mockups.jpg",
  },
  {
    id: 3,
    title: "Advanced React Patterns",
    progress: 20,
    totalLessons: 18,
    completedLessons: 4,
    nextLesson: "Custom Hooks",
    instructor: "Michael Chen",
    thumbnail: "/react-javascript-code-on-computer-screen.jpg",
  },
]

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

const recentActivity = [
  { id: 1, action: "Completed lesson", course: "Web Development", time: "2 hours ago" },
  { id: 2, action: "Passed quiz", course: "UI/UX Design", time: "1 day ago" },
  { id: 3, action: "Started course", course: "Advanced React", time: "3 days ago" },
]

export function StudentDashboard() {
  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">Welcome back, Student!</h1>
        <p className="text-muted-foreground">Continue your learning journey</p>
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
              <div className="text-2xl font-bold">{enrolledCourses.length}</div>
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
              <div className="text-2xl font-bold">42.5</div>
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
              <div className="text-2xl font-bold">5</div>
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
              <div className="text-2xl font-bold">42%</div>
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
          {enrolledCourses.map((course, index) => (
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
          ))}
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
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
