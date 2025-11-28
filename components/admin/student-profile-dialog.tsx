"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  BookOpen,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle,
  Loader2,
  GraduationCap,
} from "lucide-react"
import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface StudentProfileData {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
  isActive: boolean
  lastLogin?: Date
  createdAt: Date
  dailyStudyTime: number
  stats: {
    totalCourses: number
    activeCourses: number
    completedCourses: number
    avgProgress: number
  }
  recentCourses: Array<{
    id: string
    courseId: string
    title: string
    slug?: string
    thumbnail?: string
    price: number
    teacher: {
      name: string
    }
    status: string
    progress: number
    enrolledAt: string
    lastAccessed: string
  }>
  allCourses: Array<{
    id: string
    courseId: string
    title: string
    slug?: string
    price: number
    teacher: {
      name: string
    }
    status: string
    progress: number
    enrolledAt: string
    lastAccessed: string
  }>
}

interface StudentProfileDialogProps {
  studentId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StudentProfileDialog({ studentId, open, onOpenChange }: StudentProfileDialogProps) {
  const [student, setStudent] = useState<StudentProfileData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && studentId) {
      fetchStudentProfile()
    }
  }, [open, studentId])

  const fetchStudentProfile = async () => {
    if (!studentId) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/admin/students/${studentId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch student profile')
      }

      const data = await response.json()
      setStudent(data.data)
    } catch (err) {
      console.error('Error fetching student profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default'
      case 'completed':
        return 'success'
      case 'dropped':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Student Profile</DialogTitle>
          <DialogDescription>Detailed information about the student</DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-destructive">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && student && (
          <div className="space-y-6">
            {/* Header Section */}
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={student.avatar} alt={student.name} />
                <AvatarFallback className="text-lg">{getInitials(student.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-2xl font-bold">{student.name}</h3>
                  <Badge variant={student.isActive ? "default" : "secondary"}>
                    {student.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-2">{student.email}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Joined {new Date(student.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </div>
                  {student.lastLogin && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Last login {new Date(student.lastLogin).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Enrolled Courses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span className="text-2xl font-bold">{student.stats.totalCourses}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {student.stats.activeCourses} active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Completed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-2xl font-bold">{student.stats.completedCourses}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Courses finished
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Avg. Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-2xl font-bold">{student.stats.avgProgress}%</span>
                  </div>
                  <Progress value={student.stats.avgProgress} className="mt-2 h-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Study Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-2xl font-bold">{student.dailyStudyTime}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Minutes/day
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Courses Section */}
            <Tabs defaultValue="recent" className="w-full">
              <TabsList>
                <TabsTrigger value="recent">Recent Activity</TabsTrigger>
                <TabsTrigger value="all">All Courses</TabsTrigger>
              </TabsList>

              <TabsContent value="recent" className="space-y-4">
                {student.recentCourses.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No courses enrolled</p>
                ) : (
                  <div className="space-y-3">
                    {student.recentCourses.map((course) => (
                      <Card key={course.id}>
                        <CardContent className="pt-6">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold">{course.title}</h4>
                                  <Badge variant={getStatusColor(course.status) as any} className="text-xs">
                                    {course.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <GraduationCap className="h-3 w-3" />
                                    {course.teacher.name}
                                  </span>
                                  <span>${course.price}</span>
                                  <span>Enrolled {course.enrolledAt}</span>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="font-medium">{course.progress}%</span>
                              </div>
                              <Progress value={course.progress} className="h-2" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="all">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Enrolled</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {student.allCourses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell className="font-medium">{course.title}</TableCell>
                        <TableCell>{course.teacher.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={course.progress} className="h-2 w-20" />
                            <span className="text-sm">{course.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(course.status) as any}>
                            {course.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {course.enrolledAt}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
