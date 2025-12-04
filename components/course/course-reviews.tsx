"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, ThumbsUp, Loader2, Pencil, Trash2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface Review {
  _id: string
  user: {
    _id: string
    name: string
    avatar?: string
    email: string
  }
  rating: number
  comment: string
  helpful: number
  createdAt: string
  updatedAt: string
}

interface ReviewStats {
  totalReviews: number
  averageRating: number
}

interface CourseReviewsProps {
  courseId: string
}

export function CourseReviews({ courseId }: CourseReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats>({ totalReviews: 0, averageRating: 0 })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [hoveredRating, setHoveredRating] = useState(0)
  const { toast } = useToast()
  const { user } = useAuth()

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/reviews?courseId=${courseId}`)
      const data = await response.json()

      if (data.success) {
        setReviews(data.data.reviews || [])
        setStats(data.data.stats || { totalReviews: 0, averageRating: 0 })
      }
    } catch (error) {
      console.error("Error fetching reviews:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReview = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to write a review.",
        variant: "destructive"
      })
      return
    }

    if (comment.trim().length < 10) {
      toast({
        title: "Invalid Comment",
        description: "Comment must be at least 10 characters long.",
        variant: "destructive"
      })
      return
    }

    try {
      setSubmitting(true)

      if (editingReview) {
        // Update existing review
        const response = await fetch(`/api/reviews/${editingReview._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating, comment: comment.trim() })
        })
        const data = await response.json()

        if (data.success) {
          toast({
            title: "Review Updated",
            description: "Your review has been updated successfully."
          })
          setEditingReview(null)
        } else {
          throw new Error(data.error || "Failed to update review")
        }
      } else {
        // Create new review
        const response = await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseId, rating, comment: comment.trim() })
        })
        const data = await response.json()

        if (data.success) {
          toast({
            title: "Review Submitted",
            description: "Thank you for your feedback!"
          })
        } else {
          throw new Error(data.error || "Failed to submit review")
        }
      }

      setShowReviewForm(false)
      setRating(5)
      setComment("")
      fetchReviews()
    } catch (error) {
      console.error("Error submitting review:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit review",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return

    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: "DELETE"
      })
      const data = await response.json()

      if (data.success) {
        toast({
          title: "Review Deleted",
          description: "Your review has been deleted."
        })
        fetchReviews()
      } else {
        throw new Error(data.error || "Failed to delete review")
      }
    } catch (error) {
      console.error("Error deleting review:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete review",
        variant: "destructive"
      })
    }
  }

  const handleMarkHelpful = async (reviewId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to mark reviews as helpful.",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: "POST"
      })
      const data = await response.json()

      if (data.success) {
        fetchReviews()
      }
    } catch (error) {
      console.error("Error marking review as helpful:", error)
    }
  }

  const startEditReview = (review: Review) => {
    setEditingReview(review)
    setRating(review.rating)
    setComment(review.comment)
    setShowReviewForm(true)
  }

  const userHasReviewed = reviews.some(review => review.user._id === user?._id)

  useEffect(() => {
    fetchReviews()
  }, [courseId])

  const renderStars = (rating: number, interactive = false, size = "h-5 w-5") => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${
              star <= (interactive ? (hoveredRating || rating) : rating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            } ${interactive ? "cursor-pointer transition-colors" : ""}`}
            onClick={interactive ? () => setRating(star) : undefined}
            onMouseEnter={interactive ? () => setHoveredRating(star) : undefined}
            onMouseLeave={interactive ? () => setHoveredRating(0) : undefined}
          />
        ))}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Student Reviews</CardTitle>
            <CardDescription>
              {stats.totalReviews} {stats.totalReviews === 1 ? "review" : "reviews"} • 
              Average rating: {stats.averageRating.toFixed(1)} / 5.0
            </CardDescription>
          </div>
          {user?.role === "student" && !userHasReviewed && (
            <Button onClick={() => setShowReviewForm(true)}>
              Write a Review
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No reviews yet. Be the first to review this course!</p>
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence>
              {reviews.map((review, index) => (
                <motion.div
                  key={review._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="border-b pb-6 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={review.user.avatar} alt={review.user.name} />
                      <AvatarFallback>{review.user.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold">{review.user.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {renderStars(review.rating)}
                            <span className="text-sm text-muted-foreground">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        {user?._id === review.user._id && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEditReview(review)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteReview(review._id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <p className="text-muted-foreground mb-3">{review.comment}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMarkHelpful(review._id)}
                        className="gap-2"
                      >
                        <ThumbsUp className="h-4 w-4" />
                        Helpful ({review.helpful})
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Review Form Dialog */}
        <Dialog open={showReviewForm} onOpenChange={(open) => {
          setShowReviewForm(open)
          if (!open) {
            setEditingReview(null)
            setRating(5)
            setComment("")
          }
        }}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>{editingReview ? "Edit Review" : "Write a Review"}</DialogTitle>
              <DialogDescription>
                Share your experience with this course to help other students.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Rating</Label>
                {renderStars(rating, true, "h-8 w-8")}
              </div>
              <div className="space-y-2">
                <Label htmlFor="comment">Your Review</Label>
                <Textarea
                  id="comment"
                  placeholder="Tell us about your experience with this course..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={5}
                  maxLength={1000}
                />
                <p className="text-sm text-muted-foreground">
                  {comment.length} / 1000 characters (minimum 10)
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowReviewForm(false)
                  setEditingReview(null)
                  setRating(5)
                  setComment("")
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmitReview} disabled={submitting || comment.trim().length < 10}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : editingReview ? (
                  "Update Review"
                ) : (
                  "Submit Review"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
