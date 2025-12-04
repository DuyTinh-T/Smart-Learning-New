import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Review from "@/models/Review"
import Course from "@/models/Course"
import { verifyAuth } from "@/lib/auth"

// GET - Get all reviews for a course
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get("courseId")

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: "Course ID is required" },
        { status: 400 }
      )
    }

    await dbConnect()

    const reviews = await Review.find({ courseId })
      .populate({
        path: "userId",
        select: "name avatar email"
      })
      .sort({ createdAt: -1 })

    // Calculate average rating
    const totalReviews = reviews.length
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      : 0

    return NextResponse.json({
      success: true,
      data: {
        reviews: reviews.map(review => ({
          _id: review._id,
          user: review.userId,
          rating: review.rating,
          comment: review.comment,
          helpful: review.helpful?.length || 0,
          createdAt: review.createdAt,
          updatedAt: review.updatedAt
        })),
        stats: {
          totalReviews,
          averageRating: Math.round(averageRating * 10) / 10
        }
      }
    })
  } catch (error) {
    console.error("Error fetching reviews:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch reviews" },
      { status: 500 }
    )
  }
}

// POST - Add a new review
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req)
    
    if (!auth.success || !auth.userId || !auth.user) {
      return NextResponse.json(
        { success: false, error: auth.error || "Unauthorized" },
        { status: 401 }
      )
    }

    if (auth.user.role !== "student") {
      return NextResponse.json(
        { success: false, error: "Only students can write reviews" },
        { status: 403 }
      )
    }

    const { courseId, rating, comment } = await req.json()

    // Validate input
    if (!courseId || !rating || !comment) {
      return NextResponse.json(
        { success: false, error: "Course ID, rating, and comment are required" },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: "Rating must be between 1 and 5" },
        { status: 400 }
      )
    }

    if (comment.length < 10) {
      return NextResponse.json(
        { success: false, error: "Comment must be at least 10 characters long" },
        { status: 400 }
      )
    }

    if (comment.length > 1000) {
      return NextResponse.json(
        { success: false, error: "Comment must be less than 1000 characters" },
        { status: 400 }
      )
    }

    await dbConnect()

    // Check if course exists
    const course = await Course.findById(courseId)
    if (!course) {
      return NextResponse.json(
        { success: false, error: "Course not found" },
        { status: 404 }
      )
    }

    // Check if user already reviewed this course
    const existingReview = await Review.findOne({
      userId: auth.userId,
      courseId: courseId
    })

    if (existingReview) {
      return NextResponse.json(
        { success: false, error: "You have already reviewed this course" },
        { status: 400 }
      )
    }

    // Create review
    const review = await Review.create({
      userId: auth.userId,
      courseId: courseId,
      rating: rating,
      comment: comment.trim()
    })

    // Update course rating
    await updateCourseRating(courseId)

    return NextResponse.json({
      success: true,
      data: review,
      message: "Review added successfully"
    })
  } catch (error) {
    console.error("Error adding review:", error)
    return NextResponse.json(
      { success: false, error: "Failed to add review" },
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
