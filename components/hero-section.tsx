"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Play } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 to-background py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-6"
          >
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl text-balance">
              Learn Without Limits
            </h1>
            <p className="text-lg text-muted-foreground md:text-xl text-pretty">
              Discover thousands of courses taught by expert instructors. Build your skills, advance your career, and
              achieve your learning goals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 group" asChild>
                <Link href="/register">
                  Start Learning Today
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="group bg-transparent" asChild>
                <Link href="/courses">
                  <Play className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                  Explore Courses
                </Link>
              </Button>
            </div>
            <div className="flex items-center gap-8 pt-4">
              <div>
                <p className="text-3xl font-bold text-primary">10K+</p>
                <p className="text-sm text-muted-foreground">Active Students</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">500+</p>
                <p className="text-sm text-muted-foreground">Courses</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">50+</p>
                <p className="text-sm text-muted-foreground">Expert Instructors</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 p-8">
              <img
                src="/students-learning-online-with-laptops-and-books-in.jpg"
                alt="Students learning online"
                className="h-full w-full object-cover rounded-xl"
              />
            </div>
            {/* Floating elements */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
              className="absolute -top-4 -right-4 bg-accent text-accent-foreground rounded-xl p-4 shadow-lg"
            >
              <p className="text-sm font-semibold">🎓 New Course!</p>
            </motion.div>
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, delay: 0.5 }}
              className="absolute -bottom-4 -left-4 bg-card text-card-foreground rounded-xl p-4 shadow-lg border"
            >
              <p className="text-sm font-semibold">⭐ 4.9 Rating</p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
