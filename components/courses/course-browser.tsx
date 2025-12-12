"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search, 
  Filter, 
  Clock, 
  Users, 
  Star, 
  BookOpen, 
  Loader2, 
  AlertCircle,
  Heart,
  PlayCircle,
  Award
} from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { courseApi, enrollmentApi } from "@/lib/api/course-api"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"

interface Course {
  _id: string
  title: string
  description: string
  instructor: string
  thumbnail?: string
  level: string
  duration?: string
  price: number
  rating?: number
  reviews?: number
  students?: number
  category: string
  tags: string[]
  createdAt: string
  modules?: any[]
}

const categories = [
  "Tất cả danh mục",
  "Lập trình", 
  "Thiết kế",
  "Kinh doanh",
  "Marketing",
  "Khoa học dữ liệu",
  "Nhiếp ảnh",
  "Âm nhạc",
  "Ngôn ngữ"
]

const levels = [
  "Tất cả cấp độ",
  "Mới bắt đầu",
  "Trung bình",
  "Nâng cao",
]

const sortOptions = [
  { value: "newest", label: "Mới nhất" },
  { value: "oldest", label: "Cũ nhất" },
  { value: "rating", label: "Đánh giá cao nhất" },
  { value: "students", label: "Phổ biến nhất" },
  { value: "price_low", label: "Giá: Thấp đến cao" },
  { value: "price_high", label: "Giá: Cao đến thấp" }
]

