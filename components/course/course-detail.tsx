"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, Users, Star, BookOpen, CheckCircle2, Lock, Play } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"

const courseData = {
  id: 1,
  title: "Introduction to Web Development",
  description:
    "Master the fundamentals of web development with HTML, CSS, and JavaScript. Build real-world projects and learn industry best practices from experienced instructors.",
  instructor: "Sarah Johnson",
  instructorBio: "Senior Web Developer with 10+ years of experience teaching thousands of students worldwide.",
  duration: "8 weeks",
  students: 1234,
  rating: 4.8,
  reviews: 342,
  level: "Beginner",
  price: 49.99,
  thumbnail: "/web-development-coding-on-laptop-screen.jpg",
  enrolled: true,
  progress: 65,
  modules: [
    {
      id: 1,
      title: "Getting Started with HTML",
      lessons: [
        { id: 1, title: "Introduction to HTML", duration: "15 min", completed: true },
        { id: 2, title: "HTML Elements and Tags", duration: "20 min", completed: true },
        { id: 3, title: "Forms and Input", duration: "25 min", completed: true },
      ],
    },
    {
      id: 2,
      title: "Styling with CSS",
      lessons: [
        { id: 4, title: "CSS Basics", duration: "18 min", completed: true },
        { id: 5, title: "Flexbox Layout", duration: "22 min", completed: true },
        { id: 6, title: "CSS Grid", duration: "20 min", completed: false },
      ],
    },
    {
      id: 3,
      title: "JavaScript Fundamentals",
      lessons: [
        { id: 7, title: "Variables and Data Types", duration: "16 min", completed: false },
        { id: 8, title: "Functions and Scope", duration: "24 min", completed: false },
        { id: 9, title: "DOM Manipulation", duration: "28 min", completed: false },
      ],
    },
    {
      id: 4,
      title: "Building Your First Project",
      lessons: [
        { id: 10, title: "Project Planning", duration: "12 min", completed: false, locked: true },
        { id: 11, title: "Implementation", duration: "45 min", completed: false, locked: true },
        { id: 12, title: "Deployment", duration: "20 min", completed: false, locked: true },
      ],
    },
  ],
}

export function CourseDetail({ courseId }: { courseId: string }) {
  return (
    <div className="bg-muted/30">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 lg:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-2"
            >
              <Badge className="mb-4 bg-accent text-accent-foreground">{courseData.level}</Badge>
              <h1 className="text-4xl font-bold mb-4 text-balance">{courseData.title}</h1>
              <p className="text-lg text-muted-foreground mb-6 text-pretty">{courseData.description}</p>
              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-accent text-accent" />
                  <span className="font-semibold">{courseData.rating}</span>
                  <span className="text-muted-foreground">({courseData.reviews} reviews)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span>{courseData.students.toLocaleString()} students</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <span>{courseData.duration}</span>
                </div>
              </div>
              <div className="mt-6">
                <p className="text-sm text-muted-foreground mb-1">Instructor</p>
                <p className="font-semibold">{courseData.instructor}</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="sticky top-20">
                <div className="aspect-video overflow-hidden rounded-t-lg">
                  <img
                    src={courseData.thumbnail || "/placeholder.svg"}
                    alt={courseData.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-6">
                  {courseData.enrolled ? (
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Your Progress</span>
                          <span className="text-sm text-muted-foreground">{courseData.progress}%</span>
                        </div>
                        <Progress value={courseData.progress} className="h-2" />
                      </div>
                      <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                        <Link href={`/student/courses/${courseData.id}`}>Continue Learning</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-center">
                        <p className="text-3xl font-bold mb-2">${courseData.price}</p>
                        <p className="text-sm text-muted-foreground">One-time payment</p>
                      </div>
                      <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Enroll Now</Button>
                      <Button variant="outline" className="w-full bg-transparent">
                        Add to Wishlist
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Course Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="curriculum" className="space-y-6">
            <TabsList className="bg-card">
              <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>

            <TabsContent value="curriculum" className="space-y-4">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Card>
                  <CardHeader>
                    <CardTitle>Course Curriculum</CardTitle>
                    <CardDescription>
                      {courseData.modules.length} modules •{" "}
                      {courseData.modules.reduce((acc, m) => acc + m.lessons.length, 0)} lessons
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {courseData.modules.map((module, moduleIndex) => (
                      <motion.div
                        key={module.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: moduleIndex * 0.1 }}
                      >
                        <div className="border rounded-lg overflow-hidden">
                          <div className="bg-muted/50 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <BookOpen className="h-5 w-5 text-primary" />
                              <h3 className="font-semibold">{module.title}</h3>
                            </div>
                            <Badge variant="outline">{module.lessons.length} lessons</Badge>
                          </div>
                          <div className="divide-y">
                            {module.lessons.map((lesson) => (
                              <div
                                key={lesson.id}
                                className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  {lesson.locked ? (
                                    <Lock className="h-4 w-4 text-muted-foreground" />
                                  ) : lesson.completed ? (
                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                  ) : (
                                    <Play className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  <span className={lesson.locked ? "text-muted-foreground" : ""}>{lesson.title}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className="text-sm text-muted-foreground">{lesson.duration}</span>
                                  {!lesson.locked && courseData.enrolled && (
                                    <Button size="sm" variant="ghost" asChild>
                                      <Link href={`/student/courses/${courseData.id}/lessons/${lesson.id}`}>
                                        {lesson.completed ? "Review" : "Start"}
                                      </Link>
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="about">
              <Card>
                <CardHeader>
                  <CardTitle>About This Course</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">What You'll Learn</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                        <span>Build responsive websites using HTML, CSS, and JavaScript</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                        <span>Understand modern web development best practices</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                        <span>Create interactive user interfaces with JavaScript</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                        <span>Deploy your projects to the web</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">About the Instructor</h3>
                    <p className="text-muted-foreground">{courseData.instructorBio}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews">
              <Card>
                <CardHeader>
                  <CardTitle>Student Reviews</CardTitle>
                  <CardDescription>{courseData.reviews} reviews</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Reviews coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  )
}
