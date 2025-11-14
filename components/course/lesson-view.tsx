"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, ChevronRight, CheckCircle2, FileText, Play, Loader2, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"

// Interfaces
interface LessonViewProps {
  courseId: string
  lessonId: string
}

interface LessonData {
  id: string
  title: string
  type: 'text' | 'video' | 'quiz' | 'project'
  content?: string
  videoUrl?: string
  duration?: number
  courseId: string
  courseTitle?: string
  moduleTitle?: string
  completed: boolean
  progress?: number
  previousLesson?: { id: string; title: string }
  nextLesson?: { id: string; title: string }
  hasQuiz?: boolean
  resources?: string[]
}

// Video Player Component
const VideoPlayer = ({ videoUrl, title }: { videoUrl?: string; title: string }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  const getVideoEmbedUrl = (url: string): string | null => {
    if (!url) return null
    
    // YouTube URL handling
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`
    }
    
    // Vimeo URL handling
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`
    }
    
    // Direct video file (mp4, webm, etc.)
    if (url.match(/\.(mp4|webm|ogg)$/i)) {
      return url
    }
    
    // Return original URL if it's already an embed URL
    if (url.includes('embed')) {
      return url
    }
    
    return null
  }

  const embedUrl = videoUrl ? getVideoEmbedUrl(videoUrl) : null

  if (!videoUrl) {
    return (
      <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg mb-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground">Text-based lesson content</p>
        </div>
      </div>
    )
  }

  if (!embedUrl) {
    return (
      <div className="aspect-video bg-destructive/10 rounded-lg mb-6 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive">Invalid video URL format</p>
          <p className="text-sm text-muted-foreground mt-2">Supported: YouTube, Vimeo, direct video files</p>
        </div>
      </div>
    )
  }

  // For direct video files
  if (embedUrl.match(/\.(mp4|webm|ogg)$/i)) {
    return (
      <div className="aspect-video bg-black rounded-lg mb-6 overflow-hidden">
        <video
          controls
          className="w-full h-full"
          poster="/placeholder.svg"
          onLoadStart={() => setIsLoading(true)}
          onCanPlay={() => setIsLoading(false)}
          onError={() => {
            setError(true)
            setIsLoading(false)
          }}
        >
          <source src={embedUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}
      </div>
    )
  }

  // For embedded videos (YouTube, Vimeo)
  return (
    <div className="aspect-video bg-black rounded-lg mb-6 overflow-hidden relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      )}
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-destructive/10">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive">Failed to load video</p>
          </div>
        </div>
      ) : (
        <iframe
          src={embedUrl}
          title={title}
          className="w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setError(true)
            setIsLoading(false)
          }}
        />
      )}
    </div>
  )
}

const lessonData = {
  id: 6,
  title: "CSS Grid",
  type: "video" as const,
  courseId: 1,
  courseTitle: "Introduction to Web Development",
  moduleTitle: "Styling with CSS",
  // Example video URLs for testing - replace with real lesson data
  videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Example YouTube URL
  // videoUrl: "https://player.vimeo.com/video/123456789", // Example Vimeo embed
  // videoUrl: "/videos/lesson-6.mp4", // Example direct video file
  content: `
    <h2>Understanding CSS Grid</h2>
    <p>CSS Grid is a powerful layout system that allows you to create complex, responsive layouts with ease. Unlike Flexbox, which is one-dimensional, Grid is two-dimensional, meaning you can control both rows and columns simultaneously.</p>
    
    <h3>Key Concepts</h3>
    <ul>
      <li><strong>Grid Container:</strong> The parent element that has display: grid applied to it.</li>
      <li><strong>Grid Items:</strong> The direct children of the grid container.</li>
      <li><strong>Grid Lines:</strong> The dividing lines that make up the structure of the grid.</li>
      <li><strong>Grid Tracks:</strong> The space between two grid lines (rows or columns).</li>
    </ul>
    
    <h3>Basic Grid Example</h3>
    <pre><code>.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}</code></pre>
    
    <p>This creates a grid with three equal columns and a 20px gap between items.</p>
    
    <h3>Practice Exercise</h3>
    <p>Try creating a responsive grid layout that displays 3 columns on desktop, 2 on tablet, and 1 on mobile.</p>
  `,
  duration: "20 min",
  completed: false,
  progress: 45,
  previousLesson: { id: 5, title: "Flexbox Layout" },
  nextLesson: { id: 7, title: "Variables and Data Types" },
  hasQuiz: true,
  recommendedNext: [
    { id: 7, title: "Variables and Data Types", module: "JavaScript Fundamentals" },
    { id: 8, title: "Functions and Scope", module: "JavaScript Fundamentals" },
  ],
}

