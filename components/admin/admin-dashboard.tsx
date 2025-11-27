"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  Users,
  GraduationCap,
  BookOpen,
  TrendingUp,
  Search,
  MoreVertical,
  UserCheck,
  UserX,
  Mail,
  Shield,
  Loader2,
} from "lucide-react"
import { motion } from "framer-motion"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface Teacher {
  id: string
  name: string
  email: string
  courses: number
  students: number
  rating: number
  status: string
  joined: string
  avatar?: string
}

interface Student {
  id: string
  name: string
  email: string
  courses: number
  progress: number
  status: string
  joined: string
  avatar?: string
}

interface Course {
  id: string
  title: string
  slug: string
  description?: string
  category?: string
  thumbnail?: string
  price: number
  teacher: {
    id: string
    name: string
    email?: string
  }
  modules: number
  enrollments: number
  rating: number
  totalRatings: number
  visibility: string
  isActive: boolean
  createdAt: string
}

interface PlatformStats {
  totalStudents: { value: number; change: string }
  totalTeachers: { value: number; change: string }
  activeCourses: { value: number; change: string }
  platformRevenue: { value: number; change: string }
}

const teachers = [
  {
    id: 1,
    name: "Dr. Sarah Johnson",
    email: "sarah.johnson@example.com",
    courses: 3,
    students: 2126,
    rating: 4.8,
    status: "active",
    joined: "Jan 2024",
  },
  {
    id: 2,
    name: "Prof. Michael Chen",
    email: "michael.chen@example.com",
    courses: 5,
    students: 3450,
    rating: 4.9,
    status: "active",
    joined: "Feb 2024",
  },
  {
    id: 3,
    name: "Dr. Emily Rodriguez",
    email: "emily.rodriguez@example.com",
    courses: 2,
    students: 890,
    rating: 4.7,
    status: "active",
    joined: "Mar 2024",
  },
  {
    id: 4,
    name: "Prof. James Wilson",
    email: "james.wilson@example.com",
    courses: 1,
    students: 234,
    rating: 4.5,
    status: "pending",
    joined: "Apr 2024",
  },
]

const students = [
  {
    id: 1,
    name: "Alice Johnson",
    email: "alice.j@example.com",
    courses: 4,
    progress: 75,
    status: "active",
    joined: "Jan 2024",
  },
  {
    id: 2,
    name: "Bob Smith",
    email: "bob.smith@example.com",
    courses: 2,
    progress: 45,
    status: "active",
    joined: "Feb 2024",
  },
  {
    id: 3,
    name: "Carol Williams",
    email: "carol.w@example.com",
    courses: 6,
    progress: 90,
    status: "active",
    joined: "Jan 2024",
  },
  {
    id: 4,
    name: "David Brown",
    email: "david.b@example.com",
    courses: 3,
    progress: 30,
    status: "active",
    joined: "Mar 2024",
  },
  {
    id: 5,
    name: "Emma Davis",
    email: "emma.d@example.com",
    courses: 1,
    progress: 15,
    status: "inactive",
    joined: "Apr 2024",
  },
]

const platformStats = [
  { label: "Total Students", value: "12,456", change: "+12%", icon: Users },
  { label: "Total Teachers", value: "234", change: "+8%", icon: GraduationCap },
  { label: "Active Courses", value: "567", change: "+15%", icon: BookOpen },
  { label: "Platform Revenue", value: "$234,567", change: "+23%", icon: TrendingUp },
]

