"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Filter, Star, Users, Clock, BookOpen, Loader2, AlertCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { courseApi, enrollmentApi } from "@/lib/api/course-api"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"

interface Course {
  _id: string
  title: string
  description: string
  instructor?: string
  category: string
  tags: string[]
  thumbnail?: string
  price: number
  rating: number
  enrollmentCount: number
  duration?: string
  level?: string
  isActive: boolean
  createdBy?: {
    name: string
    email: string
  }
}

interface CoursesData {
  courses: Course[]
  meta: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export default function CourseBrowser() {
  const [coursesData, setCoursesData] = useState<CoursesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("createdAt")
  const [currentPage, setCurrentPage] = useState(1)
  const [enrollingCourses, setEnrollingCourses] = useState<Set<string>>(new Set())
  
  const { toast } = useToast()
  const { user } = useAuth()

  // Categories for filtering
  const categories = [
    "all",
    "programming", 
    "design",
    "business",
    "marketing", 
    "data-science",
    "frontend",
    "backend",
    "mobile",
    "devops"
  ]

  useEffect(() => {
    loadCourses()
  }, [searchQuery, selectedCategory, sortBy, currentPage])

  const loadCourses = async () => {
    try {
      setLoading(true)
      setError(null)

      const params: any = {
        page: currentPage,
        limit: 12,
        sortBy,
        sortOrder: 'desc'
      }

      if (searchQuery.trim()) {
        params.q = searchQuery.trim()
      }

      if (selectedCategory && selectedCategory !== "all") {
        params.category = selectedCategory
      }

      const response = await courseApi.getAll(params)
      
      if (response.success) {
        // API returns { success: true, data: [...courses], meta: {...} }
        // Since apiCall returns the full response, we can access both data and meta at the same level
        const courses = response.data as any
        const meta = (response as any).meta
        
        if (courses && meta) {
          setCoursesData({
            courses: Array.isArray(courses) ? courses : [],
            meta: meta
          })
        } else if (Array.isArray(courses)) {
          // Fallback if meta is missing
          setCoursesData({
            courses: courses,
            meta: {
              page: currentPage,
              limit: 12,
              totalCount: courses.length,
              totalPages: Math.ceil(courses.length / 12),
              hasNextPage: false,
              hasPreviousPage: false
            }
          })
        } else {
          throw new Error('Invalid response structure')
        }
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

    try {
      setEnrollingCourses(prev => new Set(prev).add(courseId))
      
      const response = await enrollmentApi.enroll(courseId)
      
      if (response.success) {
        toast({
          title: "Enrollment Successful!",
          description: "You have been enrolled in this course. Check your dashboard to start learning.",
        })
      } else {
        throw new Error(response.error || 'Enrollment failed')
      }
    } catch (error) {
      console.error('Enrollment error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to enroll in course'
      toast({
        title: "Enrollment Failed",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setEnrollingCourses(prev => {
        const newSet = new Set(prev)
        newSet.delete(courseId)
        return newSet
      })
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    loadCourses()
  }

  const formatPrice = (price: number) => {
    if (price === 0) return "Free"
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  const getCategoryDisplayName = (category: string) => {
    const categoryMap: Record<string, string> = {
      'all': 'All Categories',
      'programming': 'Programming',
      'design': 'Design',
      'business': 'Business',
      'marketing': 'Marketing',
      'data-science': 'Data Science',
      'frontend': 'Frontend',
      'backend': 'Backend',
      'mobile': 'Mobile Development',
      'devops': 'DevOps'
    }
    return categoryMap[category] || category
  }

  if (loading && !coursesData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg">Loading courses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Header */}
      <section className="py-12 bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold mb-4">Khám phá các khóa học</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Khám phá hàng ngàn khóa học từ các giảng viên chuyên gia và nâng cao kỹ năng của bạn.
            </p>
            
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search courses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </form>
              
              <div className="flex gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {getCategoryDisplayName(category)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">Newest</SelectItem>
                    <SelectItem value="title">Title A-Z</SelectItem>
                    <SelectItem value="price">Price Low to High</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="enrollmentCount">Most Popular</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {error ? (
            <div className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Error Loading Courses</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={loadCourses}>Try Again</Button>
            </div>
          ) : !coursesData?.courses?.length ? (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h2 className="text-2xl font-bold mb-2">No Courses Found</h2>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search criteria or filters
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery("")
                  setSelectedCategory("all")
                  setCurrentPage(1)
                }}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <>
              {/* Results Info */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-muted-foreground">
                  Showing {((coursesData.meta.page - 1) * coursesData.meta.limit) + 1} - {Math.min(coursesData.meta.page * coursesData.meta.limit, coursesData.meta.totalCount)} of {coursesData.meta.totalCount} courses
                </p>
                {loading && (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading...</span>
                  </div>
                )}
              </div>

              {/* Courses Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence>
                  {coursesData.courses.map((course, index) => (
                    <motion.div
                      key={course._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Card className="h-full flex flex-col overflow-hidden hover:shadow-lg transition-all duration-300 group">
                        <div className="aspect-video overflow-hidden">
                          <img
                            src={course.thumbnail || "/placeholder.svg"}
                            alt={course.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                        
                        <CardHeader className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {getCategoryDisplayName(course.category)}
                            </Badge>
                            <span className="text-sm font-bold text-primary">
                              {formatPrice(course.price)}
                            </span>
                          </div>
                          
                          <CardTitle className="text-lg leading-tight line-clamp-2">
                            {course.title}
                          </CardTitle>
                          
                          <CardDescription className="line-clamp-3 flex-1">
                            {course.description}
                          </CardDescription>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span>{course.rating.toFixed(1)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>{course.enrollmentCount}</span>
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground">
                            By {course.createdBy?.name || 'Unknown Instructor'}
                          </p>
                        </CardHeader>
                        
                        <CardContent className="pt-0">
                          <div className="flex gap-2">
                            <Button variant="outline" className="flex-1" asChild>
                              <Link href={`/courses/${course._id}`}>
                                View Details
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Pagination */}
              {coursesData.meta.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={!coursesData.meta.hasPreviousPage || loading}
                  >
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(7, coursesData.meta.totalPages) }, (_, i) => {
                      const totalPages = coursesData.meta.totalPages
                      const currentPage = coursesData.meta.page
                      
                      // Show first page, last page, current page and 2 pages around current
                      let page: number
                      if (totalPages <= 7) {
                        page = i + 1
                      } else {
                        if (i === 0) {
                          page = 1
                        } else if (i === 6) {
                          page = totalPages
                        } else if (currentPage <= 3) {
                          page = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          page = totalPages - 6 + i
                        } else {
                          page = currentPage - 3 + i
                        }
                      }
                      
                      // Show ellipsis
                      const showEllipsis = (
                        (i === 1 && page > 2) || 
                        (i === 5 && page < totalPages - 1)
                      )
                      
                      if (showEllipsis) {
                        return (
                          <span key={`ellipsis-${i}`} className="px-2">
                            ...
                          </span>
                        )
                      }
                      
                      return (
                        <Button
                          key={page}
                          variant={page === currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          disabled={loading}
                        >
                          {page}
                        </Button>
                      )
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(coursesData.meta.totalPages, prev + 1))}
                    disabled={!coursesData.meta.hasNextPage || loading}
                  >
                    Next
                  </Button>
                  
                  <span className="ml-4 text-sm text-muted-foreground">
                    Page {coursesData.meta.page} of {coursesData.meta.totalPages}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}