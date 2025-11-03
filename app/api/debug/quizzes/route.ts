import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongodb'
import Quiz from '@/models/Quiz'

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    
    // Get all quizzes with populated fields
    const quizzes = await Quiz.find({})
      .populate('lessonId', 'title _id')
      .populate('createdBy', 'name email')
      .lean()
    
    console.log('Debug - All quizzes:', quizzes)
    
    return NextResponse.json({
      success: true,
      count: quizzes.length,
      data: quizzes,
      message: 'Debug - All quizzes retrieved'
    })
  } catch (error) {
    console.error('Debug quiz error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch quizzes for debug',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}