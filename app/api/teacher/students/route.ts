import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import mongoose from 'mongoose'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacherId')

    if (!teacherId || teacherId === 'undefined') {
      return NextResponse.json({ error: 'Valid Teacher ID is required' }, { status: 400 })
    }

    await connectDB()
    const db = mongoose.connection.db
    
    // Get teacher's courses
    let courses = []
    try {
      courses = await db.collection('courses').find({
        $or: [
          { teacherId: new ObjectId(teacherId) },
          { teacher: new ObjectId(teacherId) },
          { createdBy: new ObjectId(teacherId) },
          { teacherId: teacherId },
          { teacher: teacherId },
          { createdBy: teacherId }
        ]
      }).toArray()
    } catch (err) {
      // Ignore error and continue
    }

    const courseIds = courses.map(course => course._id)

    // Try multiple enrollment collections and field names
    let students = []
    if (courseIds.length > 0) {
      const enrollmentCollections = ['enrollments', 'course_enrollments', 'user_enrollments', 'subscriptions']
      
      for (const collectionName of enrollmentCollections) {
        try {
          // First try to get raw enrollments to see the structure
          const rawEnrollments = await db.collection(collectionName).find({
            $or: [
              { courseId: { $in: courseIds } },
              { course: { $in: courseIds } },
              { course_id: { $in: courseIds } }
            ]
          }).limit(5).toArray()

          if (rawEnrollments.length > 0) {
            // Try multiple field variations for user lookup
            students = await db.collection(collectionName)
              .aggregate([
                { 
                  $match: { 
                    $or: [
                      { courseId: { $in: courseIds } },
                      { course: { $in: courseIds } },
                      { course_id: { $in: courseIds } }
                    ]
                  } 
                },
                {
                  $addFields: {
                    studentObjectId: {
                      $cond: {
                        if: { $eq: [{ $type: "$student" }, "string"] },
                        then: { $toObjectId: "$student" },
                        else: "$student"
                      }
                    },
                    userIdObjectId: {
                      $cond: {
                        if: { $eq: [{ $type: "$userId" }, "string"] },
                        then: { $toObjectId: "$userId" },
                        else: "$userId"
                      }
                    },
                    courseObjectId: {
                      $cond: {
                        if: { $eq: [{ $type: "$course" }, "string"] },
                        then: { $toObjectId: "$course" },
                        else: "$course"
                      }
                    },
                    courseIdObjectId: {
                      $cond: {
                        if: { $eq: [{ $type: "$courseId" }, "string"] },
                        then: { $toObjectId: "$courseId" },
                        else: "$courseId"
                      }
                    }
                  }
                },
                {
                  $lookup: {
                    from: 'users',
                    let: { 
                      studentId: '$studentObjectId',
                      userId: '$userIdObjectId'
                    },
                    pipeline: [
                      {
                        $match: {
                          $expr: {
                            $or: [
                              { $eq: ['$_id', '$$studentId'] },
                              { $eq: ['$_id', '$$userId'] }
                            ]
                          }
                        }
                      }
                    ],
                    as: 'userInfo'
                  }
                },
                {
                  $lookup: {
                    from: 'courses',
                    let: { 
                      courseId: '$courseObjectId',
                      courseIdAlt: '$courseIdObjectId'
                    },
                    pipeline: [
                      {
                        $match: {
                          $expr: {
                            $or: [
                              { $eq: ['$_id', '$$courseId'] },
                              { $eq: ['$_id', '$$courseIdAlt'] }
                            ]
                          }
                        }
                      }
                    ],
                    as: 'courseInfo'
                  }
                },
                { $sort: { createdAt: -1 } }
              ]).toArray()
            
            if (students.length > 0) break
          }
        } catch (err) {
          continue
        }
      }
    }

    // Format student data
    const formattedStudents = students.map(enrollment => {
      const user = enrollment.userInfo?.[0]
      const course = enrollment.courseInfo?.[0]

      // Extract user info
      const userName = user?.name || user?.email?.split('@')[0] || 'Unknown User'
      const userEmail = user?.email || 'No email'
      
      // Extract course info
      const courseName = course?.title || course?.name || 'Unknown Course'

      return {
        id: enrollment._id.toString(),
        name: userName,
        email: userEmail,
        course: courseName,
        progress: enrollment.progress?.percentage || 0,
        enrolled: enrollment.createdAt || enrollment.enrolledAt || new Date(),
        lastActive: enrollment.progress?.lastAccessedAt || enrollment.updatedAt || enrollment.createdAt || new Date(),
        userId: user?._id?.toString() || 'unknown',
        courseId: course?._id?.toString() || 'unknown'
      }
    })

    return NextResponse.json({ 
      students: formattedStudents,
      total: formattedStudents.length
    })
  } catch (error) {
    console.error('Error fetching teacher students:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, studentId, courseId, teacherId } = body

    if (!action || !teacherId) {
      return NextResponse.json({ error: 'Action and teacher ID are required' }, { status: 400 })
    }

    await connectDB()
    const db = mongoose.connection.db

    switch (action) {
      case 'send_message':
        // Logic to send message to student
        return NextResponse.json({ message: 'Message sent successfully' })
      
      case 'view_details':
        // Get detailed student information
        if (!studentId) {
          return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
        }
        
        const studentDetails = await db.collection('users')
          .aggregate([
            { $match: { _id: new ObjectId(studentId) } },
            {
              $lookup: {
                from: 'enrollments',
                localField: '_id',
                foreignField: 'userId',
                as: 'enrollments'
              }
            },
            {
              $lookup: {
                from: 'user_progress',
                localField: '_id',
                foreignField: 'userId',
                as: 'progress'
              }
            }
          ]).toArray()

        return NextResponse.json({ student: studentDetails[0] || null })
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error handling student action:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}