export function AdminDashboard() {
  const [teachersData, setTeachersData] = useState<Teacher[]>([])
  const [studentsData, setStudentsData] = useState<Student[]>([])
  const [coursesData, setCoursesData] = useState<Course[]>([])
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Pagination states
  const [teachersPage, setTeachersPage] = useState(1)
  const [studentsPage, setStudentsPage] = useState(1)
  const [coursesPage, setCoursesPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch all data in parallel
        const [teachersRes, studentsRes, coursesRes, statsRes] = await Promise.all([
          fetch('/api/admin/teachers'),
          fetch('/api/admin/students'),
          fetch('/api/admin/courses'),
          fetch('/api/admin/stats'),
        ])

        if (!teachersRes.ok || !studentsRes.ok || !coursesRes.ok || !statsRes.ok) {
          throw new Error('Failed to fetch admin data')
        }

        const [teachersData, studentsData, coursesData, statsData] = await Promise.all([
          teachersRes.json(),
          studentsRes.json(),
          coursesRes.json(),
          statsRes.json(),
        ])

        setTeachersData(teachersData.data || [])
        setStudentsData(studentsData.data || [])
        setCoursesData(coursesData.data || [])
        setStats(statsData.data || null)
      } catch (err) {
        console.error('Error fetching admin data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Pagination logic
  const paginateData = <T,>(data: T[], page: number) => {
    const startIndex = (page - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return data.slice(startIndex, endIndex)
  }

  const getTotalPages = (dataLength: number) => {
    return Math.ceil(dataLength / itemsPerPage)
  }

  const paginatedTeachers = paginateData(teachersData, teachersPage)
  const paginatedStudents = paginateData(studentsData, studentsPage)
  const paginatedCourses = paginateData(coursesData, coursesPage)

  const teachersTotalPages = getTotalPages(teachersData.length)
  const studentsTotalPages = getTotalPages(studentsData.length)
  const coursesTotalPages = getTotalPages(coursesData.length)

  const displayStats = stats
    ? [
        {
          label: "Total Students",
          value: stats.totalStudents.value.toLocaleString(),
          change: stats.totalStudents.change,
          icon: Users,
        },
        {
          label: "Total Teachers",
          value: stats.totalTeachers.value.toLocaleString(),
          change: stats.totalTeachers.change,
          icon: GraduationCap,
        },
        {
          label: "Active Courses",
          value: stats.activeCourses.value.toLocaleString(),
          change: stats.activeCourses.change,
          icon: BookOpen,
        },
        {
          label: "Platform Revenue",
          value: `$${stats.platformRevenue.value.toLocaleString()}`,
          change: stats.platformRevenue.change,
          icon: TrendingUp,
        },
      ]
    : platformStats

  // Pagination component
  const PaginationControls = ({
    currentPage,
    totalPages,
    onPageChange,
  }: {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
  }) => {
    if (totalPages <= 1) return null

    return (
      <div className="flex items-center justify-between mt-4 pt-4 border-t">
        <div className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
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
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>
        <p className="text-muted-foreground">Manage teachers, students, and platform operations</p>
      </motion.div>

      {/* Platform Stats */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading admin data...</span>
        </div>
      )}

      {error && (
        <Card className="mb-8 border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive text-center">{error}</p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {displayStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
            <Card className="transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                <stat.icon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.change} from last month</p>
              </CardContent>
            </Card>
              </motion.div>
            ))}
          </div>

          <Tabs defaultValue="teachers" className="space-y-6">
        <TabsList className="bg-card">
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
        </TabsList>

        <TabsContent value="teachers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Teacher Management</CardTitle>
                  <CardDescription>Manage and monitor all teachers on the platform</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search teachers..." className="pl-9 w-64" />
                  </div>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Users className="h-4 w-4 mr-2" />
                    Add Teacher
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Courses</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teachersData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No teachers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedTeachers.map((teacher, index) => (
                      <motion.tr
                        key={teacher.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="group"
                      >
                      <TableCell className="font-medium">{teacher.name}</TableCell>
                      <TableCell className="text-muted-foreground">{teacher.email}</TableCell>
                      <TableCell>{teacher.courses}</TableCell>
                      <TableCell>{teacher.students.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{teacher.rating}</span>
                          <span className="text-yellow-500">★</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={teacher.status === "active" ? "default" : "secondary"}
                          className={teacher.status === "active" ? "bg-primary" : ""}
                        >
                          {teacher.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{teacher.joined}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <UserCheck className="h-4 w-4 mr-2" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <BookOpen className="h-4 w-4 mr-2" />
                              View Courses
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <UserX className="h-4 w-4 mr-2" />
                              Suspend Account
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      </motion.tr>
                    ))
                  )}
                </TableBody>
              </Table>
              <PaginationControls
                currentPage={teachersPage}
                totalPages={teachersTotalPages}
                onPageChange={setTeachersPage}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Student Management</CardTitle>
                  <CardDescription>Manage and monitor all students on the platform</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search students..." className="pl-9 w-64" />
                  </div>
                  <Button variant="outline">Export Data</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Enrolled Courses</TableHead>
                    <TableHead>Avg. Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentsData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No students found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedStudents.map((student, index) => (
                    <motion.tr
                      key={student.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="group"
                    >
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell className="text-muted-foreground">{student.email}</TableCell>
                      <TableCell>{student.courses}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${student.progress}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{student.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={student.status === "active" ? "default" : "secondary"}
                          className={student.status === "active" ? "bg-primary" : ""}
                        >
                          {student.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{student.joined}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <UserCheck className="h-4 w-4 mr-2" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Message
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <BookOpen className="h-4 w-4 mr-2" />
                              View Enrollments
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <UserX className="h-4 w-4 mr-2" />
                              Suspend Account
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                    ))
                  )}
                </TableBody>
              </Table>
              <PaginationControls
                currentPage={studentsPage}
                totalPages={studentsTotalPages}
                onPageChange={setStudentsPage}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Course Management</CardTitle>
                  <CardDescription>Monitor and manage all courses on the platform</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search courses..." className="pl-9 w-64" />
                  </div>
                  <Button variant="outline">Export Data</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {coursesData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No Courses Found</p>
                  <p className="text-sm">There are no courses on the platform yet.</p>
                </div>
              ) : (
                <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Enrollments</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCourses.map((course, index) => (
                      <motion.tr
                        key={course.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="group"
                      >
                        <TableCell className="font-medium">{course.title}</TableCell>
                        <TableCell className="text-muted-foreground">{course.teacher.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{course.category || 'Uncategorized'}</Badge>
                        </TableCell>
                        <TableCell>${course.price}</TableCell>
                        <TableCell>{course.enrollments}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{course.rating.toFixed(1)}</span>
                            <span className="text-yellow-500">★</span>
                            <span className="text-xs text-muted-foreground">({course.totalRatings})</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={course.isActive ? "default" : "secondary"}
                            className={course.isActive ? "bg-primary" : ""}
                          >
                            {course.isActive ? 'active' : 'inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <BookOpen className="h-4 w-4 mr-2" />
                                View Course
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <UserCheck className="h-4 w-4 mr-2" />
                                View Teacher
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
                                <UserX className="h-4 w-4 mr-2" />
                                Deactivate Course
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
                <PaginationControls
                  currentPage={coursesPage}
                  totalPages={coursesTotalPages}
                  onPageChange={setCoursesPage}
                />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
