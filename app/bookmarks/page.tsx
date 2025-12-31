"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, BookmarkCheck, Trash2, Star, Users, Clock, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

interface BookmarkedCourse {
  _id: string
  course: {
    _id: string
    title: string
    description: string
    thumbnail?: string
    price?: number
    level: string
    rating?: number
    students?: number
    duration?: string
    instructor: string
  }
  createdAt: string
}

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkedCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  const fetchBookmarks = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/bookmarks")
      const data = await response.json()

      if (data.success) {
        setBookmarks(data.data || [])
      } else {
        throw new Error(data.error || "Failed to fetch bookmarks")
      }
    } catch (error) {
      console.error("Error fetching bookmarks:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load bookmarks",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const removeBookmark = async (courseId: string) => {
    try {
      setRemovingId(courseId)
      const response = await fetch(`/api/bookmarks/${courseId}`, {
        method: "DELETE"
      })
      const data = await response.json()

      if (data.success) {
        setBookmarks(prev => prev.filter(b => b.course._id !== courseId))
        toast({
          title: "Removed",
          description: "Course removed from bookmarks"
        })
      } else {
        throw new Error(data.error || "Failed to remove bookmark")
      }
    } catch (error) {
      console.error("Error removing bookmark:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove bookmark",
        variant: "destructive"
      })
    } finally {
      setRemovingId(null)
    }
  }

  useEffect(() => {
    if (user) {
      fetchBookmarks()
    }
  }, [user])

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto" />
          <h2 className="text-2xl font-bold">Sign In Required</h2>
          <p className="text-muted-foreground">Please sign in to view your bookmarked courses.</p>
          <Button asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg">Loading bookmarks...</p>
        </div>
      </div>
    )
  }

  return (
    <>
        <Header />
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <section className="py-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <BookmarkCheck className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold">My Bookmarks</h1>
            </div>
            <p className="text-muted-foreground">
              Courses you've saved for later ({bookmarks.length})
            </p>
          </motion.div>

          {bookmarks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="text-center py-12">
                <CardContent>
                  <BookmarkCheck className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Bookmarks Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Start exploring courses and bookmark the ones you're interested in!
                  </p>
                  <Button asChild>
                    <Link href="/courses">Browse Courses</Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookmarks.map((bookmark, index) => (
                <motion.div
                  key={bookmark._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                    <div className="aspect-video overflow-hidden relative">
                      <img
                        src={bookmark.course.thumbnail || "/placeholder.svg"}
                        alt={bookmark.course.title}
                        className="w-full h-full object-cover"
                      />
                      <Badge className="absolute top-3 right-3 bg-accent text-accent-foreground">
                        {bookmark.course.level}
                      </Badge>
                    </div>
                    <CardHeader className="flex-1">
                      <CardTitle className="line-clamp-2">
                        {bookmark.course.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {bookmark.course.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {bookmark.course.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-accent text-accent" />
                            <span>{bookmark.course.rating}</span>
                          </div>
                        )}
                        {bookmark.course.students && (
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{bookmark.course.students}</span>
                          </div>
                        )}
                        {bookmark.course.duration && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{bookmark.course.duration}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold">
                          {bookmark.course.price && bookmark.course.price > 0
                            ? `$${bookmark.course.price}`
                            : "Free"}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <Button asChild className="flex-1">
                          <Link href={`/courses/${bookmark.course._id}`}>
                            View Course
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => removeBookmark(bookmark.course._id)}
                          disabled={removingId === bookmark.course._id}
                          className="text-destructive hover:text-destructive"
                        >
                          {removingId === bookmark.course._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
    <Footer/>
    </>
  )
}
