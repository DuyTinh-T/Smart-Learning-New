import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { connectDB, Course, User, Payment } from '@/models';
import mongoose from 'mongoose';

// Khởi tạo Stripe với secret key từ environment hoặc hardcoded cho test
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover'
});

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { courseId, userId } = await request.json();

    // Validate input
    if (!courseId || !userId) {
      return NextResponse.json(
        { error: 'Course ID and User ID are required' },
        { status: 400 }
      );
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return NextResponse.json(
        { error: 'Invalid course ID format' },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // Kiểm tra course tồn tại và có giá
    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    if (!course.price || course.price <= 0) {
      return NextResponse.json(
        { error: 'Course is free or price not set' },
        { status: 400 }
      );
    }

    // Kiểm tra user tồn tại
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Kiểm tra xem user đã mua course này chưa
    const existingPayment = await Payment.findOne({
      userId,
      courseId,
      status: 'completed'
    });

    if (existingPayment) {
      return NextResponse.json(
        { error: 'You have already purchased this course' },
        { status: 409 }
      );
    }

    // Tạo Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: course.title,
              description: course.description || 'Online Course',
              images: course.thumbnail ? [course.thumbnail] : undefined,
            },
            unit_amount: Math.round(course.price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${request.nextUrl.origin}/payment/success?courseId=${course._id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/courses/${course._id}?payment=cancelled`,
      metadata: {
        courseId: courseId,
        userId: userId,
        courseName: course.title,
      },
    });

    // Lưu payment record vào database với status pending
    const payment = new Payment({
      stripeSessionId: session.id,
      userId,
      courseId,
      amount: Math.round(course.price * 100), // Save in cents
      currency: 'usd',
      status: 'pending',
      metadata: {
        courseName: course.title,
        customerEmail: user.email,
      },
      stripeMetadata: session.metadata,
    });

    await payment.save();

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      paymentId: payment._id,
    });

  } catch (error) {
    console.error('Error creating payment session:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: `Stripe error: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}