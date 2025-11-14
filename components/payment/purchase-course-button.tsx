'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard, ShoppingCart } from 'lucide-react';

interface Course {
  _id: string;
  title: string;
  price: number;
  slug: string;
}

interface PurchaseCourseButtonProps {
  course: Course;
  isEnrolled?: boolean;
  className?: string;
}

interface PaymentSession {
  sessionId: string;
  url: string;
  paymentId: string;
}

export function PurchaseCourseButton({ 
  course, 
  isEnrolled = false, 
  className = '' 
}: PurchaseCourseButtonProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  // Format price to display
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  // Handle purchase click
  const handlePurchase = async () => {
    // Check if user is authenticated
    if (!user) {
      setShowLoginDialog(true);
      return;
    }

    // Check if course is free
    if (course.price <= 0) {
      toast({
        title: "Free Course",
        description: "This course is free! You can enroll directly.",
        variant: "default"
      });
      return;
    }

    setLoading(true);
    
    try {
      // Call API to create payment session
      const response = await fetch('/api/payment/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: course._id,
          userId: user._id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment session');
      }

      const session: PaymentSession = await response.json();

      // Redirect to Stripe Checkout
      if (session.url) {
        window.location.href = session.url;
      } else {
        throw new Error('No payment URL received');
      }

    } catch (error) {
      console.error('Purchase error:', error);
      
      let errorMessage = 'Failed to process payment. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Purchase Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle login redirect
  const handleLoginRedirect = () => {
    const currentUrl = window.location.pathname;
    const loginUrl = `/login?redirect=${encodeURIComponent(currentUrl)}`;
    window.location.href = loginUrl;
  };

  // Don't show button if already enrolled
  if (isEnrolled) {
    return (
      <Button 
        disabled 
        className={`w-full ${className}`}
      >
        <ShoppingCart className="mr-2 h-4 w-4" />
        Already Enrolled
      </Button>
    );
  }

  // Show free course button
  if (course.price <= 0) {
    return (
      <Button 
        onClick={handlePurchase}
        disabled={authLoading}
        className={`w-full ${className}`}
      >
        <ShoppingCart className="mr-2 h-4 w-4" />
        Enroll for Free
      </Button>
    );
  }

  return (
    <>
      <Button
        onClick={handlePurchase}
        disabled={loading || authLoading}
        className={`w-full ${className}`}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Purchase for {formatPrice(course.price)}
          </>
        )}
      </Button>

      {/* Login Dialog */}
      <AlertDialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Login Required</AlertDialogTitle>
            <AlertDialogDescription>
              You need to be logged in to purchase this course. Would you like to login now?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setShowLoginDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleLoginRedirect}>
              Login
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}