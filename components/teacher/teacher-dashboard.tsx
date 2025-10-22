"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Users, TrendingUp, DollarSign, Edit, Eye, BarChart3 } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { CreateCourseDialog } from "@/components/teacher/create-course-dialog"
import { CreateQuizDialog } from "@/components/teacher/create-quiz-dialog"

const teacherCourses = [
  {
    id: 1,
    title: "Introduction to Web Development",
    students: 1234,
    rating: 4.8,
    revenue: 12340,
    status: "Published",
    modules: 8,
    lessons: 24,
    thumbnail: "/web-development-coding-on-laptop-screen.jpg",
  },
  {
    id: 2,
    title: "Advanced React Patterns",
    students: 892,
    rating: 4.9,
    revenue: 8920,
    status: "Published",
    modules: 6,
    lessons: 18,
    thumbnail: "/react-javascript-code-on-computer-screen.jpg",
  },
  {
    id: 3,
    title: "JavaScript Fundamentals",
    students: 0,
    rating: 0,
    revenue: 0,
    status: "Draft",
    modules: 4,
    lessons: 12,
    thumbnail: "/javascript-code.png",
  },
]

const recentStudents = [
  { id: 1, name: "Alice Johnson", course: "Web Development", progress: 75, enrolled: "2 days ago" },
  { id: 2, name: "Bob Smith", course: "Advanced React", progress: 45, enrolled: "5 days ago" },
  { id: 3, name: "Carol Williams", course: "Web Development", progress: 90, enrolled: "1 week ago" },
  { id: 4, name: "David Brown", course: "Advanced React", progress: 30, enrolled: "1 week ago" },
]

const analytics = [
  { month: "Jan", students: 120, revenue: 1200 },
  { month: "Feb", students: 180, revenue: 1800 },
  { month: "Mar", students: 240, revenue: 2400 },
  { month: "Apr", students: 320, revenue: 3200 },
]

export function TeacherDashboard() {
  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold mb-2">Teacher Dashboard</h1>
          <p className="text-muted-foreground">Manage your courses and track student progress</p>
        </div>
        <div className="flex gap-3">
          <CreateCourseDialog />
          <CreateQuizDialog />
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
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2,126</div>
              <p className="text-xs text-muted-foreground">+180 this month</p>
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
              <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teacherCourses.filter((c) => c.status === "Published").length}</div>
              <p className="text-xs text-muted-foreground">1 in draft</p>
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
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$21,260</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
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
              <CardTitle className="text-sm font-medium">Avg. Rating</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4.85</div>
              <p className="text-xs text-muted-foreground">Across all courses</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Tabs defaultValue="courses" className="space-y-6">
        <TabsList className="bg-card">
          <TabsTrigger value="courses">My Courses</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-4">
          {teacherCourses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="overflow-hidden transition-all hover:shadow-lg">
                <div className="md:flex">
                  <div className="md:w-64 h-48 md:h-auto relative overflow-hidden">
                    <img
                      src={course.thumbnail || "/placeholder.svg"}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                    <Badge
                      className={`absolute top-4 right-4 ${
                        course.status === "Published"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {course.status}
                    </Badge>
                  </div>
                  <div className="flex-1 p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-3">{course.title}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Students</p>
                            <p className="text-lg font-semibold">{course.students.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Rating</p>
                            <p className="text-lg font-semibold">{course.rating > 0 ? course.rating : "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Revenue</p>
                            <p className="text-lg font-semibold">${course.revenue.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Content</p>
                            <p className="text-lg font-semibold">
                              {course.modules}M / {course.lessons}L
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/teacher/courses/${course.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/courses/${course.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/teacher/courses/${course.id}/analytics`}>
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Stats
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Enrollments</CardTitle>
              <CardDescription>Students who recently joined your courses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentStudents.map((student, index) => (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex items-center justify-between pb-4 border-b last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-semibold text-primary">{student.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-muted-foreground">{student.course}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{student.progress}% complete</p>
                      <p className="text-xs text-muted-foreground">{student.enrolled}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Card>
                <CardHeader>
                  <CardTitle>Student Growth</CardTitle>
                  <CardDescription>Monthly enrollment trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.map((data, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{data.month}</span>
                        <div className="flex items-center gap-4">
                          <div className="w-32 bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${(data.students / 320) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold w-12 text-right">{data.students}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Growth</CardTitle>
                  <CardDescription>Monthly revenue trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.map((data, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{data.month}</span>
                        <div className="flex items-center gap-4">
                          <div className="w-32 bg-muted rounded-full h-2">
                            <div
                              className="bg-accent h-2 rounded-full transition-all"
                              style={{ width: `${(data.revenue / 3200) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold w-16 text-right">${data.revenue}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
