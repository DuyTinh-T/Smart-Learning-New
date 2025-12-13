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
    
    // Get teacher's courses with flexible field matching
    let courses = []
    try {
      courses = await db.collection('courses').find({
        $or: [
          { teacherId: new ObjectId(teacherId) },
          { teacher: new ObjectId(teacherId) },
          { createdBy: new ObjectId(teacherId) },
          { 'teacher._id': new ObjectId(teacherId) }
        ]
      }).toArray()
    } catch (err) {
      courses = await db.collection('courses').find({
        $or: [
          { teacherId: teacherId },
          { teacher: teacherId },
          { createdBy: teacherId }
        ]
      }).toArray()
    }

    // Get enrollments for teacher's courses
    const courseIds = courses.map(course => course._id).filter(Boolean)
    
    let enrollments = []
    if (courseIds.length > 0) {
      // Try multiple enrollment collection names
      const enrollmentCollections = ['enrollments', 'course_enrollments', 'user_enrollments', 'subscriptions']
      
      for (const collectionName of enrollmentCollections) {
        try {
          const testEnrollments = await db.collection(collectionName).find({
            $or: [
              { courseId: { $in: courseIds } },
              { course: { $in: courseIds } },
              { course_id: { $in: courseIds } }
            ]
          }).limit(1).toArray()
          
          if (testEnrollments.length > 0) {
            enrollments = await db.collection(collectionName).find({
              $or: [
                { courseId: { $in: courseIds } },
                { course: { $in: courseIds } },
                { course_id: { $in: courseIds } }
              ]
            }).toArray()
            break
          }
        } catch (err) {
          continue
        }
      }
    }

    // Get recent students (last 10 enrollments)  
    let recentEnrollments = []
    if (courseIds.length > 0) {
      try {
        recentEnrollments = await db.collection('enrollments')
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
            { $sort: { createdAt: -1 } },
            { $limit: 10 },
            {
              $lookup: {
                from: 'users',
                let: { 
                  userId: {
                    $ifNull: [
                      "$userId", 
                      { $ifNull: ["$user", "$user_id"] }
                    ]
                  }
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $or: [
                          { $eq: ["$_id", "$$userId"] },
                          { $eq: [{ $toString: "$_id" }, { $toString: "$$userId" }] }
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
                  courseId: {
                    $ifNull: [
                      "$courseId", 
                      { $ifNull: ["$course", "$course_id"] }
                    ]
                  }
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $or: [
                          { $eq: ["$_id", "$$courseId"] },
                          { $eq: [{ $toString: "$_id" }, { $toString: "$$courseId" }] }
                        ]
                      }
                    }
                  }
                ],
                as: 'courseInfo'
              }
            }
          ]).toArray()
      } catch (err) {
        // Fallback to basic query without lookup
        recentEnrollments = await db.collection('enrollments')
          .find({
            $or: [
              { courseId: { $in: courseIds } },
              { course: { $in: courseIds } },
              { course_id: { $in: courseIds } }
            ]
          })
          .sort({ createdAt: -1 })
          .limit(10)
          .toArray()
      }
    }

    // Calculate statistics
    const publishedCourses = courses.filter(course => course.status === 'published').length
    const draftCourses = courses.filter(course => course.status === 'draft').length
    const totalStudents = enrollments.length
    
    // Calculate total revenue (assuming price is stored in courses)
    const totalRevenue = enrollments.reduce((sum, enrollment) => {
      const courseId = enrollment.courseId || enrollment.course || enrollment.course_id
      if (!courseId) return sum
      
      const course = courses.find(c => {
        const cId = c._id?.toString()
        const eId = typeof courseId === 'object' && courseId.toString ? courseId.toString() : 
                    typeof courseId === 'string' ? courseId : String(courseId || '')
        return cId === eId
      })
      return sum + (course?.price || 0)
    }, 0)

    // Calculate average rating
    const coursesWithRatings = courses.filter(course => course.rating && course.rating > 0)
    const averageRating = coursesWithRatings.length > 0 
      ? coursesWithRatings.reduce((sum, course) => sum + course.rating, 0) / coursesWithRatings.length 
      : 0

    // Format recent students data
    const recentStudents = recentEnrollments.map(enrollment => ({
      id: enrollment._id?.toString() || Math.random().toString(36),
      name: enrollment.userInfo?.[0]?.name || enrollment.user?.[0]?.name || enrollment.user?.name || 'Unknown User',
      course: enrollment.courseInfo?.[0]?.title || enrollment.courseInfo?.[0]?.name || 
              enrollment.course?.[0]?.title || enrollment.course?.[0]?.name || 
              enrollment.course?.title || enrollment.course?.name || 'Unknown Course',
      progress: enrollment.progress || 0,
      enrolled: formatTimeAgo(enrollment.createdAt || new Date())
    }))

    // Generate analytics data (last 6 months)
    const analytics = await generateAnalyticsData(db, courseIds)

    const dashboardData = {
      totalStudents,
      totalCourses: courses.length,
      publishedCourses,
      draftCourses,
      totalRevenue,
      averageRating,
      recentStudents,
      analytics
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error('Error fetching teacher dashboard data:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

async function generateAnalyticsData(db: any, courseIds: any[]) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const currentDate = new Date()
  const analytics = []

  if (courseIds.length === 0) {
    // Return empty analytics if no courses
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      analytics.push({
        month: months[date.getMonth()],
        students: 0,
        revenue: 0
      })
    }
    return analytics
  }

  // Get all courses with prices
  const courses = await db.collection('courses').find({
    _id: { $in: courseIds }
  }).toArray()

  for (let i = 5; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
    const nextDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 1)
    
    let enrollmentsInMonth = []
    let enrollmentsCount = 0
    
    // Try different enrollment collections
    const enrollmentCollections = ['enrollments', 'course_enrollments', 'user_enrollments']
    
    for (const collectionName of enrollmentCollections) {
      try {
        enrollmentsInMonth = await db.collection(collectionName).find({
          $and: [
            {
              $or: [
                { courseId: { $in: courseIds } },
                { course: { $in: courseIds } },
                { course_id: { $in: courseIds } }
              ]
            },
            {
              $or: [
                { createdAt: { $gte: date, $lt: nextDate } },
                { enrolledAt: { $gte: date, $lt: nextDate } }
              ]
            }
          ]
        }).toArray()
        
        enrollmentsCount = enrollmentsInMonth.length
        if (enrollmentsCount > 0) break
      } catch (err) {
        continue
      }
    }

    // Calculate revenue for this month
    let monthlyRevenue = 0
    if (enrollmentsInMonth.length > 0) {
      enrollmentsInMonth.forEach(enrollment => {
        const courseId = enrollment.courseId || enrollment.course || enrollment.course_id
        if (courseId) {
          const course = courses.find(c => {
            const cId = c._id?.toString()
            const eId = typeof courseId === 'object' && courseId.toString ? courseId.toString() : 
                        typeof courseId === 'string' ? courseId : String(courseId || '')
            return cId === eId
          })
          monthlyRevenue += (course?.price || 0)
        }
      })
    }

    analytics.push({
      month: months[date.getMonth()],
      students: enrollmentsCount,
      revenue: monthlyRevenue
    })
  }

  return analytics
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffInMs = now.getTime() - new Date(date).getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) {
    return 'Hôm nay'
  } else if (diffInDays === 1) {
    return '1 ngày trước'
  } else if (diffInDays < 7) {
    return `${diffInDays} ngày trước`
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7)
    return `${weeks} tuần trước`
  } else {
    const months = Math.floor(diffInDays / 30)
    return `${months} tháng trước`
  }
}