"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Play, ChevronLeft, ChevronRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useState, useEffect } from "react"

interface Course {
  id: string
  title: string
  description: string
  thumbnail?: string
  instructor_name?: string
  price?: number
  level?: string
}

interface Slide {
  id: string
  title: string
  subtitle: string
  image: string
  gradient: string
  isWelcome: boolean
  course?: Course
}

const defaultSlide: Slide = {
  id: "welcome",
  title: "Khám Phá Tri Thức Không Giới Hạn",
  subtitle: "Tham gia cùng hàng nghìn học viên đang học tập và phát triển kỹ năng mới mỗi ngày",
  image: "/students-learning-online-with-laptops-and-books-in.jpg",
  gradient: "from-blue-600/20 to-purple-600/20",
  isWelcome: true
}

export function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState<Course[]>([])

  // Create slides array with default slide and course slides
  const allSlides: Slide[] = [defaultSlide, ...courses.map(course => ({
    id: course.id,
    title: course.title,
    subtitle: course.description,
    image: course.thumbnail || "/students-learning-online-with-laptops-and-books-in.jpg",
    gradient: "from-blue-600/20 to-purple-600/20",
    isWelcome: false,
    course
  }))]

  // Load latest courses
  useEffect(() => {
    const fetchLatestCourses = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/courses?limit=3&sortBy=createdAt&sortOrder=desc')
        if (response.ok) {
          const result = await response.json()
          setCourses(result.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch courses:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLatestCourses()
  }, [])

  // Auto-play functionality
  useEffect(() => {
    if (allSlides.length <= 1) return
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % allSlides.length)
    }, 8000) 

    return () => clearInterval(interval)
  }, [allSlides.length])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % allSlides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + allSlides.length) % allSlides.length)
  }

  if (loading) {
    return (
      <section className="relative overflow-hidden h-[80vh] min-h-[600px] flex items-center justify-center bg-gradient-to-r from-blue-600/10 to-purple-600/10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Đang tải...</p>
        </div>
      </section>
    )
  }

  return (
    <section className="relative overflow-hidden h-[80vh] min-h-[600px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0"
        >
          {/* Background Image with Overlay */}
          <div className="absolute inset-0">
            <img
              src={allSlides[currentSlide]?.image}
              alt={allSlides[currentSlide]?.title}
              className="h-full w-full object-cover"
            />
            <div className={`absolute inset-0 bg-gradient-to-r ${allSlides[currentSlide]?.gradient} mix-blend-multiply`} />
            <div className="absolute inset-0 bg-black/40" />
          </div>

          {/* Content */}
          <div className="relative z-10 h-full flex items-center">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl">
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="text-center md:text-left"
                >
                  <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                    {allSlides[currentSlide]?.title}
                  </h1>
                  <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl">
                    {allSlides[currentSlide]?.subtitle}
                  </p>
                  
                  {/* Course info for course slides */}
                  {!allSlides[currentSlide]?.isWelcome && allSlides[currentSlide]?.course && (
                    <div className="flex flex-wrap gap-4 mb-6 text-white/90">
                      {allSlides[currentSlide].course.instructor_name && (
                        <span className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-sm">
                          👨‍🏫 {allSlides[currentSlide].course.instructor_name}
                        </span>
                      )}
                      {allSlides[currentSlide].course.level && (
                        <span className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-sm">
                          📚 {allSlides[currentSlide].course.level}
                        </span>
                      )}
                      {allSlides[currentSlide].course.price && (
                        <span className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-sm">
                          💰 {allSlides[currentSlide].course.price.toLocaleString('vi-VN')}đ
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row gap-4 mb-12">
                    {allSlides[currentSlide]?.isWelcome ? (
                      <>
                        <Button size="lg" className="bg-white text-black hover:bg-white/90 group text-lg px-8 py-6" asChild>
                          <Link href="/register">
                            Bắt Đầu Học Ngay
                            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                          </Link>
                        </Button>
                        <Button  size="lg" className="bg-white text-black hover:bg-white/90 group text-lg px-8 py-6" asChild>
                          <Link href="/courses">
                            <Play className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
                            Khám Phá Khóa Học
                          </Link>
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="lg" className="bg-white text-black hover:bg-white/90 group text-lg px-8 py-6" asChild>
                          <Link href={`/courses/${allSlides[currentSlide]?.id}`}>
                            Xem Chi Tiết
                            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                          </Link>
                        </Button>
                        <Button  size="lg" className="bg-white text-black hover:bg-white/90 group text-lg px-8 py-6" asChild>
                          <Link href="/courses">
                            <Play className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
                            Tất Cả Khóa Học
                          </Link>
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex flex-wrap gap-8 justify-center md:justify-start">
                    <div className="text-center md:text-left">
                      <p className="text-4xl font-bold text-white">10K+</p>
                      <p className="text-white/80">Active Students</p>
                    </div>
                    <div className="text-center md:text-left">
                      <p className="text-4xl font-bold text-white">500+</p>
                      <p className="text-white/80">Courses</p>
                    </div>
                    <div className="text-center md:text-left">
                      <p className="text-4xl font-bold text-white">50+</p>
                      <p className="text-white/80">Expert Instructors</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-all duration-300"
      >
        <ChevronLeft className="h-6 w-6 text-white" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-all duration-300"
      >
        <ChevronRight className="h-6 w-6 text-white" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
        {allSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/70'
            }`}
          />
        ))}
      </div>
    </section>
  )
}
