"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Edit, 
  Trash2, 
  PlayCircle, 
  FileText, 
  Video, 
  PenTool,
  ArrowLeft,
  GraduationCap,
  Clock,
  Users,
  ChevronDown,
  ChevronRight
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { courseApi, moduleApi, lessonApi, handleApiError } from "@/lib/api/course-api"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/auth-context"

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
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  modules?: Module[];
  createdAt: string;
}

interface Module {
  _id: string;
  title: string;
  description?: string;
  order: number;
  lessons?: Lesson[];
}

interface Lesson {
  _id: string;
  title: string;
  type: 'text' | 'video' | 'quiz' | 'project';
  content?: string;
  resources?: string[];
  duration?: number;
  order: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

interface CourseDetailManagementProps {
  courseId: string;
  onBack: () => void;
}

export function CourseDetailManagement({ courseId, onBack }: CourseDetailManagementProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  
  // Module dialog states
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false)
  const [editingModule, setEditingModule] = useState<Module | null>(null)
  const [moduleFormData, setModuleFormData] = useState({
    title: '',
    description: ''
  })
  
  // Lesson dialog states
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [selectedModuleId, setSelectedModuleId] = useState<string>('')
  const [lessonFormData, setLessonFormData] = useState({
    title: '',
    type: 'text' as 'text' | 'video' | 'quiz' | 'project',
    content: '',
    duration: 0,
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced'
  })

  // Check if current user can edit this course
  const canEditCourse = () => {
    if (!user || !course) return false
    return user.role === 'admin' || user._id === course.createdBy._id
  }

