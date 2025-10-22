"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, ChevronRight, CheckCircle2, FileText } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"

const lessonData = {
  id: 6,
  title: "CSS Grid",
  courseId: 1,
  courseTitle: "Introduction to Web Development",
  moduleTitle: "Styling with CSS",
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

export function LessonView({ courseId, lessonId }: { courseId: string; lessonId: string }) {
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
                  {/* Video Player Placeholder */}
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg mb-6 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                        <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-primary border-b-8 border-b-transparent ml-1" />
                      </div>
                      <p className="text-muted-foreground">Video Player</p>
                    </div>
                  </div>

                  {/* Lesson Content */}
                  <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: lessonData.content }} />

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

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recommended Next</CardTitle>
                  <CardDescription>Continue your learning journey</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {lessonData.recommendedNext.map((lesson) => (
                    <Link
                      key={lesson.id}
                      href={`/student/courses/${courseId}/lessons/${lesson.id}`}
                      className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <p className="font-medium text-sm mb-1">{lesson.title}</p>
                      <p className="text-xs text-muted-foreground">{lesson.module}</p>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
