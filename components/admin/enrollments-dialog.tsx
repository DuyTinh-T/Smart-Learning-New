"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BookOpen,
  Calendar,
  Clock,
  TrendingUp,
  CheckCircle,
  Loader2,
  GraduationCap,
  AlertCircle,
} from "lucide-react"
import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface EnrollmentData {
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
}

interface StudentEnrollmentsData {
  id: string
  name: string
  email: string
  stats: {
    totalCourses: number
    activeCourses: number
    completedCourses: number
    avgProgress: number
  }
  allCourses: EnrollmentData[]
}

interface EnrollmentsDialogProps {
  studentId: string | null
  studentName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EnrollmentsDialog({ studentId, studentName, open, onOpenChange }: EnrollmentsDialogProps) {
  const [enrollments, setEnrollments] = useState<StudentEnrollmentsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && studentId) {
      fetchEnrollments()
    }
  }, [open, studentId])

  const fetchEnrollments = async () => {
    if (!studentId) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/admin/students/${studentId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch enrollments')
      }

      const data = await response.json()
      setEnrollments(data.data)
    } catch (err) {
      console.error('Error fetching enrollments:', err)
      setError(err instanceof Error ? err.message : 'Failed to load enrollments')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default'
      case 'completed':
        return 'default'
      case 'dropped':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'active':
        return <TrendingUp className="h-4 w-4 text-blue-500" />
      case 'dropped':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const filterCoursesByStatus = (status: string) => {
    if (!enrollments) return []
    return enrollments.allCourses.filter((course) => course.status === status)
  }

  const activeCourses = filterCoursesByStatus('active')
  const completedCourses = filterCoursesByStatus('completed')
  const droppedCourses = filterCoursesByStatus('dropped')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Course Enrollments</DialogTitle>
          <DialogDescription>
            All courses enrolled by {studentName}
          </DialogDescription>
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

        {!loading && !error && enrollments && (
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span className="text-2xl font-bold">{enrollments.stats.totalCourses}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Total Enrolled</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    <span className="text-2xl font-bold">{enrollments.stats.activeCourses}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Active Courses</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-2xl font-bold">{enrollments.stats.completedCourses}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl font-bold">{enrollments.stats.avgProgress}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Avg. Progress</p>
                  <Progress value={enrollments.stats.avgProgress} className="mt-2 h-1" />
                </CardContent>
              </Card>
            </div>

            {/* Enrollments List */}
            <Tabs defaultValue="all" className="w-full">
              <TabsList>
                <TabsTrigger value="all">
                  All ({enrollments.allCourses.length})
                </TabsTrigger>
                <TabsTrigger value="active">
                  Active ({activeCourses.length})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completed ({completedCourses.length})
                </TabsTrigger>
                {droppedCourses.length > 0 && (
                  <TabsTrigger value="dropped">
                    Dropped ({droppedCourses.length})
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="all" className="mt-4">
                {enrollments.allCourses.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>No enrollments found</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course</TableHead>
                        <TableHead>Teacher</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Enrolled</TableHead>
                        <TableHead>Last Accessed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enrollments.allCourses.map((course) => (
                        <TableRow key={course.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{course.title}</p>
                              <p className="text-xs text-muted-foreground">${course.price}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <GraduationCap className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{course.teacher.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 min-w-[120px]">
                              <Progress value={course.progress} className="h-2 w-full" />
                              <span className="text-sm font-medium whitespace-nowrap">
                                {course.progress}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(course.status)}
                              <Badge variant={getStatusColor(course.status) as any}>
                                {course.status}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {course.enrolledAt}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {course.lastAccessed}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="active" className="mt-4">
                {activeCourses.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No active courses</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeCourses.map((course) => (
                      <Card key={course.id}>
                        <CardContent className="pt-6">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold">{course.title}</h4>
                                  <Badge variant="default" className="text-xs">
                                    {course.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <GraduationCap className="h-3 w-3" />
                                    {course.teacher.name}
                                  </span>
                                  <span>${course.price}</span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Enrolled {course.enrolledAt}
                                  </span>
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
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              Last accessed: {course.lastAccessed}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="completed" className="mt-4">
                {completedCourses.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No completed courses</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {completedCourses.map((course) => (
                      <Card key={course.id} className="border-green-200 dark:border-green-800">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                <h4 className="font-semibold">{course.title}</h4>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <GraduationCap className="h-3 w-3" />
                                  {course.teacher.name}
                                </span>
                                <span>${course.price}</span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Completed on {course.lastAccessed}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {droppedCourses.length > 0 && (
                <TabsContent value="dropped" className="mt-4">
                  <div className="space-y-3">
                    {droppedCourses.map((course) => (
                      <Card key={course.id} className="border-red-200 dark:border-red-800 opacity-75">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <AlertCircle className="h-5 w-5 text-red-500" />
                                <h4 className="font-semibold">{course.title}</h4>
                                <Badge variant="destructive" className="text-xs">
                                  Dropped
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <GraduationCap className="h-3 w-3" />
                                  {course.teacher.name}
                                </span>
                                <span>Progress: {course.progress}%</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
