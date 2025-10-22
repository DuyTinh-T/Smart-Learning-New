"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Users, Star } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"

const courses = [
  {
    id: 1,
    title: "Introduction to Web Development",
    description: "Learn the fundamentals of HTML, CSS, and JavaScript to build modern websites.",
    instructor: "Sarah Johnson",
    duration: "8 weeks",
    students: 1234,
    rating: 4.8,
    level: "Beginner",
    image: "/web-development-coding-on-laptop-screen.jpg",
  },
  {
    id: 2,
    title: "Advanced React Patterns",
    description: "Master advanced React concepts including hooks, context, and performance optimization.",
    instructor: "Michael Chen",
    duration: "6 weeks",
    students: 892,
    rating: 4.9,
    level: "Advanced",
    image: "/react-javascript-code-on-computer-screen.jpg",
  },
  {
    id: 3,
    title: "UI/UX Design Fundamentals",
    description: "Create beautiful and user-friendly interfaces with modern design principles.",
    instructor: "Emily Rodriguez",
    duration: "10 weeks",
    students: 2156,
    rating: 4.7,
    level: "Intermediate",
    image: "/ui-ux-design-wireframes-and-mockups.jpg",
  },
]

export function FeaturedCourses() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">Featured Courses</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore our most popular courses and start your learning journey today
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
            >
              <Card className="h-full flex flex-col overflow-hidden transition-shadow hover:shadow-lg">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={course.image || "/placeholder.svg"}
                    alt={course.title}
                    className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                  />
                  <Badge className="absolute top-4 right-4 bg-accent text-accent-foreground">{course.level}</Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-xl">{course.title}</CardTitle>
                  <CardDescription>{course.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground mb-4">by {course.instructor}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{course.students.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-accent text-accent" />
                      <span>{course.rating}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                    <Link href={`/courses/${course.id}`}>View Course</Link>
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-12"
        >
          <Button variant="outline" size="lg" asChild>
            <Link href="/courses">View All Courses</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
