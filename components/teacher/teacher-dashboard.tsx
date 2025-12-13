"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Users, TrendingUp, DollarSign, Edit, Eye, BarChart3, TestTube, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { CreateCourseDialog } from "@/components/teacher/create-course-dialog"
import { CreateQuizDialog } from "@/components/teacher/create-quiz-dialog"
import { CourseManagement } from "@/components/teacher/course-management"
import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"

export function TeacherDashboard() {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState({
    totalStudents: 0,
    totalCourses: 0,
    publishedCourses: 0,
    draftCourses: 0,
    totalRevenue: 0,
    averageRating: 0,
    recentStudents: [],
    analytics: []
  })
  const [rooms, setRooms] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [roomsLoading, setRoomsLoading] = useState(false)
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [user])

  const handleTabChange = (value) => {
    if (value === 'rooms' && rooms.length === 0) {
      fetchRooms()
    } else if (value === 'students' && students.length === 0) {
      fetchStudents()
    }
  }

  const fetchDashboardData = async () => {
    if (!user || !user._id) {
      return
    }
    
    try {
      setLoading(true)
      const response = await fetch(`/api/teacher/dashboard?teacherId=${user._id}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }
      
      const data = await response.json()
      setDashboardData(data)
    } catch (err) {
      setError(err.message)
      const mockData = {
        totalStudents: 0,
        totalCourses: 0,
        publishedCourses: 0,
        draftCourses: 0,
        totalRevenue: 0,
        averageRating: 0,
        recentStudents: [],
        analytics: []
      }
      setDashboardData(mockData)
    } finally {
      setLoading(false)
    }
  }

  const fetchRooms = async () => {
    if (!user || !user._id) return
    
    try {
      setRoomsLoading(true)
      const response = await fetch(`/api/teacher/rooms?teacherId=${user._id}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch rooms data: ${response.status}`)
      }
      
      const data = await response.json()
      setRooms(data.rooms || [])
    } catch (err) {
      setError(`Failed to load rooms: ${err.message}`)
      setRooms([])
    } finally {
      setRoomsLoading(false)
    }
  }

  const fetchStudents = async () => {
    if (!user || !user._id) return
    
    try {
      setStudentsLoading(true)
      const response = await fetch(`/api/teacher/students?teacherId=${user._id}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch students data: ${response.status}`)
      }
      
      const data = await response.json()
      setStudents(data.students || [])
    } catch (err) {
      setError(`Failed to load students: ${err.message}`)
      setStudents([])
    } finally {
      setStudentsLoading(false)
    }
  }

  const formatTimeAgo = (dateString) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) {
      return 'Hôm nay'
    } else if (diffInDays === 1) {
      return '1 ngày trước'
    } else if (diffInDays < 7) {
      return `${diffInDays} ngày trước`
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7)
      return `${weeks} tuần trước`
    } else {
      const months = Math.floor(diffInDays / 30)
      return `${months} tháng trước`
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { label: 'Đang hoạt động', variant: 'default' },
      completed: { label: 'Hoàn thành', variant: 'secondary' },
      scheduled: { label: 'Đã lên lịch', variant: 'outline' }
    }
    return statusConfig[status] || { label: status, variant: 'default' }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-500 mb-4">Lỗi khi tải dữ liệu: {error}</p>
            <Button onClick={fetchDashboardData}>Thử lại</Button>
          </div>
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
        className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold mb-2">Trang quản lý giảng viên</h1>
          <p className="text-muted-foreground">Quản lý khóa học và theo dõi tiến độ học viên</p>
        </div>
        <div className="flex gap-3">
          <Link href="/teacher/rooms">
            <Button variant="outline" className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              Phòng thi
            </Button>
          </Link>
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
              <CardTitle className="text-sm font-medium">Tổng học viên</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.totalStudents.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Tổng số học viên</p>
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
              <CardTitle className="text-sm font-medium">Khóa học đang hoạt động</CardTitle>
              <BookOpen className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.publishedCourses}</div>
              <p className="text-xs text-muted-foreground">{dashboardData.draftCourses} bản nháp</p>
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
              <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
              <DollarSign className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${dashboardData.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Tổng doanh thu</p>
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
              <CardTitle className="text-sm font-medium">Đánh giá trung bình</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.averageRating.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Trên tất cả khóa học</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Tabs defaultValue="courses" className="space-y-6" onValueChange={handleTabChange}>
        <TabsList className="bg-card">
          <TabsTrigger value="courses">Khóa học của tôi</TabsTrigger>
          <TabsTrigger value="rooms">Phòng thi</TabsTrigger>
          <TabsTrigger value="students">Học viên</TabsTrigger>
          <TabsTrigger value="analytics">Phân tích</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-4">
          <CourseManagement />
        </TabsContent>

        <TabsContent value="rooms" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Phòng thi của tôi</CardTitle>
                  <CardDescription>Quản lý và theo dõi các phòng thi trực tuyến</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={fetchRooms} variant="outline" size="sm">
                    Làm mới
                  </Button>
                  <Link href="/teacher/rooms">
                    <Button>
                      Tạo phòng mới
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {roomsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2 text-sm text-muted-foreground">Đang tải phòng thi...</span>
                </div>
              ) : error && rooms.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-red-500 mb-4">Lỗi khi tải danh sách phòng thi</p>
                  <Button onClick={fetchRooms} variant="outline" size="sm">
                    Thử lại
                  </Button>
                </div>
              ) : rooms.length > 0 ? (
                <div className="space-y-4">
                  {rooms.map((room, index) => (
                    <motion.div
                      key={room.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <TestTube className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{room.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{room.participants} học viên</span>
                            <span>Thời lượng: {room.duration} phút</span>
                            <span>{formatTimeAgo(room.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={getStatusBadge(room.status).variant}>
                          {getStatusBadge(room.status).label}
                        </Badge>
                        <Link href={`/teacher/rooms`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Xem chi tiết
                          </Button>
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TestTube className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Chưa có phòng thi nào được tạo
                  </p>
                  <Link href="/teacher/rooms">
                    <Button>
                      Tạo phòng thi đầu tiên
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Học viên của tôi</CardTitle>
                  <CardDescription>Danh sách và tiến độ học tập của học viên</CardDescription>
                </div>
                <Button onClick={fetchStudents} variant="outline" size="sm">
                  Làm mới
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {studentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2 text-sm text-muted-foreground">Đang tải danh sách học viên...</span>
                </div>
              ) : error && students.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-red-500 mb-4">Lỗi khi tải danh sách học viên</p>
                  <Button onClick={fetchStudents} variant="outline" size="sm">
                    Thử lại
                  </Button>
                </div>
              ) : students.length > 0 ? (
                <div className="space-y-4">
                  {students.map((student, index) => (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="font-semibold text-primary text-lg">{student.name.charAt(0)}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold">{student.name}</h3>
                            <Badge variant="outline">{student.course}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{student.email}</span>
                            <span>Đăng ký: {formatTimeAgo(student.enrolled)}</span>
                            <span>Hoạt động: {formatTimeAgo(student.lastActive)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-24 bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${student.progress}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-12 text-right">{student.progress}%</span>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.location.href = `mailto:${student.email}`}
                          >
                            <Users className="h-4 w-4 mr-2" />
                            Liên hệ
                          </Button>
                          <Button variant="outline" size="sm">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Chi tiết
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Chưa có học viên nào đăng ký khóa học
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Học viên sẽ xuất hiện ở đây khi họ đăng ký khóa học của bạn
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Card>
                <CardHeader>
                  <CardTitle>Tăng trưởng học viên</CardTitle>
                  <CardDescription>Xu hướng đăng ký hàng tháng</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.analytics.length > 0 ? dashboardData.analytics.map((data, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{data.month}</span>
                        <div className="flex items-center gap-4">
                          <div className="w-32 bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${Math.min((data.students / Math.max(...dashboardData.analytics.map(a => a.students), 1)) * 100, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold w-12 text-right">{data.students}</span>
                        </div>
                      </div>
                    )) : (
                      <p className="text-muted-foreground text-center py-8">
                        Chưa có dữ liệu phân tích
                      </p>
                    )}
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
                  <CardTitle>Tăng trưởng doanh thu</CardTitle>
                  <CardDescription>Xu hướng doanh thu hàng tháng</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.analytics.length > 0 ? dashboardData.analytics.map((data, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{data.month}</span>
                        <div className="flex items-center gap-4">
                          <div className="w-32 bg-muted rounded-full h-2">
                            <div
                              className="bg-accent h-2 rounded-full transition-all"
                              style={{ width: `${Math.min((data.revenue / Math.max(...dashboardData.analytics.map(a => a.revenue), 1)) * 100, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold w-16 text-right">${data.revenue}</span>
                        </div>
                      </div>
                    )) : (
                      <p className="text-muted-foreground text-center py-8">
                        Chưa có dữ liệu phân tích
                      </p>
                    )}
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
