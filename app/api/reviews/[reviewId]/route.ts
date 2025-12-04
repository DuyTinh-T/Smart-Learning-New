import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Review from "@/models/Review"
import Course from "@/models/Course"
import { verifyAuth } from "@/lib/auth"

// PUT - Update a review
export async function PUT(
  req: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const auth = await verifyAuth(req)
    
    if (!auth.success || !auth.userId) {
      return NextResponse.json(
        { success: false, error: auth.error || "Unauthorized" },
        { status: 401 }
      )
    }

    const { rating, comment } = await req.json()

    // Validate input
    if (!rating && !comment) {
      return NextResponse.json(
        { success: false, error: "At least one field (rating or comment) is required" },
        { status: 400 }
      )
    }

    if (rating && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { success: false, error: "Rating must be between 1 and 5" },
        { status: 400 }
      )
    }

    if (comment && (comment.length < 10 || comment.length > 1000)) {
      return NextResponse.json(
        { success: false, error: "Comment must be between 10 and 1000 characters" },
        { status: 400 }
      )
    }

    await dbConnect()

    const review = await Review.findById(params.reviewId)

    if (!review) {
      return NextResponse.json(
        { success: false, error: "Review not found" },
        { status: 404 }
      )
    }

    // Check if user owns this review
    if (review.userId.toString() !== auth.userId) {
      return NextResponse.json(
        { success: false, error: "You can only edit your own reviews" },
        { status: 403 }
      )
    }

    // Update review
    const updateData: any = {}
    if (rating) updateData.rating = rating
    if (comment) updateData.comment = comment.trim()

    const updatedReview = await Review.findByIdAndUpdate(
      params.reviewId,
      updateData,
      { new: true }
    )

    // Update course rating if rating changed
    if (rating) {
      await updateCourseRating(review.courseId.toString())
    }

    return NextResponse.json({
      success: true,
      data: updatedReview,
      message: "Review updated successfully"
    })
  } catch (error) {
    console.error("Error updating review:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update review" },
      { status: 500 }
    )
  }
}

// DELETE - Delete a review
export async function DELETE(
  req: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const auth = await verifyAuth(req)
    
    if (!auth.success || !auth.userId) {
      return NextResponse.json(
        { success: false, error: auth.error || "Unauthorized" },
        { status: 401 }
      )
    }

    await dbConnect()

    const review = await Review.findById(params.reviewId)

    if (!review) {
      return NextResponse.json(
        { success: false, error: "Review not found" },
        { status: 404 }
      )
    }

    // Check if user owns this review or is admin
    if (review.userId.toString() !== auth.userId && auth.user?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "You can only delete your own reviews" },
        { status: 403 }
      )
    }

    const courseId = review.courseId.toString()
    await Review.findByIdAndDelete(params.reviewId)

    // Update course rating
    await updateCourseRating(courseId)

    return NextResponse.json({
      success: true,
      message: "Review deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting review:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete review" },
      { status: 500 }
    )
  }
}

// POST - Mark review as helpful
export async function POST(
  req: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const auth = await verifyAuth(req)
    
    if (!auth.success || !auth.userId) {
      return NextResponse.json(
        { success: false, error: auth.error || "Unauthorized" },
        { status: 401 }
      )
    }

    await dbConnect()

    const review = await Review.findById(params.reviewId)

    if (!review) {
      return NextResponse.json(
        { success: false, error: "Review not found" },
        { status: 404 }
      )
    }

    // Check if already marked as helpful
    const helpfulIndex = review.helpful.indexOf(auth.userId)

    if (helpfulIndex > -1) {
      // Remove from helpful
      review.helpful.splice(helpfulIndex, 1)
    } else {
      // Add to helpful
      review.helpful.push(auth.userId)
    }

    await review.save()

    return NextResponse.json({
      success: true,
      data: { helpful: review.helpful.length },
      message: helpfulIndex > -1 ? "Removed from helpful" : "Marked as helpful"
    })
  } catch (error) {
    console.error("Error marking review as helpful:", error)
    return NextResponse.json(
      { success: false, error: "Failed to mark review as helpful" },
      { status: 500 }
    )
  }
}

// Helper function to update course rating
async function updateCourseRating(courseId: string) {
  try {
    const reviews = await Review.find({ courseId })
    const totalReviews = reviews.length
    
    if (totalReviews === 0) {
      await Course.findByIdAndUpdate(courseId, {
        rating: 0,
        reviews: 0
      })
      return
    }

    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews

    await Course.findByIdAndUpdate(courseId, {
      rating: Math.round(averageRating * 10) / 10,
      reviews: totalReviews
    })
  } catch (error) {
    console.error("Error updating course rating:", error)
  }
}
