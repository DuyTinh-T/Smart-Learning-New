import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Enrollment, Payment } from '@/models';
import { verifyAuth } from '@/lib/auth';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = authResult.userId;
    const searchParams = request.nextUrl.searchParams;
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return NextResponse.json({
        isEnrolled: false,
        hasPaid: false,
        hasPendingPayment: false,
        enrollmentStatus: null,
        paymentId: null,
        pendingPaymentId: null
      });
    }

    // Check enrollment status
    const enrollment = await Enrollment.findOne({
      student: userId,
      course: courseId
    });

    // Check payment status
    const payment = await Payment.findOne({
      userId,
      courseId,
      status: 'completed'
    });

    // Check pending payment
    const pendingPayment = await Payment.findOne({
      userId,
      courseId,
      status: 'pending'
    }).sort({ createdAt: -1 });

    return NextResponse.json({
      isEnrolled: !!enrollment,
      hasPaid: !!payment,
      hasPendingPayment: !!pendingPayment,
      enrollmentStatus: enrollment?.status || null,
      paymentId: payment?._id || null,
      pendingPaymentId: pendingPayment?._id || null
    });

  } catch (error) {
    console.error('Error checking course access:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}