import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Quiz from '@/models/Quiz'
import Lesson from '@/models/Lesson'

export async function GET() {
  try {
    await connectDB()
    
    const quizzes = await Quiz.find({}).populate('lessonId').lean()
    const lessons = await Lesson.find({}).lean()
    
    console.log('=== DEBUG INFO ===')
    console.log('Total quizzes:', quizzes.length)
    console.log('Total lessons:', lessons.length)
    
    quizzes.forEach((quiz, index) => {
      console.log(`Quiz ${index + 1}:`, {
        title: quiz.title,
        lessonId: quiz.lessonId,
        _id: quiz._id
      })
    })
    
    lessons.forEach((lesson, index) => {
      console.log(`Lesson ${index + 1}:`, {
        title: lesson.title,
        _id: lesson._id,
        type: lesson.type
      })
    })
    
    return NextResponse.json({
      success: true,
      data: {
        quizzes: quizzes.map(q => ({
          _id: q._id,
          title: q.title,
          lessonId: q.lessonId,
          questions: q.questions?.length || 0
        })),
        lessons: lessons.map(l => ({
          _id: l._id,
          title: l.title,
          type: l.type
        }))
      }
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}