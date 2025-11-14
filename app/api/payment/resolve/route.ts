import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Payment, Enrollment } from '@/models';
import { verifyAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Verify authentication (admin only for security)
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only allow admin users to resolve payments manually
    if (authResult.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { paymentId, action } = await request.json();

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    if (action === 'complete') {
      // Mark payment as completed
      await payment.markAsCompleted();

      // Create enrollment if doesn't exist
      const existingEnrollment = await Enrollment.findOne({
        student: payment.userId,
        course: payment.courseId
      });

      if (!existingEnrollment) {
        const enrollment = new Enrollment({
          student: payment.userId,
          course: payment.courseId,
          enrolledAt: new Date(),
          status: 'active'
        });
        
        await enrollment.save();
      }

      return NextResponse.json({
        message: 'Payment completed and enrollment created',
        paymentId,
        enrollmentCreated: !existingEnrollment
      });

    } else if (action === 'fail') {
      // Mark payment as failed
      await payment.markAsFailed();

      return NextResponse.json({
        message: 'Payment marked as failed',
        paymentId
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "complete" or "fail"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error resolving payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get all pending payments for debugging
    const pendingPayments = await Payment.find({ status: 'pending' })
      .populate('userId', 'name email')
      .populate('courseId', 'title slug')
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json({
      total: pendingPayments.length,
      payments: pendingPayments.map(payment => ({
        id: payment._id,
        stripeSessionId: payment.stripeSessionId,
        userId: payment.userId,
        courseId: payment.courseId,
        amount: payment.amount / 100,
        currency: payment.currency,
        createdAt: payment.createdAt,
        metadata: payment.metadata
      }))
    });

  } catch (error) {
    console.error('Error fetching pending payments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}