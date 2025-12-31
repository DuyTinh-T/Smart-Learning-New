"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Users, BookOpen } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useState, useEffect } from "react"

interface Course {
  _id: string
  title: string
  description: string
  thumbnail?: string
  createdBy?: {
    name: string
    email: string
  }
  category?: string
  price?: number
  level?: string
  createdAt: string
  updatedAt: string
  modules?: any[]
}

export function LatestCourses() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLatestCourses = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/courses?limit=6&sortBy=createdAt&sortOrder=desc')
        if (response.ok) {
          const result = await response.json()
          setCourses(result.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch latest courses:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLatestCourses()
  }, [])

  if (loading) {
    return (
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">Khóa học mới nhất</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Cập nhật các khóa học mới nhất được thêm vào nền tảng
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse">
                <Card className="h-full">
                  <div className="h-48 bg-muted"></div>
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
                    <div className="flex gap-4">
                      <div className="h-4 bg-muted rounded w-16"></div>
                      <div className="h-4 bg-muted rounded w-16"></div>
                      <div className="h-4 bg-muted rounded w-16"></div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <div className="h-10 bg-muted rounded w-full"></div>
                  </CardFooter>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">Khóa học mới nhất</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Cập nhật các khóa học mới nhất được thêm vào nền tảng của chúng tôi
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course, index) => {
            const totalModules = course.modules?.length || 0
            const totalLessons = course.modules?.reduce((sum, module) => sum + (module.lessons?.length || 0), 0) || 0

            return (
              <motion.div
                key={course._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8 }}
              >
                <Card className="h-full flex flex-col overflow-hidden transition-shadow hover:shadow-lg border-2 hover:border-primary/50">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={course.thumbnail || "/placeholder.svg"}
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                    />
                    <Badge className="absolute top-4 left-4 bg-green-500 text-white">
                      Mới
                    </Badge>
                    {course.category && (
                      <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground">
                        {course.category}
                      </Badge>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle className="text-xl line-clamp-2">{course.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm text-muted-foreground mb-4">
                      <span className="font-medium">Giảng viên:</span> {course.createdBy?.name || 'Unknown Instructor'}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        <span>{totalModules} modules</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{totalLessons} bài học</span>
                      </div>
                      <div className="flex items-center gap-1 font-semibold text-primary">
                        {course.price === 0 ? (
                          <span>Miễn phí</span>
                        ) : (
                          <span>{course.price?.toLocaleString('vi-VN')}đ</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                      <Link href={`/courses/${course._id}`}>Xem chi tiết</Link>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            )
          })}
        </div>

         <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-12"
        >
          <Button variant="outline" size="lg" asChild>
            <Link href="/courses">Xem tất cả khóa học</Link>
          </Button>
        </motion.div>

        {courses.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Chưa có khóa học nào</p>
          </div>
        )}
      </div>
    </section>
  )
}
