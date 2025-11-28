"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BookOpen,
  Users,
  Star,
  Calendar,
  Clock,
  TrendingUp,
  CheckCircle,
  Loader2,
} from "lucide-react"
import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface TeacherProfileData {
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
    totalStudents: number
    totalEnrollments: number
    avgRating: number
  }
  recentCourses: Array<{
    id: string
    title: string
    slug: string
    price: number
    enrollments: number
    rating: number
    totalRatings: number
    isActive: boolean
    createdAt: string
  }>
  allCourses: Array<{
    id: string
    title: string
    slug: string
    price: number
    enrollments: number
    rating: number
    isActive: boolean
  }>
}

interface TeacherProfileDialogProps {
  teacherId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TeacherProfileDialog({ teacherId, open, onOpenChange }: TeacherProfileDialogProps) {
  const [teacher, setTeacher] = useState<TeacherProfileData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && teacherId) {
      fetchTeacherProfile()
    }
  }, [open, teacherId])

  const fetchTeacherProfile = async () => {
    if (!teacherId) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/admin/teachers/${teacherId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch teacher profile')
      }

      const data = await response.json()
      setTeacher(data.data)
    } catch (err) {
      console.error('Error fetching teacher profile:', err)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Teacher Profile</DialogTitle>
          <DialogDescription>Detailed information about the teacher</DialogDescription>
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

        {!loading && !error && teacher && (
          <div className="space-y-6">
            {/* Header Section */}
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={teacher.avatar} alt={teacher.name} />
                <AvatarFallback className="text-lg">{getInitials(teacher.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-2xl font-bold">{teacher.name}</h3>
                  <Badge variant={teacher.isActive ? "default" : "secondary"}>
                    {teacher.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-2">{teacher.email}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Joined {new Date(teacher.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </div>
                  {teacher.lastLogin && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Last login {new Date(teacher.lastLogin).toLocaleDateString()}
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
                    Total Courses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span className="text-2xl font-bold">{teacher.stats.totalCourses}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {teacher.stats.activeCourses} active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Students
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-2xl font-bold">{teacher.stats.totalStudents}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Unique learners
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Avg. Rating
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-2xl font-bold">{teacher.stats.avgRating}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Across all courses
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Enrollments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-2xl font-bold">{teacher.stats.totalEnrollments}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total enrollments
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Courses Section */}
            <Tabs defaultValue="recent" className="w-full">
              <TabsList>
                <TabsTrigger value="recent">Recent Courses</TabsTrigger>
                <TabsTrigger value="all">All Courses</TabsTrigger>
              </TabsList>

              <TabsContent value="recent" className="space-y-4">
                {teacher.recentCourses.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No courses yet</p>
                ) : (
                  <div className="space-y-3">
                    {teacher.recentCourses.map((course) => (
                      <Card key={course.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">{course.title}</h4>
                                <Badge variant={course.isActive ? "default" : "secondary"} className="text-xs">
                                  {course.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>${course.price}</span>
                                <span>{course.enrollments} enrollments</span>
                                <span className="flex items-center gap-1">
                                  <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                  {course.rating} ({course.totalRatings})
                                </span>
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground">{course.createdAt}</span>
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
                      <TableHead>Title</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Enrollments</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teacher.allCourses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell className="font-medium">{course.title}</TableCell>
                        <TableCell>${course.price}</TableCell>
                        <TableCell>{course.enrollments}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                            {course.rating}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={course.isActive ? "default" : "secondary"}>
                            {course.isActive ? "Active" : "Inactive"}
                          </Badge>
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
