import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Bookmark from "@/models/Bookmark"
import { verifyAuth } from "@/lib/auth"

// DELETE - Remove a course from bookmarks
export async function DELETE(
  req: NextRequest,
  { params }: { params: { courseId: string } }
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

    const result = await Bookmark.findOneAndDelete({
      userId: auth.userId,
      courseId: params.courseId
    })

    if (!result) {
      return NextResponse.json(
        { success: false, error: "Bookmark not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Course removed from bookmarks"
    })
  } catch (error) {
    console.error("Error removing bookmark:", error)
    return NextResponse.json(
      { success: false, error: "Failed to remove bookmark" },
      { status: 500 }
    )
  }
}

// GET - Check if a course is bookmarked
export async function GET(
  req: NextRequest,
  { params }: { params: { courseId: string } }
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

    const bookmark = await Bookmark.findOne({
      userId: auth.userId,
      courseId: params.courseId
    })

    return NextResponse.json({
      success: true,
      data: { isBookmarked: !!bookmark }
    })
  } catch (error) {
    console.error("Error checking bookmark:", error)
    return NextResponse.json(
      { success: false, error: "Failed to check bookmark" },
      { status: 500 }
    )
  }
}
