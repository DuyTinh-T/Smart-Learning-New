import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Bookmark from "@/models/Bookmark"
import Course from "@/models/Course"
import { verifyAuth } from "@/lib/auth"

// GET - Get all bookmarks for the authenticated user
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req)
    
    if (!auth.success || !auth.userId) {
      return NextResponse.json(
        { success: false, error: auth.error || "Unauthorized" },
        { status: 401 }
      )
    }

    await dbConnect()

    const bookmarks = await Bookmark.find({ userId: auth.userId })
      .populate({
        path: "courseId",
        model: Course,
        select: "title description thumbnail price level rating students duration instructor"
      })
      .sort({ createdAt: -1 })

    // Filter out bookmarks where course was deleted
    const validBookmarks = bookmarks.filter(b => b.courseId)

    return NextResponse.json({
      success: true,
      data: validBookmarks.map(b => ({
        _id: b._id,
        course: b.courseId,
        createdAt: b.createdAt
      }))
    })
  } catch (error) {
    console.error("Error fetching bookmarks:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch bookmarks" },
      { status: 500 }
    )
  }
}

// POST - Add a course to bookmarks
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
        { success: false, error: "Only students can bookmark courses" },
        { status: 403 }
      )
    }

    const { courseId } = await req.json()

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: "Course ID is required" },
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

    // Check if already bookmarked
    const existingBookmark = await Bookmark.findOne({
      userId: auth.userId,
      courseId: courseId
    })

    if (existingBookmark) {
      return NextResponse.json(
        { success: false, error: "Course already bookmarked" },
        { status: 400 }
      )
    }

    // Create bookmark
    const bookmark = await Bookmark.create({
      userId: auth.userId,
      courseId: courseId
    })

    return NextResponse.json({
      success: true,
      data: bookmark,
      message: "Course added to bookmarks"
    })
  } catch (error) {
    console.error("Error adding bookmark:", error)
    return NextResponse.json(
      { success: false, error: "Failed to add bookmark" },
      { status: 500 }
    )
  }
}
