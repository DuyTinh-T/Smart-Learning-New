import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Payment, Enrollment } from '@/models';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Find payment by session ID
    const payment = await Payment.findOne({ stripeSessionId: sessionId });
    
    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    if (payment.status === 'completed') {
      return NextResponse.json({
        message: 'Payment already completed',
        paymentId: payment._id
      });
    }

    // Mark payment as completed
    await payment.markAsCompleted();

    // Create enrollment
    const existingEnrollment = await Enrollment.findOne({
      student: payment.userId,
      course: payment.courseId
    });

    let enrollmentCreated = false;
    if (!existingEnrollment) {
      try {
        const enrollment = new Enrollment({
          student: payment.userId,
          course: payment.courseId,
          enrolledAt: new Date(),
          status: 'active'
        });
        
        await enrollment.save();
        enrollmentCreated = true;
        console.log('New enrollment created for user:', payment.userId, 'course:', payment.courseId);
      } catch (enrollmentError: any) {
        if (enrollmentError.code === 11000) {
          // Duplicate key error - enrollment already exists (race condition)
          console.log('Enrollment already exists (race condition)');
          enrollmentCreated = false;
        } else {
          throw enrollmentError;
        }
      }
    } else {
      console.log('Enrollment already exists for user:', payment.userId, 'course:', payment.courseId);
    }

    return NextResponse.json({
      message: 'Payment completed manually',
      paymentId: payment._id,
      enrollmentCreated,
      status: 'success'
    });

  } catch (error) {
    console.error('Error simulating webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}