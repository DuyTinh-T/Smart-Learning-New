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
    
    // Try different collection names for exam rooms
    let rooms = []
    const possibleCollections = ['rooms', 'exam_rooms', 'quiz_rooms', 'test_rooms']
    
    for (const collectionName of possibleCollections) {
      try {
        rooms = await db.collection(collectionName).find({
          $or: [
            { teacherId: new ObjectId(teacherId) },
            { teacher: new ObjectId(teacherId) },
            { createdBy: new ObjectId(teacherId) },
            { teacherId: teacherId },
            { teacher: teacherId },
            { createdBy: teacherId }
          ]
        }).sort({ createdAt: -1 }).toArray()
        
        if (rooms.length > 0) break
      } catch (err) {
        continue
      }
    }

    // Get participant counts for each room
    const roomsWithParticipants = await Promise.all(
      rooms.map(async (room) => {
        const participantCount = await db.collection('exam_participants').countDocuments({
          roomId: room._id
        })
        
        return {
          id: room._id.toString(),
          name: room.name || room.title,
          status: room.status || 'scheduled',
          participants: participantCount,
          createdAt: room.createdAt,
          duration: room.duration || 60,
          quiz: room.quiz || null,
          startTime: room.startTime || null,
          endTime: room.endTime || null
        }
      })
    )

    return NextResponse.json({ 
      rooms: roomsWithParticipants,
      total: roomsWithParticipants.length 
    })
  } catch (error) {
    console.error('Error fetching teacher rooms:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, duration, quizId, teacherId, startTime } = body

    if (!name || !teacherId) {
      return NextResponse.json({ error: 'Name and teacher ID are required' }, { status: 400 })
    }

    await connectDB()
    const db = mongoose.connection.db
    
    const newRoom = {
      name,
      teacherId: new ObjectId(teacherId),
      duration: duration || 60,
      quizId: quizId ? new ObjectId(quizId) : null,
      status: 'scheduled',
      startTime: startTime ? new Date(startTime) : null,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection('exam_rooms').insertOne(newRoom)
    
    return NextResponse.json({ 
      id: result.insertedId.toString(),
      message: 'Room created successfully' 
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating room:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}