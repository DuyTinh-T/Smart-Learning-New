"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { X, Loader2, Save, Image as ImageIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { courseApi, handleApiError } from "@/lib/api/course-api"
import { uploadFile, deleteFile } from "@/lib/supabase"

interface Course {
  _id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  thumbnail?: string;
  price: number;
  visibility: 'public' | 'private';
}

interface EditCourseDialogProps {
  course: Course | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface FormData {
  title: string;
  description: string;
  category: string;
  tags: string[];
  thumbnail: string;
  price: number;
  visibility: 'public' | 'private';
}

export function EditCourseDialog({ course, open, onOpenChange, onSuccess }: EditCourseDialogProps) {
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [tagInput, setTagInput] = useState("")
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [originalThumbnail, setOriginalThumbnail] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category: '',
    tags: [],
    thumbnail: '',
    price: 0,
    visibility: 'public'
  })

  // Load course data when dialog opens
  useEffect(() => {
    if (course && open) {
      const thumbnail = course.thumbnail || ''
      setFormData({
        title: course.title || '',
        description: course.description || '',
        category: course.category || '',
        tags: course.tags || [],
        thumbnail: thumbnail,
        price: course.price || 0,
        visibility: course.visibility || 'public'
      })
      setTagInput('')
      setOriginalThumbnail(thumbnail)
      setThumbnailPreview(thumbnail)
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [course, open])

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      })
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    // Save file for later upload
    setSelectedFile(file)

    // Show preview only (no upload yet)
    const reader = new FileReader()
    reader.onloadend = () => {
      setThumbnailPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removeThumbnail = () => {
    setSelectedFile(null)
    setThumbnailPreview('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Helper function to extract file path from Supabase URL
  const getFilePathFromUrl = (url: string): string | null => {
    try {
      // URL format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
      const match = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/)
      return match ? match[1] : null
    } catch {
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!course) return
    
    if (!formData.title.trim() || !formData.description.trim() || !formData.category) {
      toast({
        title: "Lỗi xác thực",
        description: "Vui lòng điền đầy đủ các trường bắt buộc (tiêu đề, mô tả, danh mục)",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      let thumbnailUrl: string | undefined = formData.thumbnail

      // Handle image upload if user selected a new image
      if (selectedFile) {
        setUploadingImage(true)
        try {
          // Upload new image
          thumbnailUrl = await uploadFile(selectedFile, 'course-thumbnails', 'courses')
          console.log('✅ New image uploaded:', thumbnailUrl)

          // Delete old image if it exists and is from Supabase storage
          if (originalThumbnail && originalThumbnail.includes('supabase.co/storage')) {
            const oldFilePath = getFilePathFromUrl(originalThumbnail)
            if (oldFilePath) {
              try {
                await deleteFile(oldFilePath, 'course-thumbnails')
                console.log('🗑️ Old image deleted:', oldFilePath)
              } catch (deleteError) {
                console.warn('Failed to delete old image:', deleteError)
                // Continue even if delete fails
              }
            }
          }
        } catch (uploadError: any) {
          console.error('Upload error:', uploadError)
          toast({
            title: "Image upload failed",
            description: uploadError.message || "Failed to upload image. Course will keep the old thumbnail.",
          })
          // Keep the original thumbnail if upload fails
          thumbnailUrl = originalThumbnail || undefined
        } finally {
          setUploadingImage(false)
        }
      }

      // Update course data
      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        tags: formData.tags,
        thumbnail: thumbnailUrl,
        price: formData.price,
        visibility: formData.visibility
      }

      // Update the course
      const response = await courseApi.update(course._id, updateData)

      if (!response.success) {
        // Handle specific API error responses
        const errorMessage = response.error || 'Failed to update course'
        
        if (errorMessage.includes('Access denied') || errorMessage.includes('You can only update your own courses')) {
          toast({
            title: "Không có quyền truy cập",
            description: "Bạn chỉ có thể chỉnh sửa các khóa học do mình tạo ra.",
            variant: "destructive",
          })
          setLoading(false)
          return
        } else if (errorMessage.includes('Authentication required')) {
          toast({
            title: "Yêu cầu đăng nhập",
            description: "Vui lòng đăng nhập để chỉnh sửa khóa học.",
            variant: "destructive",
          })
          setLoading(false)
          return
        } else if (errorMessage.includes('Course not found')) {
          toast({
            title: "Không tìm thấy khóa học",
            description: "Khóa học bạn muốn chỉnh sửa không còn tồn tại.",
            variant: "destructive",
          })
          setLoading(false)
          return
        } else {
          throw new Error(handleApiError(response.error, response.details))
        }
      }

      toast({
        title: "Thành công!",
        description: "Cập nhật khóa học thành công",
      })

      onSuccess()
      onOpenChange(false)

    } catch (error: any) {
      console.error('Error updating course:', error)
      
      // Check for specific error messages and show appropriate toast
      if (error.message && error.message.includes('Access denied')) {
        toast({
          title: "Không có quyền truy cập",
          description: "Bạn chỉ có thể chỉnh sửa các khóa học do mình tạo ra.",
          variant: "destructive",
        })
      } else if (error.message && error.message.includes('Authentication required')) {
        toast({
          title: "Yêu cầu đăng nhập",
          description: "Vui lòng đăng nhập để chỉnh sửa khóa học.",
          variant: "destructive",
        })
      } else if (error.message && error.message.includes('Course not found')) {
        toast({
          title: "Không tìm thấy khóa học",
          description: "Khóa học bạn muốn chỉnh sửa không còn tồn tại.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Cập nhật thất bại",
          description: error.message || "Không thể cập nhật khóa học. Vui lòng thử lại.",
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      updateFormData('tags', [...formData.tags, tagInput.trim()])
      setTagInput("")
    }
  }

  const removeTag = (index: number) => {
    updateFormData('tags', formData.tags.filter((_, i) => i !== index))
  }

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>Update your course information and settings</DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-thumbnail">Course Thumbnail</Label>
              <div className="space-y-3">
                {thumbnailPreview ? (
                  <div className="relative">
                    <div className="relative w-full h-48 border-2 border-dashed rounded-lg overflow-hidden">
                      <img 
                        src={thumbnailPreview} 
                        alt="Thumbnail preview" 
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={removeThumbnail}
                        disabled={uploadingImage || loading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    {selectedFile && (
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <ImageIcon className="h-3 w-3" />
                        New image ready. Will be uploaded when you update the course.
                      </p>
                    )}
                  </div>
                ) : (
                  <div 
                    className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="flex flex-col items-center gap-2">
                      {uploadingImage ? (
                        <>
                          <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
                          <p className="text-sm text-muted-foreground">Uploading...</p>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="h-10 w-10 text-muted-foreground" />
                          <p className="text-sm font-medium">Click to upload thumbnail</p>
                          <p className="text-xs text-muted-foreground">PNG, JPG, WEBP or GIF (max. 5MB)</p>
                        </>
                      )}
                    </div>
                  </div>
                )}
                <Input 
                  ref={fileInputRef}
                  id="edit-thumbnail" 
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={uploadingImage || loading}
                />
              </div>
              <span className="text-sm text-muted-foreground">Recommended size: 1200x630px</span>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-title">Course Title *</Label>
              <Input 
                id="edit-title" 
                placeholder="e.g., Introduction to Python" 
                required 
                value={formData.title}
                onChange={(e) => updateFormData('title', e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-category">Category *</Label>
                <Input
                  id="edit-category"
                  placeholder="e.g., Programming, Design, Business..."
                  required
                  value={formData.category}
                  onChange={(e) => updateFormData('category', e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-price">Price ($)</Label>
                <Input 
                  id="edit-price" 
                  type="number" 
                  placeholder="0" 
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => updateFormData('price', parseFloat(e.target.value) || 0)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-visibility">Visibility</Label>
              <select
                id="edit-visibility"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.visibility}
                onChange={(e) => updateFormData('visibility', e.target.value as 'public' | 'private')}
                disabled={loading}
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description *</Label>
              <Textarea 
                id="edit-description" 
                placeholder="Describe what students will learn..." 
                rows={4} 
                required 
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                  disabled={loading}
                />
                <Button type="button" variant="outline" onClick={addTag} disabled={loading}>
                  Add
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {tag}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => !loading && removeTag(index)} 
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || uploadingImage}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {uploadingImage ? 'Uploading image...' : 'Updating course...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Course
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}