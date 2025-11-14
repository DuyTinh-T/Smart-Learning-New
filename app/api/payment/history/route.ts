import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Payment } from '@/models';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Verify authentication and get user info
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = authResult.userId;

    // Get payments for the user
    const payments = await Payment.findByUserId(userId);

    // Transform data for response
    const transformedPayments = payments.map((payment: any) => ({
      id: payment._id,
      courseId: payment.courseId?._id,
      courseName: payment.courseId?.title || payment.metadata?.courseName,
      courseSlug: payment.courseId?.slug,
      amount: payment.amount / 100, // Convert from cents to dollars
      currency: payment.currency.toUpperCase(),
      status: payment.status,
      createdAt: payment.createdAt,
      completedAt: payment.completedAt,
      stripeSessionId: payment.stripeSessionId
    }));

    return NextResponse.json({
      payments: transformedPayments,
      total: payments.length
    });

  } catch (error) {
    console.error('Error fetching payment history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Verify authentication and get user info  
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = authResult.userId;
    const { status, courseId } = await request.json();

    // Build query
    const query: any = { userId };
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (courseId) {
      query.courseId = courseId;
    }

    // Get filtered payments
    const payments = await Payment.find(query)
      .populate('courseId', 'title slug price')
      .sort({ createdAt: -1 });

    // Transform data for response
    const transformedPayments = payments.map((payment: any) => ({
      id: payment._id,
      courseId: payment.courseId?._id,
      courseName: payment.courseId?.title || payment.metadata?.courseName,
      courseSlug: payment.courseId?.slug,
      amount: payment.amount / 100, // Convert from cents to dollars
      currency: payment.currency.toUpperCase(),
      status: payment.status,
      createdAt: payment.createdAt,
      completedAt: payment.completedAt,
      stripeSessionId: payment.stripeSessionId
    }));

    return NextResponse.json({
      payments: transformedPayments,
      total: payments.length,
      filters: { status, courseId }
    });

  } catch (error) {
    console.error('Error fetching filtered payment history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}