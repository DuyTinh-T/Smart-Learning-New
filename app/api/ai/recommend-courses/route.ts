import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import dbConnect from '@/lib/mongodb'
import Course from '@/models/Course'
import { Enrollment } from '@/models/Enrollment'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    await dbConnect()

    // Get user's enrolled courses with details
    const enrollments = await Enrollment.find({ student: userId })
      .populate('course')
      .lean()

    // Get all available courses
    const allCourses = await Course.find({ visibility: 'public' })
      .select('_id title description category tags')
      .lean()

    // Filter out already enrolled courses
    const enrolledCourseIds = enrollments.map((e: any) => e.course?._id?.toString()).filter(Boolean)
    const availableCourses = allCourses.filter(
      (course: any) => !enrolledCourseIds.includes(course._id.toString())
    )

    if (availableCourses.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          recommendations: [],
          message: 'Bạn đã đăng ký tất cả các khóa học có sẵn!'
        }
      })
    }

    // Build context for AI
    const enrolledCoursesInfo = enrollments
      .filter((e: any) => e.course)
      .map((e: any) => ({
        title: e.course.title,
        category: e.course.category,
        tags: e.course.tags,
        progress: e.progress?.percentage || 0
      }))

    const availableCoursesInfo = availableCourses.map((c: any) => ({
      id: c._id.toString(),
      title: c.title,
      description: c.description,
      category: c.category,
      tags: c.tags
    }))

    // Create AI prompt
    const prompt = `
Bạn là một chuyên gia tư vấn học tập. Dựa trên thông tin học tập của học sinh, hãy gợi ý 3 khóa học phù hợp nhất.

**Các khóa học đã đăng ký:**
${enrolledCoursesInfo.map(c => `- ${c.title} (${c.category}) - Tiến độ: ${c.progress}%`).join('\n')}

**Các khóa học có sẵn:**
${availableCoursesInfo.map((c: any, i: number) => `${i + 1}. ID: ${c.id}, Tiêu đề: ${c.title}, Danh mục: ${c.category}`).join('\n')}

Hãy phân tích:
1. Lộ trình học tập hiện tại của học sinh
2. Kiến thức nền tảng đã có
3. Khóa học nào phù hợp để tiếp tục phát triển

Trả về JSON với format sau (CHỈ trả về JSON thuần, KHÔNG có markdown):
{
  "recommendations": [
    {
      "courseId": "id của khóa học",
      "reason": "lý do gợi ý ngắn gọn (1-2 câu)",
      "priority": số từ 1-3 (1 là ưu tiên nhất)
    }
  ],
  "learningPath": "Mô tả ngắn về lộ trình học tập được đề xuất"
}

Chọn 3 khóa học phù hợp nhất.
`

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const result = await model.generateContent(prompt)
    const responseText = result.response.text()

    // Parse AI response
    let aiResponse
    try {
      // Remove markdown code blocks if present
      const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      aiResponse = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText)
      throw new Error('Invalid AI response format')
    }

    // Match recommendations with actual course data
    const recommendations = aiResponse.recommendations
      .filter((rec: any) => rec.courseId)
      .map((rec: any) => {
        const course = availableCourses.find((c: any) => c._id.toString() === rec.courseId)
        if (!course) return null

        return {
          id: course._id.toString(),
          title: course.title,
          description: course.description,
          category: course.category,
          tags: course.tags,
          reason: rec.reason,
          priority: rec.priority
        }
      })
      .filter(Boolean)
      .sort((a: any, b: any) => a.priority - b.priority)

    return NextResponse.json({
      success: true,
      data: {
        recommendations: recommendations.slice(0, 3),
        learningPath: aiResponse.learningPath
      }
    })

  } catch (error: any) {
    console.error('AI recommendation error:', error)
    
    // Handle quota exceeded error
    if (error.message?.includes('429') || error.message?.includes('quota')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'AI service is temporarily unavailable due to high demand. Please try again in a few moments.',
          errorCode: 'QUOTA_EXCEEDED'
        },
        { status: 429 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to generate recommendations' 
      },
      { status: 500 }
    )
  }
}
