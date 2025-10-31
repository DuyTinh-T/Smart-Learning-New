"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Edit, Trash2, Eye, Users, Calendar, DollarSign, Search, Filter, Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { courseApi, handleApiError } from "@/lib/api/course-api"
import { EditCourseDialog } from "@/components/teacher/edit-course-dialog"
import { CourseDetailManagement } from "@/components/teacher/course-detail-management"
import { StudentCourseView } from "@/components/student/student-course-view"
import { useAuth } from "@/lib/auth-context"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Course {
  _id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  thumbnail?: string;
  price: number;
  visibility: 'public' | 'private';
  enrollmentCount: number;
  rating: number;
  totalRatings: number;
  totalLessons: number;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface CourseApiResponse {
  success: boolean;
  data: Course[];
  meta?: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  error?: string;
}

export function CourseManagement() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [editCourse, setEditCourse] = useState<Course | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  
  // View management states
  const [currentView, setCurrentView] = useState<'list' | 'detail' | 'student'>('list')
  const [selectedCourseId, setSelectedCourseId] = useState<string>('')
  
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    visibility: '',
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc'
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  })
  const { toast } = useToast()

  // Check if current user can edit/delete a course
  const canEditCourse = (course: Course) => {
    if (!user) return false
    
    // Admin can edit any course
    if (user.role === 'admin') return true
    
    // Creator can edit their own course
    return user._id === course.createdBy._id
  }

  // Load courses
  const loadCourses = async () => {
    try {
      setLoading(true)
      const response = await courseApi.getAll({
        page: pagination.page,
        limit: pagination.limit,
        q: filters.search || undefined,
        category: filters.category || undefined,
        visibility: filters.visibility || undefined,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      }) as CourseApiResponse

      if (response.success && response.data) {
        setCourses(response.data)
        if (response.meta) {
          setPagination(prev => ({
            ...prev,
            ...response.meta
          }))
        }
      } else {
        throw new Error(response.error || 'Failed to load courses')
      }
    } catch (error: any) {
      console.error('Error loading courses:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to load courses",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Delete course
  const deleteCourse = async (courseId: string, courseTitle: string) => {
    try {
      setDeleteLoading(courseId)
      console.log('Attempting to delete course:', courseId)
      
      const response = await courseApi.delete(courseId)
      console.log('Delete response:', response)

      if (response.success) {
        toast({
          title: "Thành công",
          description: `Đã xóa khóa học "${courseTitle}" thành công`,
        })
        
        // Remove the course from local state immediately
        setCourses(prevCourses => prevCourses.filter(course => course._id !== courseId))
        
        // Also reload courses to ensure consistency
        setTimeout(() => {
          loadCourses()
        }, 500)
      } else {
        console.error('Delete failed:', response.error, response)
        
        // Handle specific API error responses
        const errorMessage = response.error || 'Failed to delete course'
        
        if (errorMessage.includes('Access denied') || errorMessage.includes('You can only delete your own courses')) {
          toast({
            title: "Không có quyền truy cập",
            description: "Bạn chỉ có thể xóa các khóa học do mình tạo ra.",
            variant: "destructive",
          })
          setDeleteLoading(null)
          return
        } else if (errorMessage.includes('Authentication required')) {
          toast({
            title: "Yêu cầu đăng nhập",
            description: "Vui lòng đăng nhập để xóa khóa học.",
            variant: "destructive",
          })
          setDeleteLoading(null)
          return
        } else if (errorMessage.includes('Course not found')) {
          toast({
            title: "Không tìm thấy khóa học",
            description: "Khóa học bạn muốn xóa không còn tồn tại.",
            variant: "destructive",
          })
          setDeleteLoading(null)
          return
        } else {
          throw new Error(errorMessage)
        }
      }
    } catch (error: any) {
      console.error('Error deleting course:', error)
      
      // Check for specific error messages and show appropriate toast
      if (error.message && (error.message.includes('Access denied') || error.message.includes('You can only delete your own courses'))) {
        toast({
          title: "Không có quyền truy cập",
          description: "Bạn chỉ có thể xóa các khóa học do mình tạo ra.",
          variant: "destructive",
        })
      } else if (error.message && error.message.includes('Authentication required')) {
        toast({
          title: "Yêu cầu đăng nhập",
          description: "Vui lòng đăng nhập để xóa khóa học.",
          variant: "destructive",
        })
      } else if (error.message && error.message.includes('Course not found')) {
        toast({
          title: "Không tìm thấy khóa học",
          description: "Khóa học bạn muốn xóa không còn tồn tại.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Xóa thất bại",
          description: error.message || "Không thể xóa khóa học. Vui lòng thử lại.",
          variant: "destructive",
        })
      }
    } finally {
      setDeleteLoading(null)
    }
  }

  // Handle edit course
  const handleEditCourse = (course: Course) => {
    setEditCourse(course)
    setEditDialogOpen(true)
  }

  // Handle edit success
  const handleEditSuccess = () => {
    loadCourses() // Reload courses to show updated data
    setEditCourse(null)
    setEditDialogOpen(false)
  }

  // Handle view course content management
  const handleManageContent = (courseId: string) => {
    setSelectedCourseId(courseId)
    setCurrentView('detail')
  }

  // Handle view course as student
  const handleViewCourse = (courseId: string) => {
    setSelectedCourseId(courseId)
    setCurrentView('student')
  }

  // Handle back to course list
  const handleBackToList = () => {
    setCurrentView('list')
    setSelectedCourseId('')
    loadCourses() // Refresh the list in case there were changes
  }

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }

  // Apply filters (debounced search)
  useEffect(() => {
    const timer = setTimeout(() => {
      loadCourses()
    }, 500)

    return () => clearTimeout(timer)
  }, [filters, pagination.page])

  // Initial load
  useEffect(() => {
    loadCourses()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatPrice = (price: number) => {
    return price === 0 ? 'Free' : `$${price.toFixed(2)}`
  }

  // Render course detail management view
  if (currentView === 'detail' && selectedCourseId) {
    return (
      <CourseDetailManagement 
        courseId={selectedCourseId}
        onBack={handleBackToList}
      />
    )
  }

  // Render student course view
  if (currentView === 'student' && selectedCourseId) {
    return (
      <StudentCourseView 
        courseId={selectedCourseId}
        onBack={handleBackToList}
      />
    )
  }

  // Render course list view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Course Management</h2>
          <p className="text-muted-foreground">Manage your courses and track their performance</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={filters.category || "all"} onValueChange={(value) => handleFilterChange('category', value === 'all' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  <SelectItem value="programming">Programming</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="data-science">Data Science</SelectItem>
                  <SelectItem value="web-development">Web Development</SelectItem>
                  <SelectItem value="mobile-development">Mobile Development</SelectItem>
                  <SelectItem value="artificial-intelligence">Artificial Intelligence</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select value={filters.visibility || "all"} onValueChange={(value) => handleFilterChange('visibility', value === 'all' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sort by</Label>
              <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Date Created</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="enrollmentCount">Enrollments</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Courses Grid */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground text-lg">No courses found</p>
            <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters or create a new course</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card key={course._id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <CardTitle className="line-clamp-2 text-lg">{course.title}</CardTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={course.visibility === 'public' ? 'default' : 'secondary'}>
                        {course.visibility}
                      </Badge>
                      <Badge variant="outline">{course.category}</Badge>
                      {canEditCourse(course) && user?._id === course.createdBy._id && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Your Course
                        </Badge>
                      )}
                      {user?.role === 'admin' && user._id !== course.createdBy._id && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          Admin Access
                        </Badge>
                      )}
                    </div>
                  </div>
                  {course.thumbnail && (
                    <img 
                      src={course.thumbnail} 
                      alt={course.title}
                      className="w-16 h-16 object-cover rounded-lg ml-4"
                    />
                  )}
                </div>
                <CardDescription className="line-clamp-3">
                  {course.description}
                </CardDescription>
                <div className="text-xs text-muted-foreground mt-2">
                  Created by: {course.createdBy.name}
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {course.enrollmentCount} enrolled
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {formatPrice(course.price)}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(course.createdAt)}
                    </div>
                    <div>
                      {course.totalLessons || 0} lessons
                    </div>
                  </div>

                  {course.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {course.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {course.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{course.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter>
                <div className="flex w-full gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleViewCourse(course._id)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  
                  {/* Show Manage Content button if user can edit this course */}
                  {canEditCourse(course) && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleManageContent(course._id)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Content
                    </Button>
                  )}
                  
                  {/* Only show Edit button if user can edit this course */}
                  {canEditCourse(course) && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleEditCourse(course)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                  
                  {/* Only show Delete button if user can delete this course */}
                  {canEditCourse(course) && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-destructive hover:text-destructive"
                          disabled={deleteLoading === course._id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Course</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{course.title}"? This action cannot be undone.
                          All lessons and modules will also be deleted.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteCourse(course._id, course.title)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              {pagination.hasPreviousPage && (
                <PaginationItem>
                  <PaginationPrevious 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault()
                      handlePageChange(pagination.page - 1)
                    }}
                  />
                </PaginationItem>
              )}
              
              {[...Array(pagination.totalPages)].map((_, i) => {
                const page = i + 1
                const isCurrentPage = page === pagination.page
                const showPage = page === 1 || page === pagination.totalPages || 
                  (page >= pagination.page - 1 && page <= pagination.page + 1)
                
                if (!showPage) {
                  if (page === 2 && pagination.page > 4) {
                    return <PaginationItem key={page}>...</PaginationItem>
                  }
                  if (page === pagination.totalPages - 1 && pagination.page < pagination.totalPages - 3) {
                    return <PaginationItem key={page}>...</PaginationItem>
                  }
                  return null
                }
                
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      isActive={isCurrentPage}
                      onClick={(e) => {
                        e.preventDefault()
                        handlePageChange(page)
                      }}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              })}
              
              {pagination.hasNextPage && (
                <PaginationItem>
                  <PaginationNext 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault()
                      handlePageChange(pagination.page + 1)
                    }}
                  />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Results Info */}
      <div className="text-center text-sm text-muted-foreground">
        Showing {courses.length} of {pagination.totalCount} courses
      </div>

      {/* Edit Course Dialog */}
      <EditCourseDialog
        course={editCourse}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={handleEditSuccess}
      />
    </div>
  )
}