export function CourseBrowser() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [enrollingCourses, setEnrollingCourses] = useState<Set<string>>(new Set())

  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Tất cả danh mục")
  const [selectedLevel, setSelectedLevel] = useState("Tất cả cấp độ")
  const [sortBy, setSortBy] = useState("newest")
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000])

  // Load courses and enrolled courses
  useEffect(() => {
    loadCourses()
    if (user?.role === 'student') {
      loadEnrolledCourses()
    }
  }, [user])

  const loadCourses = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await courseApi.getAll({
        category: selectedCategory !== "Tất cả danh mục" ? selectedCategory : undefined,
        sortBy: sortBy === "newest" ? "createdAt" : sortBy,
        sortOrder: sortBy === "oldest" ? "asc" : "desc",
        page: 1,
        limit: 50
      })

      if (response.success && response.data) {
        setCourses(response.data.courses || [])
      } else {
        throw new Error(response.error || 'Failed to load courses')
      }
    } catch (err) {
      console.error('Failed to load courses:', err)
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

  const loadEnrolledCourses = async () => {
    try {
      const response = await enrollmentApi.getAll()
      if (response.success && response.data) {
        const enrolledIds = new Set<string>(
          response.data.enrollments?.map((enrollment: any) => 
            String(enrollment.course._id || enrollment.course.id)
          ) || []
        )
        setEnrolledCourseIds(enrolledIds)
      }
    } catch (error) {
      console.warn('Could not load enrolled courses:', error)
    }
  }

  // Apply filters
  useEffect(() => {
    let filtered = [...courses]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Category filter
    if (selectedCategory !== "Tất cả danh mục") {
      filtered = filtered.filter(course => course.category === selectedCategory)
    }

    // Level filter
    if (selectedLevel !== "Tất cả cấp độ") {
      filtered = filtered.filter(course => course.level === selectedLevel)
    }

    // Price range filter
    filtered = filtered.filter(course => 
      course.price >= priceRange[0] && course.price <= priceRange[1]
    )

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case "rating":
          return (b.rating || 0) - (a.rating || 0)
        case "students":
          return (b.students || 0) - (a.students || 0)
        case "price_low":
          return a.price - b.price
        case "price_high":
          return b.price - a.price
        default:
          return 0
      }
    })

    setFilteredCourses(filtered)
  }, [courses, searchTerm, selectedCategory, selectedLevel, sortBy, priceRange])

  const handleEnroll = async (courseId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to enroll in courses.",
        variant: "destructive"
      })
      return
    }

    if (user.role !== 'student') {
      toast({
        title: "Access Denied",
        description: "Only students can enroll in courses.",
        variant: "destructive"
      })
      return
    }

    setEnrollingCourses(prev => new Set([...prev, courseId]))

    try {
      const response = await enrollmentApi.enroll(courseId)
      
      if (response.success) {
        setEnrolledCourseIds(prev => new Set([...prev, courseId]))
        toast({
          title: "Đăng ký thành công!",
          description: "Bạn đã đăng ký khóa học này. Bắt đầu học ngay!",
        })
      } else {
        throw new Error(response.error || 'Enrollment failed')
      }
    } catch (error) {
      console.error('Enrollment error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to enroll'
      toast({
        title: "Enrollment Failed",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setEnrollingCourses(prev => {
        const next = new Set(prev)
        next.delete(courseId)
        return next
      })
    }
  }

  const resetFilters = () => {
    setSearchTerm("")
    setSelectedCategory("Tất cả danh mục")
    setSelectedLevel("Tất cả cấp độ")
    setSortBy("newest")
    setPriceRange([0, 1000])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Khám phá các <span className="text-primary">Khóa học</span> Tuyệt vời
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Learn new skills, advance your career, and achieve your goals with our comprehensive course catalog.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Tìm kiếm khóa học, giảng viên hoặc chủ đề..."
                  className="pl-12 pr-4 py-6 text-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  {levels.map(level => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={resetFilters}>
                <Filter className="h-4 w-4 mr-2" />
                Reset Filters
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} found
            </div>
          </div>
        </div>
      </section>

      {/* Course Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="flex items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-lg">Đang tải khóa học...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Không thể tải khóa học</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={loadCourses}>
                Try Again
              </Button>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Không tìm thấy khóa học nào</h3>
              <p className="text-muted-foreground mb-4">
                Thử điều chỉnh tiêu chí tìm kiếm hoặc bộ lọc
              </p>
              <Button onClick={resetFilters}>
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredCourses.map((course, index) => {
                const isEnrolled = enrolledCourseIds.has(course._id)
                const isEnrolling = enrollingCourses.has(course._id)
                
                return (
                  <motion.div
                    key={course._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    whileHover={{ y: -4 }}
                  >
                    <Card className="h-full flex flex-col overflow-hidden transition-shadow hover:shadow-lg group">
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={course.thumbnail || "/placeholder.svg"}
                          alt={course.title}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                        />
                        <div className="absolute top-4 left-4">
                          <Badge className="bg-accent text-accent-foreground">
                            {course.level}
                          </Badge>
                        </div>
                        <div className="absolute top-4 right-4">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="p-2 h-8 w-8"
                            onClick={(e) => {
                              e.preventDefault()
                              // Add to wishlist functionality
                            }}
                          >
                            <Heart className="h-3 w-3" />
                          </Button>
                        </div>
                        {isEnrolled && (
                          <div className="absolute bottom-4 right-4">
                            <Badge className="bg-primary text-primary-foreground">
                              Enrolled
                            </Badge>
                          </div>
                        )}
                      </div>

                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                          {course.title}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          by {course.instructor}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="flex-1 pb-4">
                        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                          {course.description}
                        </p>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              {course.rating && (
                                <>
                                  <Star className="h-4 w-4 fill-accent text-accent" />
                                  <span className="font-medium">{course.rating}</span>
                                  <span className="text-muted-foreground">
                                    ({course.reviews || 0})
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>{course.students?.toLocaleString() || '0'}</span>
                            </div>
                            {course.duration && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{course.duration}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-1">
                            {course.tags.slice(0, 3).map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>

                      <div className="p-6 pt-0 mt-auto">
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-2xl font-bold">
                            {course.price === 0 ? 'Free' : `$${course.price}`}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          {isEnrolled ? (
                            <>
                              <Button className="w-full" asChild>
                                <Link href={`/student/courses/${course._id}`}>
                                  <PlayCircle className="h-4 w-4 mr-2" />
                                  Tiếp tục học
                                </Link>
                              </Button>
                              <Button variant="outline" className="w-full" asChild>
                                <Link href={`/courses/${course._id}`}>
                                  View Details
                                </Link>
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button 
                                className="w-full"
                                onClick={() => handleEnroll(course._id)}
                                disabled={isEnrolling}
                              >
                                {isEnrolling ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Enrolling...
                                  </>
                                ) : (
                                  <>
                                    <BookOpen className="h-4 w-4 mr-2" />
                                    Enroll Now
                                  </>
                                )}
                              </Button>
                              <Button variant="outline" className="w-full" asChild>
                                <Link href={`/courses/${course._id}`}>
                                  View Details
                                </Link>
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}