  // Load course details
  const loadCourse = async () => {
    try {
      setLoading(true)
      const response = await courseApi.getById(courseId)
      
      if (response.success && response.data) {
        setCourse(response.data)
      } else {
        throw new Error(response.error || 'Failed to load course')
      }
    } catch (error: any) {
      console.error('Error loading course:', error)
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải thông tin khóa học",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Toggle module expansion
  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules)
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId)
    } else {
      newExpanded.add(moduleId)
    }
    setExpandedModules(newExpanded)
  }

  // Module handlers
  const openModuleDialog = (module?: Module) => {
    if (module) {
      setEditingModule(module)
      setModuleFormData({
        title: module.title,
        description: module.description || ''
      })
    } else {
      setEditingModule(null)
      setModuleFormData({
        title: '',
        description: ''
      })
    }
    setModuleDialogOpen(true)
  }

  const handleModuleSubmit = async () => {
    if (!moduleFormData.title.trim()) {
      toast({
        title: "Lỗi xác thực",
        description: "Vui lòng nhập tiêu đề module",
        variant: "destructive",
      })
      return
    }

    try {
      if (editingModule) {
        // Update existing module - would need API endpoint
        toast({
          title: "Thông báo",
          description: "Chức năng cập nhật module sẽ được thêm vào sau",
          variant: "default",
        })
      } else {
        // Create new module
        const response = await courseApi.addModule(courseId, {
          title: moduleFormData.title,
          order: course?.modules?.length || 0
        })

        if (response.success) {
          toast({
            title: "Thành công!",
            description: "Đã tạo module mới",
          })
          loadCourse() // Reload to get updated data
        } else {
          throw new Error(response.error || 'Failed to create module')
        }
      }
      
      setModuleDialogOpen(false)
    } catch (error: any) {
      console.error('Error saving module:', error)
      toast({
        title: "Lỗi",
        description: error.message || "Không thể lưu module",
        variant: "destructive",
      })
    }
  }

  // Lesson handlers
  const openLessonDialog = (moduleId: string, lesson?: Lesson) => {
    setSelectedModuleId(moduleId)
    
    if (lesson) {
      setEditingLesson(lesson)
      setLessonFormData({
        title: lesson.title,
        type: lesson.type,
        content: lesson.content || '',
        duration: lesson.duration || 0,
        difficulty: lesson.difficulty || 'beginner'
      })
    } else {
      setEditingLesson(null)
      setLessonFormData({
        title: '',
        type: 'text',
        content: '',
        duration: 0,
        difficulty: 'beginner'
      })
    }
    setLessonDialogOpen(true)
  }

  const handleLessonSubmit = async () => {
    if (!lessonFormData.title.trim()) {
      toast({
        title: "Lỗi xác thực",
        description: "Vui lòng nhập tiêu đề bài học",
        variant: "destructive",
      })
      return
    }

    try {
      if (editingLesson) {
        // Update existing lesson
        const response = await lessonApi.update(editingLesson._id, lessonFormData)
        
        if (response.success) {
          toast({
            title: "Thành công!",
            description: "Đã cập nhật bài học",
          })
          loadCourse()
        } else {
          throw new Error(response.error || 'Failed to update lesson')
        }
      } else {
        // Create new lesson
        const selectedModule = course?.modules?.find(m => m._id === selectedModuleId)
        const response = await moduleApi.addLesson(selectedModuleId, {
          ...lessonFormData,
          order: selectedModule?.lessons?.length || 0
        })

        if (response.success) {
          toast({
            title: "Thành công!",
            description: "Đã tạo bài học mới",
          })
          loadCourse()
        } else {
          throw new Error(response.error || 'Failed to create lesson')
        }
      }
      
      setLessonDialogOpen(false)
    } catch (error: any) {
      console.error('Error saving lesson:', error)
      toast({
        title: "Lỗi",
        description: error.message || "Không thể lưu bài học",
        variant: "destructive",
      })
    }
  }

  // Delete handlers
  const deleteLesson = async (lessonId: string, lessonTitle: string) => {
    try {
      const response = await lessonApi.delete(lessonId)
      
      if (response.success) {
        toast({
          title: "Thành công",
          description: `Đã xóa bài học "${lessonTitle}"`,
        })
        loadCourse()
      } else {
        throw new Error(response.error || 'Failed to delete lesson')
      }
    } catch (error: any) {
      console.error('Error deleting lesson:', error)
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa bài học",
        variant: "destructive",
      })
    }
  }

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />
      case 'quiz': return <PenTool className="h-4 w-4" />
      case 'project': return <GraduationCap className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  useEffect(() => {
    loadCourse()
  }, [courseId])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Không tìm thấy khóa học</p>
        <Button onClick={onBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{course.title}</h1>
          <p className="text-muted-foreground">Quản lý nội dung khóa học</p>
        </div>
      </div>

      {/* Course Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{course.title}</CardTitle>
              <CardDescription className="mt-2">{course.description}</CardDescription>
              <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {course.enrollmentCount} học viên
                </div>
                <div className="flex items-center gap-1">
                  <GraduationCap className="h-4 w-4" />
                  {course.modules?.length || 0} modules
                </div>
              </div>
            </div>
            {course.thumbnail && (
              <img 
                src={course.thumbnail} 
                alt={course.title}
                className="w-24 h-24 object-cover rounded-lg"
              />
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Modules Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Modules & Lessons</CardTitle>
              <CardDescription>Quản lý nội dung khóa học của bạn</CardDescription>
            </div>
            {canEditCourse() && (
              <Button onClick={() => openModuleDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Thêm Module
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {course.modules && course.modules.length > 0 ? (
            course.modules.map((module, index) => (
              <Card key={module._id} className="border-l-4 border-l-blue-500">
                <Collapsible
                  open={expandedModules.has(module._id)}
                  onOpenChange={() => toggleModule(module._id)}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {expandedModules.has(module._id) ? 
                            <ChevronDown className="h-4 w-4" /> : 
                            <ChevronRight className="h-4 w-4" />
                          }
                          <div>
                            <CardTitle className="text-lg">
                              Module {index + 1}: {module.title}
                            </CardTitle>
                            {module.description && (
                              <CardDescription>{module.description}</CardDescription>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {module.lessons?.length || 0} bài học
                          </Badge>
                          {canEditCourse() && (
                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openModuleDialog(module)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openLessonDialog(module._id)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      {module.lessons && module.lessons.length > 0 ? (
                        <div className="space-y-2">
                          {module.lessons.map((lesson, lessonIndex) => (
                            <div 
                              key={lesson._id}
                              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                            >
                              <div className="flex items-center gap-3">
                                {getLessonIcon(lesson.type)}
                                <div>
                                  <div className="font-medium">
                                    Bài {lessonIndex + 1}: {lesson.title}
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Badge variant="outline" className="text-xs">
                                      {lesson.type}
                                    </Badge>
                                    {lesson.difficulty && (
                                      <Badge 
                                        variant="secondary" 
                                        className={`text-xs ${getDifficultyColor(lesson.difficulty)}`}
                                      >
                                        {lesson.difficulty}
                                      </Badge>
                                    )}
                                    {lesson.duration && (
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {lesson.duration}p
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {canEditCourse() && (
                                <div className="flex gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openLessonDialog(module._id, lesson)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => deleteLesson(lesson._id, lesson.title)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>Chưa có bài học nào trong module này</p>
                          {canEditCourse() && (
                            <Button
                              variant="outline"
                              className="mt-2"
                              onClick={() => openLessonDialog(module._id)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Thêm bài học đầu tiên
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <GraduationCap className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Chưa có module nào</h3>
              <p className="text-muted-foreground mb-4">
                Bắt đầu tạo module đầu tiên để xây dựng nội dung khóa học
              </p>
              {canEditCourse() && (
                <Button onClick={() => openModuleDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo Module Đầu Tiên
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Module Dialog */}
      <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingModule ? 'Chỉnh Sửa Module' : 'Tạo Module Mới'}
            </DialogTitle>
            <DialogDescription>
              {editingModule ? 'Cập nhật thông tin module' : 'Thêm module mới vào khóa học'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="module-title">Tiêu đề Module *</Label>
              <Input
                id="module-title"
                value={moduleFormData.title}
                onChange={(e) => setModuleFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="VD: Giới thiệu về React"
              />
            </div>
            
            <div>
              <Label htmlFor="module-description">Mô tả (tùy chọn)</Label>
              <Textarea
                id="module-description"
                value={moduleFormData.description}
                onChange={(e) => setModuleFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Mô tả ngắn về nội dung module này..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setModuleDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleModuleSubmit}>
              {editingModule ? 'Cập Nhật' : 'Tạo Module'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingLesson ? 'Chỉnh Sửa Bài Học' : 'Tạo Bài Học Mới'}
            </DialogTitle>
            <DialogDescription>
              {editingLesson ? 'Cập nhật nội dung bài học' : 'Thêm bài học mới vào module'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="lesson-title">Tiêu đề Bài Học *</Label>
              <Input
                id="lesson-title"
                value={lessonFormData.title}
                onChange={(e) => setLessonFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="VD: JSX và Components"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lesson-type">Loại Bài Học</Label>
                <select
                  id="lesson-type"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={lessonFormData.type}
                  onChange={(e) => setLessonFormData(prev => ({ 
                    ...prev, 
                    type: e.target.value as 'text' | 'video' | 'quiz' | 'project'
                  }))}
                >
                  <option value="text">Văn bản</option>
                  <option value="video">Video</option>
                  <option value="quiz">Quiz</option>
                  <option value="project">Dự án</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="lesson-difficulty">Độ Khó</Label>
                <select
                  id="lesson-difficulty"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={lessonFormData.difficulty}
                  onChange={(e) => setLessonFormData(prev => ({ 
                    ...prev, 
                    difficulty: e.target.value as 'beginner' | 'intermediate' | 'advanced'
                  }))}
                >
                  <option value="beginner">Cơ bản</option>
                  <option value="intermediate">Trung bình</option>
                  <option value="advanced">Nâng cao</option>
                </select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="lesson-duration">Thời lượng (phút)</Label>
              <Input
                id="lesson-duration"
                type="number"
                value={lessonFormData.duration}
                onChange={(e) => setLessonFormData(prev => ({ 
                  ...prev, 
                  duration: parseInt(e.target.value) || 0 
                }))}
                placeholder="30"
                min="0"
              />
            </div>
            
            <div>
              <Label htmlFor="lesson-content">Nội dung</Label>
              <Textarea
                id="lesson-content"
                value={lessonFormData.content}
                onChange={(e) => setLessonFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Nội dung chi tiết của bài học..."
                rows={6}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setLessonDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleLessonSubmit}>
              {editingLesson ? 'Cập Nhật' : 'Tạo Bài Học'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}