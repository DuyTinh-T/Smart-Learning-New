"use client"

import React, { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
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
  ChevronRight,
  Sparkles,
  Loader2
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
import { QuizView } from "@/components/quiz/quiz-view"
import { TeacherProjectSubmissions } from "@/components/teacher/teacher-project-submissions"
import { ProjectSubmissionView } from "@/components/project/project-submission-view"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
  videoUrl?: string;
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
  
  // Preview states
  const [previewingLesson, setPreviewingLesson] = useState<Lesson | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  // Helper functions for video URLs
  const getYouTubeEmbedUrl = (url: string): string => {
    // Extract video ID from various YouTube URL formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    const videoId = match && match[2].length === 11 ? match[2] : null
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url
  }

  const getVimeoEmbedUrl = (url: string): string => {
    // Extract video ID from Vimeo URL
    const regExp = /(?:vimeo)\.com.*(?:videos|video|channels|)\/([\d]+)/i
    const match = url.match(regExp)
    const videoId = match ? match[1] : null
    return videoId ? `https://player.vimeo.com/video/${videoId}` : url
  }
  
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
  const [aiLessonLoading, setAiLessonLoading] = useState(false)
  const [lessonActiveTab, setLessonActiveTab] = useState("manual")
  const [aiLessonTopic, setAiLessonTopic] = useState("")
  const [aiLessonConfig, setAiLessonConfig] = useState({
    difficulty: 'intermediate' as 'beginner' | 'intermediate' | 'advanced',
    type: 'text' as 'text' | 'video' | 'quiz' | 'project'
  })
  const [lessonFormData, setLessonFormData] = useState({
    title: '',
    type: 'text' as 'text' | 'video' | 'quiz' | 'project',
    content: '',
    videoUrl: '',
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
        videoUrl: lesson.videoUrl || '',
        duration: lesson.duration || 0,
        difficulty: lesson.difficulty || 'beginner'
      })
      setLessonActiveTab("manual")
    } else {
      setEditingLesson(null)
      setLessonFormData({
        title: '',
        type: 'text',
        content: '',
        videoUrl: '',
        duration: 0,
        difficulty: 'beginner'
      })
      setLessonActiveTab("manual")
      setAiLessonTopic("")
      setAiLessonConfig({
        difficulty: 'intermediate',
        type: 'text'
      })
    }
    setLessonDialogOpen(true)
  }

  const generateLessonWithAI = async () => {
    if (!aiLessonTopic.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập chủ đề bài học",
        variant: "destructive",
      })
      return
    }

    setAiLessonLoading(true)
    try {
      // Build context-rich topic
      let contextTopic = aiLessonTopic
      if (course) {
        contextTopic = `${course.title} - ${aiLessonTopic}`
      }

      // Build custom prompt based on lesson type
      let customPrompt = contextTopic
      if (aiLessonConfig.type === 'project') {
        customPrompt = `Tạo đề bài tập thực hành về: ${contextTopic}. Yêu cầu: Mô tả mục tiêu, yêu cầu chi tiết, hướng dẫn thực hiện, tiêu chí đánh giá.`
      } else if (aiLessonConfig.type === 'video') {
        customPrompt = `Tạo nội dung bài học video về: ${contextTopic}. Bao gồm: Tóm tắt nội dung, các điểm chính cần học, gợi ý video trên YouTube/Vimeo.`
      } else if (aiLessonConfig.type === 'quiz') {
        customPrompt = `Tạo bài quiz về: ${contextTopic}. Tạo 5 câu hỏi trắc nghiệm với 4 lựa chọn, đánh dấu đáp án đúng.`
      } else {
        customPrompt = `Tạo bài giảng lý thuyết về: ${contextTopic}. Bao gồm: Giới thiệu, nội dung chi tiết, ví dụ minh họa, tóm tắt.`
      }

      const response = await fetch('/api/ai/generate-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: customPrompt,
          level: aiLessonConfig.difficulty,
          numQuestions: 5,
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Không thể tạo bài học với AI')
      }

      // Auto-fill form with AI-generated data
      const aiData = data.data
      
      // Set lesson data from AI response
      setLessonFormData(prev => ({
        ...prev,
        title: aiData.lessonTitle || aiLessonTopic,
        type: aiLessonConfig.type,
        content: aiData.content || '',
        videoUrl: aiLessonConfig.type === 'video' ? '' : prev.videoUrl,
        duration: 30,
        difficulty: aiLessonConfig.difficulty
      }))

      toast({
        title: "✨ Thành công!",
        description: "Nội dung bài học đã được tạo bởi AI. Bạn có thể chỉnh sửa trước khi lưu.",
      })

      // Switch to manual tab to show generated content
      setLessonActiveTab("manual")

    } catch (error: any) {
      console.error('AI generation error:', error)
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo bài học với AI",
        variant: "destructive",
      })
    } finally {
      setAiLessonLoading(false)
    }
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

    // Validate video URL for video lessons
    if (lessonFormData.type === 'video' && !lessonFormData.videoUrl.trim()) {
      toast({
        title: "Lỗi xác thực",
        description: "Vui lòng nhập URL video",
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
                                    onClick={() => {
                                      setPreviewingLesson(lesson)
                                      setShowPreview(true)
                                    }}
                                  >
                                    <PlayCircle className="h-4 w-4" />
                                  </Button>
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

      {/* Project Submissions Section */}
      <Card>
        <CardHeader>
          <CardTitle>Project Submissions</CardTitle>
          <CardDescription>View and grade student project submissions for this course</CardDescription>
        </CardHeader>
        <CardContent>
          <TeacherProjectSubmissions courseId={courseId} />
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingLesson ? 'Chỉnh Sửa Bài Học' : 'Tạo Bài Học Mới'}
            </DialogTitle>
            <DialogDescription>
              {editingLesson ? 'Cập nhật nội dung bài học' : 'Tạo thủ công hoặc dùng AI để tạo bài học'}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={lessonActiveTab} onValueChange={setLessonActiveTab} className="mt-4">
            {!editingLesson && (
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="ai">
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI Generate
                </TabsTrigger>
                <TabsTrigger value="manual">Nhập Thủ Công</TabsTrigger>
              </TabsList>
            )}

            {!editingLesson && (
              <TabsContent value="ai" className="space-y-4 mt-4">
                <div className="border rounded-lg p-6 space-y-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-purple-600 mt-1 flex-shrink-0" />
                    <div className="flex-1 space-y-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-2">✨ Tạo Bài Học Với AI</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          AI sẽ tạo nội dung bài học dựa trên chủ đề và cấu hình bạn chọn. 
                          {course && <> Trong khóa học: <strong>{course.title}</strong></>}
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="aiLessonTopic">Chủ Đề Bài Học *</Label>
                          <Input
                            id="aiLessonTopic"
                            placeholder="VD: React Hooks, Python Functions, CSS Flexbox..."
                            value={aiLessonTopic}
                            onChange={(e) => setAiLessonTopic(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                generateLessonWithAI()
                              }
                            }}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="ai-lesson-type">Loại Bài Học</Label>
                            <select
                              id="ai-lesson-type"
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              value={aiLessonConfig.type}
                              onChange={(e) => setAiLessonConfig(prev => ({ 
                                ...prev, 
                                type: e.target.value as 'text' | 'video' | 'quiz' | 'project'
                              }))}
                            >
                              <option value="text">📝 Lý Thuyết</option>
                              <option value="video">🎥 Video</option>
                              <option value="quiz">❓ Trắc Nghiệm</option>
                              <option value="project">🎯 Bài Tập Thực Hành</option>
                            </select>
                          </div>

                          <div>
                            <Label htmlFor="ai-lesson-difficulty">Độ Khó</Label>
                            <select
                              id="ai-lesson-difficulty"
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              value={aiLessonConfig.difficulty}
                              onChange={(e) => setAiLessonConfig(prev => ({ 
                                ...prev, 
                                difficulty: e.target.value as 'beginner' | 'intermediate' | 'advanced'
                              }))}
                            >
                              <option value="beginner">🌱 Cơ Bản</option>
                              <option value="intermediate">📚 Trung Bình</option>
                              <option value="advanced">🚀 Nâng Cao</option>
                            </select>
                          </div>
                        </div>

                        <Button
                          type="button"
                          onClick={generateLessonWithAI}
                          disabled={aiLessonLoading || !aiLessonTopic.trim()}
                          className="w-full"
                          size="lg"
                        >
                          {aiLessonLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Đang tạo với AI...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              {aiLessonConfig.type === 'project' && 'Tạo Bài Tập Thực Hành'}
                              {aiLessonConfig.type === 'quiz' && 'Tạo Bài Trắc Nghiệm'}
                              {aiLessonConfig.type === 'video' && 'Tạo Bài Học Video'}
                              {aiLessonConfig.type === 'text' && 'Tạo Bài Giảng'}
                            </>
                          )}
                        </Button>

                        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3">
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            <strong>💡 Xem trước:</strong> AI sẽ tạo 
                            <strong>
                              {aiLessonConfig.type === 'project' && ' đề bài tập thực hành'}
                              {aiLessonConfig.type === 'quiz' && ' câu hỏi trắc nghiệm'}
                              {aiLessonConfig.type === 'video' && ' nội dung video lesson'}
                              {aiLessonConfig.type === 'text' && ' bài giảng lý thuyết'}
                            </strong> mức độ <strong>{aiLessonConfig.difficulty === 'beginner' ? 'cơ bản' : 
                                                      aiLessonConfig.difficulty === 'intermediate' ? 'trung bình' : 'nâng cao'}</strong> về "{aiLessonTopic || '...'}"
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground text-center">
                  Sau khi tạo, chuyển sang tab "Nhập Thủ Công" để xem và chỉnh sửa
                </div>
              </TabsContent>
            )}

            <TabsContent value="manual" className="space-y-4 mt-4">
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
            
            {lessonFormData.type === 'video' && (
              <div>
                <Label htmlFor="lesson-video-url">Video URL *</Label>
                <Input
                  id="lesson-video-url"
                  type="url"
                  value={lessonFormData.videoUrl}
                  onChange={(e) => setLessonFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                  placeholder="https://www.youtube.com/watch?v=... hoặc https://vimeo.com/..."
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Hỗ trợ YouTube, Vimeo và video URL trực tiếp
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="lesson-content">
                  {lessonFormData.type === 'video' ? 'Mô tả bài học' : 'Nội dung'}
                </Label>
                <span className="text-xs text-muted-foreground">
                  Hỗ trợ Markdown format
                </span>
              </div>
              
              <Textarea
                id="lesson-content"
                value={lessonFormData.content}
                onChange={(e) => setLessonFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder={
                  lessonFormData.type === 'video' 
                    ? "Mô tả nội dung video, mục tiêu học tập..." 
                    : "Nội dung chi tiết của bài học..."
                }
                rows={10}
                className="font-mono text-sm"
              />
              
              {lessonFormData.content && (
                <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    👁️ Preview:
                  </p>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {lessonFormData.content}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          </div>
          </TabsContent>
          </Tabs>
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setLessonDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleLessonSubmit}>
              {editingLesson ? 'Cập Nhật' : 'Tạo Bài Học'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lesson Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              Preview: {previewingLesson?.title}
            </DialogTitle>
            <DialogDescription>
              Teacher preview mode - Test the lesson as students would see it
            </DialogDescription>
          </DialogHeader>
          
          {previewingLesson && (
            <div className="space-y-4">
              {previewingLesson.type === 'quiz' ? (
                <QuizView
                  courseId={courseId}
                  lessonId={previewingLesson._id}
                  isPreviewMode={true}
                  onComplete={(score) => {
                    toast({
                      title: "Preview Quiz Completed",
                      description: `Score: ${score}% - This is preview mode, no progress saved.`,
                    })
                  }}
                  onRetry={() => {
                    toast({
                      title: "Quiz Reset",
                      description: "Quiz has been reset for preview.",
                    })
                  }}
                  onContinue={() => {
                    setShowPreview(false)
                  }}
                />
              ) : (
                <div className="p-6">
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      {getLessonIcon(previewingLesson.type)}
                      <h3 className="text-lg font-semibold">{previewingLesson.title}</h3>
                      <Badge variant="outline">{previewingLesson.type}</Badge>
                    </div>
                  </div>
                  
                  {previewingLesson.type === 'video' && (
                    <div className="space-y-4">
                      {previewingLesson.videoUrl ? (
                        <div className="relative">
                          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                            {/* YouTube embed */}
                            {previewingLesson.videoUrl.includes('youtube.com') || previewingLesson.videoUrl.includes('youtu.be') ? (
                              <iframe
                                src={getYouTubeEmbedUrl(previewingLesson.videoUrl)}
                                className="w-full h-full"
                                frameBorder="0"
                                allowFullScreen
                                title={previewingLesson.title}
                              />
                            ) : previewingLesson.videoUrl.includes('vimeo.com') ? (
                              <iframe
                                src={getVimeoEmbedUrl(previewingLesson.videoUrl)}
                                className="w-full h-full"
                                frameBorder="0"
                                allowFullScreen
                                title={previewingLesson.title}
                              />
                            ) : (
                              <video
                                src={previewingLesson.videoUrl}
                                className="w-full h-full"
                                controls
                                title={previewingLesson.title}
                              />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            Video URL: {previewingLesson.videoUrl}
                          </p>
                        </div>
                      ) : (
                        <div className="bg-gray-100 p-8 rounded-lg text-center">
                          <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
                          <p className="text-muted-foreground">
                            No video URL provided for this lesson
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {previewingLesson.type === 'project' && (
                    <div className="space-y-4">
                      <ProjectSubmissionView
                        courseId={courseId}
                        lessonId={previewingLesson._id}
                        projectTitle={previewingLesson.title}
                        projectDescription={previewingLesson.content}
                        isPreviewMode={true}
                        onSubmit={(submission) => {
                          toast({
                            title: "Preview Project Submitted",
                            description: "This is preview mode - no actual submission saved.",
                          })
                        }}
                      />
                    </div>
                  )}
                  
                  {(previewingLesson.type === 'text' || previewingLesson.type === 'video') && (
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                      {previewingLesson.content && previewingLesson.content.trim() !== "" ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {previewingLesson.content}
                        </ReactMarkdown>
                      ) : (
                        <p className="text-muted-foreground">No content available for this lesson.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}