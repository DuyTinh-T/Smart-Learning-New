"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { User, Bell, Target, Award, BookOpen, Loader2, Camera, Upload } from "lucide-react"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { uploadFile } from "@/lib/supabase"

// Hard-coded data for features not yet implemented
const staticData = {
  coursesCompleted: 5,
  certificatesEarned: 5,
  hoursLearned: 127,
  learningGoals: [
    "Master React and Next.js",
    "Build 3 full-stack projects",
    "Learn TypeScript fundamentals",
    "Complete UI/UX design course",
  ],
  achievements: [
    { id: 1, title: "First Course Completed", icon: "🎓", date: "Feb 2024" },
    { id: 2, title: "Week Streak", icon: "🔥", date: "Mar 2024" },
    { id: 3, title: "Quiz Master", icon: "⭐", date: "Mar 2024" },
    { id: 4, title: "Fast Learner", icon: "⚡", date: "Apr 2024" },
  ],
}

export function UserProfile() {
  const { user, isLoading, updateProfile } = useAuth()
  const [isUpdating, setIsUpdating] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  // Initialize form data when user data loads
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    }
  }, [user])

  const handleSaveChanges = async () => {
    if (!user) return

    try {
      setIsUpdating(true)
      await updateProfile({
        name: formData.name,
        bio: formData.bio,
      })
      toast.success('Profile updated successfully!')
    } catch (error) {
      console.error('Failed to update profile:', error)
      toast.error('Failed to update profile. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleChangePassword = async () => {
    if (!user) return

    // Validation
    if (!formData.currentPassword) {
      toast.error('Please enter your current password')
      return
    }

    if (!formData.newPassword) {
      toast.error('Please enter a new password')
      return
    }

    if (formData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long')
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    try {
      setIsUpdating(true)
      await updateProfile({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      })
      
      // Clear password fields after successful update
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }))
      
      toast.success('Password changed successfully!')
    } catch (error) {
      console.error('Failed to change password:', error)
      toast.error('Failed to change password. Please check your current password.')
    } finally {
      setIsUpdating(false)
    }
  }

  const getJoinDate = () => {
    if (!user?.createdAt) return 'Unknown'
    const date = new Date(user.createdAt)
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const getUserInitials = () => {
    if (!user?.name) return 'U'
    return user.name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast.error('Vui lòng chọn file ảnh hợp lệ (JPG, PNG, GIF, WEBP)')
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast.error('Kích thước ảnh không được vượt quá 5MB')
      return
    }

    try {
      setIsUploadingAvatar(true)
      toast.loading('Đang tải ảnh lên...', { id: 'avatar-upload' })

      // Upload to Supabase storage in 'course-thumbnails' bucket
      const avatarUrl = await uploadFile(file, 'course-thumbnails', 'avatars')

      // Update profile with new avatar URL
      await updateProfile({ avatar: avatarUrl })

      toast.success('Cập nhật ảnh đại diện thành công!', { id: 'avatar-upload' })
    } catch (error) {
      console.error('Failed to upload avatar:', error)
      toast.error('Không thể tải ảnh lên. Vui lòng thử lại.', { id: 'avatar-upload' })
    } finally {
      setIsUploadingAvatar(false)
      // Reset input
      event.target.value = ''
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Đang tải hồ sơ...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Truy cập bị từ chối</h2>
          <p className="text-muted-foreground">Vui lòng đăng nhập để xem hồ sơ của bạn.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Hồ sơ & Cài đặt</h1>
          <p className="text-muted-foreground">Quản lý tài khoản và tùy chỉnh học tập của bạn</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Summary Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-1"
          >
            <Card className="sticky top-20">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                      <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <label 
                      htmlFor="avatar-upload" 
                      className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors shadow-lg"
                      title="Thay đổi ảnh đại diện"
                    >
                      {isUploadingAvatar ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={isUploadingAvatar}
                      className="hidden"
                    />
                  </div>
                  <h2 className="text-2xl font-bold mb-1">{user.name}</h2>
                  <p className="text-sm text-muted-foreground mb-4">{user.email}</p>
                  <Badge variant="outline" className="mb-6">
                    Thành viên từ {getJoinDate()}
                  </Badge>

                  <div className="w-full space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-primary" />
                        <span className="text-sm">Khóa học</span>
                      </div>
                      <span className="font-semibold">{staticData.coursesCompleted}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-accent" />
                        <span className="text-sm">Chứng chỉ</span>
                      </div>
                      <span className="font-semibold">{staticData.certificatesEarned}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" />
                        <span className="text-sm">Giờ học</span>
                      </div>
                      <span className="font-semibold">{staticData.hoursLearned}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Tabs defaultValue="personal" className="space-y-6">
              <TabsContent value="personal" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Thông tin cá nhân</CardTitle>
                    <CardDescription>Cập nhật thông tin hồ sơ của bạn</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Họ và tên</Label>
                        <Input 
                          id="name" 
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>            
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          value={formData.email}
                          disabled
                          className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">Không thể thay đổi email vì lý do bảo mật</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Vai trò</Label>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {user.role}
                          </Badge>
                        </div>
                      </div>

                      <CardTitle className="pt-4">Thay đổi mật khẩu</CardTitle>
                      <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                        <div className="space-y-2">
                          <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                          <Input 
                            id="currentPassword" 
                            type="password"
                            value={formData.currentPassword}
                            onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                            placeholder="Nhập mật khẩu hiện tại"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="newPassword">Mật khẩu mới</Label>
                          <Input 
                            id="newPassword" 
                            type="password"
                            value={formData.newPassword}
                            onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                            placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                          <Input 
                            id="confirmPassword" 
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            placeholder="Xác nhận mật khẩu mới"
                          />
                        </div>
                        <Button 
                          onClick={handleChangePassword}
                          disabled={isUpdating || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
                          variant="outline"
                          className="w-full"
                        >
                          {isUpdating ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Đang thay đổi mật khẩu...
                            </>
                          ) : (
                            'Thay đổi mật khẩu'
                          )}
                        </Button>
                      </div>
                    </div>
                    <Button 
                      onClick={handleSaveChanges}
                      disabled={isUpdating}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Đang lưu hồ sơ...
                        </>
                      ) : (
                        'Lưu thay đổi hồ sơ'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
