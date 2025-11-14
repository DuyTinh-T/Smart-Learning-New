import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { connectDB, Payment, Enrollment } from '@/models';

// Khởi tạo Stripe với secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover'
});

// Webhook endpoint secret (bạn sẽ nhận được từ Stripe Dashboard)
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_your_webhook_secret';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.text();
    const sig = request.headers.get('stripe-signature');

    if (!sig) {
      console.error('No stripe signature found');
      return NextResponse.json(
        { error: 'No stripe signature found' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log('Payment successful for session:', session.id);

      // Tìm payment record trong database
      const payment = await Payment.findBySessionId(session.id);
      
      if (!payment) {
        console.error('Payment not found for session:', session.id);
        return NextResponse.json(
          { error: 'Payment not found' },
          { status: 404 }
        );
      }

      // Cập nhật thông tin payment từ session
      payment.stripeCustomerId = session.customer as string;
      payment.stripePaymentIntentId = session.payment_intent as string;
      payment.stripeMetadata = session;
      
      // Mark payment as completed
      await payment.markAsCompleted();

      // Tạo enrollment cho học sinh
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
        console.log('Enrollment created for user:', payment.userId, 'course:', payment.courseId);
      } else {
        console.log('Enrollment already exists for user:', payment.userId, 'course:', payment.courseId);
      }

      console.log('Payment processed successfully:', payment._id);
    }

    // Handle payment failed events
    if (event.type === 'checkout.session.expired' || event.type === 'payment_intent.payment_failed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      const payment = await Payment.findBySessionId(session.id);
      if (payment) {
        await payment.markAsFailed();
        console.log('Payment marked as failed:', payment._id);
      }
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Disable Next.js body parsing to get raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};