export default function LessonView({ courseId, lessonId }: LessonViewProps) {
  const [lessonData, setLessonData] = useState<LessonData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadLessonData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/lessons/${lessonId}`)
        const data = await response.json()
        
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to load lesson')
        }
        
        // Transform API response to component structure
        const lesson: LessonData = {
          id: data.data._id || data.data.id,
          title: data.data.title,
          type: data.data.type || 'text',
          content: data.data.content,
          videoUrl: data.data.videoUrl,
          duration: data.data.duration,
          courseId: data.data.courseId?._id || data.data.courseId,
          courseTitle: data.data.courseId?.title,
          moduleTitle: 'Module', // Will be enhanced later
          completed: false, // Will be determined by user progress
          progress: 0,
          resources: data.data.resources || [],
          // Navigation will be implemented later
          previousLesson: undefined,
          nextLesson: undefined,
          hasQuiz: false
        }
        
        setLessonData(lesson)
      } catch (err) {
        console.error('Failed to load lesson:', err)
        const errorMessage = err instanceof Error ? err.message : 'Failed to load lesson'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    if (lessonId) {
      loadLessonData()
    }
  }, [lessonId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg">Loading lesson...</p>
        </div>
      </div>
    )
  }

  if (error || !lessonData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto" />
          <h2 className="text-2xl font-bold">Lesson Not Found</h2>
          <p className="text-muted-foreground">{error || "The lesson you're looking for doesn't exist."}</p>
          <Button asChild>
            <Link href={`/student/courses/${courseId}`}>Back to Course</Link>
          </Button>
        </div>
      </div>
    )
  }
  return (
    <div className="bg-muted/30 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Link href={`/courses/${courseId}`} className="hover:text-primary transition-colors">
                      {lessonData.courseTitle}
                    </Link>
                    <span>/</span>
                    <span>{lessonData.moduleTitle}</span>
                  </div>
                  <CardTitle className="text-3xl">{lessonData.title}</CardTitle>
                  <CardDescription className="flex items-center gap-4">
                    <span>{lessonData.duration}</span>
                    {lessonData.completed && (
                      <span className="flex items-center gap-1 text-primary">
                        <CheckCircle2 className="h-4 w-4" />
                        Completed
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Video Player for video lessons */}
                  {lessonData.type === "video" && (
                    <VideoPlayer 
                      videoUrl={lessonData.videoUrl} 
                      title={lessonData.title}
                    />
                  )}

                  {/* Content placeholder for non-video lessons */}
                  {lessonData.type !== "video" && (
                    <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg mb-6 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                          <FileText className="h-8 w-8 text-primary" />
                        </div>
                        <p className="text-muted-foreground">
                          {lessonData.type === "text" && "Text Lesson"}
                          {lessonData.type === "quiz" && "Quiz Lesson"}
                          {lessonData.type === "project" && "Project Lesson"}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Lesson Content */}
                  {lessonData.content && (
                    <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: lessonData.content }} />
                  )}

                  {/* Navigation */}
                  <div className="flex items-center justify-between mt-8 pt-6 border-t">
                    {lessonData.previousLesson ? (
                      <Button variant="outline" asChild>
                        <Link href={`/student/courses/${courseId}/lessons/${lessonData.previousLesson.id}`}>
                          <ChevronLeft className="h-4 w-4 mr-2" />
                          Previous
                        </Link>
                      </Button>
                    ) : (
                      <div />
                    )}
                    {lessonData.nextLesson ? (
                      <Button className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                        <Link href={`/student/courses/${courseId}/lessons/${lessonData.nextLesson.id}`}>
                          Next Lesson
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Link>
                      </Button>
                    ) : (
                      <Button className="bg-accent text-accent-foreground hover:bg-accent/90">Complete Course</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quiz Section */}
            {lessonData.hasQuiz && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="bg-gradient-to-r from-accent/10 to-accent/5 border-accent/20">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-accent/20 p-2">
                        <FileText className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <CardTitle>Test Your Knowledge</CardTitle>
                        <CardDescription>Take a quiz to reinforce what you've learned</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button className="bg-accent text-accent-foreground hover:bg-accent/90" asChild>
                      <Link href={`/student/courses/${courseId}/quiz/${lessonId}`}>Take Quiz</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle className="text-lg">Your Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Course Completion</span>
                      <span className="text-sm text-muted-foreground">{lessonData.progress}%</span>
                    </div>
                    <Progress value={lessonData.progress} className="h-2" />
                  </div>
                  <Button variant="outline" className="w-full bg-transparent" asChild>
                    <Link href={`/student/courses/${courseId}`}>View All Lessons</Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Resources Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Lesson Resources</CardTitle>
                  <CardDescription>Additional materials for this lesson</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {lessonData.resources && lessonData.resources.length > 0 ? (
                    lessonData.resources.map((resource, index) => (
                      <div
                        key={index}
                        className="block p-3 rounded-lg border"
                      >
                        <p className="font-medium text-sm">{resource}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No additional resources for this lesson.</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
